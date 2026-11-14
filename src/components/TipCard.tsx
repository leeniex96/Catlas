import { useState } from "react";
import Icon from "./Icon";
import { CarrierArt, NervousCatArt, SleepyCatArt } from "./TipIllustrations";

const KEY = "whiskermap.tip.dismissed";

function wasDismissed() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

// The three tips, each with its own little illustration.
const TIPS = [
  {
    Art: CarrierArt,
    title: "Secure setup",
    text: "Use a snug harness or a carrier your cat already knows.",
  },
  {
    Art: NervousCatArt,
    title: "Watch for stress",
    text: "Flattened ears, wide pupils, panting, or hiding mean it’s time to head home.",
  },
  {
    Art: SleepyCatArt,
    title: "Start quiet",
    text: "Pick a calm place at a slow time, and keep the first visit short.",
  },
];

// A friendly, dismissible safety tip. Once dismissed it stays hidden on this device.
export default function TipCard() {
  const [hidden, setHidden] = useState(wasDismissed);
  if (hidden) return null;

  function dismiss() {
    setHidden(true);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // Fine: it just comes back next visit.
    }
  }

  return (
    <aside
      aria-labelledby="tip-title"
      className="relative mb-6 rounded-3xl border border-accent-100 bg-accent-100/60 p-5 sm:p-6"
    >
      {/* The side padding keeps the centered title clear of the close button. */}
      <h2 id="tip-title" className="px-9 text-center text-xl font-semibold text-balance text-ink-900">
        First outing with your cat?
      </h2>
      <ul className="mt-6 space-y-9 text-ink-700 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-6 sm:space-y-0">
        {TIPS.map(({ Art, title, text }) => (
          <li key={title} className="flex flex-col items-center gap-3 text-center sm:gap-2.5">
            {/* On phones the drawing scales with the box (up to 8rem); wider screens use a fixed size. */}
            <Art className="aspect-square h-auto w-[min(28%,6rem)] sm:h-16 sm:w-16" />
            <div>
              <p className="text-lg leading-tight font-bold text-ink-900">{title}</p>
              {/* A narrow measure plus balanced wrapping keeps the lines short and even. */}
              <p className="mx-auto mt-1 max-w-[16rem] text-sm leading-snug text-balance sm:max-w-[19rem]">{text}</p>
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss this tip"
        className="absolute top-3 right-3 grid h-11 w-11 place-items-center rounded-full text-ink-700 hover:bg-white/70"
      >
        <Icon name="x" className="h-5 w-5" />
      </button>
    </aside>
  );
}
