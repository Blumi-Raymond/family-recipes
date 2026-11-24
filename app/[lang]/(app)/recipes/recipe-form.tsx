"use client";
// Add / edit a recipe. All of it is saved in one go (save_recipe in the database).
// The rows logic (headings, empty rows, amounts) lives in lib/recipes/form-state.ts.
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import { PhotoPicker, type PickedPhoto } from "@/components/photo-picker";
import {
  Alert,
  Button,
  ChoiceGroup,
  Chip,
  Field,
  FieldError,
  FormSection,
  Input,
  LinkButton,
  Select,
  TextArea,
} from "@/components/ui";
import { saveRecipe } from "@/lib/actions/recipes";
import type { RecipeDetails } from "@/lib/data/recipes";
import type { Tag } from "@/lib/data/common";
import { useI18n } from "@/lib/i18n/client";
import { dirOf, fmt, localePath } from "@/lib/i18n/config";
import {
  emptyIngredient,
  emptyStep,
  formToInput,
  initialFormState,
  newKey,
  type IngredientRow,
  type RecipeFormState,
  type StepRow,
} from "@/lib/recipes/form-state";
import { MAX_PHOTOS, type KosherType } from "@/lib/recipes/schema";
import { UNIT_SUGGESTIONS } from "@/lib/recipes/units";
import type { FieldErrors, FormErrorKey } from "@/lib/validation";

type Props = {
  recipe: RecipeDetails | null; // null = new recipe
  groupId: string;
  books: { id: string; title: string }[];
  tags: Tag[];
  initialBookId?: string; // new recipe opened from a cookbook
};

