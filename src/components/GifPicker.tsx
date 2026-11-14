import { useEffect, useState } from "react";
import { searchGifs, type Gif } from "@/lib/giphy";
import { inputClass } from "./ui";

// A search box plus a grid of GIFs from GIPHY. Calls `onPick` when someone chooses one.
// An empty search shows cat GIFs.
export default function GifPicker({ onPick }: { onPick: (gif: Gif) => void }) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false; // ignore answers that arrive after the search has changed
    setLoading(true);
    setError("");

    // Wait a moment after typing stops, so we don't search on every keystroke.
    const timer = setTimeout(
      () => {
        searchGifs(query)
          .then((result) => {
            if (!cancelled) setGifs(result);
          })
          .catch((e: unknown) => {
            if (!cancelled) {
              setGifs([]);
              setError(e instanceof Error ? e.message : "We couldn't load GIFs.");
            }
          })
          .finally(() => {
            if (!cancelled) setLoading(false);
          });
      },
      query ? 400 : 0,
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="gif-search" className="sr-only">
          Search GIFs
        </label>
        <input
          id="gif-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search GIPHY, e.g. sleepy cat"
          autoComplete="off"
          maxLength={60}
          className={inputClass}
        />
      </div>

      <div aria-live="polite">
        {loading && <p className="text-ink-700">Finding GIFs…</p>}
        {error && (
          <p role="alert" className="font-semibold text-rose-800">
            {error}
          </p>
        )}
        {!loading && !error && gifs.length === 0 && (
          <p className="text-ink-700">No GIFs found. Try a different word.</p>
        )}
      </div>

      {gifs.length > 0 && (
        <ul className="grid grid-cols-3 gap-2">
          {gifs.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                onClick={() => onPick(g)}
                aria-label={`Choose GIF: ${g.title || "untitled"}`}
                className="block w-full overflow-hidden rounded-xl border border-cream-200 bg-cream-100 hover:border-accent-600"
              >
                <img
                  src={g.previewUrl}
                  alt=""
                  loading="lazy"
                  width={g.width}
                  height={g.height}
                  className="aspect-square w-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* GIPHY asks apps that use their GIFs to credit them. */}
      <p className="text-xs text-ink-700">
        Powered by{" "}
        <a href="https://giphy.com" target="_blank" rel="noreferrer" className="font-semibold underline">
          GIPHY
        </a>
      </p>
    </div>
  );
}
