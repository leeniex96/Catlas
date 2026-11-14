// ONE place that lists every choice in the app (categories, policies, amenities).
// Filters, the business sign-up form, and the place page all read from here,
// so to add or rename an option you only edit this file.

export const CATEGORIES = [
  { value: "coffee", label: "Coffee shop", icon: "coffee" },
  { value: "bookstore", label: "Bookstore", icon: "books" },
  { value: "retail", label: "Retail", icon: "shopping-bag" },
  { value: "brewery", label: "Brewery / bar", icon: "beer" },
  { value: "restaurant", label: "Restaurant / patio", icon: "tools-kitchen-2" },
  { value: "park", label: "Park", icon: "trees" },
  { value: "other", label: "Other", icon: "sparkles" },
] as const;

export const DOG_POLICIES = [
  { value: "none", label: "No dogs" },
  { value: "separated", label: "Dogs separated" },
  { value: "allowed", label: "Dogs allowed" },
] as const;

export const NOISE_LEVELS = [
  { value: "quiet", label: "Quiet" },
  { value: "moderate", label: "Moderate" },
  { value: "lively", label: "Lively" },
] as const;

export const SETTINGS = [
  { value: "indoor", label: "Indoor" },
  { value: "outdoor", label: "Outdoor" },
  { value: "both", label: "Indoor & outdoor" },
] as const;

// Cat rules and amenities are yes/no columns on the Place table.
// `key` is the column name in prisma/schema.prisma.
export const CAT_RULES = [
  { key: "carrierOnly", label: "Carrier only" },
  { key: "harnessOk", label: "Harness OK" },
  { key: "strollerOk", label: "Stroller OK" },
] as const;

export const AMENITIES = [
  { key: "waterBowl", label: "Water bowl" },
  { key: "quietCorner", label: "Quiet corner" },
  { key: "catSavvyStaff", label: "Cat-savvy staff" },
] as const;

export const RATINGS = [
  { value: "relaxed", label: "Relaxed", icon: "mood-happy" },
  { value: "curious", label: "Curious but okay", icon: "mood-puzzled" },
  { value: "stressed", label: "Stressed", icon: "mood-nervous" },
] as const;

// Neighborhoods offered in the sign-up form and used for the sample data.
export const NEIGHBORHOODS = [
  "Back Bay",
  "Beacon Hill",
  "Brighton",
  "Cambridge",
  "Charlestown",
  "Dorchester",
  "Fenway",
  "Jamaica Plain",
  "North End",
  "Roslindale",
  "Seaport",
  "Somerville",
  "South Boston",
  "South End",
  "Other",
] as const;

// ---- Types and tiny helpers ----

export type Category = (typeof CATEGORIES)[number]["value"];
export type DogPolicy = (typeof DOG_POLICIES)[number]["value"];
export type NoiseLevel = (typeof NOISE_LEVELS)[number]["value"];
export type Setting = (typeof SETTINGS)[number]["value"];
export type Rating = (typeof RATINGS)[number]["value"];
export type CatRuleKey = (typeof CAT_RULES)[number]["key"];
export type AmenityKey = (typeof AMENITIES)[number]["key"];

type Option = { value: string; label: string };

export function labelFor(options: readonly Option[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

export function categoryInfo(value: string) {
  return CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1];
}

// Handy for zod: ["coffee", "bookstore", ...]
export function values<T extends readonly { value: string }[]>(options: T) {
  return options.map((o) => o.value) as [T[number]["value"], ...T[number]["value"][]];
}
