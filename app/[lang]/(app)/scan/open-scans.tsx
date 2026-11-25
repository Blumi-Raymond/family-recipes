// "Continue where you stopped": scans with recipes not saved yet
// (answers stored in scan_drafts). Shown above the scan form.
import { LinkButton } from "@/components/ui";
import { listOpenScans } from "@/lib/data/scan";
import { dirOf, fmt, localePath, plural } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { DismissScanButton } from "./dismiss-scan-button";

export async function OpenScans() {
  const [{ locale, t }, scans] = await Promise.all([getI18n(), listOpenScans()]);
  if (scans.length === 0) return null;
  const date = new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-GB", {
    day: "numeric",
    month: "numeric",
    timeZone: "Asia/Jerusalem",
  });

  return (
    <section aria-labelledby="open-scans" className="mb-10 flex flex-col gap-4 rounded-2xl bg-brand-tint p-5">
      <div className="flex flex-col gap-1">
        <h2 id="open-scans" className="text-[17px] font-bold tracking-tight">
          {t.scan.openTitle}
        </h2>
        <p className="text-sm text-ink-soft">{t.scan.openText}</p>
      </div>
      <ul className="flex flex-col gap-2">
        {scans.map((scan) => (
          <li
            key={scan.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3"
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="font-semibold">
                {scan.unsavedTitles.map((r, i) => (
                  <span key={i}>
                    {i > 0 && " · "}
                    <span lang={r.language} dir={dirOf(r.language)}>
                      {r.title || "—"}
                    </span>
                  </span>
                ))}
              </span>
              <span className="text-[13px] text-ink-faint">
                {plural(scan.unsavedTitles.length, t.scan.openLeftOne, t.scan.openLeftOther)}
                {scan.bookTitle && ` · ${fmt(t.scan.fromBook, { book: scan.bookTitle })}`}
                {` · ${date.format(new Date(scan.updatedAt))}`}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <LinkButton href={`${localePath(locale, "/scan/review")}?pages=${scan.pagesParam}`}>
                {t.scan.openContinue}
              </LinkButton>
              <DismissScanButton id={scan.id} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
