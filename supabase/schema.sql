-- Catlas database schema.
-- Already applied to the Supabase project as the migration "initial_schema".
-- Kept here so you can see (and re-create) how the database is set up.
--
-- WHO CAN DO WHAT (enforced by Row Level Security, "RLS", inside the database itself,
-- so it can't be bypassed from the browser):
--   Anyone (not logged in):
--     - read APPROVED places and their reviews
--     - add a review for an approved place
--     - send a "Request a spot" nomination
--     - submit a business listing (it always starts as "pending")
--   Admins (logged-in users listed in the `admins` table):
--     - see everything: pending/rejected places, owner contact info, nominations
--     - approve / reject places, delete reviews

-- Lets us turn "Café" into "cafe" when making URL slugs.
create extension if not exists unaccent with schema extensions;

-- A private schema for the admin check. It is NOT exposed through the public API.
create schema if not exists private;
grant usage on schema private to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Admins: add a row here for each person allowed to use /admin.
-- ---------------------------------------------------------------------------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;

create function private.is_admin() returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;
revoke execute on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Places
-- (The allowed values below mirror src/lib/options.ts.)
-- ---------------------------------------------------------------------------
create table public.places (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null check (char_length(name) between 1 and 120),
  address text not null check (char_length(address) between 1 and 200),
  neighborhood text not null check (char_length(neighborhood) between 1 and 60),
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  hours text not null default '' check (char_length(hours) <= 200),
  -- Must start with http(s):// because we show it as a clickable link.
  website text check (website is null or (char_length(website) <= 300 and website ~* '^https?://')),
  description text not null default '' check (char_length(description) <= 300),

  category text not null check (category in ('coffee','bookstore','retail','brewery','restaurant','park','other')),
  dog_policy text not null check (dog_policy in ('none','separated','allowed')),
  noise text not null check (noise in ('quiet','moderate','lively')),
  setting text not null check (setting in ('indoor','outdoor','both')),

  carrier_only boolean not null default false,
  harness_ok boolean not null default false,
  stroller_ok boolean not null default false,
  water_bowl boolean not null default false,
  quiet_corner boolean not null default false,
  cat_savvy_staff boolean not null default false,

  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),

  -- A place can't be approved (shown on the map) without a map location.
  constraint approved_needs_coords check (status <> 'approved' or (lat is not null and lng is not null)),
  -- "Carrier only" can't be combined with harness/stroller.
  constraint carrier_only_is_exclusive check (not (carrier_only and (harness_ok or stroller_ok)))
);
create index places_status_idx on public.places (status);
alter table public.places enable row level security;

-- Private owner contact info, kept in its own table so it can never leak with a place.
create table public.place_contacts (
  place_id uuid primary key references public.places (id) on delete cascade,
  owner_name text not null check (char_length(owner_name) between 1 and 100),
  owner_email text not null check (char_length(owner_email) between 3 and 200 and owner_email like '%@%')
);
alter table public.place_contacts enable row level security;

-- ---------------------------------------------------------------------------
-- Reviews ("How did your cat do?")
-- ---------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  rating text not null check (rating in ('relaxed','curious','stressed')),
  comment text check (comment is null or char_length(comment) <= 400),
  cat_name text check (cat_name is null or char_length(cat_name) <= 40),
  created_at timestamptz not null default now()
);
create index reviews_place_id_idx on public.reviews (place_id);
alter table public.reviews enable row level security;

-- ---------------------------------------------------------------------------
-- Nominations ("Request a spot")
-- ---------------------------------------------------------------------------
create table public.nominations (
  id uuid primary key default gen_random_uuid(),
  business_name text not null check (char_length(business_name) between 1 and 120),
  neighborhood text check (neighborhood is null or char_length(neighborhood) <= 60),
  note text check (note is null or char_length(note) <= 300),
  created_at timestamptz not null default now()
);
alter table public.nominations enable row level security;

-- ---------------------------------------------------------------------------
-- Table permissions: start from nothing, then grant only what's needed.
-- (RLS policies below narrow these down further.)
-- ---------------------------------------------------------------------------
revoke all on public.admins, public.places, public.place_contacts, public.reviews, public.nominations
  from anon, authenticated;

