// Turns a street address into map coordinates using OpenStreetMap's free "Nominatim"
// search. It's only used on the admin page (a few lookups at a time), which is well within
// their usage policy. Always double-check the result before approving.

export interface Coords {
  lat: number;
  lng: number;
}

export async function geocodeAddress(address: string, neighborhood: string): Promise<Coords | null> {
  const query = `${address}, ${neighborhood}, Massachusetts`;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const results = (await res.json()) as { lat: string; lon: string }[];
    if (!results.length) return null;
    return { lat: Number(results[0].lat), lng: Number(results[0].lon) };
  } catch {
    return null; // offline, blocked, etc. The admin can type coordinates by hand.
  }
}
