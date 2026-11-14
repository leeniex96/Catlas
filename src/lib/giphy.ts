// GIPHY support.
//
// The GIPHY API key is a Supabase secret (GIPHY_API_KEY) used only by the `giphy-search`
// Edge Function, so it never ships inside the website. The app asks that function to search.
// A saved GIF is just its GIPHY id; the picture itself stays on GIPHY's servers.

import { supabase } from "./supabase";

export interface Gif {
  id: string;
  title: string;
  /** Small version for the picker grid. */
  previewUrl: string;
  width: number;
  height: number;
}

/** The link to display a GIF. Ids are letters and numbers only (the database enforces it too). */
export function gifUrl(id: string): string {
  return `https://media.giphy.com/media/${encodeURIComponent(id)}/giphy.gif`;
}

export const GIF_ID_PATTERN = /^[A-Za-z0-9]{5,40}$/;

/** Search GIFs (kid-friendly "G" rated only). An empty search shows cat GIFs. Logged-in users only. */
export async function searchGifs(query: string): Promise<Gif[]> {
  const { data, error } = await supabase.functions.invoke("giphy-search", { body: { q: query } });

  if (error) {
    // The function explains what went wrong in the response body.
    let reason = "";
    try {
      const body = await (error as { context?: Response }).context?.json();
      reason = String(body?.error ?? "");
    } catch {
      // no readable body
    }
    if (reason.includes("not set")) throw new Error("GIF search isn't set up yet.");
    if (reason.includes("log in")) throw new Error("Please log in to search GIFs.");
    throw new Error("We couldn't load GIFs right now. Please try again.");
  }
  return ((data as { gifs?: Gif[] } | null)?.gifs ?? []).filter((g) => GIF_ID_PATTERN.test(g.id));
}