export function RecipeForm({ recipe, groupId, books, tags, initialBookId }: Props) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [form, setForm] = useState<RecipeFormState>(() => {
    const state = initialFormState(recipe, locale);
    if (!recipe && initialBookId && books.some((b) => b.id === initialBookId)) {
      state.bookId = initialBookId;
    }
    return state;
  });
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<FormErrorKey | null>(null);
  const [pending, startTransition] = useTransition();
  const [dirty, setDirty] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Content fields follow the RECIPE's language, not the site's
  const dir = dirOf(form.language);
  const lang = form.language;

  const update = (patch: Partial<RecipeFormState>) => {
    setForm((f) => ({ ...f, ...patch }));
    setDirty(true);
  };
  const setPhotos: Dispatch<SetStateAction<PickedPhoto[]>> = (value) => {
    setForm((f) => ({ ...f, photos: typeof value === "function" ? value(f.photos) : value }));
    setDirty(true);
  };
  const err = (key: string) => (errors[key] ? t.formErrors[errors[key]] : undefined);

  // Leaving with unsaved changes: the browser asks "leave site?"
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // After a failed check: move to the first field that needs fixing
  useEffect(() => {
    if (Object.keys(errors).length === 0) return;
    const first = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    first?.focus();
    first?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [errors]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (uploading || pending) return;

    const result = formToInput(form);
    if (!result.ok) {
      setErrors(result.errors);
      setFormError("summary");
      return;
    }
    setErrors({});
    setFormError(null);

    startTransition(async () => {
      const saved = await saveRecipe(result.input);
      if (saved.ok) {
        setDirty(false);
        router.push(localePath(locale, `/recipes/${saved.id}`));
      } else {
        setFormError(saved.error);
        if (saved.fieldErrors) setErrors(saved.fieldErrors);
      }
    });
  }

  const cancelHref = recipe ? localePath(locale, `/recipes/${recipe.id}`) : localePath(locale);

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-7">
      {/* ---------------- Details ---------------- */}
      <FormSection title={t.recipeForm.sectionDetails}>
        <div className="grid gap-[18px] sm:grid-cols-2">
          <ChoiceGroup
            legend={t.kosher.question}
            name="kosher"
            value={form.kosher}
            onChange={(kosher: KosherType) => update({ kosher })}
            error={err("kosher_type")}
            options={[
              { value: "meat", label: t.kosher.meat },
              { value: "dairy", label: t.kosher.dairy },
              { value: "pareve", label: t.kosher.pareve },
            ]}
          />
          <ChoiceGroup
            legend={t.recipeForm.language}
            name="language"
            value={form.language}
            onChange={(language) => update({ language })}
            hint={t.recipeForm.languageHint}
            options={[
              { value: "he", label: t.contentLanguage.he },
              { value: "en", label: t.contentLanguage.en },
            ]}
          />
        </div>
        <Field
          id="title"
          label={t.recipeForm.title}
          value={form.title}
          onChange={(e) => update({ title: e.target.value })}
          error={err("title")}
          dir={dir}
          lang={lang}
          maxLength={200}
          required
        />
        <TextArea
          id="description"
          label={t.recipeForm.description}
          value={form.description}
          onChange={(e) => update({ description: e.target.value })}
          error={err("description")}
          dir={dir}
          lang={lang}
          rows={2}
        />
      </FormSection>

      {/* ---------------- Source ---------------- */}
      <FormSection title={t.recipeForm.sectionSource}>
        <div className="grid gap-[18px] sm:grid-cols-[1fr_8rem]">
          <Select
            id="book"
            label={t.recipeForm.book}
            value={form.bookId}
            onChange={(e) => update({ bookId: e.target.value })}
          >
            <option value="">{t.recipeForm.noBook}</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </Select>
          {form.bookId ? (
            <Field
              id="page"
              label={t.recipeForm.page}
              value={form.page}
              onChange={(e) => update({ page: e.target.value })}
              error={err("page_number")}
              inputMode="numeric"
              dir="ltr"
              className={locale === "he" ? "text-right" : ""}
            />
          ) : null}
        </div>
        {!form.bookId && (
          <Field
            id="sourceNote"
            label={t.recipeForm.sourceNote}
            hint={t.recipeForm.sourceNoteHint}
            value={form.sourceNote}
            onChange={(e) => update({ sourceNote: e.target.value })}
            error={err("source_note")}
            dir={dir}
            lang={lang}
          />
        )}
      </FormSection>

      {/* ---------------- Amount and time ---------------- */}
      <FormSection title={t.recipeForm.sectionAmounts}>
        <div className="grid gap-[18px] sm:grid-cols-2">
          <Field
            id="yield"
            label={t.recipeForm.yield}
            hint={t.recipeForm.yieldHint}
            value={form.yieldText}
            onChange={(e) => update({ yieldText: e.target.value })}
            error={err("yield_text")}
            dir={dir}
            lang={lang}
          />
          <NumberField id="servings" label={t.recipeForm.servings} value={form.servings} error={err("servings")} onChange={(servings) => update({ servings })} />
        </div>
        <div className="grid gap-[18px] sm:grid-cols-3">
          <NumberField id="prep" label={t.recipeForm.prep} value={form.prep} error={err("prep_minutes")} onChange={(prep) => update({ prep })} />
          <NumberField id="cook" label={t.recipeForm.cook} value={form.cook} error={err("cook_minutes")} onChange={(cook) => update({ cook })} />
          <NumberField id="total" label={t.recipeForm.total} value={form.total} error={err("total_minutes")} onChange={(total) => update({ total })} />
        </div>
      </FormSection>

      {/* ---------------- Ingredients ---------------- */}
      <FormSection title={t.recipeForm.sectionIngredients}>
        <IngredientList
          rows={form.ingredients}
          setRows={(ingredients) => update({ ingredients })}
          errors={errors}
          dir={dir}
          lang={lang}
        />
        {err("ingredients") && <FieldError>{err("ingredients")}</FieldError>}
      </FormSection>

      {/* ---------------- Steps ---------------- */}
      <FormSection title={t.recipeForm.sectionSteps}>
        <StepList
          rows={form.steps}
          setRows={(steps) => update({ steps })}
          errors={errors}
          dir={dir}
          lang={lang}
        />
        {err("steps") && <FieldError>{err("steps")}</FieldError>}
      </FormSection>

      {/* ---------------- Notes ---------------- */}
      <FormSection title={t.recipeForm.sectionNotes}>
        <TextArea
          id="notes"
          label={t.recipeForm.notes}
          value={form.notes}
          onChange={(e) => update({ notes: e.target.value })}
          error={err("notes")}
          dir={dir}
          lang={lang}
          rows={3}
        />
      </FormSection>

      {/* ---------------- Tags ---------------- */}
      <FormSection title={t.recipeForm.sectionTags}>
        <TagPicker
          tags={tags}
          selected={form.tagIds}
          onChange={(tagIds) => update({ tagIds })}
        />
      </FormSection>

      {/* ---------------- Photos ---------------- */}
      <FormSection title={t.recipeForm.sectionPhotos}>
        <PhotoPicker
          label={fmt(t.images.max, { max: MAX_PHOTOS })}
          groupId={groupId}
          folder="recipes"
          photos={form.photos}
          setPhotos={setPhotos}
          max={MAX_PHOTOS}
          onBusyChange={setUploading}
        />
        {err("photos") && <FieldError>{err("photos")}</FieldError>}
      </FormSection>

      {/* ---------------- Save ---------------- */}
      <div className="sticky bottom-0 -mx-6 flex flex-col gap-3 border-t border-line bg-surface/95 px-6 py-4 backdrop-blur">
        {formError && <Alert>{t.formErrors[formError]}</Alert>}
        {uploading && <p className="text-sm text-ink-soft">{t.images.waitForUpload}</p>}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" block={false} disabled={pending || uploading}>
            {pending ? t.common.saving : t.recipeForm.save}
          </Button>
          <LinkButton href={cancelHref} variant="secondary" size="md">
            {t.common.cancel}
          </LinkButton>
        </div>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------
// Small parts
// ---------------------------------------------------------------------

function NumberField({
  id,
  label,
  value,
  error,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const { locale } = useI18n();
  return (
    <Field
      id={id}
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={error}
      inputMode="numeric"
      dir="ltr"
      className={locale === "he" ? "text-right" : ""}
    />
  );
}

// Move / remove buttons at the end of a row
function RowActions({
  index,
  count,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
}) {
  const { t } = useI18n();
  const button =
    "flex h-11 w-9 items-center justify-center rounded-field text-ink-faint transition-colors " +
    "hover:bg-brand-tint hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent " +
    "outline-none focus-visible:ring-2 focus-visible:ring-brand/40";
  const icon = (d: string) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
  return (
    <div className="flex shrink-0 items-center">
      <button type="button" className={button} aria-label={t.recipeForm.moveUp} disabled={index === 0} onClick={() => onMove(index, index - 1)}>
        {icon("M12 19V5M6 11l6-6 6 6")}
      </button>
      <button type="button" className={button} aria-label={t.recipeForm.moveDown} disabled={index === count - 1} onClick={() => onMove(index, index + 1)}>
        {icon("M12 5v14M6 13l6 6 6-6")}
      </button>
      <button type="button" className={`${button} hover:text-danger`} aria-label={t.recipeForm.remove} onClick={onRemove}>
        {icon("M6 6l12 12M18 6L6 18")}
      </button>
    </div>
  );
}

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function AddButtons({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

// Focus the first input of a row that was just added
function useFocusNewRow() {
  const pending = useRef<string | null>(null);
  useEffect(() => {
    if (!pending.current) return;
    document.getElementById(pending.current)?.focus();
    pending.current = null;
  });
  return (id: string) => {
    pending.current = id;
  };
}

// ---------------------------------------------------------------------
// Ingredients
// ---------------------------------------------------------------------
function IngredientList({
  rows,
  setRows,
  errors,
  dir,
  lang,
}: {
  rows: IngredientRow[];
  setRows: (rows: IngredientRow[]) => void;
  errors: FieldErrors;
  dir: "rtl" | "ltr";
  lang: "he" | "en";
}) {
  const { t } = useI18n();
  const unitsId = useId();
  const focusLater = useFocusNewRow();
  const units = UNIT_SUGGESTIONS[lang];

  const change = (key: string, patch: Partial<IngredientRow>) =>
    setRows(rows.map((r) => (r.key === key ? ({ ...r, ...patch } as IngredientRow) : r)));
  const remove = (key: string) => setRows(rows.filter((r) => r.key !== key));
  const add = (kind: "item" | "heading") => {
    const key = newKey();
    setRows([...rows, kind === "item" ? emptyIngredient(key) : { key, kind: "heading", text: "" }]);
    focusLater(kind === "item" ? `ing-${key}-quantity` : `ing-${key}-heading`);
  };
  const error = (key: string, field: string) => {
    const e = errors[`ingredient.${key}.${field}`];
    return e ? t.formErrors[e] : undefined;
  };

  return (
    <div className="flex flex-col gap-3" dir={dir} lang={lang}>
      <datalist id={unitsId}>
        {units.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>

      {/* Column titles (wide screens). On phones each field shows its name inside. */}
      <div
        aria-hidden="true"
        className="hidden gap-2 text-[13px] font-medium text-ink sm:grid sm:grid-cols-[5.5rem_6.5rem_minmax(0,1fr)_9rem_5.5rem_7rem]"
      >
        <span>{t.recipeForm.quantity}</span>
        <span>{t.recipeForm.unit}</span>
        <span>{t.recipeForm.ingredient}</span>
        <span>{t.recipeForm.note}</span>
        <span>{t.recipeForm.optional}</span>
        <span />
      </div>

      <ul className="flex flex-col gap-3 sm:gap-2">
        {rows.map((row, index) => {
          const actions = (
            <RowActions
              index={index}
              count={rows.length}
              onMove={(from, to) => setRows(move(rows, from, to))}
              onRemove={() => remove(row.key)}
            />
          );

          if (row.kind === "heading") {
            return (
              <li key={row.key} className="flex items-center gap-2 pt-2">
                <Input
                  id={`ing-${row.key}-heading`}
                  aria-label={t.recipeForm.heading}
                  placeholder={t.recipeForm.headingPlaceholder}
                  value={row.text}
                  onChange={(e) => change(row.key, { text: e.target.value })}
                  className="flex-1 font-semibold"
                />
                {actions}
              </li>
            );
          }

          const qtyError = error(row.key, "quantity");
          const nameError = error(row.key, "name");
          return (
            <li key={row.key} className="flex flex-col gap-1 border-b border-line pb-3 sm:border-0 sm:pb-0">
              <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2 sm:grid-cols-[5.5rem_6.5rem_minmax(0,1fr)_9rem_5.5rem_7rem] sm:items-center">
                <Input
                  id={`ing-${row.key}-quantity`}
                  aria-label={t.recipeForm.quantity}
                  placeholder={t.recipeForm.quantity}
                  value={row.quantity}
                  onChange={(e) => change(row.key, { quantity: e.target.value })}
                  invalid={Boolean(qtyError)}
                  inputMode="decimal"
                  dir="ltr"
                  className="text-center"
                />
                <Input
                  aria-label={t.recipeForm.unit}
                  placeholder={t.recipeForm.unit}
                  value={row.unit}
                  onChange={(e) => change(row.key, { unit: e.target.value })}
                  list={unitsId}
                />
                <Input
                  aria-label={t.recipeForm.ingredient}
                  placeholder={t.recipeForm.ingredient}
                  value={row.name}
                  onChange={(e) => change(row.key, { name: e.target.value })}
                  invalid={Boolean(nameError)}
                  className="col-span-2 sm:col-span-1"
                />
                <Input
                  aria-label={t.recipeForm.note}
                  placeholder={t.recipeForm.notePlaceholder}
                  value={row.note}
                  onChange={(e) => change(row.key, { note: e.target.value })}
                  className="col-span-2 sm:col-span-1"
                />
                <label className="flex h-11 items-center gap-2 text-sm text-ink-soft">
                  <input
                    type="checkbox"
                    checked={row.optional}
                    onChange={(e) => change(row.key, { optional: e.target.checked })}
                    className="size-4 accent-brand"
                  />
                  <span className="sm:sr-only">{t.recipeForm.optional}</span>
                </label>
                <div className="justify-self-end">{actions}</div>
              </div>
              {(qtyError || nameError) && <FieldError>{qtyError ?? nameError}</FieldError>}
            </li>
          );
        })}
      </ul>

      <AddButtons>
        <Button variant="secondary" size="sm" block={false} onClick={() => add("item")}>
          + {t.recipeForm.addIngredient}
        </Button>
        <Button variant="secondary" size="sm" block={false} onClick={() => add("heading")}>
          + {t.recipeForm.addHeading}
        </Button>
      </AddButtons>
    </div>
  );
}

// ---------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------
function StepList({
  rows,
  setRows,
  errors,
  dir,
  lang,
}: {
  rows: StepRow[];
  setRows: (rows: StepRow[]) => void;
  errors: FieldErrors;
  dir: "rtl" | "ltr";
  lang: "he" | "en";
}) {
  const { t } = useI18n();
  const focusLater = useFocusNewRow();

  const change = (key: string, text: string) =>
    setRows(rows.map((r) => (r.key === key ? { ...r, text } : r)));
  const add = (kind: "item" | "heading") => {
    const key = newKey();
    setRows([...rows, kind === "item" ? emptyStep(key) : { key, kind: "heading", text: "" }]);
    focusLater(`step-${key}`);
  };

  // Step numbers skip the headings: 1, 2, [heading], 3...
  const numbers = new Map<string, number>();
  rows.filter((r) => r.kind === "item").forEach((r, i) => numbers.set(r.key, i + 1));

  return (
    <div className="flex flex-col gap-3" dir={dir} lang={lang}>
      <ul className="flex flex-col gap-3">
        {rows.map((row, index) => {
          const actions = (
            <RowActions
              index={index}
              count={rows.length}
              onMove={(from, to) => setRows(move(rows, from, to))}
              onRemove={() => setRows(rows.filter((r) => r.key !== row.key))}
            />
          );
          if (row.kind === "heading") {
            return (
              <li key={row.key} className="flex items-center gap-2 pt-2">
                <Input
                  id={`step-${row.key}`}
                  aria-label={t.recipeForm.heading}
                  placeholder={t.recipeForm.headingPlaceholder}
                  value={row.text}
                  onChange={(e) => change(row.key, e.target.value)}
                  className="flex-1 font-semibold"
                />
                {actions}
              </li>
            );
          }
          const number = numbers.get(row.key) ?? 0;
          const label = fmt(t.recipeForm.step, { n: number });
          const error = errors[`step.${row.key}`];
          return (
            <li key={row.key} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-2.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-tint text-sm font-semibold text-brand-dark"
              >
                {number}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <TextArea
                  id={`step-${row.key}`}
                  aria-label={label}
                  value={row.text}
                  onChange={(e) => change(row.key, e.target.value)}
                  error={error ? t.formErrors[error] : undefined}
                  rows={2}
                />
              </div>
              {actions}
            </li>
          );
        })}
      </ul>
      <AddButtons>
        <Button variant="secondary" size="sm" block={false} onClick={() => add("item")}>
          + {t.recipeForm.addStep}
        </Button>
        <Button variant="secondary" size="sm" block={false} onClick={() => add("heading")}>
          + {t.recipeForm.addHeading}
        </Button>
      </AddButtons>
    </div>
  );
}

// ---------------------------------------------------------------------
// Tags, grouped by category
// ---------------------------------------------------------------------
function TagPicker({
  tags,
  selected,
  onChange,
}: {
  tags: Tag[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const { locale, t } = useI18n();
  if (tags.length === 0) return <p className="text-sm text-ink-soft">{t.recipeForm.noTags}</p>;

  const categories = (["protein", "dish", "occasion", "other"] as const).filter((c) =>
    tags.some((tag) => tag.category === c),
  );
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  return (
    <div className="flex flex-col gap-4">
      {categories.map((category) => (
        <div key={category} className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-ink">{t.tagCategories[category]}</span>
          <div className="flex flex-wrap gap-2">
            {tags
              .filter((tag) => tag.category === category)
              .map((tag) => (
                <Chip key={tag.id} selected={selected.includes(tag.id)} onClick={() => toggle(tag.id)}>
                  {locale === "he" ? tag.name_he : tag.name_en}
                </Chip>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
