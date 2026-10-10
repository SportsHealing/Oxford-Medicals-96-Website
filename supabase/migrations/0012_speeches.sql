-- Speeches and the quotes shown on the members' Home page.
-- The words themselves are loaded separately (not kept in the public code),
-- and only signed-in members can read them. Safe to run more than once.

create table if not exists public.speeches (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title      text not null,
  speaker    text,
  occasion   text,
  -- Paragraphs separated by a blank line; "## " starts a heading;
  -- ![caption](data:image/...) is a picture; *line* italic; **line** bold.
  body       text not null,
  sort       int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.speech_quotes (
  id          uuid primary key default gen_random_uuid(),
  speech_id   uuid not null references public.speeches (id) on delete cascade,
  text        text not null,
  -- Overrides the speaker, e.g. when a speech quotes someone else.
  attribution text,
  sort        int not null default 0
);

alter table public.speeches enable row level security;
alter table public.speech_quotes enable row level security;

drop policy if exists "members read speeches" on public.speeches;
create policy "members read speeches" on public.speeches for select to authenticated using (public.is_member());
drop policy if exists "admins manage speeches" on public.speeches;
create policy "admins manage speeches" on public.speeches for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "members read speech quotes" on public.speech_quotes;
create policy "members read speech quotes" on public.speech_quotes for select to authenticated using (public.is_member());
drop policy if exists "admins manage speech quotes" on public.speech_quotes;
create policy "admins manage speech quotes" on public.speech_quotes for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.speeches, public.speech_quotes from anon;
