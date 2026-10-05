-- Privacy tightening.
-- 1. Members must not be able to read each other's email addresses, or
--    change their own is_admin flag. Column level grants handle both.
-- 2. A recipient reads contact requests through a function that reveals the
--    sender's email only to them.

revoke select, update on public.members from authenticated, anon;

grant select (
  id, full_name, known_as, college, grad_year, job_title, workplace, career_path,
  interests, clinical_training, memory, tingewick, linkedin, accepts_contact,
  allows_tags, is_admin, created_at, updated_at
) on public.members to authenticated;

grant update (
  full_name, known_as, college, job_title, workplace, career_path, interests,
  clinical_training, memory, tingewick, linkedin, accepts_contact, allows_tags
) on public.members to authenticated;

-- A member's own email, for display on their profile page.
create or replace function public.my_email()
returns text language sql stable security definer set search_path = public as $$
  select email from public.members where id = auth.uid();
$$;

-- Messages sent to the current member, with the sender's name and email.
create or replace function public.contact_inbox()
returns table (id uuid, message text, created_at timestamptz, from_id uuid, from_name text, from_email text)
language sql stable security definer set search_path = public as $$
  select c.id, c.message, c.created_at, m.id, m.full_name, m.email
  from public.contact_requests c
  join public.members m on m.id = c.from_member
  where c.to_member = auth.uid()
  order by c.created_at desc;
$$;

-- Admins may see the members list with emails, to manage invitations.
create or replace function public.admin_members()
returns table (id uuid, email text, full_name text, is_admin boolean, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select id, email, full_name, is_admin, created_at
  from public.members
  where public.is_admin()
  order by created_at;
$$;
