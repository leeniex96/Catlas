-- Migration 005: fix an "infinite recursion" between two security rules.
-- Already applied to the Supabase project as "fix_friends_policy_recursion".
--
-- Problem: the rule for sending a friend request checked the `profiles` table, and the rule
-- for reading profiles checked the `friendships` table, so each kept asking the other.
-- Fix: do those two lookups inside small helper functions in the private schema.

create function private.has_profile() returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (select 1 from public.profiles where user_id = (select auth.uid()));
$$;

-- True if you have a request or friendship (either direction) with `other`.
create function private.is_connected(other uuid) returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.friendships f
    where (f.requester_id = other and f.addressee_id = (select auth.uid()))
       or (f.addressee_id = other and f.requester_id = (select auth.uid()))
  );
$$;

revoke execute on function private.has_profile() from public;
revoke execute on function private.is_connected(uuid) from public;
grant execute on function private.has_profile() to authenticated;
grant execute on function private.is_connected(uuid) to authenticated;

drop policy "you can send a friend request as yourself" on public.friendships;
create policy "you can send a friend request as yourself"
  on public.friendships for insert to authenticated
  with check (
    requester_id = (select auth.uid())
    and status = 'pending'
    and (select private.has_profile())
  );

drop policy "friends can read each other's profiles" on public.profiles;
create policy "friends can read each other's profiles"
  on public.profiles for select to authenticated
  using ((select private.is_connected(user_id)));
