import { useEffect, useMemo, useState, type FormEvent } from "react";
import { repo } from "@/data";
import type { Nomination, Place, PlacePhoto } from "@/data/types";
import { Badge, btnPrimary, btnSecondary, Card, Field, inputClass, PageHeading } from "@/components/ui";
import Icon from "@/components/Icon";
import { adminSignIn, adminSignOut, getIsAdmin } from "@/lib/adminAuth";
import { geocodeAddress } from "@/lib/geocode";
import {
  AMENITIES,
  CAT_RULES,
  categoryInfo,
  DOG_POLICIES,
  labelFor,
  NOISE_LEVELS,
  SETTINGS,
} from "@/lib/options";
import { formatDate } from "@/lib/reviews";
import { useAsync } from "@/lib/useAsync";

export default function AdminPage() {
  // "checking" while we ask Supabase whether you're already logged in as an admin.
  const [state, setState] = useState<"checking" | "out" | "in">("checking");

  useEffect(() => {
    getIsAdmin()
      .then((isAdmin) => setState(isAdmin ? "in" : "out"))
      .catch(() => setState("out"));
  }, []);

  if (state === "checking") return <p className="text-lg">Loading…</p>;
  if (state === "out") return <AdminLogin onLogin={() => setState("in")} />;
  return (
    <AdminDashboard
      onLogout={async () => {
        await adminSignOut();
        setState("out");
      }}
    />
  );
}

