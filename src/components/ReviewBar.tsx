import type { ReviewStats } from "@/data/types";

// A thin stacked bar: green = relaxed, yellow = curious, red = stressed.
// The words always appear next to it too, so color is never the only signal.
export default function ReviewBar({ stats }: { stats: ReviewStats }) {
  if (stats.total === 0) return null;
  const pct = (n: number) => `${(n / stats.total) * 100}%`;

  return (
    <div
      role="img"
      aria-label={`${stats.relaxed} relaxed, ${stats.curious} curious but okay, ${stats.stressed} stressed`}
      className="flex h-2.5 w-full overflow-hidden rounded-full bg-cream-200"
    >
      <div style={{ width: pct(stats.relaxed) }} className="bg-sage-800" />
      <div style={{ width: pct(stats.curious) }} className="bg-[#d8a31d]" />
      <div style={{ width: pct(stats.stressed) }} className="bg-rose-800" />
    </div>
  );
}
