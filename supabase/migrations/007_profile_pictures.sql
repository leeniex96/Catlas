-- Migration 007: profile pictures.
-- Already applied to the Supabase project as "profile_pictures".
--
-- A profile can point at one image file in the `avatars` storage bucket. Who can see the
-- picture is decided by who can read the profile: yourself, your friends, and people you have
-- a pending request with. Visitors and strangers never get the file's path.

alter table public.profiles add column avatar_path text;

-- The picture must live in your OWN folder ("<your user id>/<file>"), so nobody can point
-- their profile at someone else's file.
alter table public.profiles
  add constraint avatar_in_own_folder
  check (avatar_path is null or (char_length(avatar_path) <= 200 and avatar_path like user_id::text || '/%'));

-- (Re-)grant: you may change your names and your picture, but never your username.
grant update (display_name, cat_name, avatar_path) on public.profiles to authenticated;

-- ---- Storage bucket: small images only ----
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "users can upload their own avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "users can see their own avatar files, admins can see all"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.is_admin()))
  );

create policy "users can delete their own avatar, admins can delete any"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.is_admin()))
  );

-- ---- Friends' visits now also return the friend's picture ----
drop function public.friend_visits(uuid);
create function public.friend_visits(p_place_id uuid default null)
returns table (
  review_id uuid,
  friend_user_id uuid,
  friend_username text,
  friend_display_name text,
  friend_avatar_path text,
  review_cat_name text,
  rating text,
  comment text,
  visited_at timestamptz,
  place_id uuid,
  place_slug text,
  place_name text
)
language sql
security definer
stable
set search_path = ''
as $$
  select r.id, p.user_id, p.username, p.display_name, p.avatar_path, r.cat_name, r.rating, r.comment,
         r.created_at, pl.id, pl.slug, pl.name
  from public.reviews r
  join public.friendships f
    on f.status = 'accepted'
   and ((f.requester_id = (select auth.uid()) and f.addressee_id = r.user_id)
     or (f.addressee_id = (select auth.uid()) and f.requester_id = r.user_id))
  join public.profiles p on p.user_id = r.user_id
  join public.places pl on pl.id = r.place_id and pl.status = 'approved'
  where p_place_id is null or r.place_id = p_place_id
  order by r.created_at desc
  limit 100;
$$;
revoke execute on function public.friend_visits(uuid) from public, anon;
grant execute on function public.friend_visits(uuid) to authenticated;
