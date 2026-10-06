-- Members can upload their own photos, edit or delete them, and tag
-- themselves directly (no need to confirm a tag you placed yourself).

-- Photos: members insert as themselves; uploader or admin can edit/delete.
create policy "members add photos" on public.photos
  for insert with check (public.is_member() and uploaded_by = auth.uid());
create policy "uploader edits own photos" on public.photos
  for update using (uploaded_by = auth.uid()) with check (uploaded_by = auth.uid());
create policy "uploader deletes own photos" on public.photos
  for delete using (uploaded_by = auth.uid());

-- Tags: replace the insert rule so a self-tag can go straight to confirmed.
drop policy if exists "members suggest tags" on public.photo_tags;
create policy "members suggest tags" on public.photo_tags
  for insert with check (
    public.is_member()
    and suggested_by = auth.uid()
    and (status = 'pending' or (status = 'confirmed' and member_id = auth.uid()))
    and exists (select 1 from public.members m where m.id = member_id and m.allows_tags)
  );

-- Storage: members upload into a folder named after their own id.
create policy "members upload own photo files" on storage.objects
  for insert with check (
    bucket_id = 'photos' and public.is_member()
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "members delete own photo files" on storage.objects
  for delete using (
    bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Keep uploads sensible: images only, 15 MB max.
update storage.buckets
  set file_size_limit = 15728640,
      allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif']
  where id = 'photos';
