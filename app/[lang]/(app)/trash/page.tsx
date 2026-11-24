// Trash: recipes moved here stay 30 days (then the database deletes them).
import type { Metadata } from "next";
import { Suspense } from "react";
import { EmptyState, PageHeader } from "@/components/ui";
import { listTrash } from "@/lib/data/recipes";
import { dirOf, fmt } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { RestoreButton } from "./restore-button";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.trash.title };
}

async function TrashList() {
  const [{ t }, recipes] = await Promise.all([getI18n(), listTrash()]);
  if (recipes.length === 0) {
    return <EmptyState title={t.trash.emptyTitle} text={t.trash.emptyText} />;
  }
  return (
    <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line">
      {recipes.map((r) => {
        const days = r.daysLeft;
        return (
          <li key={r.id} className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span lang={r.language} dir={dirOf(r.language)} className="truncate font-semibold">
                {r.title}
              </span>
              <span className="text-[13px] text-ink-faint">
                {days === 0
                  ? t.trash.today
                  : days === 1
                    ? t.trash.daysLeftOne
                    : fmt(t.trash.daysLeftOther, { n: days })}
              </span>
            </div>
            <RestoreButton id={r.id} />
          </li>
        );
      })}
    </ul>
  );
}

export default async function TrashPage() {
  const { t } = await getI18n();
  return (
    <>
      <PageHeader title={t.trash.title} subtitle={t.trash.subtitle} />
      <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-brand-tint" aria-hidden="true" />}>
        <TrashList />
      </Suspense>
    </>
  );
}
