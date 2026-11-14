import { useEffect, useMemo } from "react";
import L from "leaflet";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import type { PlaceWithStats } from "@/data/types";
import { iconSvg, type IconName } from "@/lib/icons";
import { categoryInfo } from "@/lib/options";
import { SampleBadge } from "./ui";

const BOSTON: L.LatLngTuple = [42.3601, -71.0589];

// Leaflet's default pin images don't play nicely with bundlers, so we draw our own
// pins with HTML + CSS (see .wm-pin in index.css), each holding its category's Tabler icon.
const iconCache = new Map<IconName, L.DivIcon>();
function pinIcon(name: IconName) {
  let icon = iconCache.get(name);
  if (!icon) {
    icon = L.divIcon({
      className: "wm-pin",
      html: `<span><i>${iconSvg(name)}</i></span>`,
      iconSize: [38, 38],
      iconAnchor: [19, 46], // the sharp tip of the pin
      popupAnchor: [0, -46],
    });
    iconCache.set(name, icon);
  }
  return icon;
}

// Zooms the map to fit whichever places are currently shown (e.g. after filtering).
function FitToPlaces({ places }: { places: Located[] }) {
  const map = useMap();
  const key = places.map((p) => p.id).join(",");

  useEffect(() => {
    function fit() {
      map.invalidateSize(); // tell Leaflet the container's real size
      if (places.length === 0) return;
      map.fitBounds(L.latLngBounds(places.map((p) => [p.lat, p.lng] as L.LatLngTuple)), {
        padding: [40, 40],
        maxZoom: 14,
        animate: false,
      });
    }
    fit();

    // Re-fit if the container changes size (phone rotation, window resize, layout settling).
    const observer = new ResizeObserver(fit);
    observer.observe(map.getContainer());
    return () => observer.disconnect();
    // `key` changes only when the set of places changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);

  return null;
}

type Located = PlaceWithStats & { lat: number; lng: number };

export default function PlaceMap({
  places,
  userLocation,
}: {
  places: PlaceWithStats[];
  /** When "Near me" is on, a dot shows where the visitor is. */
  userLocation?: { lat: number; lng: number } | null;
}) {
  // Pending listings have no coordinates yet, so only plot places that do.
  const located = useMemo(
    () => places.filter((p): p is Located => p.lat !== null && p.lng !== null),
    [places],
  );

  return (
    <div
      role="region"
      aria-label="Map of cat-friendly places. The list view has the same places."
      className="h-full min-h-80 overflow-hidden rounded-3xl border border-cream-200"
    >
      <MapContainer center={BOSTON} zoom={12} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToPlaces places={located} />
        {userLocation && (
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={9}
            pathOptions={{ color: "#fff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 }}
          >
            <Tooltip>You are here</Tooltip>
          </CircleMarker>
        )}
        {located.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={pinIcon(categoryInfo(p.category).icon)} title={p.name}>
            {/* The left padding keeps the popup from sliding under the zoom buttons. */}
            <Popup autoPanPaddingTopLeft={[64, 24]}>
              <div className="space-y-1">
                <p className="text-xs font-semibold tracking-[0.16em] text-accent-700 uppercase">
                  {categoryInfo(p.category).label}
                </p>
                <p className="font-serif text-xl leading-tight font-semibold text-plum-900">{p.name}</p>
                <p className="text-sm text-plum-900">{p.neighborhood}</p>
                {p.isSample && <SampleBadge />}
                <p className="pt-1">
                  <Link to={`/places/${p.slug}`} className="text-sm font-semibold text-accent-700 underline">
                    View details →
                  </Link>
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
