import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/skeletons";
import { PageHeader } from "@/components/ui";
import { getCookbook } from "@/lib/data/cookbooks";
import { getI18n } from "@/lib/i18n/server";
import { BookForm } from "../../book-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.books.metaEdit };
}

async function EditBook({ params }: PageProps<"/[lang]/books/[id]/edit">) {
  const { id } = await params;
  const book = await getCookbook(id);
  if (!book) notFound();
  return <BookForm initial={book} groupId={book.group_id} />;
}

export default async function EditBookPage(props: PageProps<"/[lang]/books/[id]/edit">) {
  const { t } = await getI18n();
  return (
    <>
      <PageHeader title={t.books.titleEdit} />
      <Suspense fallback={<FormSkeleton />}>
        <EditBook {...props} />
      </Suspense>
    </>
  );
}
