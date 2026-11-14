import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { repo } from "@/data";
import { btnPrimary, btnSecondary, Card, Field, inputClass, PageHeading } from "@/components/ui";
import Avatar from "@/components/Avatar";
import { signIn, signOut, signUp, useAuth } from "@/lib/auth";
import { BADGES, evaluateBadges } from "@/lib/badges";
import { prepareAvatar } from "@/lib/image";
import { useAsync } from "@/lib/useAsync";

export default function AccountPage() {
  const { user, profile, loading } = useAuth();

  if (loading) return <p className="text-lg">Loading…</p>;
  if (!user) return <LoggedOut />;
  if (!profile) return <FinishProfile />;
  return <MyProfile />;
}

// ---------- Not logged in: create an account or log in ----------

function LoggedOut() {
  const [mode, setMode] = useState<"signup" | "login">("signup");

  return (
    <div className="mx-auto max-w-lg">
      <PageHeading
        title={mode === "signup" ? "Join Catlas" : "Welcome back"}
        intro={
          mode === "signup"
            ? "An account lets you add friends, share how your cat did, and add photos. Browsing never needs one."
            : "Log in to see your friends and add photos."
        }
      />
      <div role="group" aria-label="Create an account or log in" className="mb-4 flex gap-2">
        {(["signup", "login"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            className={`min-h-11 rounded-full border px-5 text-base font-semibold ${
              mode === m ? "border-accent-600 bg-accent-600 text-white" : "border-line bg-white text-ink-900"
            }`}
          >
            {m === "signup" ? "Create account" : "Log in"}
          </button>
        ))}
      </div>
      <Card>{mode === "signup" ? <SignUpForm /> : <LogInForm />}</Card>
    </div>
  );
}

