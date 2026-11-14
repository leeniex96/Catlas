import { Link, useParams } from "react-router-dom";
import { repo } from "@/data";
import FriendsHere from "@/components/FriendsHere";
import Icon from "@/components/Icon";
import PhotoSection from "@/components/PhotoSection";
import ReviewBar from "@/components/ReviewBar";
import ReviewForm from "@/components/ReviewForm";
import { Badge, Card } from "@/components/ui";
import {
  AMENITIES,
  CAT_RULES,
  categoryInfo,
  DOG_POLICIES,
  labelFor,
  NOISE_LEVELS,
  RATINGS,
  SETTINGS,
} from "@/lib/options";
import { formatDate, summaryText } from "@/lib/reviews";
import { useAsync } from "@/lib/useAsync";

const RATING_TONE = { relaxed: "sage", curious: "honey", stressed: "rose" } as const;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="font-semibold text-ink-700">{label}</dt>
      <dd className="text-ink-900">{children}</dd>
    </div>
  );
}

export default function PlaceDetailPage() {
  const { slug = "" } = useParams();
  const place = useAsync(() => repo.getApprovedPlace(slug), [slug]);
  const reviews = useAsync(
    () => (place.data ? repo.listReviews(place.data.id) : Promise.resolve([])),
    [place.data?.id],
  );

  if (place.loading && !place.data) return <p className="text-lg">Loading…</p>;

  if (!place.data) {
    return (
      <div className="py-10 text-center">
        <h1 className="text-3xl font-semibold">We couldn’t find that place</h1>
        <p className="mt-2 text-ink-700">It may have moved, or the link might be off.</p>
        <Link to="/" className="mt-4 inline-block font-semibold text-accent-700 underline">
          ← Back to all places
        </Link>
      </div>
    );
  }

  const p = place.data;
  const category = categoryInfo(p.category);
  const rules = CAT_RULES.filter((r) => p[r.key]);
  const amenities = AMENITIES.filter((a) => p[a.key]);
  const mapLink =
    p.lat !== null && p.lng !== null
      ? `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=17/${p.lat}/${p.lng}`
      : null;

  return (
    <article className="mx-auto max-w-3xl">
      <Link to="/" className="inline-block py-2 font-semibold text-accent-700 underline">
        ← All places
      </Link>

      <header className="mt-2 mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge tone="accent">
            <Icon name={category.icon} className="h-4 w-4" /> {category.label}
          </Badge>
        </div>
        <h1 className="text-3xl leading-tight font-semibold sm:text-4xl">{p.name}</h1>
        <p className="mt-1 text-lg text-ink-700">{p.neighborhood}</p>
        {p.description && <p className="mt-3 max-w-prose text-lg">{p.description}</p>}
      </header>

      <Card className="mb-6">
        <h2 className="font-serif text-2xl font-semibold">Cat policies</h2>
        <dl className="mt-2 divide-y divide-cream-200">
          <Row label="Dogs">{labelFor(DOG_POLICIES, p.dogPolicy)}</Row>
          <Row label="Noise level">{labelFor(NOISE_LEVELS, p.noise)}</Row>
          <Row label="Setting">{labelFor(SETTINGS, p.setting)}</Row>
          <Row label="Cat rules">
            {rules.length ? (
              <span className="flex flex-wrap gap-2">
                {rules.map((r) => (
                  <Badge key={r.key} tone="sage">
                    {r.label}
                  </Badge>
                ))}
              </span>
            ) : (
              <span className="text-ink-700">Not specified. Ask staff when you arrive.</span>
            )}
          </Row>
          <Row label="Amenities">
            {amenities.length ? (
              <span className="flex flex-wrap gap-2">
                {amenities.map((a) => (
                  <Badge key={a.key} tone="accent">
                    {a.label}
                  </Badge>
                ))}
              </span>
            ) : (
              <span className="text-ink-700">None listed</span>
            )}
          </Row>
        </dl>
      </Card>

      <Card className="mb-6">
        <h2 className="font-serif text-2xl font-semibold">Visit info</h2>
        <dl className="mt-2 divide-y divide-cream-200">
          <Row label="Address">
            {p.address}
            {mapLink && (
              <>
                {" · "}
                <a href={mapLink} target="_blank" rel="noreferrer" className="font-semibold text-accent-700 underline">
                  See on OpenStreetMap
                </a>
              </>
            )}
          </Row>
          <Row label="Hours">{p.hours || <span className="text-ink-700">Not listed</span>}</Row>
          {p.website && (
            <Row label="Website">
              <a href={p.website} target="_blank" rel="noreferrer" className="font-semibold text-accent-700 underline break-all">
                {p.website.replace(/^https?:\/\//, "")}
              </a>
            </Row>
          )}
        </dl>
      </Card>

      <PhotoSection placeId={p.id} placeName={p.name} />

      <section aria-labelledby="reviews-title" className="space-y-5">
        <div>
          <h2 id="reviews-title" className="font-serif text-2xl font-semibold">
            How did cats do here?
          </h2>
          <p className="mt-1 text-xl font-medium">{summaryText(p.stats)}</p>
          {p.stats.total > 0 && (
            <>
              <div className="mt-3">
                <ReviewBar stats={p.stats} />
              </div>
              <ul className="mt-3 flex flex-wrap gap-2">
                {RATINGS.map((r) => (
                  <li key={r.value}>
                    <Badge tone={RATING_TONE[r.value]}>
                      <Icon name={r.icon} className="h-4 w-4" /> {r.label}: {p.stats[r.value]}
                    </Badge>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <FriendsHere placeId={p.id} />

        <ReviewForm
          placeId={p.id}
          onAdded={() => {
            place.reload(); // refresh the summary counts
            reviews.reload(); // and the list
          }}
        />

        <ul className="space-y-3">
          {(reviews.data ?? []).map((r) => {
            const rating = RATINGS.find((x) => x.value === r.rating)!;
            return (
              <li key={r.id} className="rounded-2xl border border-cream-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Badge tone={RATING_TONE[r.rating]}>
                    <Icon name={rating.icon} className="h-4 w-4" /> {rating.label}
                  </Badge>
                  <span className="text-sm text-ink-700">
                    {r.catName ? `${r.catName} · ` : ""}
                    {formatDate(r.createdAt)}
                  </span>
                </div>
                {r.comment && <p className="mt-2">{r.comment}</p>}
              </li>
            );
          })}
        </ul>
      </section>
    </article>
  );
}
