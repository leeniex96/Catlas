// Catlas: searches GIPHY on behalf of logged-in users.
// (Already deployed to the Supabase project as the Edge Function "giphy-search".)
//
// Why this exists: the GIPHY API key lives here as a Supabase secret named GIPHY_API_KEY,
// so it never ships inside the website's JavaScript. The app calls this function; the
// function calls GIPHY.
//
// Request:  POST { "q": "sleepy cat" }   (q is optional; defaults to "cat")
// Response: { "gifs": [{ id, title, previewUrl, width, height }] }
// Health check: POST { "ping": true } -> { "configured": true | false } (never reveals the key)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// The platform has already verified the login token. We only read which kind of user it is.
function tokenRole(req: Request): string | null {
  try {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload)).role ?? null;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);

  // The secret is called "Giphy" in this project; "GIPHY_API_KEY" also works.
  const apiKey = Deno.env.get("Giphy") ?? Deno.env.get("GIPHY_API_KEY");

  let body: { q?: unknown; ping?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // no body is fine
  }

  // Anyone can ask whether the key is set up (yes/no only).
  if (body.ping === true) return json({ configured: Boolean(apiKey) });

  // Searching uses up the GIPHY allowance, so it's for logged-in cat owners only.
  if (tokenRole(req) !== "authenticated") return json({ error: "Please log in to search GIFs." }, 401);
  if (!apiKey) return json({ error: "GIPHY_API_KEY is not set for this function." }, 500);

  const q = (typeof body.q === "string" ? body.q : "").trim().slice(0, 60) || "cat";
  const params = new URLSearchParams({ api_key: apiKey, q, limit: "18", rating: "g", lang: "en" });

  const res = await fetch(`https://api.giphy.com/v1/gifs/search?${params}`);
  if (!res.ok) return json({ error: `GIPHY answered with status ${res.status}.` }, 502);
  const data = await res.json();

  // Send back only what the app needs, and only well-formed items.
  const gifs = (Array.isArray(data.data) ? data.data : [])
    // deno-lint-ignore no-explicit-any
    .map((g: Record<string, any>) => ({
      id: String(g.id ?? ""),
      title: String(g.title ?? "").slice(0, 120),
      previewUrl: String(g.images?.fixed_width?.url ?? ""),
      width: Number(g.images?.fixed_width?.width ?? 200),
      height: Number(g.images?.fixed_width?.height ?? 200),
    }))
    .filter((g: { id: string; previewUrl: string }) => /^[A-Za-z0-9]{5,40}$/.test(g.id) && g.previewUrl.startsWith("https://"));

  return json({ gifs });
});
