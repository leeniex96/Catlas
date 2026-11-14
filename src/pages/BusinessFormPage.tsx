import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { repo } from "@/data";
import Icon from "@/components/Icon";
import type { NewPlaceInput } from "@/data/types";
import { btnPrimary, btnSecondary, Card, ChoiceChip, Field, inputClass, PageHeading } from "@/components/ui";
import {
  AMENITIES,
  CAT_RULES,
  CATEGORIES,
  DOG_POLICIES,
  NEIGHBORHOODS,
  NOISE_LEVELS,
  SETTINGS,
} from "@/lib/options";

// Starting values for the form.
const INITIAL: NewPlaceInput = {
  name: "",
  address: "",
  neighborhood: "",
  hours: "",
  website: "",
  description: "",
  category: "coffee",
  dogPolicy: "separated",
  noise: "quiet",
  setting: "indoor",
  carrierOnly: false,
  harnessOk: false,
  strollerOk: false,
  waterBowl: false,
  quietCorner: false,
  catSavvyStaff: false,
  ownerName: "",
  ownerEmail: "",
};

export default function BusinessFormPage() {
  const [form, setForm] = useState<NewPlaceInput>(INITIAL);
  const [saving, setSaving] = useState(false);
  const [submittedName, setSubmittedName] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Update one field, e.g. set("name", "My Café").
  function set<K extends keyof NewPlaceInput>(key: K, value: NewPlaceInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // "Carrier only" can't be combined with harness or stroller, so ticking one clears the other.
  function toggleRule(key: (typeof CAT_RULES)[number]["key"]) {
    setForm((f) => {
      const turningOn = !f[key];
      if (key === "carrierOnly") {
        return { ...f, carrierOnly: turningOn, harnessOk: turningOn ? false : f.harnessOk, strollerOk: turningOn ? false : f.strollerOk };
      }
      return { ...f, [key]: turningOn, carrierOnly: turningOn ? false : f.carrierOnly };
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await repo.submitPlace({
        ...form,
        name: form.name.trim(),
        address: form.address.trim(),
        website: form.website?.trim() || undefined,
        description: form.description.trim(),
        hours: form.hours.trim(),
        ownerName: form.ownerName?.trim(),
        ownerEmail: form.ownerEmail?.trim(),
      });
      setSubmittedName(form.name.trim());
    } catch {
      setError("Something went wrong saving your listing. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (submittedName) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="text-center">
          <Icon name="cat" className="mx-auto h-14 w-14 text-accent-700" />
          <h1 className="mt-3 text-3xl font-semibold">Thanks, {submittedName} is on our list!</h1>
          <p className="mx-auto mt-2 max-w-prose text-lg text-ink-700">
            We review every listing by hand to keep Catlas trustworthy. Once approved, your place will show up on
            the map. We may email you with a quick question.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link to="/" className={btnPrimary}>
              Back to the map
            </Link>
            <button
              type="button"
              className={btnSecondary}
              onClick={() => {
                setForm(INITIAL);
                setSubmittedName(null);
              }}
            >
              Add another business
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeading
        title="Welcome cats at your business"
        intro="Tell cat owners what to expect. It takes about two minutes, and every listing is reviewed before it appears."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="space-y-5">
          <h2 className="font-serif text-2xl font-semibold">About your business</h2>

          <Field id="biz-name" label="Business name">
            <input id="biz-name" required className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="organization" />
          </Field>

          <Field id="biz-address" label="Street address" hint="We use this to place you on the map.">
            <input id="biz-address" required className={inputClass} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="123 Main St, Boston, MA" autoComplete="street-address" />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="biz-hood" label="Neighborhood">
              <select id="biz-hood" required className={inputClass} value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)}>
                <option value="" disabled>
                  Choose one…
                </option>
                {NEIGHBORHOODS.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </Field>

            <Field id="biz-category" label="Type of place">
              <select id="biz-category" className={inputClass} value={form.category} onChange={(e) => set("category", e.target.value as NewPlaceInput["category"])}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field id="biz-hours" label="Hours" optional hint="For example: Mon–Fri 7am–5pm">
            <input id="biz-hours" className={inputClass} value={form.hours} onChange={(e) => set("hours", e.target.value)} aria-describedby="biz-hours-hint" />
          </Field>

          <Field id="biz-website" label="Website" optional>
            <input id="biz-website" type="url" className={inputClass} value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" autoComplete="url" />
          </Field>

          <Field id="biz-desc" label="Why is it great for cats?" optional hint="A sentence or two is plenty.">
            <textarea id="biz-desc" rows={3} maxLength={300} className={inputClass} value={form.description} onChange={(e) => set("description", e.target.value)} aria-describedby="biz-desc-hint" />
          </Field>
        </Card>

        <Card className="space-y-6">
          <h2 className="font-serif text-2xl font-semibold">Your cat policies</h2>

          <fieldset>
            <legend className="mb-2 font-semibold">Dogs on site</legend>
            <div className="flex flex-wrap gap-2">
              {DOG_POLICIES.map((o) => (
                <ChoiceChip key={o.value} type="radio" name="dogPolicy" label={o.label} checked={form.dogPolicy === o.value} onChange={() => set("dogPolicy", o.value)} />
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 font-semibold">How noisy is it?</legend>
            <div className="flex flex-wrap gap-2">
              {NOISE_LEVELS.map((o) => (
                <ChoiceChip key={o.value} type="radio" name="noise" label={o.label} checked={form.noise === o.value} onChange={() => set("noise", o.value)} />
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 font-semibold">Where can cats be?</legend>
            <div className="flex flex-wrap gap-2">
              {SETTINGS.map((o) => (
                <ChoiceChip key={o.value} type="radio" name="setting" label={o.label} checked={form.setting === o.value} onChange={() => set("setting", o.value)} />
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="font-semibold">Cat rules</legend>
            <p className="mb-2 text-sm text-ink-700">Tick everything that applies. “Carrier only” can’t be combined with the others.</p>
            <div className="flex flex-wrap gap-2">
              {CAT_RULES.map((r) => (
                <ChoiceChip key={r.key} label={r.label} checked={form[r.key]} onChange={() => toggleRule(r.key)} />
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 font-semibold">What do you offer?</legend>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((a) => (
                <ChoiceChip key={a.key} label={a.label} checked={form[a.key]} onChange={() => set(a.key, !form[a.key])} />
              ))}
            </div>
          </fieldset>
        </Card>

        <Card className="space-y-5">
          <div>
            <h2 className="font-serif text-2xl font-semibold">Your contact info</h2>
            <p className="text-ink-700">Private. We only use it to confirm your listing and never show it publicly.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="owner-name" label="Your name">
              <input id="owner-name" required className={inputClass} value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} autoComplete="name" />
            </Field>
            <Field id="owner-email" label="Email">
              <input id="owner-email" type="email" required className={inputClass} value={form.ownerEmail} onChange={(e) => set("ownerEmail", e.target.value)} autoComplete="email" />
            </Field>
          </div>
        </Card>

        {error && (
          <p role="alert" className="font-semibold text-rose-800">
            {error}
          </p>
        )}

        <button type="submit" disabled={saving} className={`${btnPrimary} w-full sm:w-auto`}>
          {saving ? "Sending…" : "Submit my listing"}
        </button>
      </form>
    </div>
  );
}
