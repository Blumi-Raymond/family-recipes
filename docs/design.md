# Design guide — "olive" (design A1)

Chosen 24.11.2026. Every screen on the site follows this guide.
Source of truth for colors: `app/globals.css` (`@theme`).
Building blocks: `components/ui.tsx` (Button, Field, Alert, Divider, Logo).

## Look
- Clean and minimal: lots of white space, few colors, no gradients, no shadows-on-everything, no emoji in the UI.
- Hebrew, right-to-left. Font: **Heebo** (loaded in `app/layout.tsx`).
- One accent color (olive green). Everything else is ink on white or on the soft tint.

## Colors (Tailwind names)
| Name | Hex | Use |
|---|---|---|
| `brand` | #3F5D3A | primary buttons, links, icons, focus |
| `brand-dark` | #2F4A2B | hover on brand |
| `brand-tint` | #EEF2EA | side panels, soft boxes, chips |
| `ink` | #1C2419 | main text |
| `ink-soft` | #55604F | secondary text |
| `ink-faint` | #7A8574 | placeholders, hints |
| `line` | #DCE3D6 | borders, dividers |
| `surface` | #FFFFFF | page background |
| `danger` / `danger-tint` | #A3302A / #FBEDEC | errors |

Do not add new colors without updating this table and `globals.css`.

## Type
- Page title: 34px bold, tight tracking (`text-[34px] font-bold tracking-tight`).
- Big marketing line (auth panel only): 56–60px extra-bold.
- Body 15px; labels 13px medium; hints 12px.

## Shapes & spacing
- Inputs and buttons: 48px high, radius 10px (`rounded-field`).
- Cards / boxes: radius 16px (`rounded-2xl`), `bg-brand-tint` or white with `border-line`.
- Forms: max width ~380px, 18px between fields, 28px between sections.
- Page content: `max-w-5xl` with 24px side padding.

## Components
- Primary action = `<Button>` (brand). Secondary = `<Button variant="secondary">` (white with border).
- Every input = `<Field label=...>` (always a visible label).
- Errors/success = `<Alert>`; keep text short and human ("הסיסמה שגויה.").
- Icons: thin outline (stroke 1.6–1.8), brand color, inline SVG.
- Text uses feminine Hebrew forms (the users are women in the family), e.g. "התחברי".
