import { useCallback, useState } from "react";
import type { LatLng } from "./geo";

export type LocationStatus = "idle" | "asking" | "on" | "denied" | "unavailable";

// Asks the browser for the visitor's location when they press "Near me".
// The location only lives in this component's memory: it is never saved or sent anywhere.
export function useGeolocation() {
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [coords, setCoords] = useState<LatLng | null>(null);

  const request = useCallback(() => {
    // Browsers only allow location on https:// pages and on localhost.
    if (!("geolocation" in navigator)) {
      setStatus("unavailable");
      return;
    }
    setStatus("asking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("on");
      },
      (err) => {
        setCoords(null);
        setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  const clear = useCallback(() => {
    setCoords(null);
    setStatus("idle");
  }, []);

  return { status, coords, request, clear };
}
