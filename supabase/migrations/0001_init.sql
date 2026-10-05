-- Oxford Medics 96: initial schema.
-- Run in the Supabase SQL editor, or with `supabase db push`.

-- ---------------------------------------------------------------
-- Who is allowed in. Admins add emails here before inviting people.
-- ---------------------------------------------------------------
create table public.allowed_emails (
  email       text primary key check (email = lower(email)),
  note        text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Members. One row per signed-in person who is on the allowed list.
-- Created automatically on first sign-in (see trigger below).
-- ---------------------------------------------------------------
create table public.members (
  id                uuid primary key references auth.users (id) on delete cascade,
  email             text not null unique,
  full_name         text not null default '',
  known_as          text,
  college           text,
  grad_year         int  not null default 1996,
  job_title         text,
  workplace         text,
  career_path       text,
  interests         text,
  clinical_training text,
  memory            text,
  tingewick         text,
  linkedin          text,
  accepts_contact   boolean not null default true,
  allows_tags       boolean not null default true,
  is_admin          boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Photos. The file itself lives in the private "photos" storage bucket.
-- ---------------------------------------------------------------
create table public.photos (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  year          text,
  place         text,
  caption       text,
  storage_path  text not null unique,
  uploaded_by   uuid references public.members (id),
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Tags. A member is suggested to be in a photo at (x, y) percent.
-- Visible to others only once the tagged member confirms.
-- ---------------------------------------------------------------
create type public.tag_status as enum ('pending', 'confirmed', 'rejected');

create table public.photo_tags (
  id            uuid primary key default gen_random_uuid(),
  photo_id      uuid not null references public.photos (id) on delete cascade,
  member_id     uuid not null references public.members (id) on delete cascade,
  x             numeric(5,2) not null check (x between 0 and 100),
  y             numeric(5,2) not null check (y between 0 and 100),
  status        public.tag_status not null default 'pending',
  suggested_by  uuid references public.members (id),
  created_at    timestamptz not null default now(),
  unique (photo_id, member_id)
);

-- ---------------------------------------------------------------
-- Contact requests. The recipient's address is never exposed.
-- ---------------------------------------------------------------
create table public.contact_requests (
  id          uuid primary key default gen_random_uuid(),
  from_member uuid not null references public.members (id) on delete cascade,
  to_member   uuid not null references public.members (id) on delete cascade,
  message     text not null check (length(message) between 1 and 2000),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------
create or replace function public.is_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where id = auth.uid());
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where id = auth.uid() and is_admin);
$$;

-- On first sign-in, create a member row if the email is on the allowed list.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.allowed_emails where email = lower(new.email)) then
    insert into public.members (id, email)
    values (new.id, lower(new.email))
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep updated_at fresh.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger members_touch before update on public.members
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------
-- Row level security. Nothing is visible to non-members.
-- ---------------------------------------------------------------
alter table public.allowed_emails   enable row level security;
alter table public.members          enable row level security;
alter table public.photos           enable row level security;
alter table public.photo_tags       enable row level security;
alter table public.contact_requests enable row level security;

-- allowed_emails: admins only.
create policy "admins manage allowed emails" on public.allowed_emails
  for all using (public.is_admin()) with check (public.is_admin());

-- members: every member can read every member; each person edits only themselves.
create policy "members read members" on public.members
  for select using (public.is_member());
create policy "members edit own profile" on public.members
  for update using (id = auth.uid()) with check (id = auth.uid());

-- photos: members read; admins write.
create policy "members read photos" on public.photos
  for select using (public.is_member());
create policy "admins manage photos" on public.photos
  for all using (public.is_admin()) with check (public.is_admin());

-- photo_tags: confirmed tags visible to all members; pending ones only to the
-- tagged person and the suggester. Any member can suggest. Only the tagged
-- person can confirm or reject. Tagged person or an admin can delete.
create policy "members read visible tags" on public.photo_tags
  for select using (
    public.is_member() and (
      status = 'confirmed' or member_id = auth.uid() or suggested_by = auth.uid()
    )
  );
create policy "members suggest tags" on public.photo_tags
  for insert with check (
    public.is_member()
    and suggested_by = auth.uid()
    and status = 'pending'
    and exists (select 1 from public.members m where m.id = member_id and m.allows_tags)
  );
create policy "tagged person decides" on public.photo_tags
  for update using (member_id = auth.uid()) with check (member_id = auth.uid());
create policy "tagged person or admin removes" on public.photo_tags
  for delete using (member_id = auth.uid() or public.is_admin());

-- contact_requests: sender inserts; sender and recipient can read.
create policy "members send contact requests" on public.contact_requests
  for insert with check (
    public.is_member()
    and from_member = auth.uid()
    and exists (select 1 from public.members m where m.id = to_member and m.accepts_contact)
  );
create policy "parties read contact requests" on public.contact_requests
  for select using (from_member = auth.uid() or to_member = auth.uid());

-- ---------------------------------------------------------------
-- Storage: private bucket for photo files. Members read, admins write.
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('photos', 'photos', false)
  on conflict (id) do nothing;

create policy "members read photo files" on storage.objects
  for select using (bucket_id = 'photos' and public.is_member());
create policy "admins upload photo files" on storage.objects
  for insert with check (bucket_id = 'photos' and public.is_admin());
create policy "admins update photo files" on storage.objects
  for update using (bucket_id = 'photos' and public.is_admin());
create policy "admins delete photo files" on storage.objects
  for delete using (bucket_id = 'photos' and public.is_admin());
