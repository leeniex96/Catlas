import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { repo } from "@/data";
import type { Friendship, Profile } from "@/data/types";
import Avatar from "@/components/Avatar";
import FriendVisitList from "@/components/FriendVisitList";
import { btnPrimary, btnSecondary, Card, Field, inputClass, PageHeading } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useAsync } from "@/lib/useAsync";

function PersonLine({ person }: { person: Profile }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={person.displayName} url={person.avatarUrl} />
      <div className="min-w-0">
        <p className="font-semibold">{person.displayName}</p>
        <p className="text-sm text-ink-700">
          @{person.username}
          {person.catName && ` · cat: ${person.catName}`}
        </p>
      </div>
    </div>
  );
}

export default function FriendsPage() {
  const { user, profile, loading } = useAuth();

  if (loading) return <p className="text-lg">Loading…</p>;
  if (!user || !profile) {
    return (
      <div className="mx-auto max-w-lg">
        <PageHeading title="Friends" intro="Log in to add friends and see where their cats have been." />
        <Link to="/account" className={btnPrimary}>
          Log in or create an account
        </Link>
      </div>
    );
  }
  return <FriendsDashboard />;
}

function FriendsDashboard() {
  const friendships = useAsync(() => repo.listFriendships(), []);
  const visits = useAsync(() => repo.listFriendVisits(), []);

  const all = friendships.data ?? [];
  const incoming = all.filter((f) => f.status === "pending" && !f.iSentIt);
  const outgoing = all.filter((f) => f.status === "pending" && f.iSentIt);
  const friends = all.filter((f) => f.status === "accepted");

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeading title="Friends" intro="Friends can see which places each other's cats have visited and how they did." />

      <AddFriend existing={all} onSent={friendships.reload} />

      {incoming.length > 0 && (
        <section aria-labelledby="incoming-title" className="space-y-3">
          <h2 id="incoming-title" className="font-serif text-2xl font-semibold">
            Requests for you
          </h2>
          {incoming.map((f) => (
            <RequestRow key={f.id} friendship={f} onChanged={friendships.reload} onAccepted={visits.reload} />
          ))}
        </section>
      )}

      <section aria-labelledby="friends-title" className="space-y-3">
        <h2 id="friends-title" className="font-serif text-2xl font-semibold">
          Your friends
        </h2>
        {friendships.loading && !friendships.data && <p>Loading…</p>}
        {!friendships.loading && friends.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line bg-white p-5 text-ink-700">
            No friends yet. Add someone by their username above.
          </p>
        )}
        {friends.map((f) => (
          <FriendRow key={f.id} friendship={f} onChanged={() => { friendships.reload(); visits.reload(); }} />
        ))}
      </section>

      {outgoing.length > 0 && (
        <section aria-labelledby="outgoing-title" className="space-y-3">
          <h2 id="outgoing-title" className="font-serif text-2xl font-semibold">
            Waiting for them to accept
          </h2>
          {outgoing.map((f) => (
            <OutgoingRow key={f.id} friendship={f} onChanged={friendships.reload} />
          ))}
        </section>
      )}

      <section aria-labelledby="visits-title" className="space-y-3">
        <h2 id="visits-title" className="font-serif text-2xl font-semibold">
          Friends' visits
        </h2>
        {visits.loading && !visits.data && <p>Loading…</p>}
        {!visits.loading && (visits.data ?? []).length === 0 && (
          <p className="rounded-2xl border border-dashed border-line bg-white p-5 text-ink-700">
            Nothing yet. When your friends review a place while logged in, it shows up here.
          </p>
        )}
        <FriendVisitList visits={visits.data ?? []} showPlace />
      </section>
    </div>
  );
}

// ---------- Add a friend by exact username ----------

