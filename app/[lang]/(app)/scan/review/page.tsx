// Review a scan: the free path (copy the instructions, paste the answer),
// then the filled-in recipe form next to the page photo. See scan-review.tsx
// and docs/stage-2-scan-plan.md.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/skeletons";
import { LinkButton, PageHeader } from "@/components/ui";
import { getPersonalGroupId, getTags } from "@/lib/data/common";
import { listCookbookOptions } from "@/lib/data/cookbooks";
import { getScanPages } from "@/lib/data/scan";
import { localePath } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { parsePageIds } from "@/lib/scan/pages";
import { ScanReview } from "./scan-review";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.scan.reviewTitle };
}

// ?pages=<id>,<id> — the page rows created by the scan screen
async function Review({ searchParams }: PageProps<"/[lang]/scan/review">) {
  const { pages: param } = await searchParams;
  const ids = parsePageIds(param);
  if (!ids) notFound();
  const [scan, groupId, books, tags] = await Promise.all([
    getScanPages(ids),
    getPersonalGroupId(),
    listCookbookOptions(),
    getTags(),
  ]);
  if (!scan) notFound();

  return (
    <ScanReview
      pageIds={ids}
      pages={scan.pages.map((p) => ({ id: p.id, url: p.url }))}
      cookbook={scan.cookbook}
      groupId={groupId}
      books={books}
      tags={tags}
    />
  );
}

export default async function ScanReviewPage(props: PageProps<"/[lang]/scan/review">) {
  const { locale, t } = await getI18n();
  return (
    <>
      <PageHeader
        title={t.scan.reviewTitle}
        actions={
          <LinkButton href={localePath(locale, "/scan")} variant="secondary">
            {t.scan.newScan}
          </LinkButton>
        }
      />
      <Suspense fallback={<FormSkeleton />}>
        <Review {...props} />
      </Suspense>
    </>
  );
}
