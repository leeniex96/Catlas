// Filters live in the page URL (e.g. /?category=coffee&dogs=none&rule=harnessOk),
// so a filtered view can be shared as a link and the Back button works.
//
// How filters combine:
//  - Within one group (e.g. two categories), a place can match EITHER  -> "or"
//  - Across groups (category AND dog policy), a place must match all   -> "and"
//  - Cat rules and amenities are checkboxes; a place must have EVERY one you tick.

import {
  AMENITIES,
  CAT_RULES,
  CATEGORIES,
  DOG_POLICIES,
  NOISE_LEVELS,
  SETTINGS,
  type AmenityKey,
  type CatRuleKey,
} from "./options";
import type { Place } from "@/data/types";

export interface Filters {
  category: string[];
  dogs: string[];
  noise: string[];
  setting: string[];
  rule: CatRuleKey[];
  amenity: AmenityKey[];
}

export type FilterGroup = keyof Filters;

export const EMPTY_FILTERS: Filters = {
  category: [],
  dogs: [],
  noise: [],
  setting: [],
  rule: [],
  amenity: [],
};

// For each group, the values we accept from the URL (ignores anything made-up).
const ALLOWED: Record<FilterGroup, string[]> = {
  category: CATEGORIES.map((o) => o.value),
  dogs: DOG_POLICIES.map((o) => o.value),
  noise: NOISE_LEVELS.map((o) => o.value),
  setting: SETTINGS.map((o) => o.value),
  rule: CAT_RULES.map((o) => o.key),
  amenity: AMENITIES.map((o) => o.key),
};

export function parseFilters(params: URLSearchParams): Filters {
  const read = (group: FilterGroup) =>
    params.getAll(group).filter((v) => ALLOWED[group].includes(v));
  return {
    category: read("category"),
    dogs: read("dogs"),
    noise: read("noise"),
    setting: read("setting"),
    rule: read("rule") as CatRuleKey[],
    amenity: read("amenity") as AmenityKey[],
  };
}

/** Returns a copy of the URL params with `group` toggled for `value`. */
export function toggleFilter(params: URLSearchParams, group: FilterGroup, value: string) {
  const next = new URLSearchParams(params);
  const current = next.getAll(group);
  next.delete(group);
  const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
  updated.forEach((v) => next.append(group, v));
  return next;
}

/** Removes every filter (and the search text) but keeps other params such as `view`. */
export function clearFilters(params: URLSearchParams) {
  const next = new URLSearchParams(params);
  (Object.keys(EMPTY_FILTERS) as FilterGroup[]).forEach((g) => next.delete(g));
  next.delete("q");
  return next;
}

/**
 * Text search. Every word you type must appear somewhere in the place's name, neighborhood,
 * address, category or description ("south end coffee" finds coffee shops in the South End).
 */
export function matchesSearch(place: Place, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = [
    place.name,
    place.neighborhood,
    place.address,
    place.description,
    CATEGORIES.find((c) => c.value === place.category)?.label ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return words.every((w) => haystack.includes(w));
}

export function countActiveFilters(f: Filters): number {
  return Object.values(f).reduce((sum, list) => sum + list.length, 0);
}

export function applyFilters<T extends Place>(places: T[], f: Filters): T[] {
  // "Indoor" should also find places that are indoor AND outdoor (and likewise for outdoor).
  const settings = new Set<string>(f.setting);
  if (settings.has("indoor") || settings.has("outdoor")) settings.add("both");

  return places.filter((p) => {
    if (f.category.length && !f.category.includes(p.category)) return false;
    if (f.dogs.length && !f.dogs.includes(p.dogPolicy)) return false;
    if (f.noise.length && !f.noise.includes(p.noise)) return false;
    if (settings.size && !settings.has(p.setting)) return false;
    if (!f.rule.every((key) => p[key])) return false;
    if (!f.amenity.every((key) => p[key])) return false;
    return true;
  });
}