grant select on public.places to anon, authenticated;
grant update, delete on public.places to authenticated;
grant select on public.place_contacts to authenticated;
grant select, insert on public.reviews to anon, authenticated;
grant delete on public.reviews to authenticated;
grant insert on public.nominations to anon, authenticated;
grant select, delete on public.nominations to authenticated;
grant select on public.admins to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security policies
-- ---------------------------------------------------------------------------
create policy "admins can see their own admin row"
  on public.admins for select to authenticated
  using (user_id = (select auth.uid()));

create policy "anyone can read approved places"
  on public.places for select to anon, authenticated
  using (status = 'approved');
create policy "admins can read all places"
  on public.places for select to authenticated
  using ((select private.is_admin()));
create policy "admins can update places"
  on public.places for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins can delete places"
  on public.places for delete to authenticated
  using ((select private.is_admin()));

create policy "admins can read contacts"
  on public.place_contacts for select to authenticated
  using ((select private.is_admin()));

create policy "anyone can read reviews of approved places"
  on public.reviews for select to anon, authenticated
  using (exists (select 1 from public.places p where p.id = place_id and p.status = 'approved'));
create policy "admins can read all reviews"
  on public.reviews for select to authenticated
  using ((select private.is_admin()));
create policy "anyone can review an approved place"
  on public.reviews for insert to anon, authenticated
  with check (exists (select 1 from public.places p where p.id = place_id and p.status = 'approved'));
create policy "admins can delete reviews"
  on public.reviews for delete to authenticated
  using ((select private.is_admin()));

create policy "anyone can send a nomination"
  on public.nominations for insert to anon, authenticated
  with check (char_length(btrim(business_name)) > 0);
create policy "admins can read nominations"
  on public.nominations for select to authenticated
  using ((select private.is_admin()));
create policy "admins can delete nominations"
  on public.nominations for delete to authenticated
  using ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- Business sign-up. Visitors can't insert into `places` directly; they call this
-- function instead, which ALWAYS creates a pending, non-sample place with no
-- coordinates (so nobody can publish themselves), plus the private contact row.
-- ---------------------------------------------------------------------------
create function public.submit_place(payload jsonb) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_slug text;
  new_slug text;
  n integer := 1;
  new_id uuid;
begin
  -- "Marmalade & Café" -> "marmalade-and-cafe"; add -2, -3... if it's taken.
  base_slug := trim(both '-' from regexp_replace(
    lower(replace(extensions.unaccent(payload->>'name'), '&', 'and')), '[^a-z0-9]+', '-', 'g'));
  if base_slug = '' then base_slug := 'place'; end if;
  new_slug := base_slug;
  while exists (select 1 from public.places where slug = new_slug) loop
    n := n + 1;
    new_slug := base_slug || '-' || n;
  end loop;

  insert into public.places (
    slug, name, address, neighborhood, hours, website, description,
    category, dog_policy, noise, setting,
    carrier_only, harness_ok, stroller_ok, water_bowl, quiet_corner, cat_savvy_staff,
    status, is_sample
  ) values (
    new_slug,
    btrim(payload->>'name'),
    btrim(payload->>'address'),
    btrim(payload->>'neighborhood'),
    coalesce(btrim(payload->>'hours'), ''),
    nullif(btrim(payload->>'website'), ''),
    coalesce(btrim(payload->>'description'), ''),
    payload->>'category',
    payload->>'dogPolicy',
    payload->>'noise',
    payload->>'setting',
    coalesce((payload->>'carrierOnly')::boolean, false),
    coalesce((payload->>'harnessOk')::boolean, false),
    coalesce((payload->>'strollerOk')::boolean, false),
    coalesce((payload->>'waterBowl')::boolean, false),
    coalesce((payload->>'quietCorner')::boolean, false),
    coalesce((payload->>'catSavvyStaff')::boolean, false),
    'pending',
    false
  ) returning id into new_id;

  insert into public.place_contacts (place_id, owner_name, owner_email)
  values (new_id, btrim(payload->>'ownerName'), btrim(payload->>'ownerEmail'));
end;
$$;
revoke execute on function public.submit_place(jsonb) from public;
grant execute on function public.submit_place(jsonb) to anon, authenticated;
