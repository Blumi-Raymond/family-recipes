// Shared UI building blocks in the site's design (docs/design.md).
// Build new screens from these instead of styling from scratch.
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2";

// ---------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------
type ButtonVariant = "primary" | "secondary" | "danger";
type ButtonSize = "md" | "sm";

const buttonLook: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  secondary: "border border-line bg-surface text-ink hover:bg-brand-tint",
  danger: "border border-line bg-surface text-danger hover:bg-danger-tint",
};

// Shared by <Button> and <LinkButton>
function buttonClass(variant: ButtonVariant, size: ButtonSize, block: boolean, extra: string) {
  return (
    `inline-flex shrink-0 items-center justify-center gap-2.5 rounded-field font-semibold transition-colors ` +
    `disabled:cursor-wait disabled:opacity-60 ${focusRing} ${buttonLook[variant]} ` +
    (size === "md" ? "h-12 px-5 text-[15px] " : "h-10 px-4 text-sm ") +
    (block ? "w-full " : "") +
    extra
  );
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean; // full width (forms). false = as wide as the text
};

export function Button({
  variant = "primary",
  size = "md",
  block = true,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={buttonClass(variant, size, block, className)} {...props} />
  );
}

// A link that looks like a button (e.g. "New recipe", "Edit")
export function LinkButton({
  variant = "primary",
  size = "sm",
  block = false,
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize; block?: boolean }) {
  return <Link className={buttonClass(variant, size, block, className)} {...props} />;
}

// ---------------------------------------------------------------------
// Text field: label + input (+ optional hint)
// ---------------------------------------------------------------------
const inputLook =
  "rounded-field border bg-surface px-3.5 text-[15px] text-ink placeholder:text-ink-faint " +
  "transition-colors outline-none focus:border-brand focus:ring-1 focus:ring-brand " +
  "disabled:bg-brand-tint disabled:text-ink-soft";

function Label({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink">
      {children}
    </label>
  );
}

// Small text under a field: a hint, or (in red) what needs fixing
function Hint({ id, error, children }: { id?: string; error?: boolean; children: ReactNode }) {
  return (
    <p id={id} className={`text-xs ${error ? "font-medium text-danger" : "text-ink-faint"}`}>
      {children}
    </p>
  );
}

// Text under a list row (ingredients, steps) explaining what to fix
export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <Hint id={id} error>
      {children}
    </Hint>
  );
}

type FieldProps = ComponentProps<"input"> & {
  label: string;
  hint?: string;
  invalid?: boolean;
  error?: string; // shown instead of the hint, in red
};

export function Field({ label, hint, invalid, error, id, className = "", ...props }: FieldProps) {
  const note = error ?? hint;
  const bad = invalid || Boolean(error);
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        aria-invalid={bad || undefined}
        aria-describedby={note && id ? `${id}-hint` : undefined}
        className={`h-12 ${inputLook} ${bad ? "border-danger" : "border-line"} ${className}`}
        {...props}
      />
      {note && (
        <Hint id={id ? `${id}-hint` : undefined} error={Boolean(error)}>
          {note}
        </Hint>
      )}
    </div>
  );
}

// Input without its own label, for rows in a list (ingredients, steps).
// Always pass aria-label, and show a visible column title above the list.
export function Input({
  invalid,
  className = "",
  ...props
}: ComponentProps<"input"> & { invalid?: boolean }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={`h-11 min-w-0 ${inputLook} ${invalid ? "border-danger" : "border-line"} ${className}`}
      {...props}
    />
  );
}

// Multi-line text: label + textarea (+ optional hint)
export function TextArea({
  label,
  hint,
  invalid,
  error,
  id,
  className = "",
  rows = 3,
  ...props
}: ComponentProps<"textarea"> & { label?: string; hint?: string; invalid?: boolean; error?: string }) {
  const note = error ?? hint;
  const bad = invalid || Boolean(error);
  return (
    <div className="flex flex-col gap-1.5">
      {label && <Label htmlFor={id}>{label}</Label>}
      <textarea
        id={id}
        rows={rows}
        aria-invalid={bad || undefined}
        aria-describedby={note && id ? `${id}-hint` : undefined}
        className={`py-3 leading-relaxed ${inputLook} ${bad ? "border-danger" : "border-line"} ${className}`}
        {...props}
      />
      {note && (
        <Hint id={id ? `${id}-hint` : undefined} error={Boolean(error)}>
          {note}
        </Hint>
      )}
    </div>
  );
}

