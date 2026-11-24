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
All in `components/ui.tsx` unless noted. Build screens from these.
- Primary action = `<Button>` (brand). Secondary = `variant="secondary"`. Destructive = `variant="danger"`.
  `size="sm"` (40px) for actions inside a page; `block={false}` when it shouldn't fill the width.
- A link that looks like a button = `<LinkButton>`.
- Every input = `<Field label=...>` / `<TextArea>` / `<Select>` (always a visible label).
  Errors: pass `error="..."` — the field turns red and the message replaces the hint.
- Rows in a list (ingredients, steps) = `<Input aria-label=...>` under visible column titles, `<FieldError>` under the row.
- One choice out of a few (meat/dairy/pareve, language) = `<ChoiceGroup>`.
- On/off filters and tags = `<Chip selected>`. Read-only label = `<Badge>` (`tone="brand"` for meat/dairy/pareve).
- Page title row = `<PageHeader title actions>`. Empty list = `<EmptyState>`. Form part = `<FormSection title>`.
- Errors/success = `<Alert>`; keep text short and human ("הסיסמה שגויה.").
- Images = `<Photo>` (`components/photo.tsx`, soft placeholder when missing); uploading = `<PhotoPicker>`.
- "Are you sure?" = `<ConfirmButton>` (`components/confirm-button.tsx`) — in place, no browser pop-ups; focus starts on "No".
- Loading = soft `bg-brand-tint` shapes with `animate-pulse` (`components/skeletons.tsx`).
- Icons: thin outline (stroke 1.6–1.8), brand color, inline SVG.
- Text uses feminine Hebrew forms (the users are women in the family), e.g. "התחברי".

## Two languages
- The interface language is the first part of the URL (`/he/...`, `/en/...`). All text comes from
  `lib/i18n/dictionaries/he.ts` (source) and `en.ts` (must match). Never write UI text in a component.
- Use logical CSS (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`) so layouts flip by themselves.
- Recipe and cookbook **content** keeps its own language: put `lang` and `dir={dirOf(language)}` on it
  (an English recipe reads left-to-right on the Hebrew site, and the other way round).
