import { repo } from "@/data";
import { useAuth } from "@/lib/auth";
import { useAsync } from "@/lib/useAsync";
import FriendVisitList from "./FriendVisitList";
import Icon from "./Icon";

// "Friends who've been here": reviews of this place by the viewer's friends.
// Shows nothing for logged-out visitors or when no friend has been here.
export default function FriendsHere({ placeId }: { placeId: string }) {
  const { user, profile } = useAuth();
  const loggedIn = Boolean(user && profile);
  const visits = useAsync(
    () => (loggedIn ? repo.listFriendVisits(placeId) : Promise.resolve([])),
    [placeId, loggedIn],
  );

  const list = visits.data ?? [];
  if (list.length === 0) return null;

  return (
    <section aria-labelledby="friends-here-title" className="space-y-3">
      <h3 id="friends-here-title" className="font-serif text-xl font-semibold">
        <Icon name="paw" className="mr-1.5 h-5 w-5 align-[-0.15em]" />
        Friends who’ve been here
      </h3>
      <FriendVisitList visits={list} showPlace={false} />
    </section>
  );
}