function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [catName, setCatName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await signUp({ email, password, username, displayName, catName });
      if (result.error) setError(result.error);
      else if (result.needsConfirmation) setCheckEmail(true);
      // Otherwise we're logged in and the page switches to the profile automatically.
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (checkEmail) {
    return (
      <p role="status" className="text-lg">
        Almost done! We sent a confirmation link to <strong>{email}</strong>. Click it, then come back and log in.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field id="su-email" label="Email" hint="Only used to log in. It's never shown to anyone.">
        <input id="su-email" type="email" required autoComplete="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} aria-describedby="su-email-hint" />
      </Field>
      <Field id="su-password" label="Password" hint="At least 8 characters.">
        <input id="su-password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby="su-password-hint" />
      </Field>
      <Field id="su-username" label="Username" hint="3 to 20 letters, numbers or underscores. Friends find you by this.">
        <input
          id="su-username"
          required
          pattern="[a-zA-Z0-9_]{3,20}"
          title="3 to 20 letters, numbers or underscores"
          autoComplete="username"
          autoCapitalize="none"
          className={inputClass}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          aria-describedby="su-username-hint"
        />
      </Field>
      <Field id="su-display" label="Your name" hint="What friends will see.">
        <input id="su-display" required maxLength={40} autoComplete="nickname" className={inputClass} value={displayName} onChange={(e) => setDisplayName(e.target.value)} aria-describedby="su-display-hint" />
      </Field>
      <Field id="su-cat" label="Your cat's name" optional>
        <input id="su-cat" maxLength={40} className={inputClass} value={catName} onChange={(e) => setCatName(e.target.value)} />
      </Field>
      {error && (
        <p role="alert" className="font-semibold text-rose-800">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className={btnPrimary}>
        {busy ? "Creating…" : "Create my account"}
      </button>
    </form>
  );
}

function LogInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const message = await signIn(email, password).catch(() => "Something went wrong. Please try again.");
    setBusy(false);
    if (message) setError(message);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field id="li-email" label="Email">
        <input id="li-email" type="email" required autoComplete="username" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field id="li-password" label="Password">
        <input id="li-password" type="password" required autoComplete="current-password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      {error && (
        <p role="alert" className="font-semibold text-rose-800">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className={btnPrimary}>
        {busy ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}

// ---------- Logged in, but no profile yet (e.g. the admin account) ----------

function FinishProfile() {
  const { refreshProfile } = useAuth();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [catName, setCatName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (await repo.isUsernameTaken(username)) {
        setError("That username is taken. Try another.");
        return;
      }
      await repo.createMyProfile({ username, displayName, catName });
      await refreshProfile();
    } catch {
      setError("We couldn't save your profile. Check the username and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeading title="Finish your profile" intro="Pick a username so friends can find you." />
      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field id="fp-username" label="Username" hint="3 to 20 letters, numbers or underscores.">
            <input id="fp-username" required pattern="[a-zA-Z0-9_]{3,20}" autoCapitalize="none" className={inputClass} value={username} onChange={(e) => setUsername(e.target.value)} aria-describedby="fp-username-hint" />
          </Field>
          <Field id="fp-display" label="Your name">
            <input id="fp-display" required maxLength={40} className={inputClass} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </Field>
          <Field id="fp-cat" label="Your cat's name" optional>
            <input id="fp-cat" maxLength={40} className={inputClass} value={catName} onChange={(e) => setCatName(e.target.value)} />
          </Field>
          {error && (
            <p role="alert" className="font-semibold text-rose-800">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={busy} className={btnPrimary}>
              {busy ? "Saving…" : "Save profile"}
            </button>
            <button type="button" className={btnSecondary} onClick={() => void signOut()}>
              Log out
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// ---------- Paw-ssport summary ----------

function PassportCard() {
  const { profile } = useAuth();
  const passport = useAsync(() => repo.getPassport(), []);
  const stats = passport.data?.stats;
  const earned = stats ? evaluateBadges(stats).filter((b) => b.earned).length : 0;
  const cat = profile?.catName ?? "your cat";

  return (
    <Card className="mb-6">
      <h2 className="font-serif text-2xl font-semibold">Your Paw-ssport</h2>
      <p className="mt-1 text-ink-700">
        {stats
          ? `${stats.placesVisited} ${stats.placesVisited === 1 ? "stamp" : "stamps"} and ${earned} of ${BADGES.length} badges so far.`
          : passport.loading
            ? "Loading…"
            : `Stamps and badges for you and ${cat}.`}
      </p>
      <Link to="/passport" className={`${btnPrimary} mt-4`}>
        Open my Paw-ssport
      </Link>
    </Card>
  );
}

// ---------- Profile picture ----------

function AvatarEditor() {
  const { profile, refreshProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  // Changing this key clears the file picker after an upload.
  const [pickerKey, setPickerKey] = useState(0);

  if (!profile) return null;

  async function handleChoose(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await repo.uploadAvatar(await prepareAvatar(file));
      await refreshProfile();
      setMessage("Picture updated!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't upload that picture.");
    } finally {
      setBusy(false);
      setPickerKey((k) => k + 1);
    }
  }

  async function handleRemove() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await repo.removeAvatar();
      await refreshProfile();
      setMessage("Picture removed.");
    } catch {
      setError("We couldn't remove your picture. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mb-6">
      <h2 className="font-serif text-2xl font-semibold">Profile picture</h2>
      <div className="mt-4 flex flex-wrap items-center gap-5">
        <Avatar name={profile.displayName} url={profile.avatarUrl} size="lg" />
        <div className="min-w-0 flex-1 space-y-3">
          <Field id="avatar-file" label={profile.avatarUrl ? "Choose a new picture" : "Add a picture"}>
            <input
              key={pickerKey}
              id="avatar-file"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              disabled={busy}
              className={`${inputClass} file:mr-3 file:rounded-full file:border-0 file:bg-cream-100 file:px-4 file:py-2 file:font-semibold`}
              onChange={(e) => void handleChoose(e.target.files?.[0])}
            />
          </Field>
          {profile.avatarUrl && (
            <button type="button" className={btnSecondary} disabled={busy} onClick={handleRemove}>
              Remove picture
            </button>
          )}
        </div>
      </div>
      {busy && <p role="status" className="mt-3 text-ink-700">Working…</p>}
      {error && (
        <p role="alert" className="mt-3 font-semibold text-rose-800">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mt-3 rounded-2xl bg-sage-100 p-3 font-semibold text-sage-800">
          {message}
        </p>
      )}
      <p className="mt-3 text-sm text-ink-700">
        Only you and your friends can see your picture. It's cropped to a square.
      </p>
    </Card>
  );
}

// ---------- Logged in with a profile ----------

function MyProfile() {
  const { profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [catName, setCatName] = useState(profile?.catName ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Keep the form in step if the profile loads/changes underneath us.
  useEffect(() => {
    setDisplayName(profile?.displayName ?? "");
    setCatName(profile?.catName ?? "");
  }, [profile]);

  if (!profile) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await repo.updateMyProfile({ displayName, catName });
      await refreshProfile();
      setSaved(true);
    } catch {
      setError("We couldn't save that. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeading title={`Hi, ${profile.displayName}!`} intro={`You're signed in as @${profile.username}.`} />
      <PassportCard />
      <AvatarEditor />
      <Card className="mb-6">
        <h2 className="font-serif text-2xl font-semibold">Your profile</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          <Field id="pf-display" label="Your name">
            <input id="pf-display" required maxLength={40} className={inputClass} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </Field>
          <Field id="pf-cat" label="Your cat's name" optional>
            <input id="pf-cat" maxLength={40} className={inputClass} value={catName} onChange={(e) => setCatName(e.target.value)} />
          </Field>
          {error && (
            <p role="alert" className="font-semibold text-rose-800">
              {error}
            </p>
          )}
          {saved && (
            <p role="status" className="rounded-2xl bg-sage-100 p-3 font-semibold text-sage-800">
              Saved!
            </p>
          )}
          <button type="submit" disabled={busy} className={btnPrimary}>
            {busy ? "Saving…" : "Save changes"}
          </button>
        </form>
      </Card>
      <div className="flex flex-wrap gap-3">
        <Link to="/friends" className={btnSecondary}>
          Go to friends
        </Link>
        <button type="button" className={btnSecondary} onClick={() => void signOut()}>
          Log out
        </button>
      </div>
    </div>
  );
}
