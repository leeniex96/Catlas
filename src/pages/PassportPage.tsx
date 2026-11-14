import { Link, useParams } from "react-router-dom";
import { repo } from "@/data";
import type { PassportStamp } from "@/data/types";
import Icon from "@/components/Icon";
import { btnPrimary, Card, PageHeading } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { BADGES, evaluateBadges, type BadgeProgress } from "@/lib/badges";
import { categoryInfo } from "@/lib/options";
import { useAsync } from "@/lib/useAsync";

// /passport          -> your own Paw-ssport
// /passport/:userId  -> a friend's Paw-ssport (the database only allows it for accepted friends)
export default function PassportPage() {
  const { userId } = useParams();
  const { user, profile, loading } = useAuth();

  if (loading) return <p className="text-lg">Loading…</p>;
  if (!user) {
    return (
      <div className="mx-auto max-w-lg">
        <PageHeading
          title="Your Paw-ssport"
          intro="Collect a stamp at every cat-friendly spot, and earn cheeky badges for you and your cat."
        />
        <Link to="/account" className={btnPrimary}>
          Log in or create an account
        </Link>
      </div>
    );
  }
  return <PassportView friendId={userId} myName={profile?.displayName} myCat={profile?.catName} />;
}

function PassportView({
  friendId,
  myName,
  myCat,
}: {
  friendId?: string;
  myName?: string;
  myCat?: string;
}) {
  const isSelf = !friendId;
  const passport = useAsync(() => repo.getPassport(friendId), [friendId]);
  // For a friend's page we need their name and cat, which live on the friendship.
  const friends = useAsync(() => (friendId ? repo.listFriendships() : Promise.resolve([])), [friendId]);
  const friend = friends.data?.find((f) => f.other.userId === friendId)?.other;

  if (passport.loading || (friendId && friends.loading)) return <p className="text-lg">Loading…</p>;

  if (!passport.data) {
    return (
      <div className="mx-auto max-w-lg">
        <PageHeading title="Paw-ssport" intro="This Paw-ssport isn't available. You can only see a friend's once you're friends." />
        <Link to="/friends" className={btnPrimary}>
          Back to friends
        </Link>
      </div>
    );
  }

  const { stats, stamps } = passport.data;
  const owner = isSelf ? myName : friend?.displayName;
  const cat = (isSelf ? myCat : friend?.catName) ?? (isSelf ? "Your cat" : owner ? `${owner}'s cat` : "The cat");
  const progress = evaluateBadges(stats);
  const earned = progress.filter((b) => b.earned);
  const locked = progress.filter((b) => !b.earned);

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <PageHeading
          title={isSelf ? "Your Paw-ssport" : `${owner ?? "Their"}'s Paw-ssport`}
          intro={
            isSelf
              ? `Stamp your way around Boston with ${cat}. Review a place while logged in to collect its stamp.`
              : `Every place ${cat} has been, and the badges they've earned along the way.`
          }
        />
        <dl className="grid grid-cols-3 gap-3 text-center">
          {[
            ["Stamps", stats.placesVisited],
            ["Badges", `${earned.length} of ${BADGES.length}`],
            ["Spots found", stats.listedSpots],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-cream-200 bg-white p-3">
              <dd className="font-serif text-2xl font-semibold text-plum-900 sm:text-3xl">{value}</dd>
              <dt className="text-sm text-ink-700">{label}</dt>
            </div>
          ))}
        </dl>
      </div>

      {/* ---- Stamps ---- */}
      <section aria-labelledby="stamps-title" className="space-y-4">
        <h2 id="stamps-title" className="font-serif text-2xl font-semibold">
          Stamps
        </h2>
        {stamps.length === 0 ? (
          <Card className="text-center">
            <Icon name="paw" className="mx-auto h-12 w-12 text-accent-700" />
            <p className="mt-3 text-lg font-semibold">No stamps yet</p>
            <p className="mt-1 text-ink-700">
              {isSelf
                ? "Review a place while you're logged in to collect your first stamp."
                : "They haven't collected any stamps yet."}
            </p>
            {isSelf && (
              <Link to="/" className={`${btnPrimary} mt-4`}>
                Find a place
              </Link>
            )}
          </Card>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {stamps.map((s) => (
              <li key={s.placeId}>
                <StampTile stamp={s} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- Badges ---- */}
      <section aria-labelledby="badges-title" className="space-y-4">
        <h2 id="badges-title" className="font-serif text-2xl font-semibold">
          Badges
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[...earned, ...locked].map((b) => (
            <li key={b.def.id}>
              <BadgeTile progress={b} cat={cat} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ---------- One stamp: a place you've been ----------

function StampTile({ stamp }: { stamp: PassportStamp }) {
  const category = categoryInfo(stamp.category);
  const when = new Date(stamp.firstVisit).toLocaleDateString("en-US", { month: "short", year: "numeric" });

  return (
    <Link
      to={`/places/${stamp.slug}`}
      className="flex h-full flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-accent-700/50 bg-white p-4 text-center transition-colors hover:border-accent-700 hover:bg-cream-100"
    >
      <span className="grid h-14 w-14 place-items-center rounded-full bg-plum-800 text-white">
        <Icon name={category.icon} className="h-7 w-7" />
      </span>
      <span className="font-serif text-lg leading-tight font-semibold text-plum-900">{stamp.name}</span>
      <span className="text-sm text-ink-700">
        {stamp.neighborhood} · {when}
      </span>
    </Link>
  );
}

// ---------- One badge: earned or locked ----------

function BadgeTile({ progress, cat }: { progress: BadgeProgress; cat: string }) {
  const { def, value, earned } = progress;

  return (
    <div
      className={`flex h-full gap-4 rounded-3xl border p-4 ${
        earned ? "border-accent-700/30 bg-white" : "border-cream-200 bg-cream-100/60"
      }`}
    >
      <span
        className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${
          earned ? "bg-plum-800 text-white" : "bg-white text-ink-500"
        }`}
      >
        <Icon name={earned ? def.icon : "lock"} className="h-7 w-7" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2">
          <span className={`font-serif text-lg leading-tight font-semibold ${earned ? "text-plum-900" : "text-ink-700"}`}>
            {def.name}
          </span>
          <span className="text-xs font-bold tracking-wider text-accent-700 uppercase">
            {earned ? "Earned" : "Locked"}
          </span>
        </p>
        <p className="mt-1 text-sm text-ink-700">{earned ? def.blurb(cat) : def.how}</p>

        {!earned && (
          <div className="mt-2">
            <div
              role="progressbar"
              aria-label={`${def.name} progress`}
              aria-valuemin={0}
              aria-valuemax={def.goal}
              aria-valuenow={value}
              className="h-2 overflow-hidden rounded-full bg-white"
            >
              <div className="h-full rounded-full bg-accent-700" style={{ width: `${(value / def.goal) * 100}%` }} />
            </div>
            <p className="mt-1 text-xs text-ink-700">
              {value} of {def.goal}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
