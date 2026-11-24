// Frame for the login and sign-up screens (design A1):
// form on one side, a tinted panel with the message on the other.
import type { ReactNode } from "react";
import { getI18n } from "@/lib/i18n/server";
import { LanguageSwitch } from "./language-switch";
import { Logo } from "./ui";

const icons = {
  scan: (
    <>
      <path d="M4 8V6a2 2 0 0 1 2-2h2" />
      <path d="M16 4h2a2 2 0 0 1 2 2v2" />
      <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
      <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
      <path d="M4 12h16" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </>
  ),
  heart: <path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z" />,
};

export async function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const { t } = await getI18n();
  const features = [
    { text: t.authShell.featureScan, icon: icons.scan },
    { text: t.authShell.featureSearch, icon: icons.search },
    { text: t.authShell.featureFavorites, icon: icons.heart },
  ];

  return (
    <div className="flex flex-1">
      <main className="flex min-w-0 flex-1 flex-col px-6 py-10 sm:px-12 lg:px-[72px] lg:py-12">
        <div className="flex items-center justify-between gap-4">
          <Logo name={t.meta.siteName} />
          <LanguageSwitch />
        </div>
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="flex w-full max-w-[380px] flex-col gap-7">
            <div className="flex flex-col gap-2">
              <h1 className="text-[34px] font-bold leading-tight tracking-tight">{title}</h1>
              <p className="text-[15px] text-ink-soft">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </main>

      <aside className="hidden min-w-0 flex-1 flex-col justify-between bg-brand-tint p-16 lg:flex">
        <span className="text-[13px] font-semibold tracking-wide text-brand">
          {t.authShell.tagline}
        </span>
        <div className="flex flex-col gap-5">
          <p className="text-[56px] font-extrabold leading-[1.04] tracking-[-0.035em] xl:text-[60px]">
            {t.authShell.headline1}
            <br />
            <span className="text-brand">{t.authShell.headline2}</span>
          </p>
          <p className="max-w-[400px] text-[17px] leading-relaxed text-ink-soft">
            {t.authShell.blurb}
          </p>
        </div>
        <ul className="flex flex-col gap-3.5 text-[15px]">
          {features.map((f) => (
            <li key={f.text} className="flex items-center gap-3">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-brand"
                aria-hidden="true"
              >
                {f.icon}
              </svg>
              {f.text}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
