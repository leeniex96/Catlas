// The ONLY door between the screens and the data.
//
// Every screen talks to this interface, never to Supabase directly. Today
// `supabaseRepository.ts` implements it. Keeping this layer means the screens don't
// need to change if the data source ever does.

import type {
  FriendVisit,
  Friendship,
  ListingStatus,
  NewNominationInput,
  NewPlaceInput,
  NewReviewInput,
  Nomination,
  Passport,
  PhotoStatus,
  Place,
  PlacePhoto,
  PlaceWithStats,
  Profile,
  Review,
} from "./types";

export interface Repository {
  /** Approved places (with review counts) for the map and list. */
  listApprovedPlaces(): Promise<PlaceWithStats[]>;

  /** One approved place by its URL slug, or null if it doesn't exist. */
  getApprovedPlace(slug: string): Promise<PlaceWithStats | null>;

  listReviews(placeId: string): Promise<Review[]>;
  addReview(input: NewReviewInput): Promise<void>;

  /** Business sign-up. The new place starts as "pending" until an admin approves it. */
  submitPlace(input: NewPlaceInput): Promise<void>;

  addNomination(input: NewNominationInput): Promise<void>;

  // --- Accounts (logged-in users) ---
  /** My profile, or null if I'm logged out or haven't made one yet. */
  getMyProfile(): Promise<Profile | null>;
  createMyProfile(input: { username: string; displayName: string; catName?: string }): Promise<void>;
  updateMyProfile(input: { displayName: string; catName?: string }): Promise<void>;
  isUsernameTaken(username: string): Promise<boolean>;
  /** Set (or replace) my profile picture. The old file is deleted. */
  uploadAvatar(file: Blob): Promise<void>;
  /** Remove my profile picture. */
  removeAvatar(): Promise<void>;

  // --- Friends (logged-in users) ---
  /** Find someone by their exact username. Returns null if there's no match (or it's me). */
  findProfileByUsername(username: string): Promise<Profile | null>;
  sendFriendRequest(userId: string): Promise<void>;
  /** Everyone I have a pending request or friendship with. */
  listFriendships(): Promise<Friendship[]>;
  acceptFriendRequest(id: string): Promise<void>;
  /** Unfriend, decline a request, or cancel one I sent. */
  removeFriendship(id: string): Promise<void>;
  /** Reviews by my accepted friends, newest first. Pass a place id to see just that place. */
  listFriendVisits(placeId?: string): Promise<FriendVisit[]>;

  // --- Paw-ssport ---
  /** My stamps and stats (no argument), or a friend's (pass their user id). Null if not allowed. */
  getPassport(userId?: string): Promise<Passport | null>;

  // --- Photos ---
  listApprovedPhotos(placeId: string): Promise<PlacePhoto[]>;
  /** Logged-in users only. The photo starts as "pending" until an admin approves it. */
  uploadPhoto(placeId: string, file: Blob, caption?: string): Promise<void>;
  /** Logged-in users only. Adds a GIPHY GIF (by its id). Starts as "pending" like photos. */
  addGif(placeId: string, gifId: string, caption?: string): Promise<void>;

  // --- Admin only (the database refuses these unless you're logged in as an admin) ---
  listPhotosByStatus(status: PhotoStatus): Promise<PlacePhoto[]>;
  approvePhoto(id: string): Promise<void>;
  /** Marks the photo rejected and deletes its file. */
  rejectPhoto(photo: PlacePhoto): Promise<void>;
  listPlacesByStatus(status: ListingStatus): Promise<Place[]>;
  /** Approve a pending place. Needs map coordinates so it can show on the map. */
  approvePlace(id: string, coords: { lat: number; lng: number }): Promise<void>;
  rejectPlace(id: string): Promise<void>;
  listNominations(): Promise<Nomination[]>;
  /** Mark requested spots as listed. Whoever sent them (if logged in) earns Paw-ssport credit. */
  markNominationsListed(ids: string[]): Promise<void>;
}
