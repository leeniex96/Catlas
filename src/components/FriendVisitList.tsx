import { Link } from "react-router-dom";
import type { FriendVisit } from "@/data/types";
import { RATINGS } from "@/lib/options";
import { formatDate } from "@/lib/reviews";
import Avatar from "./Avatar";
import Icon from "./Icon";
import { Badge } from "./ui";

const RATING_TONE = { relaxed: "sage", curious: "honey", stressed: "rose" } as const;

/**
 * Reviews written by the viewer's friends.
 * `showPlace` adds a link to the place (used on the Friends page; not needed on a place's own page).
 */
export default function FriendVisitList({ visits, showPlace }: { visits: FriendVisit[]; showPlace: boolean }) {
  return (
    <ul className="space-y-3">
      {visits.map((v) => {
        const rating = RATINGS.find((r) => r.value === v.rating)!;
        return (
          <li key={v.reviewId} className="flex gap-3 rounded-2xl border border-cream-200 bg-white p-4">
            <Avatar name={v.friend.displayName} url={v.friend.avatarUrl} size="sm" />
            <div className="min-w-0">
              <p className="font-semibold text-ink-900">
                {v.friend.displayName}
                {v.catName && <span className="font-normal text-ink-700"> and {v.catName}</span>}
                {showPlace && (
                  <>
                    <span className="font-normal text-ink-700"> visited </span>
                    <Link to={`/places/${v.placeSlug}`} className="text-accent-700 underline">
                      {v.placeName}
                    </Link>
                  </>
                )}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge tone={RATING_TONE[v.rating]}>
                  <Icon name={rating.icon} className="h-3.5 w-3.5" /> {rating.label}
                </Badge>
                <span className="text-sm text-ink-700">{formatDate(v.visitedAt)}</span>
              </div>
              {v.comment && <p className="mt-2">{v.comment}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
