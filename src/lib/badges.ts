// The Paw-ssport badges. To add, rename or re-tune a badge, edit the list below. Nothing in
// the database needs to change: badges are worked out from a person's numbers (see passport()
// in supabase/migrations/009_passport.sql) every time the page is shown.

import type { PassportStats } from "@/data/types";
import type { IconName } from "./icons";

export interface BadgeDef {
  id: string;
  name: string;
  icon: IconName;
  /** Which number it's earned from. */
  stat: keyof PassportStats;
  /** How many of that number it takes. */
  goal: number;
  /** Shown while the badge is still locked. */
  how: string;
  /** Shown once earned. `cat` is the cat's name (or "Your cat"). */
  blurb: (cat: string) => string;
}

export const BADGES: BadgeDef[] = [
  // ---- Places visited ----
  {
    id: "kitten-steps",
    name: "Kitten Steps",
    icon: "paw",
    stat: "placesVisited",
    goal: 1,
    how: "Review your first place.",
    blurb: (cat) => `${cat}'s first outing is in the books!`,
  },
  {
    id: "curious-cat",
    name: "Curious Cat",
    icon: "paw",
    stat: "placesVisited",
    goal: 3,
    how: "Review 3 different places.",
    blurb: (cat) => `Three places sniffed out. ${cat} is getting the hang of this.`,
  },
  {
    id: "whisker-wanderer",
    name: "Whisker Wanderer",
    icon: "map-pin",
    stat: "placesVisited",
    goal: 5,
    how: "Review 5 different places.",
    blurb: (cat) => `Five places and counting. ${cat} is on the move.`,
  },
  {
    id: "nine-lives-nomad",
    name: "Nine Lives Nomad",
    icon: "flag",
    stat: "placesVisited",
    goal: 9,
    how: "Review 9 different places. One for each life.",
    blurb: (cat) => `Nine places, nine lives. ${cat} has seen it all.`,
  },
  {
    id: "top-cat",
    name: "Top Cat",
    icon: "trophy",
    stat: "placesVisited",
    goal: 20,
    how: "Review 20 different places.",
    blurb: (cat) => `Twenty places! ${cat} is the top cat in town.`,
  },

  // ---- Neighborhoods ----
  {
    id: "turf-tourist",
    name: "Turf Tourist",
    icon: "compass",
    stat: "neighborhoods",
    goal: 3,
    how: "Review places in 3 different neighborhoods.",
    blurb: (cat) => `${cat} has claimed turf in three neighborhoods.`,
  },
  {
    id: "prowl-around-town",
    name: "Prowl Around Town",
    icon: "compass",
    stat: "neighborhoods",
    goal: 6,
    how: "Review places in 6 different neighborhoods.",
    blurb: (cat) => `Six neighborhoods. ${cat} is prowling the whole town.`,
  },

  // ---- Variety ----
  {
    id: "cat-of-all-trades",
    name: "Cat of All Trades",
    icon: "award",
    stat: "categories",
    goal: 4,
    how: "Review 4 different kinds of places, like a café, a bookstore and a park.",
    blurb: (cat) => `${cat} does it all: cafés, books, patios and more.`,
  },

  // ---- Finding new spots ----
  {
    id: "spot-sniffer",
    name: "Spot Sniffer",
    icon: "binoculars",
    stat: "listedSpots",
    goal: 1,
    how: "Request a spot that gets listed on Catlas. (Log in first, so we know it's you.)",
    blurb: (cat) => `You sniffed out a new spot, and ${cat} has you to thank.`,
  },
  {
    id: "trend-whisperer",
    name: "Trend Whisperer",
    icon: "binoculars",
    stat: "listedSpots",
    goal: 3,
    how: "Get 3 of your spot requests listed.",
    blurb: () => `Three spots you found are now on the map. Cats everywhere thank you.`,
  },

  // ---- Photos ----
  {
    id: "paw-parazzi",
    name: "Paw-parazzi",
    icon: "camera",
    stat: "photos",
    goal: 1,
    how: "Share a photo or GIF that gets approved.",
    blurb: (cat) => `Caught on camera! ${cat} is famous now.`,
  },
  {
    id: "whisker-lens",
    name: "Whisker Lens",
    icon: "camera",
    stat: "photos",
    goal: 5,
    how: "Get 5 photos or GIFs approved.",
    blurb: (cat) => `Five approved shots. ${cat} has a whole portfolio.`,
  },
];

export interface BadgeProgress {
  def: BadgeDef;
  value: number; // how far along (capped at the goal)
  earned: boolean;
}

/** Works out which badges are earned, and how far along each unearned one is. */
export function evaluateBadges(stats: PassportStats): BadgeProgress[] {
  return BADGES.map((def) => {
    const raw = stats[def.stat];
    return { def, value: Math.min(raw, def.goal), earned: raw >= def.goal };
  });
}
