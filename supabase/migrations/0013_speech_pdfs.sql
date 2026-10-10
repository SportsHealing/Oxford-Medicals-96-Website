-- Downloadable PDF copies of the speeches, for signed-in members only.
-- The files are kept in the database (base64 text), not in the public code;
-- they are small (well under 1 MB each). Safe to run more than once.

alter table public.speeches add column if not exists pdf_name text;
alter table public.speeches add column if not exists pdf_base64 text;
