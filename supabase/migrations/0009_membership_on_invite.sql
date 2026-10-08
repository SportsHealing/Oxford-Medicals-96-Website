-- Membership used to be granted only when an account was first created. Anyone
-- who tried to sign in before being invited stayed "not recognised" for good.
-- Now adding an address to the list also grants membership to an existing account.

create or replace function public.grant_membership_for_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.members (id, email)
  select u.id, lower(u.email)
  from auth.users u
  where lower(u.email) = new.email
    and not exists (select 1 from public.members m where m.email = lower(u.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_allowed_email_added on public.allowed_emails;
create trigger on_allowed_email_added
  after insert on public.allowed_emails
  for each row execute function public.grant_membership_for_email();

-- Repair people who are already stuck.
insert into public.members (id, email)
select u.id, lower(u.email)
from auth.users u
join public.allowed_emails a on a.email = lower(u.email)
where not exists (select 1 from public.members m where m.id = u.id or m.email = lower(u.email))
on conflict (id) do nothing;

-- For the Admin page: people who tried to sign in with an address that is not
-- on the list (often a different address from the one they were invited on).
create or replace function public.admin_unrecognised_signins()
returns table (email text, first_tried timestamptz, signed_in boolean)
language sql stable security definer set search_path = public as $$
  select lower(u.email), u.created_at, u.last_sign_in_at is not null
  from auth.users u
  where public.is_admin()
    and u.email is not null
    and not exists (select 1 from public.allowed_emails a where a.email = lower(u.email))
    and not exists (select 1 from public.members m where m.id = u.id)
  order by u.created_at desc;
$$;

revoke all on function public.admin_unrecognised_signins() from public, anon;
grant execute on function public.admin_unrecognised_signins() to authenticated;
