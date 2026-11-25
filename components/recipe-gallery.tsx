"use client";
// Recipe photos: one big image + small ones underneath. A click on a small one
// shows it in the big frame (only for now — the saved main photo doesn't
// change). A click on the big one opens it over the page, full size, with
// "previous / next" (arrow keys work) and "close" (Escape works too).
// The scanned cookbook pages come last, shown whole (never cropped).
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";
import { Photo } from "./photo";

export type GalleryItem = {
  key: string;
  kind: "dish" | "page";
  url: string | null;
  thumbUrl: string | null;
};

const focusRing = "outline-none focus-visible:ring-2 focus-visible:ring-brand/40";

export function RecipeGallery({ items, title }: { items: GalleryItem[]; title: string }) {
  const { t } = useI18n();
  const [current, setCurrent] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const item = items[Math.min(current, items.length - 1)];

  // Names: "Photo 2", "The original page"
  const pageNumbers = new Map(
    items.filter((i) => i.kind === "page").map((i, n) => [i.key, n + 1] as const),
  );
  const nameOf = (it: GalleryItem, index: number) =>
    it.kind === "page"
      ? pageNumbers.size === 1
        ? t.recipe.bookPageOne
        : fmt(t.recipe.bookPage, { n: pageNumbers.get(it.key) ?? 1 })
      : index === 0
      ? title
      : fmt(t.recipe.photo, { n: index + 1 });

  const step = (by: number) => setCurrent((c) => (c + by + items.length) % items.length);

  // The page under the open image doesn't scroll
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const unlock = () => document.documentElement.classList.remove("overflow-hidden");
    el.addEventListener("close", unlock);
    return () => {
      el.removeEventListener("close", unlock);
      unlock();
    };
  }, []);

  function openLarge() {
    document.documentElement.classList.add("overflow-hidden");
    dialog.current?.showModal();
  }

  const isPage = item.kind === "page";

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={openLarge}
        aria-label={`${nameOf(item, current)} — ${t.recipe.enlarge}`}
        className={`group relative block w-full overflow-hidden rounded-2xl ${focusRing} focus-visible:ring-offset-2`}
      >
        <Photo
          key={item.key}
          src={item.url}
          alt={nameOf(item, current)}
          eager
          // A cookbook page is shown whole, on the soft background
          className={
            "aspect-[4/3] w-full lg:aspect-auto lg:h-[min(40rem,calc(100dvh-12rem))] " +
            (isPage ? "object-contain!" : "")
          }
        />
        {/* "Enlarge" hint, on hover / keyboard focus */}
        <span
          aria-hidden="true"
          className="absolute bottom-3 end-3 flex size-10 items-center justify-center rounded-full bg-surface/90 text-brand opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <ExpandIcon />
        </span>
      </button>

      {isPage && <p className="text-[13px] text-ink-soft">{nameOf(item, current)}</p>}

      {items.length > 1 && (
        <ul className="flex flex-wrap gap-2.5" aria-label={t.recipe.photos}>
          {items.map((it, i) => (
            <li key={it.key}>
              <button
                type="button"
                onClick={() => setCurrent(i)}
                aria-pressed={i === current}
                aria-label={nameOf(it, i)}
                className={
                  `block overflow-hidden rounded-xl transition ${focusRing} ` +
                  (i === current
                    ? "ring-2 ring-brand ring-offset-2"
                    : "opacity-75 hover:opacity-100")
                }
              >
                <Photo
                  src={it.thumbUrl ?? it.url}
                  alt=""
                  className={it.kind === "page" ? "h-16 w-12 object-top" : "size-16"}
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Full size, over the page */}
      <dialog
        ref={dialog}
        aria-label={nameOf(item, current)}
        onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
        onKeyDown={(e) => {
          if (items.length < 2) return;
          // Arrow keys follow the reading direction
          const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
          if (e.key === "ArrowLeft") step(rtl ? 1 : -1);
          if (e.key === "ArrowRight") step(rtl ? -1 : 1);
        }}
        className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-ink/95 p-0 backdrop:bg-transparent"
      >
        <div
          className="flex h-full flex-col items-center justify-center gap-4 p-4 sm:p-8"
          onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={item.key}
            src={item.url ?? undefined}
            alt={nameOf(item, current)}
            className="min-h-0 max-w-full flex-1 rounded-xl object-contain"
          />
          <div className="flex items-center gap-2">
            {items.length > 1 && (
              <DarkButton onClick={() => step(-1)} label={t.recipe.previousPhoto}>
                <ArrowIcon className="ltr:rotate-180" />
              </DarkButton>
            )}
            <span className="min-w-16 text-center text-sm text-white/80">
              {items.length > 1 && fmt(t.recipe.photoOf, { n: current + 1, total: items.length })}
            </span>
            {items.length > 1 && (
              <DarkButton onClick={() => step(1)} label={t.recipe.nextPhoto}>
                <ArrowIcon className="rtl:rotate-180" />
              </DarkButton>
            )}
          </div>
          <div className="absolute top-4 end-4">
            {/* autoFocus: the first thing the keyboard reaches is "close" */}
            <DarkButton onClick={() => dialog.current?.close()} label={t.common.close} autoFocus>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </DarkButton>
          </div>
        </div>
      </dialog>
    </div>
  );
}

function DarkButton({
  onClick,
  label,
  children,
  autoFocus,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  autoFocus?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      autoFocus={autoFocus}
      className="flex size-11 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    >
      {children}
    </button>
  );
}

// Points "forward" in a left-to-right page (the callers flip it)
function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
    </svg>
  );
}
