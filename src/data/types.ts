// The shapes of our data. When we add Supabase, these map 1:1 onto three tables:
// places, reviews, nominations.

import type { Category, DogPolicy, NoiseLevel, Rating, Setting } from "@/lib/options";

export type ListingStatus = "pending" | "approved" | "rejected";

export interface Place {
  id: string;
  slug: string; // used in the URL: /places/marmalade-and-mews
  name: string;
  address: string;
  neighborhood: string;
  // Pending listings have no coordinates until the admin approves them.
  lat: number | null;
  lng: number | null;
  hours: string; // free text, e.g. "Mon–Fri 7am–5pm"
  website?: string;
  description: string;

  category: Category;
  dogPolicy: DogPolicy;
  noise: NoiseLevel;
  setting: Setting;

  // Cat rules
  carrierOnly: boolean;
  harnessOk: boolean;
  strollerOk: boolean;

  // Amenities
  waterBowl: boolean;
  quietCorner: boolean;
  catSavvyStaff: boolean;

  status: ListingStatus;
  isSample: boolean; // true = fictional sample data (shows a "Sample listing" badge)

  // Private contact info, only shown on the admin page.
  // With Supabase this should live in a table that only admins can read.
  ownerName?: string;
  ownerEmail?: string;

  createdAt: string; // ISO date
}

export interface Review {
  id: string;
  placeId: string;
  rating: Rating;
  comment?: string;
  catName?: string;
  createdAt: string; // ISO date
}

export interface Nomination {
  id: string;
  businessName: string;
  neighborhood?: string;
  note?: string;
  /** "listed" once an admin has added the place to Catlas. */
  status: "open" | "listed";
  createdAt: string; // ISO date
}

// ---- Accounts, friends and photos ----

export interface Profile {
  userId: string;
  username: string; // unique, lowercase, how friends find you
  displayName: string;
  catName?: string;
  /** Link to their profile picture, if they have one. */
  avatarUrl?: string;
}

export interface Friendship {
  id: string;
  status: "pending" | "accepted";
  /** true if I sent the request, false if I received it. */
  iSentIt: boolean;
  /** The other person. */
  other: Profile;
  createdAt: string;
}

/** A review written by one of my accepted friends. */
export interface FriendVisit {
  reviewId: string;
  friend: Pick<Profile, "userId" | "username" | "displayName" | "avatarUrl">;
  catName?: string; // the cat that went on this visit
  rating: Rating;
  comment?: string;
  visitedAt: string;
  placeId: string;
  placeSlug: string;
  placeName: string;
}

export type PhotoStatus = "pending" | "approved" | "rejected";

export interface PlacePhoto {
  id: string;
  placeId: string;
  /** An uploaded picture, or a GIPHY GIF. */
  kind: "photo" | "gif";
  url: string; // public link to the image or GIF
  caption?: string;
  status: PhotoStatus;
  createdAt: string;
  placeName?: string; // only filled in on the admin page
}

// ---- Paw-ssport (stamps and badges) ----

/** The numbers badges are earned from. */
export interface PassportStats {
  placesVisited: number; // different places reviewed while logged in
  neighborhoods: number; // different neighborhoods among those places
  categories: number; // different kinds of places (coffee shop, bookstore, ...)
  listedSpots: number; // "Request a spot" requests that got listed
  photos: number; // approved photos and GIFs
}

/** One stamp: a place you've been. */
export interface PassportStamp {
  placeId: string;
  slug: string;
  name: string;
  neighborhood: string;
  category: Category;
  firstVisit: string; // ISO date
}

export interface Passport {
  stats: PassportStats;
  stamps: PassportStamp[];
}

// How many cats had each experience at a place.
export interface ReviewStats {
  total: number;
  relaxed: number;
  curious: number;
  stressed: number;
}

export type PlaceWithStats = Place & { stats: ReviewStats };

// What the business sign-up form collects.
export type NewPlaceInput = Omit<
  Place,
  "id" | "slug" | "lat" | "lng" | "status" | "isSample" | "createdAt"
>;

export type NewReviewInput = Pick<Review, "placeId" | "rating" | "comment" | "catName">;
export type NewNominationInput = Pick<Nomination, "businessName" | "neighborhood" | "note">;
