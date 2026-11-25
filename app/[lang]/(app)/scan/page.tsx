import type { Metadata } from "next";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/skeletons";
import { LinkButton, PageHeader } from "@/components/ui";
import { getPersonalGroupId } from "@/lib/data/common";
import { listCookbookOptions } from "@/lib/data/cookbooks";
import { countWaitingRecipes } from "@/lib/data/scan";
import { localePath, plural } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
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

// "3 recipes waiting for review" -> the list (only when there are any)
async function WaitingLink() {
  const [{ locale, t }, count] = await Promise.all([getI18n(), countWaitingRecipes()]);
  if (count === 0) return null;
  return (
    <LinkButton href={localePath(locale, "/scan/waiting")} variant="secondary">
      {plural(count, t.scan.waitingOne, t.scan.waitingOther)}
    </LinkButton>
  );
}

export default async function ScanPage(props: PageProps<"/[lang]/scan">) {
  const { t } = await getI18n();
  return (
    <>
      <PageHeader
        title={t.scan.title}
        subtitle={t.scan.subtitle}
        actions={
          // A shortcut, so nothing while loading (in the title row: nothing below moves)
          <Suspense fallback={null}>
            <WaitingLink />
          </Suspense>
        }
      />
      <Suspense fallback={<FormSkeleton />}>
        <Scan {...props} />
      </Suspense>
    </>
  );
}
