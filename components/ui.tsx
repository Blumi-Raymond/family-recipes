// Shared UI building blocks in the site's design (docs/design.md).
// Build new screens from these instead of styling from scratch.
import type { ComponentProps, ReactNode } from "react";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2";

// ---------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------
type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary";
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const look =
    variant === "primary"
      ? "bg-brand text-white hover:bg-brand-dark"
      : "border border-line bg-surface text-ink hover:bg-brand-tint";
  return (
    <button
      className={
        `flex h-12 w-full items-center justify-center gap-2.5 rounded-field px-5 text-[15px] font-semibold transition-colors ` +
        `disabled:cursor-wait disabled:opacity-60 ${focusRing} ${look} ${className}`
      }
      {...props}
    />
  );
}

// ---------------------------------------------------------------------
// Text field: label + input (+ optional hint)
// ---------------------------------------------------------------------
type FieldProps = ComponentProps<"input"> & {
  label: string;
  hint?: string;
  invalid?: boolean;
};

export function Field({ label, hint, invalid, id, className = "", ...props }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={invalid || undefined}
        className={
          `h-12 rounded-field border bg-surface px-3.5 text-[15px] text-ink placeholder:text-ink-faint ` +
          `transition-colors focus:border-brand focus:ring-1 focus:ring-brand outline-none ` +
          `${invalid ? "border-danger" : "border-line"} ${className}`
        }
        {...props}
      />
      {hint && <p className="text-xs text-ink-faint">{hint}</p>}
    </div>
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
// Logo (pot icon + name)
// ---------------------------------------------------------------------
export function Logo() {
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
      <span className="text-[17px] font-bold tracking-tight">מתכונים משפחתיים</span>
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
