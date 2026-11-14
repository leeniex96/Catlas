-- Migration 006: two small indexes suggested by Supabase's performance advisor.
-- Already applied as "add_missing_foreign_key_indexes".
create index friendships_requester_idx on public.friendships (requester_id);
create index place_photos_user_idx on public.place_photos (user_id);
