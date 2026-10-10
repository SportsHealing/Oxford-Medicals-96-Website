-- Photo categories, so the archive can be browsed by occasion (Graduation,
-- Tingewick, Sport...) even where a photo has no year or place.
-- Admins set them in bulk on the Photos page ("Sort photos"), or let the
-- optional AI sorter suggest them. Safe to run more than once.

alter table public.photos add column if not exists category text;
-- Who set it: 'person' (an admin or the uploader) or 'ai' (a suggestion).
-- The AI sorter only ever fills photos that have no category yet.
alter table public.photos add column if not exists category_source text;

alter table public.photos drop constraint if exists photos_category_check;
alter table public.photos add constraint photos_category_check check (
  category is null or category in (
    'graduation', 'tingewick', 'formal', 'social', 'sport', 'medicine',
    'everyday', 'travel', 'reunions', 'other'
  )
);
alter table public.photos drop constraint if exists photos_category_source_check;
alter table public.photos add constraint photos_category_source_check check (
  category_source is null or category_source in ('person', 'ai')
);

create index if not exists photos_category_idx on public.photos (category);

-- Editing rules are unchanged: admins can edit any photo, members their own uploads.
