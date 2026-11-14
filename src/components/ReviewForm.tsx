import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { repo } from "@/data";
import { useAuth } from "@/lib/auth";
import { RATINGS, type Rating } from "@/lib/options";
import Icon from "./Icon";
import { btnPrimary, Card, Field, inputClass } from "./ui";

// "How did your cat do?" No account needed: just a rating, plus an optional note and name.
// If you ARE logged in, the review is linked to you so your friends can see the visit.
export default function ReviewForm({ placeId, onAdded }: { placeId: string; onAdded: () => void }) {
  const { user, profile } = useAuth();
  const [rating, setRating] = useState<Rating | null>(null);
  const [comment, setComment] = useState("");
  const [catName, setCatName] = useState("");

  // Pre-fill the cat's name from the profile (once it has loaded) unless they've typed one.
  useEffect(() => {
    if (profile?.catName) setCatName((current) => current || profile.catName!);
  }, [profile]);
  const [saving, setSaving] = useState(false);
  const [thanks, setThanks] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!rating) {
      setError("Please pick how your cat did.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await repo.addReview({
        placeId,
        rating,
        comment: comment.trim() || undefined,
        catName: catName.trim() || undefined,
      });
      setRating(null);
      setComment("");
      setCatName(profile?.catName ?? "");
      setThanks(true);
      onAdded();
    } catch {
      setError("We couldn't save your review. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <fieldset>
          <legend className="font-serif text-2xl font-semibold">How did your cat do?</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {RATINGS.map((r) => (
              <label key={r.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="rating"
                  value={r.value}
                  checked={rating === r.value}
                  onChange={() => {
                    setRating(r.value);
                    setThanks(false);
                    setError("");
                  }}
                  className="peer sr-only"
                />
                <span className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-line bg-white px-4 py-3 text-center text-base font-semibold peer-checked:border-accent-600 peer-checked:bg-accent-600 peer-checked:text-white peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-600">
                  <Icon name={r.icon} className="h-5 w-5" />
                  {r.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Field id="review-comment" label="Anything other cat owners should know?" optional>
          <textarea
            id="review-comment"
            rows={3}
            maxLength={400}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Quiet corner by the window, staff offered water…"
            className={inputClass}
          />
        </Field>

        <Field id="review-cat" label="Your cat's name" optional>
          <input
            id="review-cat"
            type="text"
            maxLength={40}
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            placeholder="Miso"
            className={inputClass}
          />
        </Field>

        <p className="text-sm text-ink-700">
          {user && profile ? (
            <>Posting as <strong>{profile.displayName}</strong>. Your friends will see this visit, and you'll earn a Paw-ssport stamp.</>
          ) : (
            <>
              Posting anonymously.{" "}
              <Link to="/account" className="font-semibold text-accent-700 underline">
                Log in
              </Link>{" "}
              to let friends see your visits and collect Paw-ssport stamps.
            </>
          )}
        </p>

        {error && (
          <p role="alert" className="font-semibold text-rose-800">
            {error}
          </p>
        )}
        {thanks && (
          <p role="status" className="rounded-2xl bg-sage-100 p-3 font-semibold text-sage-800">
            Thank you! Your review is up.
            {user && profile && (
              <>
                {" "}
                Stamped!{" "}
                <Link to="/passport" className="underline">
                  See your Paw-ssport
                </Link>
              </>
            )}
          </p>
        )}

        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? "Saving…" : "Share how it went"}
        </button>
      </form>
    </Card>
  );
}
