// Recipes waiting for review: scans with recipes not saved yet
// (answers stored in scan_drafts). The menu shows how many there are.
import type { Metadata } from "next";
import { Suspense } from "react";
import { Photo } from "@/components/photo";
import { EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { listOpenScans } from "@/lib/data/scan";
import { dirOf, fmt, localePath } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { DismissScanButton } from "./dismiss-scan-button";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.waiting.title };
}

async function WaitingList() {
  const [{ locale, t }, scans] = await Promise.all([getI18n(), listOpenScans()]);
  if (scans.length === 0) {
    return (
      <EmptyState
        title={t.waiting.emptyTitle}
        text={t.waiting.emptyText}
        action={<LinkButton href={localePath(locale, "/scan")}>{t.scan.newScan}</LinkButton>}
      />
    );
  }
  const date = new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-GB", {
    day: "numeric",
    month: "numeric",
    timeZone: "Asia/Jerusalem",
  });

  return (
    <ul className="flex flex-col gap-3">
      {scans.map((scan) => (
        <li key={scan.id} className="flex items-start gap-4 rounded-2xl border border-line p-3 pe-4 sm:items-center">
          <Photo src={scan.thumbUrl} alt="" className="h-20 w-[60px] shrink-0 rounded-xl object-top" />
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-6 gap-y-3 py-1">
            <div className="flex min-w-0 flex-col gap-1">
              <ul className="flex flex-col gap-0.5">
                {scan.unsavedTitles.map((r, i) => (
                  <li key={i} lang={r.language} dir={dirOf(r.language)} className="font-semibold leading-snug">
                    {r.title || "—"}
                  </li>
                ))}
              </ul>
              <span className="text-[13px] text-ink-faint">
                {scan.bookTitle ? fmt(t.scan.fromBook, { book: scan.bookTitle }) : t.scan.notFromBook}
                {` · ${date.format(new Date(scan.updatedAt))}`}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <LinkButton href={`${localePath(locale, "/scan/review")}?pages=${scan.pagesParam}`}>
                {t.waiting.review}
              </LinkButton>
              <DismissScanButton id={scan.id} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="h-[106px] animate-pulse rounded-2xl bg-brand-tint" />
      ))}
    </div>
  );
}

export default async function WaitingPage() {
  const { locale, t } = await getI18n();
  return (
    <>
      <PageHeader
        title={t.waiting.title}
        subtitle={t.waiting.subtitle}
        actions={
          <LinkButton href={localePath(locale, "/scan")} variant="secondary">
            {t.scan.newScan}
          </LinkButton>
        }
      />
      <Suspense fallback={<ListSkeleton />}>
        <WaitingList />
      </Suspense>
    </>
  );
}
