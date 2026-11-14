// Who is logged in? Any component can ask with `const { user, profile } = useAuth()`.
// Wrap the app in <AuthProvider> once (see main.tsx).

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { repo } from "@/data";
import type { Profile } from "@/data/types";
import { supabase } from "./supabase";

interface AuthState {
  /** The logged-in account, or null. */
  user: User | null;
  /** Their profile (username, display name, cat). Null if logged out or not yet created. */
  profile: Profile | null;
  /** True until we know whether someone is logged in. */
  loading: boolean;
  /** Re-read the profile after creating or editing it. */
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  // The user id we've finished loading a profile for (so we can tell "still loading" apart
  // from "has no profile").
  const [profileLoadedFor, setProfileLoadedFor] = useState<string | null>(null);

  // Keep `user` in sync with Supabase (log in, log out, session refresh).
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setSessionChecked(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = user?.id ?? null;

  const loadProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      return;
    }
    try {
      setProfile(await repo.getMyProfile());
    } catch {
      setProfile(null);
    } finally {
      setProfileLoadedFor(userId);
    }
  }, [userId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      profile,
      loading: !sessionChecked || (userId !== null && profileLoadedFor !== userId),
      refreshProfile: loadProfile,
    }),
    [user, profile, sessionChecked, userId, profileLoadedFor, loadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

// ---- Actions (not React-specific) ----

export interface SignUpInput {
  email: string;
  password: string;
  username: string;
  displayName: string;
  catName?: string;
}

export interface SignUpResult {
  /** A message to show, or null on success. */
  error: string | null;
  /** True if Supabase wants the person to confirm their email before they can log in. */
  needsConfirmation: boolean;
}

export async function signUp(input: SignUpInput): Promise<SignUpResult> {
  const username = input.username.trim().toLowerCase();
  if (await repo.isUsernameTaken(username)) {
    return { error: "That username is taken. Try another.", needsConfirmation: false };
  }

  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    // The database turns this into a profile row when the account is created.
    options: {
      data: { username, display_name: input.displayName.trim(), cat_name: input.catName?.trim() ?? "" },
    },
  });
  if (error) return { error: friendlyAuthError(error.message), needsConfirmation: false };
  return { error: null, needsConfirmation: !data.session };
}

export async function signIn(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  return error ? "That email or password didn't work." : null;
}

export async function signOut() {
  await supabase.auth.signOut();
}

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "There's already an account with that email. Try logging in.";
  }
  if (m.includes("password")) return "Please choose a stronger password (at least 8 characters).";
  if (m.includes("rate limit")) return "Too many attempts. Please wait a few minutes and try again.";
  if (m.includes("database error")) return "That username may be taken or invalid. Try another.";
  return "We couldn't create your account. Please try again.";
}
