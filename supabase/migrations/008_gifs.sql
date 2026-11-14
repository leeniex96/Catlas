-- Migration 008: GIFs from Giphy in the photo gallery.
-- Already applied to the Supabase project as "gif_photos".
--
-- A gallery item is now EITHER an uploaded image file (storage_path) OR a Giphy GIF (gif_id,
-- just the GIF's id; the picture itself stays on Giphy's servers). Both go through the same
-- approval: they start "pending" and only show after an admin approves them.

alter table public.place_photos alter column storage_path drop not null;

-- Giphy ids are letters and numbers only. Checking that means nobody can sneak other text
-- (like a web address) into the link we build from the id.
alter table public.place_photos
  add column gif_id text check (gif_id is null or gif_id ~ '^[A-Za-z0-9]{5,40}$');

-- Exactly one of the two must be set.
alter table public.place_photos
  add constraint photo_is_file_or_gif check ((storage_path is null) <> (gif_id is null));

grant select (gif_id) on public.place_photos to anon, authenticated;
grant insert (gif_id) on public.place_photos to authenticated;

drop policy "logged-in users can add a photo to an approved place" on public.place_photos;
create policy "logged-in users can add a photo or GIF to an approved place"
  on public.place_photos for insert to authenticated
  with check (
    exists (select 1 from public.places p where p.id = place_id and p.status = 'approved')
    and (
      gif_id is not null                                      -- a GIF (no file involved)
      or storage_path like (select auth.uid())::text || '/%'  -- or a file in the uploader's own folder
    )
  );
