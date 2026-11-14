// Talks to the real Supabase database.
// Table and column names come from supabase/schema.sql (database uses snake_case,
// the app uses camelCase, so `toPlace` below translates between them).

import { GIF_ID_PATTERN, gifUrl } from "@/lib/giphy";
import { supabase } from "@/lib/supabase";
import type { Repository } from "./repository";
import type {
  FriendVisit,
  Friendship,
  ListingStatus,
  Nomination,
  PhotoStatus,
  Place,
  PlacePhoto,
  PlaceWithStats,
  Profile,
  Review,
  ReviewStats,
} from "./types";

const PHOTO_BUCKET = "place-photos";
const AVATAR_BUCKET = "avatars";

interface ProfileRow {
  user_id: string;
  username: string;
  display_name: string;
  cat_name: string | null;
  // Missing when the row comes from find_profile (strangers don't get to see pictures).
  avatar_path?: string | null;
}

const PROFILE_COLUMNS = "user_id, username, display_name, cat_name, avatar_path";

function avatarUrl(path: string | null | undefined): string | undefined {
  return path ? supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl : undefined;
}

function toProfile(row: ProfileRow): Profile {
  return {
    userId: row.user_id,
    username: row.username,
    displayName: row.display_name,
    catName: row.cat_name ?? undefined,
    avatarUrl: avatarUrl(row.avatar_path),
  };
}

interface PhotoRow {
  id: string;
  place_id: string;
  storage_path: string | null; // set for uploaded pictures
  gif_id: string | null; // set for GIPHY GIFs (exactly one of the two is set)
  caption: string | null;
  status: PhotoStatus;
  created_at: string;
  places?: { name: string } | null;
}

function toPhoto(row: PhotoRow): PlacePhoto {
  return {
    id: row.id,
    placeId: row.place_id,
    kind: row.gif_id ? "gif" : "photo",
    url: row.gif_id
      ? gifUrl(row.gif_id)
      : supabase.storage.from(PHOTO_BUCKET).getPublicUrl(row.storage_path ?? "").data.publicUrl,
    caption: row.caption ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    placeName: row.places?.name,
  };
}

/** The id of whoever is logged in, or null. */
async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

async function requireUserId(): Promise<string> {
  const id = await currentUserId();
  if (!id) throw new Error("Please log in first.");
  return id;
}

// ---- What a row looks like coming out of the database ----

interface PlaceRow {
  id: string;
  slug: string;
  name: string;
  address: string;
  neighborhood: string;
  lat: number | null;
  lng: number | null;
  hours: string;
  website: string | null;
  description: string;
  category: Place["category"];
  dog_policy: Place["dogPolicy"];
  noise: Place["noise"];
  setting: Place["setting"];
  carrier_only: boolean;
  harness_ok: boolean;
  stroller_ok: boolean;
  water_bowl: boolean;
  quiet_corner: boolean;
  cat_savvy_staff: boolean;
  status: ListingStatus;
  is_sample: boolean;
  created_at: string;
}

interface ContactRow {
  owner_name: string;
  owner_email: string;
}

interface ReviewRow {
  id: string;
  place_id: string;
  rating: Review["rating"];
  comment: string | null;
  cat_name: string | null;
  created_at: string;
}

const PLACE_COLUMNS =
  "id, slug, name, address, neighborhood, lat, lng, hours, website, description, category, dog_policy, noise, setting, carrier_only, harness_ok, stroller_ok, water_bowl, quiet_corner, cat_savvy_staff, status, is_sample, created_at";

// ---- Translating rows into the shapes the screens use ----

function toPlace(row: PlaceRow, contact?: ContactRow | null): Place {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    address: row.address,
    neighborhood: row.neighborhood,
    lat: row.lat,
    lng: row.lng,
    hours: row.hours,
    website: row.website ?? undefined,
    description: row.description,
    category: row.category,
    dogPolicy: row.dog_policy,
    noise: row.noise,
    setting: row.setting,
    carrierOnly: row.carrier_only,
    harnessOk: row.harness_ok,
    strollerOk: row.stroller_ok,
    waterBowl: row.water_bowl,
    quietCorner: row.quiet_corner,
    catSavvyStaff: row.cat_savvy_staff,
    status: row.status,
    isSample: row.is_sample,
    ownerName: contact?.owner_name,
    ownerEmail: contact?.owner_email,
    createdAt: row.created_at,
  };
}

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    placeId: row.place_id,
    rating: row.rating,
    comment: row.comment ?? undefined,
    catName: row.cat_name ?? undefined,
    createdAt: row.created_at,
  };
}

