"use client";
// Prepares a photo in the browser and uploads it straight to Supabase Storage.
// Why in the browser: phone photos are 3–10 MB; we shrink them to ~200–400 KB
// before uploading (faster, cheaper), and the files never pass through our
// server (Server Actions accept only ~1 MB).
import { createClient } from "@/lib/supabase/client";
import { IMAGE_BUCKET, newImagePath, thumbPath, type ImageFolder } from "./paths";

// Size and quality per folder. Page photos are read by the AI, so they keep
// more detail: 2576px on the long side is the most the model makes use of,
// and text needs a higher quality than a photo of a dish.
const SETTINGS: Record<ImageFolder, { max: number; webp: number; jpeg: number }> = {
  dishes: { max: 1600, webp: 0.82, jpeg: 0.85 },
  covers: { max: 1600, webp: 0.82, jpeg: 0.85 },
  pages: { max: 2576, webp: 0.9, jpeg: 0.92 },
};
const THUMB_SIZE = 480;

export class ImageError extends Error {
  constructor(public kind: "type" | "upload") {
    super(kind);
  }
}

async function loadImage(file: File): Promise<ImageBitmap> {
  if (!file.type.startsWith("image/")) throw new ImageError("type");
  try {
    // from-image: respects the phone's rotation info
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new ImageError("type"); // e.g. HEIC on a browser that can't open it
  }
}

// Draw the image no larger than `max` px on its long side
function toBlob(image: ImageBitmap, max: number, type: string, quality: number): Promise<Blob> {
  const scale = Math.min(1, max / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ImageError("type");
  ctx.fillStyle = "#fff"; // transparent PNGs -> white, not black
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new ImageError("type"))), type, quality),
  );
}

export type UploadedImage = {
  path: string; // full-size path, saved in the database
  previewUrl: string; // local preview (until the page reloads)
};

export async function uploadImage(
  file: File,
  groupId: string,
  folder: ImageFolder,
): Promise<UploadedImage> {
  const image = await loadImage(file);
  const settings = SETTINGS[folder];

  let full: Blob;
  let thumb: Blob;
  let isWebp: boolean;
  try {
    // WebP where the browser can create it (older Safari can't -> JPEG)
    full = await toBlob(image, settings.max, "image/webp", settings.webp);
    isWebp = full.type === "image/webp";
    if (!isWebp) full = await toBlob(image, settings.max, "image/jpeg", settings.jpeg);
    thumb = await toBlob(image, THUMB_SIZE, isWebp ? "image/webp" : "image/jpeg", 0.78);
  } finally {
    image.close(); // free the memory even if drawing failed
  }
  const type = isWebp ? "image/webp" : "image/jpeg";

  const path = newImagePath(groupId, folder, isWebp ? "webp" : "jpg");
  const storage = createClient().storage.from(IMAGE_BUCKET);
  const options = { contentType: type, cacheControl: "31536000", upsert: false };

  const [a, b] = await Promise.all([
    storage.upload(path, full, options),
    storage.upload(thumbPath(path), thumb, options),
  ]);
  if (a.error || b.error) {
    console.error("Image upload failed:", a.error?.message ?? b.error?.message);
    throw new ImageError("upload");
  }

  return { path, previewUrl: URL.createObjectURL(thumb) };
}
