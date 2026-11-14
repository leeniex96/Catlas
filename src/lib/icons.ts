// Every icon the app uses, from the Tabler Icons set (https://tabler.io/icons), outline style.
// Each import is the icon's raw SVG text. To add an icon: import it here, add it to ICONS,
// and use it with <Icon name="..." /> (or iconSvg("...") for map pins).

import adjustmentsHorizontal from "@tabler/icons/outline/adjustments-horizontal.svg?raw";
import award from "@tabler/icons/outline/award.svg?raw";
import binoculars from "@tabler/icons/outline/binoculars.svg?raw";
import compass from "@tabler/icons/outline/compass.svg?raw";
import flag from "@tabler/icons/outline/flag.svg?raw";
import lock from "@tabler/icons/outline/lock.svg?raw";
import trophy from "@tabler/icons/outline/trophy.svg?raw";
import beer from "@tabler/icons/outline/beer.svg?raw";
import books from "@tabler/icons/outline/books.svg?raw";
import bulb from "@tabler/icons/outline/bulb.svg?raw";
import camera from "@tabler/icons/outline/camera.svg?raw";
import cat from "@tabler/icons/outline/cat.svg?raw";
import check from "@tabler/icons/outline/check.svg?raw";
import chevronDown from "@tabler/icons/outline/chevron-down.svg?raw";
import chevronUp from "@tabler/icons/outline/chevron-up.svg?raw";
import coffee from "@tabler/icons/outline/coffee.svg?raw";
import currentLocation from "@tabler/icons/outline/current-location.svg?raw";
import list from "@tabler/icons/outline/list.svg?raw";
import mailHeart from "@tabler/icons/outline/mail-heart.svg?raw";
import mapPin from "@tabler/icons/outline/map-pin.svg?raw";
import map2 from "@tabler/icons/outline/map-2.svg?raw";
import moodHappy from "@tabler/icons/outline/mood-happy.svg?raw";
import moodNervous from "@tabler/icons/outline/mood-nervous.svg?raw";
import moodPuzzled from "@tabler/icons/outline/mood-puzzled.svg?raw";
import moodSad from "@tabler/icons/outline/mood-sad.svg?raw";
import paw from "@tabler/icons/outline/paw.svg?raw";
import shoppingBag from "@tabler/icons/outline/shopping-bag.svg?raw";
import sparkles from "@tabler/icons/outline/sparkles.svg?raw";
import toolsKitchen2 from "@tabler/icons/outline/tools-kitchen-2.svg?raw";
import trees from "@tabler/icons/outline/trees.svg?raw";
import x from "@tabler/icons/outline/x.svg?raw";

export const ICONS = {
  // Place categories
  coffee,
  books,
  "shopping-bag": shoppingBag,
  beer,
  "tools-kitchen-2": toolsKitchen2,
  trees,
  sparkles,
  // How did your cat do?
  "mood-happy": moodHappy,
  "mood-puzzled": moodPuzzled,
  "mood-nervous": moodNervous,
  "mood-sad": moodSad,
  // Paw-ssport badges
  award,
  binoculars,
  compass,
  flag,
  lock,
  trophy,
  // Everywhere else
  "adjustments-horizontal": adjustmentsHorizontal,
  bulb,
  camera,
  cat,
  check,
  "chevron-down": chevronDown,
  "chevron-up": chevronUp,
  "current-location": currentLocation,
  list,
  "mail-heart": mailHeart,
  "map-2": map2,
  "map-pin": mapPin,
  paw,
  x,
} as const;

export type IconName = keyof typeof ICONS;

/** The icon's raw SVG text (used for the map pins, which aren't React). */
export function iconSvg(name: IconName): string {
  return ICONS[name];
}
