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
| `notice` / `notice-tint` | #845511 / #FBF3E4 | "worth checking" marks on a scanned draft — something to look at, not an error |

Do not add new colors without updating this table and `globals.css`.

## Type
- Page title: 34px bold, tight tracking (`text-[34px] font-bold tracking-tight`).
- Big marketing line (auth panel only): 56–60px extra-bold.
- Body 15px; labels 13px medium; hints 12px.

## Shapes & spacing
- Inputs and buttons: 48px high, radius 10px (`rounded-field`).
- Cards / boxes: radius 16px (`rounded-2xl`), `bg-brand-tint` or white with `border-line`.
- Forms: max width ~380px, 18px between fields, 28px between sections.
- Page content: `max-w-5xl` with 24px side padding. A screen that needs more room (the scan review: form + page photo
  side by side) puts `data-wide` on an element, and the frame widens to `max-w-7xl` (`app/[lang]/(app)/layout.tsx`, CSS `:has`).
- The recipe form follows its **own** width, not the window's (container queries: `@container` on the form,
  `@xl:` / `@2xl:` inside), so it also works in the narrower column next to a photo.

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
- Recipe page photos for scanning (1–4, in reading order, high resolution) = `<PagePicker>` (`components/page-picker.tsx`):
  portrait tiles (3:4) numbered "עמוד 1", with text actions להקדים / לדחות / הסרה.
- "Worth checking" under a field (a scanned draft) = `<CheckNote>` — amber `notice` color, outline "!" icon. Not an
  error (errors stay red). `tone="info"` = a neutral note in `ink-soft` (e.g. "why dairy", "corrected by hand").
  A list of what to check = a `bg-notice-tint` box at the top; each line moves to its field.
- "Are you sure?" = `<ConfirmButton>` (`components/confirm-button.tsx`) — in place, no browser pop-ups; focus starts on "No".
- Loading = soft `bg-brand-tint` shapes with `animate-pulse` (`components/skeletons.tsx`).
- Icons: thin outline (stroke 1.6–1.8), brand color, inline SVG.
- Header on small phones (≤440px): "מתכון חדש" shrinks to "+" and "סריקה" to a camera icon (the text stays for screen
  readers). Checked at 320–1280px in both languages — re-check when adding a link.
- "Continue where you stopped" (scan screen) = a `bg-brand-tint` box above the form; each scan is a white rounded row with
  the unsaved recipe names, a short grey line (how many left · book · date), "להמשך" and "הסרה מהרשימה" (`<ConfirmButton>`).
- Scan review screen: the form on the start side, the page photo (sticky, page tabs, zoom, open full size) on the end
  side from 1280px; below that the photo sits above the form.
- Recipe page: from 1024px the recipe sits on the start side (right in Hebrew) and the photos on the end side, sticky
  (`data-wide`). Below that, the photos are on top. In the recipe column: labels + "עריכה" on one row, title (40px when the
  column is wide), a line of amount and times between two thin lines, then ingredients (a `bg-brand-tint` box) beside the
  numbered method when the column is wide enough (`@container` / `@2xl`), else one under the other. "העברה לסל" at the end.
- Recipe photos = `<RecipeGallery>` (`components/recipe-gallery.tsx`): one big photo, small ones underneath (the chosen
  one has a brand ring). A click on a small one shows it big — only for now, the main photo doesn't change. A click on the
  big one opens it over the page (dark background, previous/next, arrow keys, Escape). The scanned cookbook pages come
  last, shown whole (`object-contain`), with a caption.
- Text uses feminine Hebrew forms (the users are women in the family), e.g. "התחברי".

## Two languages
- The interface language is the first part of the URL (`/he/...`, `/en/...`). All text comes from
  `lib/i18n/dictionaries/he.ts` (source) and `en.ts` (must match). Never write UI text in a component.
- Use logical CSS (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`) so layouts flip by themselves.
- Recipe and cookbook **content** keeps its own language: put `lang` and `dir={dirOf(language)}` on it
  (an English recipe reads left-to-right on the Hebrew site, and the other way round).
