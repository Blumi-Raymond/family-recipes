// 404 page, in the page's language.
import Link from "next/link";
import { localePath } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";

export default async function NotFound() {
  const { locale, t } = await getI18n();
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-start justify-center gap-3 px-6 py-16">
      <h1 className="text-[34px] font-bold tracking-tight">{t.notFound.title}</h1>
      <p className="text-[15px] text-ink-soft">{t.notFound.text}</p>
      <Link
        href={localePath(locale)}
        className="mt-2 text-[15px] font-semibold text-brand underline underline-offset-4 hover:text-brand-dark"
      >
        {t.notFound.home}
      </Link>
    </main>
  );
}
