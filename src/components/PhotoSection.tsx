import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { repo } from "@/data";
import { useAuth } from "@/lib/auth";
import type { Gif } from "@/lib/giphy";
import { prepareImage } from "@/lib/image";
import { useAsync } from "@/lib/useAsync";
import GifPicker from "./GifPicker";
import { btnPrimary, btnSecondary, Card, Field, inputClass } from "./ui";

// Photos and GIFs of a place. Anyone can look; logged-in users can add a picture or a GIPHY
// GIF, and it only appears after an admin approves it.
export default function PhotoSection({ placeId, placeName }: { placeId: string; placeName: string }) {
  const { user } = useAuth();
  const photos = useAsync(() => repo.listApprovedPhotos(placeId), [placeId]);
  const list = photos.data ?? [];

  return (
    <section aria-labelledby="photos-title" className="mb-6 space-y-4">
      <h2 id="photos-title" className="font-serif text-2xl font-semibold">
        Photos
      </h2>

      {list.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {list.map((p) => (
            <li key={p.id}>
              <a href={p.url} target="_blank" rel="noreferrer" className="relative block">
                <img
                  src={p.url}
                  alt={
                    p.caption
                      ? `${p.caption} (${p.kind === "gif" ? "GIF" : "photo"} of ${placeName})`
                      : `${p.kind === "gif" ? "GIF" : "Photo"} of ${placeName}`
                  }
                  loading="lazy"
                  className="aspect-square w-full rounded-2xl border border-cream-200 object-cover"
                />
                {p.kind === "gif" && (
                  <span
                    aria-hidden="true"
                    className="absolute top-2 left-2 rounded-full bg-plum-800 px-2 py-0.5 text-[0.6rem] leading-none font-bold tracking-wider text-white uppercase"
                  >
                    GIF
                  </span>
                )}
              </a>
              {p.caption && <p className="mt-1 text-sm text-ink-700">{p.caption}</p>}
            </li>
          ))}
        </ul>
      ) : (
        !photos.loading && <p className="text-ink-700">No photos yet. Be the first to share one!</p>
      )}

      {user ? (
        <>
          <PhotoUpload placeId={placeId} />
          <GifAdder placeId={placeId} />
        </>
      ) : (
        <p className="text-ink-700">
          <Link to="/account" className="font-semibold text-accent-700 underline">
            Log in
          </Link>{" "}
          to add a photo or GIF.
        </p>
      )}
    </section>
  );
}

function PhotoUpload({ placeId }: { placeId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  // Changing this key clears the file picker after a successful upload.
  const [pickerKey, setPickerKey] = useState(0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const resized = await prepareImage(file);
      await repo.uploadPhoto(placeId, resized, caption);
      setMessage("Thank you! Your photo will show up once it's approved.");
      setFile(null);
      setCaption("");
      setPickerKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't upload that photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-xl font-semibold">Add a photo</h3>
        <Field id="photo-file" label="Choose a photo">
          <input
            key={pickerKey}
            id="photo-file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            required
            className={`${inputClass} file:mr-3 file:rounded-full file:border-0 file:bg-cream-100 file:px-4 file:py-2 file:font-semibold`}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </Field>
        <Field id="photo-caption" label="Caption" optional>
          <input id="photo-caption" maxLength={120} className={inputClass} value={caption} onChange={(e) => setCaption(e.target.value)} />
        </Field>
        {error && (
          <p role="alert" className="font-semibold text-rose-800">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="rounded-2xl bg-sage-100 p-3 font-semibold text-sage-800">
            {message}
          </p>
        )}
        <button type="submit" disabled={busy || !file} className={btnPrimary}>
          {busy ? "Uploading…" : "Upload photo"}
        </button>
        <p className="text-sm text-ink-700">Only share photos you took. Photos are reviewed before they appear.</p>
      </form>
    </Card>
  );
}

// Add a GIPHY GIF instead of uploading a picture. Search, pick one, add a caption, send it
// for approval.
function GifAdder({ placeId }: { placeId: string }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Gif | null>(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function reset() {
    setPicked(null);
    setCaption("");
    setOpen(false);
  }

  async function handleAdd() {
    if (!picked) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await repo.addGif(placeId, picked.id, caption);
      reset();
      setMessage("Thank you! Your GIF will show up once it's approved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't add that GIF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <h3 className="text-xl font-semibold">Add a GIF</h3>

      {!open && (
        <div className="mt-3 space-y-3">
          <button
            type="button"
            className={btnSecondary}
            onClick={() => {
              setOpen(true);
              setMessage("");
            }}
          >
            Search GIPHY
          </button>
          {message && (
            <p role="status" className="rounded-2xl bg-sage-100 p-3 font-semibold text-sage-800">
              {message}
            </p>
          )}
        </div>
      )}

      {open && !picked && (
        <div className="mt-3 space-y-3">
          <GifPicker onPick={setPicked} />
          <button type="button" className={btnSecondary} onClick={reset}>
            Cancel
          </button>
        </div>
      )}

      {open && picked && (
        <div className="mt-3 space-y-4">
          <img
            src={picked.previewUrl}
            alt={picked.title ? `Chosen GIF: ${picked.title}` : "Chosen GIF"}
            width={picked.width}
            height={picked.height}
            className="max-h-64 w-auto rounded-2xl border border-cream-200"
          />
          <Field id="gif-caption" label="Caption" optional>
            <input
              id="gif-caption"
              maxLength={120}
              className={inputClass}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </Field>
          {error && (
            <p role="alert" className="font-semibold text-rose-800">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button type="button" className={btnPrimary} disabled={busy} onClick={handleAdd}>
              {busy ? "Adding…" : "Add this GIF"}
            </button>
            <button type="button" className={btnSecondary} disabled={busy} onClick={() => setPicked(null)}>
              Choose a different GIF
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
