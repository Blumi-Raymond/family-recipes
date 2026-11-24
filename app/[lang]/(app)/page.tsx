// Home page — temporary until the recipe list is built (stage 1ה).
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { fmt } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";

async function Welcome({ hello }: { hello: string }) {
  const user = await getCurrentUser();
  return (
    <h1 className="text-[34px] font-bold leading-tight tracking-tight">
      {fmt(hello, { name: user.displayName })}
    </h1>
  );
}

export default async function Home() {
  const { t } = await getI18n();
  return (
    <>
      <Suspense fallback={<div className="h-11" />}>
        <Welcome hello={t.home.hello} />
      </Suspense>
      <p className="mt-2 text-[15px] text-ink-soft">{t.home.subtitle}</p>

      <div className="mt-10 rounded-2xl bg-brand-tint p-8">
        <p className="text-sm font-semibold text-brand">{t.home.soon}</p>
        <p className="mt-2 max-w-md text-ink-soft">{t.home.soonText}</p>
      </div>
    </>
  );
}
