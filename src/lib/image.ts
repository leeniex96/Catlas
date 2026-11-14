// Shrinks a photo in the browser before uploading: max 1600px on the long side, saved as
// a JPEG. That keeps uploads small and fast (phone photos are often 5-10 MB) and strips
// location info that phones embed in photos.

const MAX_SIDE = 1600;
const AVATAR_SIZE = 400;
const MAX_ORIGINAL_BYTES = 25 * 1024 * 1024;

async function loadBitmap(file: File): Promise<ImageBitmap> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > MAX_ORIGINAL_BYTES) throw new Error("That photo is too large (25 MB max).");
  try {
    // `from-image` applies the phone's rotation so photos aren't sideways.
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("We couldn't read that image. Try a JPEG or PNG.");
  }
}

function toJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("We couldn't process that image."))), "image/jpeg", 0.85),
  );
}

/** A profile picture: cropped to a centered square and shrunk to 400 x 400. */
export async function prepareAvatar(file: File): Promise<Blob> {
  const bitmap = await loadBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser can't process images.");
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE,
  );
  bitmap.close();
  return toJpeg(canvas);
}

export async function prepareImage(file: File): Promise<Blob> {
  const bitmap = await loadBitmap(file);

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser can't process images.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return toJpeg(canvas);
}
