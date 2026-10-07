-- A small copy of each photo for grids and strips, so pages load quickly.
-- Photos without one keep working: the site falls back to the full-size file.
alter table public.photos add column if not exists thumb_path text;
