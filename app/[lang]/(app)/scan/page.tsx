import type { Metadata } from "next";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/skeletons";
import { PageHeader } from "@/components/ui";
import { getPersonalGroupId } from "@/lib/data/common";
import { listCookbookOptions } from "@/lib/data/cookbooks";
import { getI18n } from "@/lib/i18n/server";
import { OpenScans } from "./open-scans";
import { ScanForm } from "./scan-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.scan.meta };
}

// ?book=<id> opens the screen with that cookbook already chosen
async function Scan({ searchParams }: PageProps<"/[lang]/scan">) {
  const [{ book }, groupId, books] = await Promise.all([
    searchParams,
    getPersonalGroupId(),
    listCookbookOptions(),
  ]);
  return (
    <ScanForm
      groupId={groupId}
      books={books}
      initialBookId={typeof book === "string" ? book : undefined}
    />
  );
}

export default async function ScanPage(props: PageProps<"/[lang]/scan">) {
  const { t } = await getI18n();
  return (
    <>
      <PageHeader title={t.scan.title} subtitle={t.scan.subtitle} />
      {/* Nothing shown while loading: the list is a shortcut, the form is the page */}
      <Suspense fallback={null}>
        <OpenScans />
      </Suspense>
      <Suspense fallback={<FormSkeleton />}>
        <Scan {...props} />
      </Suspense>
    </>
  );
}
