-- Website, Instagram and X (Twitter) on member profiles, alongside LinkedIn.
alter table public.members add column if not exists website text;
alter table public.members add column if not exists instagram text;
alter table public.members add column if not exists twitter text;
grant select (website, instagram, twitter), update (website, instagram, twitter)
  on public.members to authenticated;
