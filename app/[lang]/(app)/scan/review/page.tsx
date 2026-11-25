// Review a scan: the page photos, in order.
// Stage C adds the filled-in form next to them (see docs/stage-2-scan-plan.md).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/skeletons";
import { Photo } from "@/components/photo";
import { PageHeader } from "@/components/ui";
import { getScanPages } from "@/lib/data/scan";
import { fmt } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { parsePageIds } from "@/lib/scan/pages";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.scan.reviewTitle };
}

// ?pages=<id>,<id> — the page rows created by the scan screen
async function Review({ searchParams }: PageProps<"/[lang]/scan/review">) {
  const [{ pages: param }, { t }] = await Promise.all([searchParams, getI18n()]);
  const ids = parsePageIds(param);
  if (!ids) notFound();
  const scan = await getScanPages(ids);
  if (!scan) notFound();

  const total = scan.pages.length;
  return (
    <div className="flex flex-col gap-6">
      <p className="text-[15px] text-ink-soft">
        {scan.cookbook ? fmt(t.scan.fromBook, { book: scan.cookbook.title }) : t.scan.notFromBook}
      </p>
      <ol className="grid gap-4 sm:grid-cols-2">
        {scan.pages.map((page, i) => {
          const name = fmt(t.scan.pageOf, { n: i + 1, total });
          return (
            <li key={page.id} className="flex flex-col gap-2">
              <span className="text-[13px] font-medium text-ink">{name}</span>
              <Photo
                src={page.url}
                alt={name}
                eager={i === 0}
                className="min-h-40 w-full rounded-2xl border border-line"
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default async function ScanReviewPage(props: PageProps<"/[lang]/scan/review">) {
  const { t } = await getI18n();
  return (
    <>
      <PageHeader title={t.scan.reviewTitle} />
      <Suspense fallback={<FormSkeleton />}>
        <Review {...props} />
      </Suspense>
    </>
  );
}
