# Catlas

Find Boston places where your cat is welcome, and see how other cats did.
Built with React, Vite, TypeScript, Tailwind CSS and Leaflet (OpenStreetMap tiles, no API key),
with **Supabase** as the backend (database + admin login).

## Run it

You need Node 20.19+. From this folder:

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. To test on your phone, use the "Network" address Vite prints
(your phone must be on the same Wi-Fi).

The Supabase settings live in `.env.local` (already created). If you ever need to recreate it,
copy `.env.example` and fill in your project's URL and **publishable** key (Supabase dashboard →
Project Settings → API Keys). The publishable key is meant to be public. Never put a
`secret` / `service_role` key in this app.

Other commands: `npm run build` (production build into `dist/`), `npm run typecheck`.

## Make yourself an admin (one time)

The admin page (`/admin`) uses a real Supabase login. You need an account, and then you need to be
listed as an admin:

1. Supabase dashboard → **Authentication → Users → Add user → Create new user**. Enter your email
   and a strong password, and tick **Auto Confirm User**.
2. Dashboard → **SQL Editor**, run this with your email (this is what makes the account an admin):

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'YOUR-EMAIL@example.com';
   ```
3. Go to <http://localhost:5173/admin> and log in.

Keep **"Allow new users to sign up"** switched **on** (Authentication → Sign In / Providers). Cat owners
create their own accounts for friends and photos. Being logged in never makes someone an admin:
only people in the `admins` table are.

On the admin page you can approve or reject pending listings, approve or reject uploaded photos, and see
how many people requested each spot. To approve a listing, give it a map location: click
**Look up from address** (free OpenStreetMap search), check the result, then **Approve**.

## Features for cat owners

- **Search and "Near me":** the search box matches name, neighborhood, address and type ("south end coffee").
  "Near me" asks the browser for your location, sorts by distance and shows a dot on the map. Your
  location is never saved or sent anywhere. (Phones only allow it on `https://` pages.)
