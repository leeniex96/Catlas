-- Migration 009: the Paw-ssport (stamps and badges).
-- Already applied to the Supabase project as "passport".
--
-- 1. "Request a spot" nominations now remember WHO sent them (when logged in) and whether the spot
--    has been listed yet, so the person can earn a "Spot Sniffer" badge.
-- 2. `passport()` counts a person's stamps and stats. Only you, and your accepted friends, can read it.
--    (The badges themselves are worked out in the app from these numbers: see src/lib/badges.ts.)

-- ---- Nominations: who sent it, and has it been listed? ----
alter table public.nominations
  add column user_id uuid references auth.users (id) on delete set null default auth.uid(),
  add column status text not null default 'open' check (status in ('open', 'listed')),
  add column listed_place_id uuid references public.places (id) on delete set null;
create index nominations_user_id_idx on public.nominations (user_id);
create index nominations_listed_place_idx on public.nominations (listed_place_id);

-- Visitors may only fill in the three public fields. `user_id` is set by the database (so nobody can
-- send a request "as" someone else) and `status` always starts as "open".
revoke insert on public.nominations from anon, authenticated;
grant insert (business_name, neighborhood, note) on public.nominations to anon, authenticated;

-- Only admins can mark a request as listed.
grant update (status, listed_place_id) on public.nominations to authenticated;
create policy "admins can update nominations"
  on public.nominations for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- ---- The Paw-ssport numbers ----
-- Pass nothing to see your own; pass a friend's user id to see theirs.
-- Returns null if you're not allowed (a stranger's) or not logged in.
create function public.passport(p_user uuid default null)
returns jsonb
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  target uuid;
begin
  if me is null then
    return null;
  end if;

  target := coalesce(p_user, me);

  if target <> me and not exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester_id = me and f.addressee_id = target)
        or (f.addressee_id = me and f.requester_id = target))
  ) then
    return null;
  end if;

  return jsonb_build_object(
    'stats', jsonb_build_object(
      -- each place counts once, however many times it was reviewed
      'places_visited', (
        select count(distinct r.place_id) from public.reviews r
        join public.places pl on pl.id = r.place_id and pl.status = 'approved'
        where r.user_id = target),
      'neighborhoods', (
        select count(distinct pl.neighborhood) from public.reviews r
        join public.places pl on pl.id = r.place_id and pl.status = 'approved'
        where r.user_id = target),
      'categories', (
        select count(distinct pl.category) from public.reviews r
        join public.places pl on pl.id = r.place_id and pl.status = 'approved'
        where r.user_id = target),
      'listed_spots', (
        select count(*) from public.nominations n
        where n.user_id = target and n.status = 'listed'),
      'photos', (
        select count(*) from public.place_photos ph
        where ph.user_id = target and ph.status = 'approved')
    ),
    'stamps', coalesce((
      select jsonb_agg(to_jsonb(s) order by s.first_visit)
      from (
        select pl.id as place_id, pl.slug, pl.name, pl.neighborhood, pl.category,
               min(r.created_at) as first_visit
        from public.reviews r
        join public.places pl on pl.id = r.place_id and pl.status = 'approved'
        where r.user_id = target
        group by pl.id, pl.slug, pl.name, pl.neighborhood, pl.category
        order by min(r.created_at)
        limit 200
      ) s
    ), '[]'::jsonb)
  );
end;
$$;
revoke execute on function public.passport(uuid) from public, anon;
grant execute on function public.passport(uuid) to authenticated;
