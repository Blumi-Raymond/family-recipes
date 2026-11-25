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
- One frame width on every page: `max-w-7xl`, 24px side padding (16px on phones). The header never moves between pages
  (it used to widen for some screens — that was a visible jump). Narrow content (forms) sits on the start side.
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
- Recipes waiting for review (scanned, not saved yet): their own page `/scan/waiting`. Each scan is a rounded row with a
  small picture of the first page (3:4), the recipe names, a grey line (book · date), "לבדיקה" and "הסרה מהרשימה"
  (`<ConfirmButton>`). The menu shows the number as a small brand pill after "סריקה"; the scan screen shows one button
  ("3 מתכונים מחכים לאישור") in its title row — never a long list above the form.
- Scan review screen: the form on the start side, the page photo (sticky, page tabs, zoom, open full size) on the end
  side from 1280px; below that the photo sits above the form.
- Recipe page: from 1024px the recipe sits on the start side (right in Hebrew) and the photos on the end side, sticky
  Below that, the photos are on top. A recipe without photos stays within `max-w-5xl`. In the recipe column: labels + "עריכה" on one row, title (40px when the
  column is wide), a line of amount and times between two thin lines, then ingredients (a `bg-brand-tint` box) beside the
  numbered method when the column is wide enough (`@container` / `@2xl`), else one under the other. "העברה לסל" at the end.
- Recipe photos = `<RecipeGallery>` (`components/recipe-gallery.tsx`): one big photo, small ones underneath (the chosen
  one has a brand ring). A click on a small one shows it big — only for now, the main photo doesn't change. A click on the
  big one opens it over the page (dark background, previous/next, arrow keys, Escape). The scanned cookbook pages come
  last, shown whole (`object-contain`), with a caption.
- Recipe form, when it is wide (`@5xl`, a full page on a computer): the recipe itself (details, ingredients, method, notes)
  in the main column; source, amount and time, labels and photos in a 22rem side column (its own `@container`). Narrower
  (phone, or beside the page photo when scanning): one column in that order.
- **Nothing moves by itself.** Something that appears or disappears depending on a choice takes a fixed place:
  - a field that depends on another (book -> "page", no book -> "other source") swaps in the same slot, same height
    (hints as placeholders there);
  - an action that is only sometimes available ("ניקוי הסינון") stays in place, `invisible` when not needed;
  - status text while uploading goes inside the button ("התמונות עולות..."), not as an extra line;
  - things that load late go where they don't push content (title row actions, a pill after a menu link).
  Errors after "save" may add a line under a field — that's expected. Check new screens for jumps (layout shift = 0).
- Text uses feminine Hebrew forms (the users are women in the family), e.g. "התחברי".

## Two languages
- The interface language is the first part of the URL (`/he/...`, `/en/...`). All text comes from
  `lib/i18n/dictionaries/he.ts` (source) and `en.ts` (must match). Never write UI text in a component.
- Use logical CSS (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`) so layouts flip by themselves.
- Recipe and cookbook **content** keeps its own language: put `lang` and `dir={dirOf(language)}` on it
  (an English recipe reads left-to-right on the Hebrew site, and the other way round).
