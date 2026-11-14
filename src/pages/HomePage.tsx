import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { repo } from "@/data";
import FilterPanel from "@/components/FilterPanel";
import Icon from "@/components/Icon";
import PlaceCard from "@/components/PlaceCard";
import PlaceMap from "@/components/PlaceMap";
import TipCard from "@/components/TipCard";
import { btnPrimary, btnSecondary, inputClass } from "@/components/ui";
import {
  applyFilters,
  clearFilters,
  countActiveFilters,
  matchesSearch,
  parseFilters,
  toggleFilter,
  type FilterGroup,
} from "@/lib/filters";
import { distanceMiles } from "@/lib/geo";
import { useAsync } from "@/lib/useAsync";
import { useGeolocation } from "@/lib/useGeolocation";
import { useMediaQuery } from "@/lib/useMediaQuery";

export default function HomePage() {
  // Filters, search text and the map/list choice are stored in the URL (see lib/filters.ts).
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => parseFilters(params), [params]);
  const search = params.get("q") ?? "";
  const activeCount = countActiveFilters(filters) + (search.trim() ? 1 : 0);
  const view = params.get("view") === "map" ? "map" : "list";

  // "Near me": the visitor's location stays in memory only; it is never saved or sent.
  const location = useGeolocation();

  // On big screens we show the list and the map side by side; on phones, one at a time.
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const showList = isDesktop || view === "list";
  const showMap = isDesktop || view === "map";

  const { data: places, loading, error } = useAsync(() => repo.listApprovedPlaces(), []);

  // Miles from the visitor to each place (empty until "Near me" is on).
  const distances = useMemo(() => {
    const map = new Map<string, number>();
    const me = location.coords;
    if (me && places) {
      for (const p of places) {
        if (p.lat !== null && p.lng !== null) map.set(p.id, distanceMiles(me, { lat: p.lat, lng: p.lng }));
      }
    }
    return map;
  }, [location.coords, places]);

  const results = useMemo(() => {
    if (!places) return [];
    const matches = applyFilters(places, filters).filter((p) => matchesSearch(p, search));

    if (distances.size > 0) {
      // Closest first.
      return matches.sort((a, b) => (distances.get(a.id) ?? Infinity) - (distances.get(b.id) ?? Infinity));
    }
    // Otherwise: happiest-cat places first; places with no reviews yet go last.
    const score = (p: (typeof places)[number]) => (p.stats.total ? p.stats.relaxed / p.stats.total : -1);
    return matches.sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name));
  }, [places, filters, search, distances]);

  function setSearch(text: string) {
    const p = new URLSearchParams(params);
    if (text) p.set("q", text);
    else p.delete("q");
    setParams(p, { replace: true });
  }

  function setView(next: "map" | "list") {
    const p = new URLSearchParams(params);
    if (next === "map") p.set("view", "map");
    else p.delete("view");
    setParams(p, { replace: true });
  }

  return (
    <div className="pb-20 lg:pb-0">
      {/* On a phone's map view we skip the intro so the map gets the screen. */}
      {showList && (
        <>
          <section className="mb-6">
            <h1 className="text-3xl leading-tight font-semibold sm:text-4xl">Welcome to Catlas!</h1>
            <p className="mt-2 max-w-prose text-lg text-ink-700">
              Your guide to cat-friendly Boston. Discover places that welcome cats, check the dogs and noise before
              you go, and see how other cats really did, so your next outing starts with confidence.
            </p>
          </section>

          <TipCard />
        </>
      )}
      {!showList && <h1 className="sr-only">Cat-friendly places map</h1>}

      {/* Search + Near me. Shared by the list and map views. */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="place-search" className="sr-only">
            Search places by name, neighborhood or type
          </label>
          <input
            id="place-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, neighborhood or type"
            className={inputClass}
            autoComplete="off"
          />
        </div>
        {location.status === "on" ? (
          <button type="button" className={btnPrimary} onClick={location.clear} aria-pressed="true">
            <Icon name="current-location" className="h-5 w-5" /> Near me is on
          </button>
        ) : (
          <button type="button" className={btnSecondary} onClick={location.request} disabled={location.status === "asking"}>
            {location.status === "asking" ? (
              "Finding you…"
            ) : (
              <>
                <Icon name="current-location" className="h-5 w-5" /> Near me
              </>
            )}
          </button>
        )}
      </div>
      {(location.status === "denied" || location.status === "unavailable") && (
        <p role="status" className="mb-4 rounded-2xl bg-honey-100 p-3 text-honey-800">
          {location.status === "denied"
            ? "Location is blocked. To sort by distance, allow location for this site in your browser settings."
            : "We couldn't get your location. (Phones need a secure https:// link for this to work.)"}
        </p>
      )}

      <div className="lg:grid lg:grid-cols-[17rem_minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start lg:gap-6">
        <div className="lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto">
          <FilterPanel
            filters={filters}
            onToggle={(group: FilterGroup, value: string) =>
              setParams(toggleFilter(params, group, value), { replace: true })
            }
            onClear={() => setParams(clearFilters(params), { replace: true })}
          />
        </div>

        {/* On desktop this wrapper just passes its children into the grid columns. */}
        <div className="contents">
          <section aria-label="Results" className={showList ? "block" : "hidden"}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold" aria-live="polite">
                {loading ? "Finding places…" : `${results.length} ${results.length === 1 ? "place" : "places"}`}
                {location.status === "on" && !loading && (
                  <span className="text-base font-normal text-ink-700"> · closest first</span>
                )}
              </h2>
            </div>

            {error && (
              <p role="alert" className="rounded-2xl bg-rose-100 p-4 text-rose-800">
                Something went wrong loading places. Try refreshing the page.
              </p>
            )}

            {!loading && !error && results.length === 0 && (
              <div className="rounded-3xl border border-dashed border-line bg-white p-6 text-center">
                <p className="text-xl font-semibold">No purr-fect matches yet</p>
                <p className="mt-1 text-ink-700">Try loosening a filter or search, or tell us where you wish cats were welcome.</p>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  {activeCount > 0 && (
                    <button type="button" className={btnSecondary} onClick={() => setParams(clearFilters(params), { replace: true })}>
                      Clear filters
                    </button>
                  )}
                  <Link to="/request-a-spot" className={btnPrimary}>
                    Request a spot
                  </Link>
                </div>
              </div>
            )}

            <ul className="space-y-4">
              {results.map((p) => (
                <li key={p.id}>
                  <PlaceCard place={p} distanceMiles={distances.get(p.id)} />
                </li>
              ))}
            </ul>

            {!loading && results.length > 0 && (
              <div className="mt-6 rounded-3xl bg-cream-100 p-5 text-center">
                <p className="font-semibold">Wish your favorite spot welcomed cats?</p>
                <Link to="/request-a-spot" className={`${btnSecondary} mt-3`}>
                  Request a spot
                </Link>
              </div>
            )}
          </section>

          {showMap && (
            <section
              aria-label="Map"
              className="h-[calc(100dvh-22rem)] min-h-80 lg:sticky lg:top-4 lg:h-[calc(100dvh-2rem)]"
            >
              <PlaceMap places={results} userLocation={location.coords} />
            </section>
          )}
        </div>
      </div>

      {/* Phone-only Map/List switch, floating at the bottom for thumb reach. */}
      {!isDesktop && (
        <div className="fixed inset-x-0 bottom-4 z-[1000] flex justify-center">
          <div role="group" aria-label="Choose a view" className="flex rounded-full border border-line bg-white p-1 shadow-lg">
            {(["list", "map"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full px-6 text-base font-semibold ${
                  view === v ? "bg-plum-800 text-white" : "text-ink-900"
                }`}
              >
                <Icon name={v === "list" ? "list" : "map-2"} className="h-5 w-5" />
                {v === "list" ? "List" : "Map"}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
