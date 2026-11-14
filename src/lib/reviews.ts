import type { ReviewStats } from "@/data/types";

/** "8 of 10 cats were relaxed here" */
export function summaryText(stats: ReviewStats): string {
  if (stats.total === 0) return "No reviews yet. Be the first to share how your cat did!";
  const cats = stats.total === 1 ? "cat" : "cats";
  const verb = stats.relaxed === 1 ? "was" : "were";
  return `${stats.relaxed} of ${stats.total} ${cats} ${verb} relaxed here`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
