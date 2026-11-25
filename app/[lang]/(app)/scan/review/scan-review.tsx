"use client";
// The scan review screen (stage 2C — the free path):
//   1. copy the instructions -> paste them into a chat with Claude together
//      with the page photos -> paste the answer back here
//   2. several recipes found -> choose one
//   3. the recipe form, filled in, with "worth checking" marks and a summary,
//      next to the page photo. Nothing is saved until "Save recipe".
// The pasted answer is kept for this browser tab (sessionStorage), so going
// back or reloading doesn't lose an answer that took a chat to get.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useSyncExternalStore, type FormEvent } from "react";
import { Alert, Badge, Button, CheckNote, LinkButton, TextArea } from "@/components/ui";
import type { Tag } from "@/lib/data/common";
import { useI18n } from "@/lib/i18n/client";
import { dirOf, fmt, localePath, plural } from "@/lib/i18n/config";
import type { RecipeFormState } from "@/lib/recipes/form-state";
import type { ScanAnswer } from "@/lib/scan/answer";
import { parseScanAnswer, type ParseResult } from "@/lib/scan/parse";
import { buildScanPrompt } from "@/lib/scan/prompt";
import {
  answerStorageKey,
  readStoredAnswer,
  reasonText,
  summarizeChecks,
  type MarkPlace,
  type StoredAnswer,
} from "@/lib/scan/review";
import { scannedRecipeToForm, type ScanReview as Review } from "@/lib/scan/to-form";
import { RecipeForm } from "../../recipes/recipe-form";
import { PagePhotos, type ReviewPage } from "./page-photos";

type Props = {
  pageIds: string[];
  pages: ReviewPage[];
  cookbook: { id: string; title: string } | null;
  groupId: string;
  books: { id: string; title: string }[];
  tags: Tag[];
};

type View = { kind: "paste" } | { kind: "list" } | { kind: "form"; index: number };
type PasteError = Extract<ParseResult, { ok: false }>["error"];

const CHAT_URL = "https://claude.ai/new";

function storageGet(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null; // storage blocked (private mode etc.): just not remembered
  }
}
function storageSet(key: string, value: StoredAnswer) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // full or blocked: the answer still works on this screen
  }
}

// Where to go once an answer is known: one unsaved recipe -> its form;
// otherwise the list (choose a recipe / see what was saved / "no recipe")
function viewFor(a: ScanAnswer, saved: Record<string, string>): View {
  if (a.status === "ok" && a.recipes.length === 1 && !saved["0"]) return { kind: "form", index: 0 };
  return { kind: "list" };
}

// An answer pasted earlier in this tab (reload, "back" button)
function restore(storageKey: string) {
  const stored = readStoredAnswer(storageGet(storageKey));
  if (!stored) return { text: "", answer: null, saved: {}, view: { kind: "paste" } as View };
  const parsed = parseScanAnswer(stored.text);
  if (!parsed.ok) return { text: stored.text, answer: null, saved: {}, view: { kind: "paste" } as View };
  return { text: stored.text, answer: parsed.answer, saved: stored.saved, view: viewFor(parsed.answer, stored.saved) };
}

const noSubscribe = () => () => {};

