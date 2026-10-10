-- Person finder, "Where are we now" and the Home photos.
-- * Profile fields: name at medical school, specialty, town (for the map),
--   public links (Wikipedia, ORCID, Google Scholar, hospital page) and a
--   choice to show your email to classmates (off unless you turn it on).
-- * Photos can be featured on the members' Home page (admins only).
-- Safe to run more than once.

alter table public.members
  add column if not exists previous_name text,
  add column if not exists specialty     text,
  add column if not exists show_email    boolean not null default false,
  add column if not exists town          text,
  add column if not exists country       text,
  add column if not exists lat           double precision,
  add column if not exists lng           double precision,
  add column if not exists links         jsonb not null default '{}'::jsonb;

-- Members read and edit these on their own row (row rules already limit edits to yourself).
grant select (previous_name, specialty, show_email, town, country, lat, lng, links),
      update (previous_name, specialty, show_email, town, country, lat, lng, links)
  on public.members to authenticated;

-- Emails of members who chose to show theirs, for other members only.
create or replace function public.member_contact_emails()
returns table (id uuid, email text)
language sql stable security definer set search_path = public as $$
  select m.id, m.email from public.members m
  where m.show_email and public.is_member();
$$;
revoke all on function public.member_contact_emails() from public, anon;
grant execute on function public.member_contact_emails() to authenticated;

-- Specialty from the class list fills in a blank profile.
create or replace function public.fill_member_from_roster()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.member_id is not null and new.specialty is not null then
    update public.members set specialty = new.specialty
    where id = new.member_id and (specialty is null or specialty = '');
  end if;
  return new;
end;
$$;
drop trigger if exists roster_fills_member on public.roster;
create trigger roster_fills_member
  after insert or update of member_id, specialty on public.roster
  for each row execute function public.fill_member_from_roster();

update public.members m set specialty = r.specialty
from public.roster r
where r.member_id = m.id and r.specialty is not null and (m.specialty is null or m.specialty = '');

-- ---------------------------------------------------------------
-- Home page photos: featured_rank set means "show on Home", in that order.
alter table public.photos add column if not exists featured_rank int;
create index if not exists photos_featured_idx on public.photos (featured_rank) where featured_rank is not null;

-- Uploaders may edit their own photos, but only admins choose the Home photos.
create or replace function public.guard_featured_rank()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT' and new.featured_rank is not null)
     or (tg_op = 'UPDATE' and new.featured_rank is distinct from old.featured_rank) then
    if not public.is_admin() then
      raise exception 'Only admins can choose the Home photos';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists photos_guard_featured on public.photos;
create trigger photos_guard_featured
  before insert or update on public.photos
  for each row execute function public.guard_featured_rank();
