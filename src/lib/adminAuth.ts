// Admin login, using Supabase Auth (email + password).
//
// Being logged in isn't enough: you also have to be listed in the `admins` table.
// And that's enforced by the database itself, so even if someone tampered with this file
// in their browser, Supabase would still refuse to show or change admin-only data.

import { supabase } from "./supabase";

/** True if someone is logged in AND is listed as an admin. */
export async function getIsAdmin(): Promise<boolean> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return false;

  // The `admins` table only lets you see your own row, so a row coming back = you're an admin.
  const { data } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  return Boolean(data);
}

export type LoginResult = "ok" | "bad-login" | "not-admin";

export async function adminSignIn(email: string, password: string): Promise<LoginResult> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return "bad-login";

  // A regular cat-owner account can log in here too, but it isn't an admin, so say so.
  // (We leave them logged in: it's still their valid account.)
  if (!(await getIsAdmin())) return "not-admin";
  return "ok";
}

export async function adminSignOut() {
  await supabase.auth.signOut();
}