function AddFriend({ existing, onSent }: { existing: Friendship[]; onSent: () => void }) {
  const [username, setUsername] = useState("");
  const [result, setResult] = useState<Profile | null>(null);
  const [searched, setSearched] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleFind(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setResult(null);
    try {
      setResult(await repo.findProfileByUsername(username.trim().replace(/^@/, "")));
      setSearched(true);
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSend() {
    if (!result) return;
    setBusy(true);
    try {
      await repo.sendFriendRequest(result.userId);
      setMessage(`Request sent to ${result.displayName}!`);
      setResult(null);
      setSearched(false);
      setUsername("");
      onSent();
    } catch {
      setMessage("We couldn't send that request. You may already be connected.");
    } finally {
      setBusy(false);
    }
  }

  const already = result ? existing.find((f) => f.other.userId === result.userId) : undefined;

  return (
    <Card>
      <h2 className="font-serif text-2xl font-semibold">Add a friend</h2>
      <form onSubmit={handleFind} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Field id="find-username" label="Their exact username">
            <input
              id="find-username"
              required
              autoCapitalize="none"
              autoComplete="off"
              className={inputClass}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setSearched(false);
              }}
              placeholder="e.g. miso_mom"
            />
          </Field>
        </div>
        <button type="submit" disabled={busy} className={btnSecondary}>
          Find
        </button>
      </form>

      {message && (
        <p role="status" className="mt-3 rounded-2xl bg-sage-100 p-3 font-semibold text-sage-800">
          {message}
        </p>
      )}
      {searched && !result && (
        <p role="status" className="mt-3 text-ink-700">
          No one with that exact username. Check the spelling with your friend.
        </p>
      )}
      {result && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-cream-100 p-4">
          <PersonLine person={result} />
          {already ? (
            <span className="font-semibold text-ink-700">
              {already.status === "accepted" ? "Already friends" : "Request pending"}
            </span>
          ) : (
            <button type="button" className={btnPrimary} disabled={busy} onClick={handleSend}>
              Send friend request
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

// ---------- Rows ----------

function RequestRow({
  friendship,
  onChanged,
  onAccepted,
}: {
  friendship: Friendship;
  onChanged: () => void;
  onAccepted: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function act(accept: boolean) {
    setBusy(true);
    try {
      if (accept) await repo.acceptFriendRequest(friendship.id);
      else await repo.removeFriendship(friendship.id);
    } finally {
      setBusy(false);
      onChanged();
      if (accept) onAccepted();
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cream-200 bg-white p-4">
      <PersonLine person={friendship.other} />
      <div className="flex gap-2">
        <button type="button" className={btnPrimary} disabled={busy} onClick={() => act(true)}>
          Accept
        </button>
        <button type="button" className={btnSecondary} disabled={busy} onClick={() => act(false)}>
          Decline
        </button>
      </div>
    </div>
  );
}

function FriendRow({ friendship, onChanged }: { friendship: Friendship; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);

  async function unfriend() {
    if (!window.confirm(`Remove ${friendship.other.displayName} from your friends?`)) return;
    setBusy(true);
    try {
      await repo.removeFriendship(friendship.id);
    } finally {
      setBusy(false);
      onChanged();
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cream-200 bg-white p-4">
      <PersonLine person={friendship.other} />
      <div className="flex flex-wrap gap-2">
        <Link to={`/passport/${friendship.other.userId}`} className={btnSecondary}>
          Paw-ssport
        </Link>
        <button type="button" className={btnSecondary} disabled={busy} onClick={unfriend}>
          Remove
        </button>
      </div>
    </div>
  );
}

function OutgoingRow({ friendship, onChanged }: { friendship: Friendship; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);

  async function cancel() {
    setBusy(true);
    try {
      await repo.removeFriendship(friendship.id);
    } finally {
      setBusy(false);
      onChanged();
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cream-200 bg-white p-4">
      <PersonLine person={friendship.other} />
      <button type="button" className={btnSecondary} disabled={busy} onClick={cancel}>
        Cancel request
      </button>
    </div>
  );
}
