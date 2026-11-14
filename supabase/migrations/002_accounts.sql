-- Migration 002: cat-owner accounts.
-- Already applied to the Supabase project as "accounts_and_profiles".
--
-- Adds a `profiles` table (username, display name, cat name) and lets a review remember
-- WHO wrote it (`reviews.user_id`). That link is private: the public API cannot read it,
-- it is only used by the friends feature (see 003_friends.sql).

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- Lowercase letters, numbers and underscores. Friends find each other by this.
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null check (char_length(display_name) between 1 and 40),
  cat_name text check (cat_name is null or char_length(cat_name) <= 40),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select, insert on public.profiles to authenticated;
-- You can change your names, but never your username or which account the profile belongs to.
grant update (display_name, cat_name) on public.profiles to authenticated;

create policy "users can read their own profile"
  on public.profiles for select to authenticated
  using (user_id = (select auth.uid()));
create policy "users can create their own profile"
  on public.profiles for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "users can update their own profile"
  on public.profiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- When someone signs up through the app, the sign-up form sends their username/names along
-- as "metadata", and this trigger turns that into a profile row. (Works even if email
-- confirmation is turned on later.)
create function private.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.raw_user_meta_data ? 'username' then
    insert into public.profiles (user_id, username, display_name, cat_name)
    values (
      new.id,
      lower(btrim(new.raw_user_meta_data->>'username')),
      coalesce(nullif(btrim(new.raw_user_meta_data->>'display_name'), ''), btrim(new.raw_user_meta_data->>'username')),
      nullif(btrim(new.raw_user_meta_data->>'cat_name'), '')
    );
  end if;
  return new;
end;
$$;
revoke execute on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Lets the sign-up form say "that username is taken" before submitting.
create function public.username_taken(p_username text) returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (select 1 from public.profiles where username = lower(btrim(p_username)));
$$;
revoke execute on function public.username_taken(text) from public;
grant execute on function public.username_taken(text) to anon, authenticated;

-- Reviews remember who wrote them when the reviewer was logged in (null = anonymous).
alter table public.reviews
  add column user_id uuid references auth.users (id) on delete set null default auth.uid();
create index reviews_user_id_idx on public.reviews (user_id);

-- The public may read every review column EXCEPT user_id (so reviewers stay anonymous).
revoke select on public.reviews from anon, authenticated;
grant select (id, place_id, rating, comment, cat_name, created_at) on public.reviews to anon, authenticated;

-- Replace the review-insert rule: you can only attach YOUR OWN user id (or none).
drop policy "anyone can review an approved place" on public.reviews;
create policy "anyone can review an approved place"
  on public.reviews for insert to anon, authenticated
  with check (
    exists (select 1 from public.places p where p.id = place_id and p.status = 'approved')
    and (user_id is null or user_id = (select auth.uid()))
  );
