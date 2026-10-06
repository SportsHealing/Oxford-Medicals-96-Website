-- Profile pictures, plus member photo uploads (repeats 0003 safely, so this
-- one paste works whether or not 0003 was run).

-- ---------- Member photo uploads (same as 0003, made re-runnable) ----------
drop policy if exists "members add photos" on public.photos;
create policy "members add photos" on public.photos
  for insert with check (public.is_member() and uploaded_by = auth.uid());
drop policy if exists "uploader edits own photos" on public.photos;
create policy "uploader edits own photos" on public.photos
  for update using (uploaded_by = auth.uid()) with check (uploaded_by = auth.uid());
drop policy if exists "uploader deletes own photos" on public.photos;
create policy "uploader deletes own photos" on public.photos
  for delete using (uploaded_by = auth.uid());

drop policy if exists "members suggest tags" on public.photo_tags;
create policy "members suggest tags" on public.photo_tags
  for insert with check (
    public.is_member()
    and suggested_by = auth.uid()
    and (status = 'pending' or (status = 'confirmed' and member_id = auth.uid()))
    and exists (select 1 from public.members m where m.id = member_id and m.allows_tags)
  );

drop policy if exists "members upload own photo files" on storage.objects;
create policy "members upload own photo files" on storage.objects
  for insert with check (
    bucket_id = 'photos' and public.is_member()
    and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "members delete own photo files" on storage.objects;
create policy "members delete own photo files" on storage.objects
  for delete using (
    bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text
  );

update storage.buckets
  set file_size_limit = 15728640,
      allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif']
  where id = 'photos';

-- ---------- Profile pictures ----------
alter table public.members add column if not exists avatar_path text;
grant select (avatar_path), update (avatar_path) on public.members to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 5242880,
        array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do nothing;

drop policy if exists "members read avatars" on storage.objects;
create policy "members read avatars" on storage.objects
  for select using (bucket_id = 'avatars' and public.is_member());
drop policy if exists "members upload own avatar" on storage.objects;
create policy "members upload own avatar" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and public.is_member()
    and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "members delete own avatar" on storage.objects;
create policy "members delete own avatar" on storage.objects
  for delete using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );
