import type { Metadata } from "next";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/skeletons";
import { PageHeader } from "@/components/ui";
import { getPersonalGroupId } from "@/lib/data/common";
import { getI18n } from "@/lib/i18n/server";
import { BookForm } from "../book-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.books.metaNew };
}

async function NewBook() {
  const groupId = await getPersonalGroupId();
  return <BookForm initial={null} groupId={groupId} />;
}

export default async function NewBookPage() {
  const { t } = await getI18n();
  return (
    <>
      <PageHeader title={t.books.titleNew} />
      <Suspense fallback={<FormSkeleton />}>
        <NewBook />
      </Suspense>
    </>
  );
}
