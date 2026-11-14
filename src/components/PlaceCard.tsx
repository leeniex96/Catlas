import { Link } from "react-router-dom";
import type { PlaceWithStats } from "@/data/types";
import { formatMiles } from "@/lib/geo";
import { categoryInfo } from "@/lib/options";
import Icon from "./Icon";
import { SampleBadge } from "./ui";

/**
 * One place in the list. From top to bottom:
 *   CATEGORY (small caps eyebrow)
 *   Business name (big serif)
 *   Neighborhood (smaller, with distance when "Near me" is on)
 * Cat policies and the review summary live on the place's own page.
 */
export default function PlaceCard({
  place,
  distanceMiles,
}: {
  place: PlaceWithStats;
  /** Only passed when "Near me" is on. */
  distanceMiles?: number;
}) {
  const category = categoryInfo(place.category);

  return (
    <Link
      to={`/places/${place.slug}`}
      className="group block rounded-[2rem] border border-cream-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-accent-600/40 hover:shadow-lg sm:p-7"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold tracking-[0.16em] text-accent-700 uppercase">{category.label}</p>
        {place.isSample && <SampleBadge />}
      </div>

      <h3 className="mt-2 font-serif text-2xl leading-tight font-semibold text-plum-900 sm:text-3xl">{place.name}</h3>

      <p className="mt-1.5 flex items-center gap-[3px] text-base text-plum-900">
        <Icon name="map-pin" thin className="h-[1.15rem] w-[1.15rem]" />
        <span>
          {place.neighborhood}
          {distanceMiles !== undefined && (
            <span className="font-semibold text-accent-700"> · {formatMiles(distanceMiles)} away</span>
          )}
        </span>
      </p>
    </Link>
  );
}
