-- The Speeches tab: speeches over the years, many of them PDF only.
-- Adds a year, and lets a speech be just a PDF (no typed-out text).
-- Needs 0012 and 0013 first. Safe to run more than once.

alter table public.speeches add column if not exists year int;
alter table public.speeches drop constraint if exists speeches_year_check;
alter table public.speeches add constraint speeches_year_check check (year is null or year between 1980 and 2100);

-- A speech needs either its text or a PDF.
alter table public.speeches alter column body drop not null;
alter table public.speeches drop constraint if exists speeches_body_or_pdf;
alter table public.speeches add constraint speeches_body_or_pdf check (body is not null or pdf_base64 is not null);

-- The two speeches from the 30th reunion dinner.
update public.speeches set year = 2026 where slug in ('thirty-years', 'thirty-years-on') and year is null;

create index if not exists speeches_year_idx on public.speeches (year desc);

-- Access is unchanged: signed-in members read, admins add, change and delete.