function toStats(ratings: { rating: Review["rating"] }[]): ReviewStats {
  const stats: ReviewStats = { total: ratings.length, relaxed: 0, curious: 0, stressed: 0 };
  for (const r of ratings) stats[r.rating] += 1;
  return stats;
}

// Supabase reports problems in an `error` field instead of throwing. This turns them
// into normal errors so the screens' try/catch (and "Something went wrong") work.
function check<T extends { error: { message: string } | null }>(result: T): T {
  if (result.error) throw new Error(result.error.message);
  return result;
}

// ---- The repository ----

export const supabaseRepository: Repository = {
  async listApprovedPlaces(): Promise<PlaceWithStats[]> {
    // `reviews(rating)` pulls each place's ratings along with it so we can count them.
    // Fine for an MVP; if reviews grow into the thousands, switch to a database view
    // that counts them on the server.
    const { data } = check(
      await supabase
        .from("places")
        .select(`${PLACE_COLUMNS}, reviews(rating)`)
        .eq("status", "approved"),
    );
    return (data as unknown as (PlaceRow & { reviews: { rating: Review["rating"] }[] })[]).map(
      (row) => ({ ...toPlace(row), stats: toStats(row.reviews) }),
    );
  },

  async getApprovedPlace(slug): Promise<PlaceWithStats | null> {
    const { data } = check(
      await supabase
        .from("places")
        .select(`${PLACE_COLUMNS}, reviews(rating)`)
        .eq("slug", slug)
        .eq("status", "approved")
        .maybeSingle(),
    );
    if (!data) return null;
    const row = data as unknown as PlaceRow & { reviews: { rating: Review["rating"] }[] };
    return { ...toPlace(row), stats: toStats(row.reviews) };
  },

  async listReviews(placeId) {
    const { data } = check(
      await supabase
        .from("reviews")
        .select("id, place_id, rating, comment, cat_name, created_at")
        .eq("place_id", placeId)
        .order("created_at", { ascending: false }),
    );
    return (data as ReviewRow[]).map(toReview);
  },

  async addReview(input) {
    check(
      await supabase.from("reviews").insert({
        place_id: input.placeId,
        rating: input.rating,
        comment: input.comment ?? null,
        cat_name: input.catName ?? null,
      }),
    );
  },

  async submitPlace(input) {
    // A database function does the insert so a visitor can never publish themselves
    // (see submit_place in supabase/schema.sql).
    check(await supabase.rpc("submit_place", { payload: input }));
  },

  async addNomination(input) {
    check(
      await supabase.from("nominations").insert({
        business_name: input.businessName,
        neighborhood: input.neighborhood ?? null,
        note: input.note ?? null,
      }),
    );
  },

  async listPlacesByStatus(status) {
    const { data } = check(
      await supabase
        .from("places")
        .select(`${PLACE_COLUMNS}, place_contacts(owner_name, owner_email)`)
        .eq("status", status)
        .order("created_at", { ascending: false }),
    );
    type Row = PlaceRow & { place_contacts: ContactRow | ContactRow[] | null };
    return (data as unknown as Row[]).map((row) => {
      // One contact per place; the API may hand it back as an object or a 1-item list.
      const contact = Array.isArray(row.place_contacts) ? row.place_contacts[0] : row.place_contacts;
      return toPlace(row, contact);
    });
  },

  async approvePlace(id, coords) {
    await setStatus(id, { status: "approved", lat: coords.lat, lng: coords.lng });
  },

  async rejectPlace(id) {
    await setStatus(id, { status: "rejected" });
  },

  // ---------- Accounts ----------

  async getMyProfile() {
    const uid = await currentUserId();
    if (!uid) return null;
    const { data } = check(
      await supabase.from("profiles").select(PROFILE_COLUMNS).eq("user_id", uid).maybeSingle(),
    );
    return data ? toProfile(data as ProfileRow) : null;
  },

  async createMyProfile(input) {
    const uid = await requireUserId();
    check(
      await supabase.from("profiles").insert({
        user_id: uid,
        username: input.username.trim().toLowerCase(),
        display_name: input.displayName.trim(),
        cat_name: input.catName?.trim() || null,
      }),
    );
  },

  async updateMyProfile(input) {
    const uid = await requireUserId();
    const { data } = check(
      await supabase
        .from("profiles")
        .update({ display_name: input.displayName.trim(), cat_name: input.catName?.trim() || null })
        .eq("user_id", uid)
        .select("user_id"),
    );
    if (!data || data.length === 0) throw new Error("Couldn't save your profile.");
  },

  async isUsernameTaken(username) {
    const { data } = check(await supabase.rpc("username_taken", { p_username: username }));
    return data === true;
  },

  async uploadAvatar(file) {
    const uid = await requireUserId();
    const { data: current } = check(
      await supabase.from("profiles").select("avatar_path").eq("user_id", uid).maybeSingle(),
    );
    const oldPath = (current as { avatar_path: string | null } | null)?.avatar_path ?? null;

    // A new random file name each time, so browsers never show a stale cached picture.
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const path = `${uid}/${id}.jpg`;
    check(await supabase.storage.from(AVATAR_BUCKET).upload(path, file, { contentType: "image/jpeg" }));

    const { data, error } = await supabase
      .from("profiles")
      .update({ avatar_path: path })
      .eq("user_id", uid)
      .select("user_id");
    if (error || !data || data.length === 0) {
      await supabase.storage.from(AVATAR_BUCKET).remove([path]);
      throw new Error(error?.message ?? "Couldn't save your picture.");
    }
    if (oldPath) await supabase.storage.from(AVATAR_BUCKET).remove([oldPath]);
  },

  async removeAvatar() {
    const uid = await requireUserId();
    const { data: current } = check(
      await supabase.from("profiles").select("avatar_path").eq("user_id", uid).maybeSingle(),
    );
    const oldPath = (current as { avatar_path: string | null } | null)?.avatar_path ?? null;
    check(await supabase.from("profiles").update({ avatar_path: null }).eq("user_id", uid));
    if (oldPath) await supabase.storage.from(AVATAR_BUCKET).remove([oldPath]);
  },

  // ---------- Friends ----------

  async findProfileByUsername(username) {
    const { data } = check(await supabase.rpc("find_profile", { p_username: username }));
    const rows = (data ?? []) as ProfileRow[];
    return rows.length > 0 ? toProfile(rows[0]) : null;
  },

  async sendFriendRequest(userId) {
    check(await supabase.from("friendships").insert({ addressee_id: userId }));
  },

  async listFriendships() {
    const me = await currentUserId();
    if (!me) return [];
    const { data } = check(
      await supabase
        .from("friendships")
        .select("id, status, created_at, requester_id, addressee_id")
        .order("created_at", { ascending: false }),
    );
    const rows = data as {
      id: string;
      status: Friendship["status"];
      created_at: string;
      requester_id: string;
      addressee_id: string;
    }[];
    if (rows.length === 0) return [];

    // Look up the name of the person on the other side of each friendship.
    const otherIds = rows.map((r) => (r.requester_id === me ? r.addressee_id : r.requester_id));
    const { data: profiles } = check(
      await supabase.from("profiles").select(PROFILE_COLUMNS).in("user_id", otherIds),
    );
    const byId = new Map((profiles as ProfileRow[]).map((p) => [p.user_id, toProfile(p)]));

    return rows.flatMap((r): Friendship[] => {
      const iSentIt = r.requester_id === me;
      const other = byId.get(iSentIt ? r.addressee_id : r.requester_id);
      return other ? [{ id: r.id, status: r.status, iSentIt, other, createdAt: r.created_at }] : [];
    });
  },

  async acceptFriendRequest(id) {
    const { data } = check(
      await supabase.from("friendships").update({ status: "accepted" }).eq("id", id).select("id"),
    );
    if (!data || data.length === 0) throw new Error("Couldn't accept that request.");
  },

  async removeFriendship(id) {
    check(await supabase.from("friendships").delete().eq("id", id));
  },

  async listFriendVisits(placeId) {
    const { data } = check(await supabase.rpc("friend_visits", placeId ? { p_place_id: placeId } : {}));
    type Row = {
      review_id: string;
      friend_user_id: string;
      friend_username: string;
      friend_display_name: string;
      friend_avatar_path: string | null;
      review_cat_name: string | null;
      rating: Review["rating"];
      comment: string | null;
      visited_at: string;
      place_id: string;
      place_slug: string;
      place_name: string;
    };
    return ((data ?? []) as Row[]).map(
      (r): FriendVisit => ({
        reviewId: r.review_id,
        friend: {
          userId: r.friend_user_id,
          username: r.friend_username,
          displayName: r.friend_display_name,
          avatarUrl: avatarUrl(r.friend_avatar_path),
        },
        catName: r.review_cat_name ?? undefined,
        rating: r.rating,
        comment: r.comment ?? undefined,
        visitedAt: r.visited_at,
        placeId: r.place_id,
        placeSlug: r.place_slug,
        placeName: r.place_name,
      }),
    );
  },

  // ---------- Paw-ssport ----------

  async getPassport(userId) {
    const { data } = check(await supabase.rpc("passport", userId ? { p_user: userId } : {}));
    if (!data) return null;
    const raw = data as {
      stats: {
        places_visited: number;
        neighborhoods: number;
        categories: number;
        listed_spots: number;
        photos: number;
      };
      stamps: {
        place_id: string;
        slug: string;
        name: string;
        neighborhood: string;
        category: Place["category"];
        first_visit: string;
      }[];
    };
    return {
      stats: {
        placesVisited: raw.stats.places_visited,
        neighborhoods: raw.stats.neighborhoods,
        categories: raw.stats.categories,
        listedSpots: raw.stats.listed_spots,
        photos: raw.stats.photos,
      },
      stamps: raw.stamps.map((s) => ({
        placeId: s.place_id,
        slug: s.slug,
        name: s.name,
        neighborhood: s.neighborhood,
        category: s.category,
        firstVisit: s.first_visit,
      })),
    };
  },

  // ---------- Photos ----------

  async listApprovedPhotos(placeId) {
    const { data } = check(
      await supabase
        .from("place_photos")
        .select("id, place_id, storage_path, gif_id, caption, status, created_at")
        .eq("place_id", placeId)
        .eq("status", "approved")
        .order("created_at", { ascending: false }),
    );
    return (data as PhotoRow[]).map(toPhoto);
  },

  async uploadPhoto(placeId, file, caption) {
    const uid = await requireUserId();
    // Files go in a folder named after the uploader; the database only allows that folder.
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    const path = `${uid}/${id}.jpg`;

    check(await supabase.storage.from(PHOTO_BUCKET).upload(path, file, { contentType: "image/jpeg" }));

    const { error } = await supabase
      .from("place_photos")
      .insert({ place_id: placeId, storage_path: path, caption: caption?.trim() || null });
    if (error) {
      await supabase.storage.from(PHOTO_BUCKET).remove([path]); // don't leave an orphan file
      throw new Error(error.message);
    }
  },

  async addGif(placeId, gifId, caption) {
    await requireUserId();
    if (!GIF_ID_PATTERN.test(gifId)) throw new Error("That doesn't look like a valid GIF.");
    check(
      await supabase
        .from("place_photos")
        .insert({ place_id: placeId, gif_id: gifId, caption: caption?.trim() || null }),
    );
  },

  async listPhotosByStatus(status) {
    const { data } = check(
      await supabase
        .from("place_photos")
        .select("id, place_id, storage_path, gif_id, caption, status, created_at, places(name)")
        .eq("status", status)
        .order("created_at", { ascending: false }),
    );
    return (data as unknown as PhotoRow[]).map(toPhoto);
  },

  async approvePhoto(id) {
    const { data } = check(
      await supabase.from("place_photos").update({ status: "approved" }).eq("id", id).select("id"),
    );
    if (!data || data.length === 0) throw new Error("Nothing was updated. Are you logged in as an admin?");
  },

  async rejectPhoto(photo) {
    const { data } = check(
      await supabase.from("place_photos").update({ status: "rejected" }).eq("id", photo.id).select("id, storage_path"),
    );
    if (!data || data.length === 0) throw new Error("Nothing was updated. Are you logged in as an admin?");
    // Delete the image file too (the database lets admins do this). GIFs have no file.
    const path = (data[0] as { storage_path: string | null }).storage_path;
    if (path) await supabase.storage.from(PHOTO_BUCKET).remove([path]);
  },

  async listNominations() {
    const { data } = check(
      await supabase
        .from("nominations")
        .select("id, business_name, neighborhood, note, status, created_at")
        .order("created_at", { ascending: false }),
    );
    return (
      data as {
        id: string;
        business_name: string;
        neighborhood: string | null;
        note: string | null;
        status: Nomination["status"];
        created_at: string;
      }[]
    ).map(
      (n): Nomination => ({
        id: n.id,
        businessName: n.business_name,
        neighborhood: n.neighborhood ?? undefined,
        note: n.note ?? undefined,
        status: n.status,
        createdAt: n.created_at,
      }),
    );
  },

  async markNominationsListed(ids) {
    if (ids.length === 0) return;
    const { data } = check(
      await supabase.from("nominations").update({ status: "listed" }).in("id", ids).select("id"),
    );
    if (!data || data.length === 0) throw new Error("Nothing was updated. Are you logged in as an admin?");
  },
};

// Updates a place and makes sure it actually happened. If you're not an admin, the
// database silently changes 0 rows, so we check for that and report it.
async function setStatus(id: string, changes: Record<string, unknown>) {
  const { data } = check(await supabase.from("places").update(changes).eq("id", id).select("id"));
  if (!data || data.length === 0) {
    throw new Error("Nothing was updated. Are you logged in as an admin?");
  }
}