- **Accounts:** `/account` to create an account (email, password, a unique username, your name, your cat's name).
  Browsing, reviewing and requesting spots all still work without one.
- **Profile picture:** on `/account`, choose a photo. It's cropped to a square and shrunk in the browser,
  then shown next to your name for you and your friends (and for someone you've sent a request to or
  received one from). Visitors and strangers never see it. You can replace or remove it any time.
- **Paw-ssport:** `/passport`. Every place you review while logged in earns a stamp (once per place), and
  stamps unlock cheeky cat badges for you and your cat: Kitten Steps, Curious Cat, Whisker Wanderer, Nine
  Lives Nomad, Top Cat, Turf Tourist, Prowl Around Town, Cat of All Trades, Spot Sniffer, Trend Whisperer,
  Paw-parazzi and Whisker Lens. Friends can open each other's Paw-ssports from the Friends page.
  - To add or change a badge, edit the list in `src/lib/badges.ts`. Nothing in the database changes.
  - **Spot Sniffer / Trend Whisperer:** when someone logged in sends a "Request a spot" and you later add
    that place, open `/admin`, find it under **Requested spots** and click **Mark as listed**. They earn the badge.
  - Reviewing the sample places counts as a visit for now. Before launch you may want to count only real places
    (the `is_sample` column marks the fictional ones; it's a one-line change in the `passport()` function).
- **Friends:** `/friends`. Add someone by their *exact* username, they accept, and then you can see each
  other's reviews ("visits") on the Friends page and on each place's page. Only accepted friends can see
  who wrote a review. To everyone else reviews stay anonymous, even ones written while logged in.
- **Photos and GIFs:** logged-in users can add a photo to a place, or search GIPHY and add a GIF. A photo
  is shrunk in the browser first. Either one starts as *pending* and appears only after you approve it on
  `/admin`. (A saved GIF is just its GIPHY id; the picture stays on GIPHY's servers. Only family-friendly
  "G"-rated GIFs are offered.)

### Setting up GIF search (one time)

GIF search runs through a small Supabase Edge Function called `giphy-search`
(source: `supabase/functions/giphy-search/index.ts`, already deployed). It keeps your GIPHY API key
secret on Supabase's servers, so the key never ships in the website.

1. Get a free API key at <https://developers.giphy.com> (create an app, choose **API**).
2. In the Supabase dashboard go to **Edge Functions → Secrets** (also reachable from Project Settings)
   and add a secret with your key as the value. Secret names are case-sensitive: this project's secret is
   named `Giphy`, and the function also accepts `GIPHY_API_KEY`.
3. Check it: the function answers `{"configured":true}` to a health check when the secret is found.
   Until then, the GIF search box in the app says "GIF search isn't set up yet."

GIPHY's free "beta" keys have a low hourly limit. Before launching to the public, apply for a production key
in the GIPHY developer dashboard (it's free) and replace the secret's value.

## How to add a real place

Two ways, and both are live for everyone immediately:

- **Through the app:** fill in the "List your business" form yourself, then approve it on `/admin`.
- **Directly in Supabase:** Dashboard → Table Editor → `places` → Insert row. Set `status` to
  `approved`, fill in `lat`/`lng`, and leave `is_sample` as `false` (so no "Sample listing" badge).
  Get coordinates by right-clicking the spot on <https://www.openstreetmap.org> → "Show address".

Only list places you've verified. The 15 sample places are fictional. To remove them all later,
run `delete from public.places where is_sample;` in the SQL Editor.

## How the database keeps things safe

Rules are enforced inside Supabase (Row Level Security), not in the website, so they can't be
bypassed from a browser. The full setup is in `supabase/schema.sql`.

| Who | Can do |
| --- | --- |
| Any visitor | Read approved places, reviews and approved photos; add a review; send a "Request a spot"; submit a business listing (always saved as *pending*) |
| Logged-in cat owner | Everything above, plus: edit their own profile, send/accept friend requests, see their friends' visits, upload photos (saved as *pending*) |
| Admins only | See pending/rejected places, owner contact details, spot requests and pending photos; approve/reject places and photos; delete reviews |

Owner emails live in a separate table (`place_contacts`) that only admins can read. A place can't be
approved without a map location, and website links must start with `http://` or `https://`.
Who wrote a review (`reviews.user_id`) can't be read through the public API at all; only the
`friend_visits` function reveals it, and only to accepted friends. Nobody can approve their own
photo, because `status` is filled in by the database, not the uploader.

Everything was checked with simulated visitor / friend / stranger / admin accounts (see the
numbered files in `supabase/migrations/`, applied in order after `schema.sql`).

## Project map

```
design/
  logo-options/         Catlas logo ideas as SVG files (the header uses g-line-pin.svg)
public/
  favicon.svg           The browser-tab icon
supabase/
  schema.sql            Tables, security rules, sign-up function (already applied)
  seed.sql              The 15 fictional sample places + reviews (already loaded)
  migrations/           Later changes, in order: accounts, friends, photos, a fix, indexes, profile pictures, GIFs, Paw-ssport (all applied)
  functions/giphy-search/  The Edge Function that searches GIPHY (already deployed)
src/
  data/
    types.ts            What a Place / Review / Nomination looks like
    repository.ts       The list of data actions the screens may call
    supabaseRepository.ts  Talks to Supabase
    index.ts            Picks the data source
  lib/
    supabase.ts         The Supabase connection
    auth.tsx            Who's logged in (useAuth), sign up / log in / log out
    adminAuth.ts        Admin check (logged in AND listed in `admins`)
    badges.ts           The Paw-ssport badges and how they're earned
    options.ts          Every category, policy and amenity, in one file
    icons.ts            Every icon the app uses (Tabler Icons). To change a category's icon, pick a
                        new one at tabler.io/icons, add it here, and set it in options.ts
    filters.ts          Filter + search logic (they live in the page URL)
    geo.ts, useGeolocation.ts   "Near me" distance and location
    image.ts            Shrinks photos before upload
  components/           PlaceCard, FilterPanel, PlaceMap, ReviewForm, PhotoSection, ...
  pages/                Home, Place detail, Business form, Request a spot, Account, Friends, Admin
```

To add or rename a filter option (like a new category), edit `src/lib/options.ts` **and** the matching
`check (...)` list for that column in the database (see `supabase/schema.sql`).

## Suggested next steps

1. Create your admin account (above) and try approving a listing end to end.
2. Add spam protection, since anyone can sign up: in the Supabase dashboard turn on CAPTCHA
   (Authentication → Attack Protection) and **Leaked password protection** (Authentication → Sign In / Providers → Email, a paid-plan feature),
   and consider rate limits on the anonymous forms.
3. Deploy the static site (Vercel, Netlify or Cloudflare Pages). `npm run build` produces `dist/`.
   Set the same two `VITE_SUPABASE_*` variables there, and add a rewrite of all paths to
   `index.html` so links like `/places/some-cafe` work on refresh.
4. Real-phone pass, including keyboard and screen-reader use.
5. If reviews ever grow into the thousands, count them with a database view instead of in the browser.

## Out of scope on purpose

Meetups, gamification, payments, native apps, notifications.
