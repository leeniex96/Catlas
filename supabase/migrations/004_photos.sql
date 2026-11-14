-- Migration 004: place photos with admin approval.
-- Already applied to the Supabase project as "photos".
--
-- Logged-in users upload a photo; it starts as "pending" and only shows up on the place's
-- page after an admin approves it. Files live in the Supabase Storage bucket `place-photos`
-- (max 5 MB, jpeg/png/webp), in a folder named after the uploader's user id.
--
-- NOTE: the bucket is public so approved photos load fast. A pending photo's file link is
-- unguessable but technically public. Fine for an MVP; tighten with signed URLs later.

create table public.place_photos (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  storage_path text not null unique check (char_length(storage_path) <= 200),
  caption text check (caption is null or char_length(caption) <= 120),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);
create index place_photos_place_status_idx on public.place_photos (place_id, status);
alter table public.place_photos enable row level security;

revoke all on public.place_photos from anon, authenticated;
-- Uploaders can only choose the place, file path and caption. `user_id` and `status` are
-- filled in by the database, so nobody can approve their own photo or pose as someone else.
grant select (id, place_id, storage_path, caption, status, created_at) on public.place_photos to anon, authenticated;
grant insert (place_id, storage_path, caption) on public.place_photos to authenticated;
grant update (status) on public.place_photos to authenticated;
grant delete on public.place_photos to authenticated;

create policy "anyone can see approved photos"
  on public.place_photos for select to anon, authenticated
  using (status = 'approved');
create policy "uploaders can see their own photos"
  on public.place_photos for select to authenticated
  using (user_id = (select auth.uid()));
create policy "admins can see all photos"
  on public.place_photos for select to authenticated
  using ((select private.is_admin()));

create policy "logged-in users can add a photo to an approved place"
  on public.place_photos for insert to authenticated
  with check (
    exists (select 1 from public.places p where p.id = place_id and p.status = 'approved')
    -- the file must be in the uploader's own folder: "<user id>/<file>"
    and storage_path like (select auth.uid())::text || '/%'
  );

create policy "admins can approve or reject photos"
  on public.place_photos for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "uploaders and admins can delete photos"
  on public.place_photos for delete to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

-- ---- Storage bucket + rules ----
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('place-photos', 'place-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "users can upload to their own photo folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'place-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "users can see their own files, admins can see all"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'place-photos'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.is_admin()))
  );

create policy "users can delete their own files, admins can delete any"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'place-photos'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.is_admin()))
  );
