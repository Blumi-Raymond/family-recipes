"use client";
// The page photos next to the form, to compare the text against.
// Several pages -> one at a time, with "Page 1 / Page 2" tabs.
// Zoom doubles the width (scroll inside the frame); full size opens the
// original in a new window.
import { useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/config";

export type ReviewPage = { id: string; url: string | null };

export function PagePhotos({ pages, cookbookTitle }: { pages: ReviewPage[]; cookbookTitle: string | null }) {
  const { t } = useI18n();
  const [current, setCurrent] = useState(0);
  const [zoom, setZoom] = useState(false);
  const page = pages[Math.min(current, pages.length - 1)];
  const name = fmt(t.scan.pageOf, { n: current + 1, total: pages.length });

  const textButton =
    "rounded-field px-2 py-1 text-sm font-medium text-brand underline-offset-4 hover:underline " +
    "outline-none focus-visible:ring-2 focus-visible:ring-brand/40";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-ink-soft">
          {cookbookTitle ? fmt(t.scan.fromBook, { book: cookbookTitle }) : t.scan.notFromBook}
        </p>
        <div className="flex items-center gap-1">
          <button type="button" className={textButton} onClick={() => setZoom((z) => !z)} aria-pressed={zoom}>
            {zoom ? t.scanReview.zoomOut : t.scanReview.zoomIn}
          </button>
          {page.url && (
            <a href={page.url} target="_blank" rel="noopener noreferrer" className={textButton}>
              {t.scanReview.openFull}
            </a>
          )}
        </div>
      </div>

      {pages.length > 1 && (
        <div role="tablist" aria-label={t.scanReview.photos} className="flex flex-wrap gap-1">
          {pages.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={i === current}
              onClick={() => setCurrent(i)}
              className={
                "h-9 rounded-field px-3 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand/40 " +
                (i === current
                  ? "bg-brand-tint font-semibold text-brand-dark"
                  : "font-medium text-ink-soft hover:bg-brand-tint hover:text-ink")
              }
            >
              {fmt(t.scan.page, { n: i + 1 })}
            </button>
          ))}
        </div>
      )}

      {/* The frame scrolls; the photo keeps its own direction for the scrollbars */}
      <div
        dir="ltr"
        tabIndex={0}
        aria-label={name}
        className="max-h-[60vh] overflow-auto rounded-2xl border border-line bg-brand-tint outline-none focus-visible:ring-2 focus-visible:ring-brand/40 xl:max-h-[calc(100vh-8rem)]"
      >
        {page.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={page.id}
            src={page.url}
            alt={name}
            decoding="async"
            className={zoom ? "block w-[200%] max-w-none" : "block h-auto w-full"}
          />
        ) : (
          <div className="aspect-[3/4] w-full" role="img" aria-label={name} />
        )}
      </div>
    </div>
  );
}