// The stored answer lives in the browser only: the server (and the first
// render in the browser) shows a placeholder, then the screen starts with it.
export function ScanReview(props: Props) {
  const inBrowser = useSyncExternalStore(noSubscribe, () => true, () => false);
  const { t } = useI18n();
  return (
    // data-wide: the page frame widens for this screen (form + photo side by side)
    <div data-wide className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]">
      <aside className="min-w-0 xl:sticky xl:top-6 xl:order-2" aria-label={t.scanReview.photos}>
        <PagePhotos pages={props.pages} cookbookTitle={props.cookbook?.title ?? null} />
      </aside>
      <div className="min-w-0 xl:order-1">
        {inBrowser ? (
          <ReviewSteps {...props} />
        ) : (
          <div className="h-64 animate-pulse rounded-2xl bg-brand-tint" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

function ReviewSteps({ pageIds, pages, cookbook, groupId, books, tags }: Props) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const storageKey = answerStorageKey(pageIds);

  const [initial] = useState(() => restore(storageKey));
  const [view, setView] = useState<View>(initial.view);
  const [text, setText] = useState(initial.text);
  const [pasteError, setPasteError] = useState<PasteError | null>(null);
  const [answer, setAnswer] = useState<ScanAnswer | null>(initial.answer);
  const [saved, setSaved] = useState<Record<string, string>>(initial.saved);
  const [edits, setEdits] = useState<Record<number, RecipeFormState>>({});
  const [justSaved, setJustSaved] = useState<string | null>(null);

  // The answer -> one filled-in form per recipe (the same rules as typing by hand)
  const drafts = useMemo(() => {
    if (!answer) return [];
    const ctx = {
      locale,
      bookId: cookbook?.id ?? "",
      tags,
      handwrittenSource: t.scanReview.handwrittenSource,
    };
    return answer.recipes.map((recipe) => scannedRecipeToForm(recipe, ctx));
  }, [answer, cookbook, locale, tags, t]);

  function readAnswer(e: FormEvent) {
    e.preventDefault();
    const parsed = parseScanAnswer(text);
    if (!parsed.ok) {
      setPasteError(parsed.error);
      return;
    }
    // A new answer starts fresh (nothing saved from it yet)
    setPasteError(null);
    setAnswer(parsed.answer);
    setSaved({});
    setEdits({});
    setJustSaved(null);
    storageSet(storageKey, { text, saved: {} });
    setView(viewFor(parsed.answer, {}));
    window.scrollTo({ top: 0 });
  }

  const pasteAgain = () => {
    setJustSaved(null);
    setView({ kind: "paste" });
  };

  const openRecipe = (index: number) => {
    setJustSaved(null);
    setView({ kind: "form", index });
    window.scrollTo({ top: 0 });
  };

  // Keep her edits per recipe (stable callback; no update when unchanged)
  const activeIndex = view.kind === "form" ? view.index : -1;
  const onDraftChange = useCallback(
    (form: RecipeFormState) =>
      setEdits((prev) => (prev[activeIndex] === form ? prev : { ...prev, [activeIndex]: form })),
    [activeIndex],
  );

  function onSaved(index: number, id: string) {
    const next: Record<string, string> = { ...saved, [index]: id };
    setSaved(next);
    storageSet(storageKey, { text, saved: next });
    const left = drafts.filter((_, i) => !next[i]).length;
    if (left === 0) {
      // All done: to the recipe (this screen waits, hidden, for "back")
      router.push(localePath(locale, `/recipes/${id}`));
    } else {
      setJustSaved(id);
      setView({ kind: "list" });
      window.scrollTo({ top: 0 });
    }
  }

  // ---------------------------------------------------------------------
  let main;
  if (view.kind === "paste" || !answer) {
    main = (
      <PasteSteps
        pageCount={pages.length}
        pages={pages}
        tags={tags}
        text={text}
        setText={(v) => {
          setText(v);
          setPasteError(null);
        }}
        error={pasteError}
        onSubmit={readAnswer}
      />
    );
  } else if (answer.status !== "ok" || drafts.length === 0) {
    main = (
      <div className="flex flex-col items-start gap-3 rounded-2xl bg-brand-tint p-6">
        <p className="text-[17px] font-semibold">
          {answer.status === "unreadable" ? t.scanReview.unreadable : t.scanReview.notRecipe}
        </p>
        {answer.message && <p className="text-[15px] text-ink-soft">{answer.message}</p>}
        {answer.unreadable_parts && (
          <p className="text-[15px] text-ink-soft">{fmt(t.scanReview.unreadableParts, { text: answer.unreadable_parts })}</p>
        )}
        <p className="text-sm text-ink-soft">{t.scanReview.noRecipeHint}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" block={false} onClick={pasteAgain}>
            {t.scanReview.pasteAgain}
          </Button>
          <LinkButton href={newScanHref(locale, cookbook)} variant="secondary">
            {t.scan.newScan}
          </LinkButton>
        </div>
      </div>
    );
  } else if (view.kind === "list") {
    main = (
      <div className="flex flex-col gap-5">
        {justSaved && (
          <Alert tone="success">
            {t.scanReview.savedNotice}{" "}
            <Link href={localePath(locale, `/recipes/${justSaved}`)} className="font-semibold underline underline-offset-4">
              {t.scanReview.viewSaved}
            </Link>
          </Alert>
        )}
        <div className="flex flex-col gap-1">
          <h2 className="text-[17px] font-bold tracking-tight">
            {plural(drafts.length, t.scanReview.chooseTitleOne, t.scanReview.chooseTitle)}
          </h2>
          {drafts.length > 1 && <p className="text-[15px] text-ink-soft">{t.scanReview.chooseText}</p>}
        </div>
        {answer.unreadable_parts && (
          <CheckNote>{fmt(t.scanReview.unreadableParts, { text: answer.unreadable_parts })}</CheckNote>
        )}
        <ul className="flex flex-col gap-3">
          {drafts.map(({ form }, i) => {
            const savedId = saved[i];
            const count = form.ingredients.filter((r) => r.kind === "item").length;
            return (
              <li
                key={i}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line px-5 py-4"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span lang={form.language} dir={dirOf(form.language)} className="font-semibold">
                    {form.title || "—"}
                  </span>
                  <span className="text-[13px] text-ink-faint">
                    {plural(count, t.scanReview.ingredientsOne, t.scanReview.ingredientsOther)}
                    {form.page && ` · ${fmt(t.scanReview.pageNumber, { n: form.page })}`}
                  </span>
                </div>
                {savedId ? (
                  <div className="flex items-center gap-3">
                    <Badge tone="brand">{t.scanReview.saved}</Badge>
                    <LinkButton href={localePath(locale, `/recipes/${savedId}`)} variant="secondary">
                      {t.scanReview.viewSaved}
                    </LinkButton>
                  </div>
                ) : (
                  <Button size="sm" block={false} onClick={() => openRecipe(i)}>
                    {t.scanReview.choose}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
        <div>
          <Button variant="secondary" size="sm" block={false} onClick={pasteAgain}>
            {t.scanReview.pasteAgain}
          </Button>
        </div>
      </div>
    );
  } else {
    const index = view.index;
    const draft = drafts[index];
    const current = edits[index] ?? draft.form;
    main = (
      <div className="flex flex-col gap-8">
        <Summary
          review={draft.review}
          form={current}
          unreadableParts={answer.unreadable_parts}
        />
        <RecipeForm
          key={index}
          recipe={null}
          groupId={groupId}
          books={books}
          tags={tags}
          scan={{
            form: current,
            review: draft.review,
            sourcePages: pageIds,
            edited: current !== draft.form,
            onChange: onDraftChange,
            onSaved: (id) => onSaved(index, id),
            onBack: () => setView(drafts.length > 1 ? { kind: "list" } : { kind: "paste" }),
            // Hidden after saving (kept for "back"): show the list when she returns
            onLeft: () => setView({ kind: "list" }),
          }}
        />
      </div>
    );
  }

  return main;
}

function newScanHref(locale: "he" | "en", cookbook: { id: string } | null) {
  const base = localePath(locale, "/scan");
  return cookbook ? `${base}?book=${cookbook.id}` : base;
}

// ---------------------------------------------------------------------
// The free path: copy, chat, paste
// ---------------------------------------------------------------------
function PasteSteps({
  pageCount,
  pages,
  tags,
  text,
  setText,
  error,
  onSubmit,
}: {
  pageCount: number;
  pages: ReviewPage[];
  tags: Tag[];
  text: string;
  setText: (text: string) => void;
  error: PasteError | null;
  onSubmit: (e: FormEvent) => void;
}) {
  const { locale, t } = useI18n();
  const [copy, setCopy] = useState<"idle" | "done" | "failed">("idle");
  const prompt = useMemo(
    () => buildScanPrompt({ mode: "paste", pageCount, locale, tags }),
    [pageCount, locale, tags],
  );

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopy("done");
    } catch {
      setCopy("failed"); // shows the text to copy by hand
    }
  }

  const stepNumber = (n: number) => (
    <span
      aria-hidden="true"
      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-tint text-sm font-semibold text-brand-dark"
    >
      {n}
    </span>
  );

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <h2 className="text-[17px] font-bold tracking-tight">{t.scanReview.pasteTitle}</h2>
        <p className="max-w-xl text-[15px] text-ink-soft">{t.scanReview.pasteIntro}</p>
      </div>

      <ol className="flex flex-col gap-7">
        <li className="flex gap-3">
          {stepNumber(1)}
          <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
            <h3 className="pt-0.5 font-semibold">{t.scanReview.step1}</h3>
            <Button size="sm" block={false} onClick={copyPrompt}>
              {t.scanReview.copy}
            </Button>
            {copy === "done" && (
              <p role="status" className="text-sm text-brand-dark">
                {t.scanReview.copied}
              </p>
            )}
            {copy === "failed" && (
              <div className="flex w-full flex-col gap-2">
                <p role="alert" className="text-sm text-danger">
                  {t.scanReview.copyFailed}
                </p>
                <TextArea
                  id="scan-instructions"
                  label={t.scanReview.instructionsLabel}
                  value={prompt}
                  readOnly
                  rows={6}
                  dir="ltr"
                  onFocus={(e) => e.currentTarget.select()}
                />
              </div>
            )}
          </div>
        </li>

        <li className="flex gap-3">
          {stepNumber(2)}
          <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
            <h3 className="pt-0.5 font-semibold">{t.scanReview.step2}</h3>
            <p className="max-w-xl text-[15px] text-ink-soft">{t.scanReview.step2Text}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <a
                href={CHAT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center rounded-field border border-line px-4 text-sm font-semibold text-ink transition-colors hover:bg-brand-tint outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                {t.scanReview.openChat}
              </a>
              {pages.map((page, i) =>
                page.url ? (
                  <a
                    key={page.id}
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-brand underline-offset-4 hover:underline"
                  >
                    {fmt(t.scanReview.openPage, { n: i + 1 })}
                  </a>
                ) : null,
              )}
            </div>
          </div>
        </li>

        <li className="flex gap-3">
          {stepNumber(3)}
          <form onSubmit={onSubmit} noValidate className="flex min-w-0 flex-1 flex-col items-start gap-3">
            <h3 className="pt-0.5 font-semibold">{t.scanReview.step3}</h3>
            <div className="w-full">
              <TextArea
                id="scan-answer"
                label={t.scanReview.answerLabel}
                hint={t.scanReview.answerHint}
                error={error ? t.scanReview.pasteErrors[error] : undefined}
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                dir="ltr"
                spellCheck={false}
                className="font-mono text-[13px]"
              />
            </div>
            <Button type="submit" block={false}>
              {t.scanReview.read}
            </Button>
          </form>
        </li>
      </ol>
    </div>
  );
}

// ---------------------------------------------------------------------
// "3 things to check" + a line for each, moving to its field
// ---------------------------------------------------------------------
function Summary({
  review,
  form,
  unreadableParts,
}: {
  review: Review;
  form: RecipeFormState;
  unreadableParts: string;
}) {
  const { t } = useI18n();
  const items = summarizeChecks(review.checks, form);

  const placeName = (place: MarkPlace): string => {
    switch (place.kind) {
      case "field":
        return FIELD_LABEL(t)[place.field];
      case "ingredient":
        return place.name
          ? fmt(t.scanReview.placeIngredientNamed, { n: place.n, name: place.name })
          : fmt(t.scanReview.placeIngredient, { n: place.n });
      case "step":
        return fmt(t.scanReview.placeStep, { n: place.n });
      case "general":
        return t.scanReview.placeGeneral;
    }
  };

  const title =
    items.length === 0
      ? null
      : items.length === 1
        ? t.scanReview.summaryOne
        : fmt(t.scanReview.summaryOther, { n: items.length });

  return (
    <section
      aria-label={title ?? t.scanReview.summaryNone}
      className={`flex flex-col gap-3 rounded-2xl p-5 ${items.length ? "bg-notice-tint" : "bg-brand-tint"}`}
    >
      {title ? (
        <h2 className="text-[17px] font-bold tracking-tight text-notice">{title}</h2>
      ) : (
        <p className="text-[15px] text-ink-soft">{t.scanReview.summaryNone}</p>
      )}
      {(review.continuesOnNextPage || unreadableParts) && (
        <div className="flex flex-col gap-1.5">
          {review.continuesOnNextPage && <CheckNote>{t.scanReview.continues}</CheckNote>}
          {unreadableParts && <CheckNote>{fmt(t.scanReview.unreadableParts, { text: unreadableParts })}</CheckNote>}
        </div>
      )}
      {items.length > 0 && (
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const content = (
              <>
                <span className="font-semibold">{placeName(item.place)}:</span>{" "}
                {reasonText(item.reason, t.scanReview.reasons)}
              </>
            );
            return (
              <li key={item.key}>
                {item.focusId ? (
                  <button
                    type="button"
                    onClick={() => jumpTo(item.focusId!)}
                    className="w-full rounded-field px-2 py-1.5 text-start text-sm leading-snug text-ink transition-colors hover:bg-surface/70 outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  >
                    {content}
                  </button>
                ) : (
                  <p className="px-2 py-1.5 text-sm leading-snug text-ink">{content}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-xs text-ink-soft">{t.scanReview.summaryHint}</p>
    </section>
  );
}

const FIELD_LABEL = (t: ReturnType<typeof useI18n>["t"]) => ({
  kosher_type: t.kosher.label,
  title: t.recipeForm.title,
  page_number: t.recipeForm.page,
  yield_text: t.recipeForm.yield,
  servings: t.recipeForm.servings,
  prep_minutes: t.recipeForm.prep,
  cook_minutes: t.recipeForm.cook,
  total_minutes: t.recipeForm.total,
  notes: t.recipeForm.notes,
  tags: t.recipeForm.sectionTags,
});

// Move to a field of the form: scroll it to the middle and focus it.
// A group of choices (meat/dairy/pareve) focuses its selected or first option.
function jumpTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const target =
    el.tagName === "FIELDSET"
      ? (el.querySelector<HTMLElement>("input:checked") ?? el.querySelector<HTMLElement>("input") ?? el)
      : el;
  el.scrollIntoView({ block: "center", behavior: "smooth" });
  target.focus({ preventScroll: true });
}
