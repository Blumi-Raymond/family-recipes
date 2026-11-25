// Cookbooks list
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Photo } from "@/components/photo";
import { EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { listCookbooks } from "@/lib/data/cookbooks";
import { dirOf, localePath, plural } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.books.title };
}

async function BookList() {
  const { locale, t } = await getI18n();
  const books = await listCookbooks();

  if (books.length === 0) {
    return (
      <EmptyState
        title={t.books.emptyTitle}
        text={t.books.emptyText}
        action={<LinkButton href={localePath(locale, "/books/new")}>{t.books.add}</LinkButton>}
      />
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {books.map((book) => (
        <li key={book.id} className="flex flex-col gap-3">
          <Link
            href={`${localePath(locale)}?book=${book.id}`}
            className="group flex flex-col gap-3 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <Photo
              src={book.coverUrl}
              alt=""
              className="aspect-[3/4] w-full rounded-2xl border border-line transition-opacity group-hover:opacity-90"
            />
            <div className="flex flex-col gap-0.5">
              <span lang={book.language} dir={dirOf(book.language)} className="font-semibold leading-snug group-hover:text-brand">
                {book.title}
              </span>
              {book.author && (
                <span lang={book.language} dir={dirOf(book.language)} className="text-sm text-ink-soft">
                  {book.author}
                </span>
              )}
              <span className="text-[13px] text-ink-faint">
                {book.recipeCount === 0
                  ? t.books.recipesNone
                  : plural(book.recipeCount, t.books.recipesOne, t.books.recipesOther)}
              </span>
            </div>
          </Link>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link
              href={`${localePath(locale, "/scan")}?book=${book.id}`}
              className="text-sm font-medium text-brand underline-offset-4 hover:underline"
            >
              {t.books.scan}
            </Link>
            <Link
              href={localePath(locale, `/books/${book.id}/edit`)}
              className="text-sm font-medium text-brand underline-offset-4 hover:underline"
            >
              {t.common.edit}
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

function BookListSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-brand-tint" />
      ))}
    </div>
  );
}

export default async function BooksPage() {
  const { locale, t } = await getI18n();
  return (
    <>
      <PageHeader
        title={t.books.title}
        subtitle={t.books.subtitle}
        actions={
          <LinkButton href={localePath(locale, "/books/new")} variant="secondary">
            {t.books.add}
          </LinkButton>
        }
      />
      <Suspense fallback={<BookListSkeleton />}>
        <BookList />
      </Suspense>
    </>
  );
}