// ---------- Login ----------

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await adminSignIn(email.trim(), password).catch(() => "bad-login" as const);
    setBusy(false);
    if (result === "ok") onLogin();
    else if (result === "not-admin") setError("That account isn't set up as an admin.");
    else setError("That email or password didn't work.");
  }

  return (
    <div className="mx-auto max-w-md">
      <PageHeading title="Admin" intro="Approve or reject business listings and see requested spots." />
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field id="admin-email" label="Email">
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              className={inputClass}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
            />
          </Field>
          <Field id="admin-pw" label="Password">
            <input
              id="admin-pw"
              type="password"
              autoComplete="current-password"
              required
              className={inputClass}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
            />
          </Field>
          {error && (
            <p role="alert" className="font-semibold text-rose-800">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className={btnPrimary}>
            {busy ? "Logging in…" : "Log in"}
          </button>
        </form>
      </Card>
    </div>
  );
}

// ---------- Dashboard ----------

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const pending = useAsync(() => repo.listPlacesByStatus("pending"), []);
  const rejected = useAsync(() => repo.listPlacesByStatus("rejected"), []);
  const nominations = useAsync(() => repo.listNominations(), []);
  const photos = useAsync(() => repo.listPhotosByStatus("pending"), []);

  function refresh() {
    pending.reload();
    rejected.reload();
  }

  const pendingList = pending.data ?? [];
  const nominationList = nominations.data ?? [];
  const photoList = photos.data ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeading title="Admin" />
        <button type="button" className={btnSecondary} onClick={onLogout}>
          Log out
        </button>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
        {[
          ["Pending listings", pendingList.length],
          ["Pending photos", photoList.length],
          ["Rejected", rejected.data?.length ?? 0],
          ["Spot requests", nominationList.length],
        ].map(([label, n]) => (
          <div key={label} className="rounded-2xl border border-cream-200 bg-white p-3">
            <dd className="font-serif text-3xl font-semibold">{n}</dd>
            <dt className="text-sm text-ink-700">{label}</dt>
          </div>
        ))}
      </dl>

      <section aria-labelledby="pending-title" className="space-y-4">
        <h2 id="pending-title" className="font-serif text-2xl font-semibold">
          Pending listings
        </h2>
        {pending.loading && !pending.data && <p>Loading…</p>}
        {!pending.loading && pendingList.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line bg-white p-5 text-ink-700">
            Nothing waiting for review.
          </p>
        )}
        {pendingList.map((p) => (
          <PendingCard key={p.id} place={p} onDone={refresh} />
        ))}
      </section>

      <section aria-labelledby="photos-title" className="space-y-4">
        <h2 id="photos-title" className="font-serif text-2xl font-semibold">
          Pending photos
        </h2>
        {photos.loading && !photos.data && <p>Loading…</p>}
        {!photos.loading && photoList.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line bg-white p-5 text-ink-700">
            No photos or GIFs waiting.
          </p>
        )}
        <ul className="grid gap-4 sm:grid-cols-2">
          {photoList.map((photo) => (
            <li key={photo.id}>
              <PendingPhotoCard photo={photo} onDone={photos.reload} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="noms-title" className="space-y-4">
        <h2 id="noms-title" className="font-serif text-2xl font-semibold">
          Requested spots
        </h2>
        <NominationSummary items={nominationList} onChanged={nominations.reload} />
      </section>
    </div>
  );
}

// ---------- One pending photo ----------

function PendingPhotoCard({ photo, onDone }: { photo: PlacePhoto; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function decide(approve: boolean) {
    setBusy(true);
    setError("");
    try {
      if (approve) await repo.approvePhoto(photo.id);
      else await repo.rejectPhoto(photo);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-3 !p-4">
      <a href={photo.url} target="_blank" rel="noreferrer">
        <img
          src={photo.url}
          alt={`Pending ${photo.kind === "gif" ? "GIF" : "photo"} for ${photo.placeName ?? "a place"}`}
          loading="lazy"
          className="aspect-square w-full rounded-2xl object-cover"
        />
      </a>
      <div>
        <p className="font-semibold">
          {photo.placeName ?? "Unknown place"}
          {photo.kind === "gif" && <span className="font-normal text-ink-700"> · GIF</span>}
        </p>
        {photo.caption && <p className="text-sm text-ink-700">“{photo.caption}”</p>}
        <p className="text-sm text-ink-700">Uploaded {formatDate(photo.createdAt)}</p>
      </div>
      {error && (
        <p role="alert" className="font-semibold text-rose-800">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="button" className={btnPrimary} disabled={busy} onClick={() => decide(true)}>
          Approve
        </button>
        <button type="button" className={btnSecondary} disabled={busy} onClick={() => decide(false)}>
          Reject
        </button>
      </div>
    </Card>
  );
}

// ---------- One pending listing ----------

function PendingCard({ place, onDone }: { place: Place; onDone: () => void }) {
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [lookupMsg, setLookupMsg] = useState("");
  const [looking, setLooking] = useState(false);
  const [busy, setBusy] = useState(false);

  const latNum = Number(lat);
  const lngNum = Number(lng);
  const coordsValid =
    lat.trim() !== "" && lng.trim() !== "" && Math.abs(latNum) <= 90 && Math.abs(lngNum) <= 180;

  async function lookup() {
    setLooking(true);
    setLookupMsg("");
    const found = await geocodeAddress(place.address, place.neighborhood);
    setLooking(false);
    if (found) {
      setLat(found.lat.toFixed(5));
      setLng(found.lng.toFixed(5));
      setLookupMsg("Found a match. Open it on the map to double-check before approving.");
    } else {
      setLookupMsg("Couldn't find that address. Enter the coordinates by hand instead.");
    }
  }

  async function decide(action: "approve" | "reject") {
    setBusy(true);
    if (action === "approve") await repo.approvePlace(place.id, { lat: latNum, lng: lngNum });
    else await repo.rejectPlace(place.id);
    setBusy(false);
    onDone();
  }

  const rules = CAT_RULES.filter((r) => place[r.key]).map((r) => r.label);
  const amenities = AMENITIES.filter((a) => place[a.key]).map((a) => a.label);
  const category = categoryInfo(place.category);

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold">{place.name}</h3>
        <p className="text-ink-700">
          <Icon name={category.icon} className="mr-1.5 h-4 w-4 align-[-0.2em]" />
          {category.label} · {place.neighborhood} · submitted {formatDate(place.createdAt)}
        </p>
      </div>

      <dl className="space-y-1 text-base">
        <div><dt className="inline font-semibold">Address: </dt><dd className="inline">{place.address}</dd></div>
        {place.hours && <div><dt className="inline font-semibold">Hours: </dt><dd className="inline">{place.hours}</dd></div>}
        {place.website && <div><dt className="inline font-semibold">Website: </dt><dd className="inline break-all">{place.website}</dd></div>}
        {place.description && <div><dt className="inline font-semibold">Why cats: </dt><dd className="inline">{place.description}</dd></div>}
        <div>
          <dt className="inline font-semibold">Contact: </dt>
          <dd className="inline">
            {place.ownerName} (<a className="font-semibold text-accent-700 underline" href={`mailto:${place.ownerEmail}`}>{place.ownerEmail}</a>)
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2">
        <Badge>{labelFor(DOG_POLICIES, place.dogPolicy)}</Badge>
        <Badge>{labelFor(NOISE_LEVELS, place.noise)}</Badge>
        <Badge>{labelFor(SETTINGS, place.setting)}</Badge>
        {rules.map((r) => <Badge key={r} tone="sage">{r}</Badge>)}
        {amenities.map((a) => <Badge key={a} tone="accent">{a}</Badge>)}
      </div>

      <fieldset className="rounded-2xl bg-cream-100 p-4">
        <legend className="px-1 font-semibold">Map location</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id={`lat-${place.id}`} label="Latitude">
            <input id={`lat-${place.id}`} inputMode="decimal" className={inputClass} value={lat} onChange={(e) => setLat(e.target.value)} placeholder="42.3601" />
          </Field>
          <Field id={`lng-${place.id}`} label="Longitude">
            <input id={`lng-${place.id}`} inputMode="decimal" className={inputClass} value={lng} onChange={(e) => setLng(e.target.value)} placeholder="-71.0589" />
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" className={btnSecondary} onClick={lookup} disabled={looking}>
            {looking ? "Looking…" : "Look up from address"}
          </button>
          {coordsValid && (
            <a
              className="font-semibold text-accent-700 underline"
              target="_blank"
              rel="noreferrer"
              href={`https://www.openstreetmap.org/?mlat=${latNum}&mlon=${lngNum}#map=18/${latNum}/${lngNum}`}
            >
              Check on OpenStreetMap
            </a>
          )}
        </div>
        {lookupMsg && <p role="status" className="mt-2 text-sm">{lookupMsg}</p>}
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <button type="button" className={btnPrimary} disabled={!coordsValid || busy} onClick={() => decide("approve")}>
          Approve
        </button>
        <button type="button" className={btnSecondary} disabled={busy} onClick={() => decide("reject")}>
          Reject
        </button>
      </div>
      {!coordsValid && <p className="-mt-2 text-sm text-ink-700">Add a map location to enable Approve.</p>}
    </Card>
  );
}

// ---------- Nominations: grouped by business name, most-requested first ----------

function NominationSummary({ items, onChanged }: { items: Nomination[]; onChanged: () => void }) {
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  const groups = useMemo(() => {
    const map = new Map<
      string,
      { name: string; count: number; hoods: Set<string>; notes: string[]; openIds: string[] }
    >();
    // `items` is newest-first; walk oldest-first so the group shows the first spelling used.
    for (const n of [...items].reverse()) {
      const key = n.businessName.trim().toLowerCase(); // "Blue Door" and "blue door" count together
      const g =
        map.get(key) ?? { name: n.businessName.trim(), count: 0, hoods: new Set<string>(), notes: [], openIds: [] };
      g.count += 1;
      if (n.neighborhood) g.hoods.add(n.neighborhood);
      if (n.note) g.notes.push(n.note);
      if (n.status === "open") g.openIds.push(n.id); // requests not yet marked as listed
      map.set(key, g);
    }
    return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [items]);

  // Marks every request for this business as listed. People who sent one while logged in earn
  // Paw-ssport credit (the "Spot Sniffer" badge).
  async function markListed(name: string, ids: string[]) {
    setBusyKey(name);
    setError("");
    try {
      await repo.markNominationsListed(ids);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusyKey(null);
    }
  }

  if (groups.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line bg-white p-5 text-ink-700">
        No requests yet.
      </p>
    );
  }

  return (
    <>
      <p className="text-ink-700">
        {items.length} {items.length === 1 ? "request" : "requests"} across {groups.length}{" "}
        {groups.length === 1 ? "business" : "businesses"}. Once you've added a place to Catlas, mark its requests
        as listed so the people who asked earn their badge.
      </p>
      {error && (
        <p role="alert" className="font-semibold text-rose-800">
          {error}
        </p>
      )}
      <ol className="space-y-3">
        {groups.map((g) => (
          <li key={g.name} className="flex gap-4 rounded-2xl border border-cream-200 bg-white p-4">
            <span
              aria-label={`${g.count} ${g.count === 1 ? "request" : "requests"}`}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent-100 font-serif text-xl font-semibold text-accent-700"
            >
              {g.count}
            </span>
            <div className="min-w-0">
              <p className="font-semibold">{g.name}</p>
              {g.hoods.size > 0 && <p className="text-sm text-ink-700">{[...g.hoods].join(", ")}</p>}
              {g.notes.slice(0, 3).map((note, i) => (
                <p key={i} className="mt-1 text-sm">“{note}”</p>
              ))}
              <div className="mt-3">
                {g.openIds.length > 0 ? (
                  <button
                    type="button"
                    className={btnSecondary}
                    disabled={busyKey === g.name}
                    onClick={() => markListed(g.name, g.openIds)}
                  >
                    {busyKey === g.name ? "Saving…" : "Mark as listed"}
                  </button>
                ) : (
                  <Badge tone="sage">Listed</Badge>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
