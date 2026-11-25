"use client";
// Choose the photos of a recipe's pages (1–4), in reading order.
// Each photo is shrunk and uploaded right away to "<group>/pages/" at high
// resolution (see lib/images/upload.ts); the screen keeps only the paths.
import { useEffect, useId, useState, type Dispatch, type SetStateAction } from "react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { ImageError, uploadImage } from "@/lib/images/upload";
import { Photo } from "./photo";
import { Alert } from "./ui";

export type PickedPage = { path: string; previewUrl: string };

export function PagePicker({
  groupId,
  pages,
  setPages,
  max,
  onBusyChange,
  label,
  hint,
  invalid,
}: {
  groupId: string;
  pages: PickedPage[];
  setPages: Dispatch<SetStateAction<PickedPage[]>>;
  max: number;
  onBusyChange: (busy: boolean) => void;
  label: string;
  hint: string;
  invalid?: boolean;
}) {
  const { t } = useI18n();
  const inputId = useId();
  const hintId = useId();
  const labelId = useId();
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Tell the screen while uploads are running (it waits before continuing)
  useEffect(() => onBusyChange(uploading > 0), [uploading, onBusyChange]);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const room = Math.max(0, max - pages.length - uploading);
    const chosen = Array.from(files).slice(0, room);
    if (files.length > room) setError(fmt(t.scan.max, { max }));
    if (chosen.length === 0) return;

    setUploading((n) => n + chosen.length);
    let failed: string | null = null;

    // One at a time, in the order chosen (gentle on memory; keeps the order)
    for (const file of chosen) {
      try {
        const image = await uploadImage(file, groupId, "pages");
        setPages((current) => [...current, { path: image.path, previewUrl: image.previewUrl }]);
      } catch (e) {
        failed = e instanceof ImageError && e.kind === "type" ? t.images.errorType : t.images.errorUpload;
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (failed) setError(failed);
  }

  function move(from: number, to: number) {
    setPages((current) => {
      if (to < 0 || to >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function remove(path: string) {
    setPages((current) => current.filter((p) => p.path !== path));
  }

  const canAdd = pages.length + uploading < max;
  const linkButton =
    "font-medium underline-offset-4 hover:underline disabled:cursor-default disabled:opacity-40 disabled:no-underline " +
    "rounded outline-none focus-visible:ring-2 focus-visible:ring-brand/40";

  return (
    <div role="group" aria-labelledby={labelId} aria-describedby={hintId} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span id={labelId} className="text-[13px] font-medium text-ink">
          {label}
        </span>
        <p id={hintId} className="text-xs text-ink-faint">
          {hint}
        </p>
      </div>

      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {pages.map((p, i) => {
          const name = fmt(t.scan.page, { n: i + 1 });
          return (
            <li key={p.path} className="flex flex-col gap-2">
              <div className="relative">
                <Photo
                  src={p.previewUrl}
                  alt={name}
                  className="aspect-[3/4] w-full rounded-2xl border border-line"
                />
                <span className="absolute start-2 top-2 rounded-full bg-brand px-2.5 py-1 text-xs font-semibold text-white">
                  {name}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                {pages.length > 1 && (
                  <>
                    <button
                      type="button"
                      className={`${linkButton} text-brand`}
                      disabled={i === 0}
                      onClick={() => move(i, i - 1)}
                      aria-label={`${t.scan.moveEarlier} — ${name}`}
                    >
                      {t.scan.moveEarlier}
                    </button>
                    <button
                      type="button"
                      className={`${linkButton} text-brand`}
                      disabled={i === pages.length - 1}
                      onClick={() => move(i, i + 1)}
                      aria-label={`${t.scan.moveLater} — ${name}`}
                    >
                      {t.scan.moveLater}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className={`${linkButton} text-danger`}
                  onClick={() => remove(p.path)}
                  aria-label={`${t.scan.remove} — ${name}`}
                >
                  {t.scan.remove}
                </button>
              </div>
            </li>
          );
        })}

        {Array.from({ length: uploading }, (_, i) => (
          <li key={`uploading-${i}`}>
            <div className="flex aspect-[3/4] w-full animate-pulse items-center justify-center rounded-2xl bg-brand-tint text-sm text-ink-soft">
              {t.scan.uploading}
            </div>
          </li>
        ))}

        {canAdd && uploading === 0 && (
          <li>
            <label
              htmlFor={inputId}
              className={
                "flex aspect-[3/4] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl " +
                `border border-dashed ${invalid ? "border-danger" : "border-line"} ` +
                "text-sm font-medium text-brand transition-colors hover:bg-brand-tint " +
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
                <path d="M6 3h9l4 4v14H6z" />
                <path d="M14 3v5h5" />
                <path d="M12.5 11v6M9.5 14h6" />
              </svg>
              {pages.length === 0 ? t.scan.addPages : t.scan.addPage}
              <input
                id={inputId}
                type="file"
                accept="image/*"
                multiple
                aria-describedby={hintId}
                aria-invalid={invalid || undefined}
                className="sr-only"
                onChange={(e) => {
                  void onFiles(e.target.files);
                  e.target.value = ""; // allow choosing the same file again
                }}
              />
            </label>
          </li>
        )}
      </ol>
      {error && <Alert>{error}</Alert>}
    </div>
  );
}
