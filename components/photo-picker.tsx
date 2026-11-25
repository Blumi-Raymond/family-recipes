"use client";
// Choose photos: they are shrunk and uploaded right away (see lib/images/upload.ts),
// and the form only keeps their paths. Used for recipe photos (several,
// one of them the main photo) and cookbook covers (one).
import { useEffect, useId, useState, type Dispatch, type SetStateAction } from "react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { ImageError, uploadImage } from "@/lib/images/upload";
import type { ImageFolder } from "@/lib/images/paths";
import { Photo } from "./photo";
import { Alert } from "./ui";

export type PickedPhoto = {
  path: string;
  previewUrl: string | null;
  is_cover: boolean;
};

export function PhotoPicker({
  groupId,
  folder,
  photos,
  setPhotos,
  max,
  onBusyChange,
  label,
}: {
  groupId: string;
  folder: ImageFolder;
  photos: PickedPhoto[];
  setPhotos: Dispatch<SetStateAction<PickedPhoto[]>>;
  max: number; // 1 = a single photo (cover)
  onBusyChange: (busy: boolean) => void;
  label: string;
}) {
  const { t } = useI18n();
  const inputId = useId();
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const single = max === 1;

  // Tell the form while uploads are running (it waits before saving)
  useEffect(() => onBusyChange(uploading > 0), [uploading, onBusyChange]);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const room = single ? 1 : max - photos.length;
    const chosen = Array.from(files).slice(0, Math.max(0, room));
    if (files.length > room && !single) setError(fmt(t.images.max, { max }));
    if (chosen.length === 0) return;

    setUploading((n) => n + chosen.length);
    let failed: string | null = null;

    // One at a time: gentle on phones with little memory
    for (const file of chosen) {
      try {
        const image = await uploadImage(file, groupId, folder);
        setPhotos((current) => {
          const added = { path: image.path, previewUrl: image.previewUrl, is_cover: false };
          const next = single ? [added] : [...current, added];
          // Make sure there is always a main photo
          if (!next.some((p) => p.is_cover)) next[0] = { ...next[0], is_cover: true };
          return next;
        });
      } catch (e) {
        failed = e instanceof ImageError && e.kind === "type" ? t.images.errorType : t.images.errorUpload;
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (failed) setError(failed);
  }

  function remove(path: string) {
    setPhotos((current) => {
      const next = current.filter((p) => p.path !== path);
      if (next.length > 0 && !next.some((p) => p.is_cover)) next[0] = { ...next[0], is_cover: true };
      return next;
    });
  }

  function makeCover(path: string) {
    setPhotos((current) => current.map((p) => ({ ...p, is_cover: p.path === path })));
  }

  const canAdd = single || photos.length + uploading < max;

  return (
    // @container: as many photos per row as its own width allows (e.g. a side column)
    <div className="@container flex flex-col gap-3">
      <span className="text-[13px] font-medium text-ink">{label}</span>
      <ul className={`grid gap-3 ${single ? "grid-cols-2 @md:grid-cols-3" : "grid-cols-2 @md:grid-cols-3 @2xl:grid-cols-4"}`}>
        {photos.map((p, i) => (
          <li key={p.path} className="flex flex-col gap-2">
            <div className="relative">
              <Photo
                src={p.previewUrl}
                alt={fmt(t.recipe.photo, { n: i + 1 })}
                className="aspect-square w-full rounded-2xl border border-line"
              />
              {!single && p.is_cover && (
                <span className="absolute start-2 top-2 rounded-full bg-brand px-2.5 py-1 text-xs font-semibold text-white">
                  {t.images.cover}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
              {!single && !p.is_cover && (
                <button
                  type="button"
                  onClick={() => makeCover(p.path)}
                  className="font-medium text-brand underline-offset-4 hover:underline"
                >
                  {t.images.makeCover}
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(p.path)}
                className="font-medium text-danger underline-offset-4 hover:underline"
              >
                {t.images.remove}
              </button>
            </div>
          </li>
        ))}

        {Array.from({ length: uploading }, (_, i) => (
          <li key={`uploading-${i}`}>
            <div className="flex aspect-square w-full animate-pulse items-center justify-center rounded-2xl bg-brand-tint text-sm text-ink-soft">
              {t.images.uploading}
            </div>
          </li>
        ))}

        {canAdd && uploading === 0 && !(single && photos.length === 1) && (
          <li>
            <label
              htmlFor={inputId}
              className={
                "flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl " +
                "border border-dashed border-line text-sm font-medium text-brand transition-colors hover:bg-brand-tint " +
                "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40"
              }
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
              {photos.length === 0 || single ? t.images.add : t.images.addMore}
              <input
                id={inputId}
                type="file"
                accept="image/*"
                multiple={!single}
                className="sr-only"
                onChange={(e) => {
                  void onFiles(e.target.files);
                  e.target.value = ""; // allow choosing the same file again
                }}
              />
            </label>
          </li>
        )}
      </ul>
      {error && <Alert>{error}</Alert>}
    </div>
  );
}
