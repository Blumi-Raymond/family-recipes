"use client";
// Scan screen: choose the book and the page photos (1–4, in order).
// Photos upload as soon as they are chosen; "Continue" creates the page
// rows and moves on to the review screen.
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition, type FormEvent } from "react";
import { PagePicker, type PickedPage } from "@/components/page-picker";
import { Alert, Button, Select } from "@/components/ui";
import { createScanPages } from "@/lib/actions/scan";
import { useLeaveAfterSave } from "@/lib/forms/use-leave-after-save";
import { useI18n } from "@/lib/i18n/client";
import { fmt, localePath } from "@/lib/i18n/config";
import { MAX_SCAN_PAGES, pageIdsParam } from "@/lib/scan/pages";

type Props = {
  groupId: string;
  books: { id: string; title: string }[];
  initialBookId?: string; // opened from a cookbook
};

export function ScanForm({ groupId, books, initialBookId }: Props) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [bookId, setBookId] = useState(() =>
    initialBookId && books.some((b) => b.id === initialBookId) ? initialBookId : "",
  );
  const [pages, setPages] = useState<PickedPage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingPages, setMissingPages] = useState(false);
  const [pending, startTransition] = useTransition();
  // After "Continue": locked until the review screen shows. Then (hidden,
  // kept for the browser's "back" button) the screen starts fresh, so "back"
  // means a new scan with the same book, and the same pages can't be sent twice.
  const { leaving, startLeaving } = useLeaveAfterSave(() => {
    setPages([]);
    setMissingPages(false);
    setError(null);
  });
  const onBusyChange = useCallback((busy: boolean) => setUploading(busy), []);
  // "Add at least one page" disappears as soon as a page is added
  const showMissing = missingPages && pages.length === 0;

  // Leaving after choosing photos: the browser asks "leave site?"
  const dirty = pages.length > 0 && !leaving;
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (uploading || pending || leaving) return;
    if (pages.length === 0) {
      setMissingPages(true);
      return;
    }
    setError(null);

    startTransition(async () => {
      let result;
      try {
        result = await createScanPages({
          cookbook_id: bookId || null,
          paths: pages.map((p) => p.path),
        });
      } catch {
        // No connection / server didn't answer: the photos stay on screen
        setError(t.scan.error);
        return;
      }
      if (!result.ok) {
        setError(t.scan.error);
        return;
      }
      startLeaving();
      router.push(`${localePath(locale, "/scan/review")}?pages=${pageIdsParam(result.pageIds)}`);
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-3xl flex-col gap-7">
      <div className="max-w-[380px]">
        <Select
          id="scan-book"
          label={t.scan.book}
          value={bookId}
          onChange={(e) => setBookId(e.target.value)}
        >
          <option value="">{t.scan.noBook}</option>
          {books.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title}
            </option>
          ))}
        </Select>
      </div>

      <PagePicker
        groupId={groupId}
        pages={pages}
        setPages={setPages}
        max={MAX_SCAN_PAGES}
        onBusyChange={onBusyChange}
        label={t.scan.pages}
        hint={fmt(t.scan.pagesHint, { max: MAX_SCAN_PAGES })}
        invalid={showMissing}
      />

      {showMissing && <Alert>{t.scan.needPage}</Alert>}
      {error && <Alert>{error}</Alert>}

      <div className="max-w-[380px]">
        <Button type="submit" disabled={uploading || pending || leaving}>
          {pending || leaving ? t.scan.continuing : t.scan.continue}
        </Button>
      </div>
    </form>
  );
}
