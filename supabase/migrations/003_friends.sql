-- Migration 003: friends.
-- Already applied to the Supabase project as "friends".
--
-- A friendship is one row: `requester` asked, `addressee` accepts. Only the two people
-- involved can see it. Friends see each other's profile and review "visits"; nobody else does.

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  addressee_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  constraint no_self_friendship check (requester_id <> addressee_id)
);
-- One friendship per pair of people, whichever of them asked first.
create unique index friendships_pair_idx
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index friendships_addressee_idx on public.friendships (addressee_id);
alter table public.friendships enable row level security;

revoke all on public.friendships from anon, authenticated;
grant select, insert, delete on public.friendships to authenticated;
grant update (status) on public.friendships to authenticated; -- only accepting is possible

create policy "you can see your own friendships"
  on public.friendships for select to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));

create policy "you can send a friend request as yourself"
  on public.friendships for insert to authenticated
  with check (
    requester_id = (select auth.uid())
    and status = 'pending'
    and exists (select 1 from public.profiles p where p.user_id = (select auth.uid()))
  );

-- Only the person who RECEIVED the request can accept it.
create policy "the addressee can accept a request"
  on public.friendships for update to authenticated
  using (addressee_id = (select auth.uid()) and status = 'pending')
  with check (addressee_id = (select auth.uid()) and status = 'accepted');

create policy "either person can end a friendship or cancel a request"
  on public.friendships for delete to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));

-- You can read the profile of anyone you have a request or friendship with.
create policy "friends can read each other's profiles"
  on public.profiles for select to authenticated
  using (
    exists (
      select 1 from public.friendships f
      where (f.requester_id = profiles.user_id and f.addressee_id = (select auth.uid()))
         or (f.addressee_id = profiles.user_id and f.requester_id = (select auth.uid()))
    )
  );

-- Find a person by their EXACT username (there's no browsing or partial search, on purpose).
create function public.find_profile(p_username text)
returns table (user_id uuid, username text, display_name text, cat_name text)
language sql
security definer
stable
set search_path = ''
as $$
  select p.user_id, p.username, p.display_name, p.cat_name
  from public.profiles p
  where p.username = lower(btrim(p_username))
    and (select auth.uid()) is not null
    and p.user_id <> (select auth.uid());
$$;
revoke execute on function public.find_profile(text) from public, anon;
grant execute on function public.find_profile(text) to authenticated;

-- Reviews written by YOUR ACCEPTED FRIENDS (optionally for just one place), newest first.
-- This is the only way to learn who wrote a review.
create function public.friend_visits(p_place_id uuid default null)
returns table (
  review_id uuid,
  friend_user_id uuid,
  friend_username text,
  friend_display_name text,
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
  select r.id, p.user_id, p.username, p.display_name, r.cat_name, r.rating, r.comment,
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
