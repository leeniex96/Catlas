import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { repo } from "@/data";
import Icon from "@/components/Icon";
import { btnPrimary, btnSecondary, Card, Field, inputClass, PageHeading } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { NEIGHBORHOODS } from "@/lib/options";

// "Request a spot": nominate a business you wish welcomed cats.
export default function RequestSpotPage() {
  const { user } = useAuth();
  const [businessName, setBusinessName] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await repo.addNomination({
        businessName: businessName.trim(),
        neighborhood: neighborhood || undefined,
        note: note.trim() || undefined,
      });
      setSent(true);
    } catch {
      setError("We couldn't save that request. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="text-center">
          <Icon name="mail-heart" className="mx-auto h-14 w-14 text-accent-700" />
          <h1 className="mt-3 text-3xl font-semibold">Request received!</h1>
          <p className="mx-auto mt-2 max-w-prose text-lg text-ink-700">
            When enough cat owners ask, we’ll reach out to the business. Thanks for helping more places say “cats welcome.”
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link to="/" className={btnPrimary}>
              Back to the map
            </Link>
            <button
              type="button"
              className={btnSecondary}
              onClick={() => {
                setBusinessName("");
                setNeighborhood("");
                setNote("");
                setSent(false);
              }}
            >
              Request another
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeading
        title="Request a spot"
        intro="Know a café, shop, or patio you wish welcomed cats? Tell us. We keep track of the most-requested places."
      />
      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field id="nom-name" label="Business name">
            <input id="nom-name" required className={inputClass} value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          </Field>
          <Field id="nom-hood" label="Neighborhood" optional>
            <select id="nom-hood" className={inputClass} value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)}>
              <option value="">Not sure</option>
              {NEIGHBORHOODS.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </Field>
          <Field id="nom-note" label="Why would it be great for cats?" optional>
            <textarea id="nom-note" rows={3} maxLength={300} className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          {error && (
            <p role="alert" className="font-semibold text-rose-800">
              {error}
            </p>
          )}
          <p className="rounded-2xl bg-cream-100 p-3 text-sm text-ink-700">
            {user ? (
              <>If we list this spot, you'll earn a <strong>Spot Sniffer</strong> badge in your Paw-ssport.</>
            ) : (
              <>
                <Link to="/account" className="font-semibold text-accent-700 underline">
                  Log in
                </Link>{" "}
                before you send this, and you'll earn a <strong>Spot Sniffer</strong> badge if we list it.
              </>
            )}
          </p>
          <button type="submit" disabled={saving} className={btnPrimary}>
            {saving ? "Sending…" : "Send request"}
          </button>
        </form>
      </Card>
    </div>
  );
}
