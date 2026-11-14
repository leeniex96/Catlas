// Small shared building blocks so every screen looks consistent.

import type { ReactNode } from "react";
import Icon from "./Icon";

// Reusable Tailwind class strings for buttons and form fields.
const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export const btnPrimary = `${buttonBase} bg-accent-600 text-white hover:bg-accent-700`;
export const btnSecondary = `${buttonBase} border border-line bg-white text-ink-900 hover:bg-cream-100`;

export const inputClass =
  "block w-full min-h-11 rounded-xl border border-line bg-white px-4 py-2.5 text-base text-ink-900 placeholder:text-ink-500";

/**
 * The small all-caps lilac "tag" look. The filter pills and the tags on the place cards
 * both use this one string, so they always match.
 */
const TAG_LOOK =
  "min-h-7 bg-lilac-300 px-2.5 py-1.5 text-[0.65rem] leading-none font-semibold tracking-wider text-plum-900 uppercase";

type Tone = "neutral" | "accent" | "sage" | "honey" | "rose";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-cream-100 text-ink-700",
  accent: "bg-accent-100 text-accent-700",
  sage: "bg-sage-100 text-sage-800",
  honey: "bg-honey-100 text-honey-800",
  rose: "bg-rose-100 text-rose-800",
};

/**
 * A small rounded label.
 *  - `size="sm"` is the lilac all-caps tag used on place cards (same as the filter pills).
 *  - the default is a roomier colored label (`tone`) used on the place page.
 */
export function Badge({
  tone = "neutral",
  size = "md",
  children,
}: {
  tone?: Tone;
  size?: "md" | "sm";
  children: ReactNode;
}) {
  const look = size === "sm" ? TAG_LOOK : `px-2.5 py-1 text-sm font-medium ${toneClasses[tone]}`;
  return <span className={`inline-flex items-center gap-1 rounded-full ${look}`}>{children}</span>;
}

/** Marks fictional placeholder listings so nobody mistakes them for real businesses. */
export function SampleBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-dashed border-honey-800 bg-honey-100 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-honey-800 uppercase">
      Sample listing
    </span>
  );
}

/**
 * A checkbox or radio button drawn as a pill. The real input is visually hidden but
 * still works with keyboards and screen readers.
 *  - `variant="form"` (default): the roomy white pill used in forms.
 *  - `variant="tag"`: the small lilac all-caps pill used by the filters. Selected = dark plum
 *    with a check mark, so color is never the only signal.
 */
export function ChoiceChip({
  type = "checkbox",
  name,
  label,
  checked,
  onChange,
  variant = "form",
}: {
  type?: "checkbox" | "radio";
  name?: string;
  label: string;
  checked: boolean;
  onChange: () => void;
  variant?: "form" | "tag";
}) {
  const look =
    variant === "tag"
      ? `border-transparent ${TAG_LOOK} hover:brightness-95 peer-checked:bg-plum-800 peer-checked:text-white`
      : "min-h-10 border-line bg-white px-3.5 py-1.5 text-sm font-medium text-ink-900 peer-checked:border-accent-600 peer-checked:bg-accent-600 peer-checked:text-white";

  return (
    <label className="cursor-pointer">
      <input type={type} name={name} className="peer sr-only" checked={checked} onChange={onChange} />
      <span
        className={`inline-flex items-center gap-1 rounded-full border ${look} peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-600`}
      >
        {checked && <Icon name="check" className="h-3 w-3" />}
        {label}
      </span>
    </label>
  );
}

/** A labelled form field. Pass the same `id` to the input you put inside. */
export function Field({
  id,
  label,
  hint,
  optional,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-base font-semibold text-ink-900">
        {label}
        {optional && <span className="ml-1 font-normal text-ink-700">(optional)</span>}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mb-1.5 text-sm text-ink-700">
          {hint}
        </p>
      )}
      {children}
    </div>
  );
}

export function PageHeading({ title, intro }: { title: string; intro?: ReactNode }) {
  return (
    <header className="mb-6">
      <h1 className="text-3xl leading-tight font-semibold text-ink-900 sm:text-4xl">{title}</h1>
      {intro && <p className="mt-2 max-w-prose text-lg text-ink-700">{intro}</p>}
    </header>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-cream-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}>
      {children}
    </div>
  );
}