// Drop-down list: label + select
export function Select({
  label,
  hint,
  id,
  className = "",
  children,
  ...props
}: ComponentProps<"select"> & { label: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select id={id} className={`h-12 border-line ${inputLook} ${className}`} {...props}>
        {children}
      </select>
      {hint && <Hint>{hint}</Hint>}
    </div>
  );
}

// One choice out of a few, shown as side-by-side buttons
// (e.g. meat / dairy / pareve). Works like radio buttons.
export function ChoiceGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  hint,
  error,
}: {
  legend: string;
  name: string;
  options: { value: T; label: string }[];
  value: T | "";
  onChange: (value: T) => void;
  hint?: string;
  error?: string;
}) {
  const invalid = Boolean(error);
  return (
    <fieldset className="flex flex-col gap-1.5" aria-invalid={invalid || undefined}>
      <legend className="mb-1.5 text-[13px] font-medium text-ink">{legend}</legend>
      <div
        className={`grid gap-1 rounded-field border p-1 ${invalid ? "border-danger" : "border-line"}`}
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((o) => (
          <label
            key={o.value}
            className={
              "flex h-10 cursor-pointer items-center justify-center rounded-[7px] px-2 text-[15px] transition-colors " +
              "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40 " +
              (value === o.value
                ? "bg-brand font-semibold text-white"
                : "text-ink-soft hover:bg-brand-tint hover:text-ink")
            }
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
      {(error ?? hint) && <Hint error={invalid}>{error ?? hint}</Hint>}
    </fieldset>
  );
}

// A small rounded label. With onClick it becomes an on/off toggle.
export function Chip({
  selected = false,
  className = "",
  children,
  ...props
}: ComponentProps<"button"> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={
        `inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors ${focusRing} ` +
        (selected
          ? "border-brand bg-brand text-white"
          : "border-line bg-surface text-ink-soft hover:bg-brand-tint hover:text-ink") +
        ` ${className}`
      }
      {...props}
    >
      {children}
    </button>
  );
}

// Read-only label (e.g. a tag on a recipe page)
export function Badge({ children, tone = "soft" }: { children: ReactNode; tone?: "soft" | "brand" }) {
  return (
    <span
      className={
        "inline-flex h-7 items-center rounded-full px-3 text-[13px] font-medium " +
        (tone === "brand" ? "bg-brand text-white" : "bg-brand-tint text-brand-dark")
      }
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------
export function Alert({
  tone = "error",
  children,
}: {
  tone?: "error" | "success";
  children: ReactNode;
}) {
  const look =
    tone === "error" ? "bg-danger-tint text-danger" : "bg-brand-tint text-brand-dark";
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-field px-4 py-3 text-sm leading-relaxed ${look}`}
    >
      {children}
    </div>
  );
}

// Page title row: title (+ subtitle) on one side, actions on the other
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-2">
        <h1 className="text-[34px] font-bold leading-tight tracking-tight">{title}</h1>
        {subtitle && <p className="text-[15px] text-ink-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// Soft box shown when a list is empty
export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl bg-brand-tint p-8">
      <p className="text-[17px] font-semibold">{title}</p>
      {text && <p className="max-w-md text-[15px] text-ink-soft">{text}</p>}
      {action}
    </div>
  );
}

// A form section: small title + content, 28px apart from the next one
export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-[18px] border-t border-line pt-7 first:border-t-0 first:pt-0">
      <h2 className="text-[17px] font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

// "———— או ————"
export function Divider({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3.5 text-[13px] text-ink-faint">
      <span className="h-px flex-1 bg-line" />
      {children}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

// ---------------------------------------------------------------------
// Logo (pot icon + site name, in the page's language)
// ---------------------------------------------------------------------
export function Logo({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-brand"
        aria-hidden="true"
      >
        <path d="M4 11h16v2a7 7 0 0 1-7 7h-2a7 7 0 0 1-7-7v-2z" />
        <path d="M2 11h20" />
        <path d="M9 7c0-1.5 1-1.5 1-3" />
        <path d="M13 7c0-1.5 1-1.5 1-3" />
      </svg>
      <span className="text-[17px] font-bold tracking-tight">{name}</span>
    </div>
  );
}

export function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 2.9-2.2 5.4-4.7 7.1l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C.9 16.6 0 20.2 0 24s.9 7.4 2.6 10.7l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
    </svg>
  );
}
