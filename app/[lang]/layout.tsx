// Root layout. The language is the first part of the URL (/he/..., /en/...),
// so <html lang dir> is known while the page is built — no cookies needed.
import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import { I18nProvider } from "@/lib/i18n/client";
import { dirOf, locales } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import "../globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

// Required with Cache Components: the possible values of [lang]
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: { default: t.meta.siteName, template: `%s · ${t.meta.siteName}` },
    description: t.meta.description,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const { locale, t } = await getI18n();
  return (
    <html lang={locale} dir={dirOf(locale)} className={`${heebo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <I18nProvider locale={locale} dictionary={t}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
