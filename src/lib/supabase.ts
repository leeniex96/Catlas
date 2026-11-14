// The one connection to Supabase, shared by the whole app.
// URL and key come from .env.local (see .env.example). The publishable key is safe to
// ship in the browser: the database's Row Level Security rules protect the data.

import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && key);

// Placeholders keep the app from crashing on import; main.tsx shows a setup message instead.
export const supabase = createClient(url ?? "http://localhost", key ?? "missing-key");
