# Anvukta Consulting Service — Design System

> Extracted from the supplied visual references (deep-navy editorial consulting layout,
> serif display type, hairline rules, circular arrow CTAs, bracket eyebrow marks,
> alternating light/dark section rhythm) and re-expressed as an **original** Anvukta identity.
> No reference logo, wordmark, copy, illustration or branded artwork is reproduced.

---

## 1. Design intent

| Attribute | Decision |
| --- | --- |
| Mood | Elegant, quiet, precise, editorial, executive |
| Reading model | Long-form editorial page, not a SaaS marketing page |
| Section rhythm | One idea per section; alternate light paper → warm paper → dark ink → light |
| Density | Generous whitespace; type does the work, not decoration |
| Colour use | Restrained. Brass accent appears in small quantities only |
| Corners | Square. Only circular controls and pills are rounded |
| Shadows | None on cards. Depth comes from hairlines and ground colour |
| Motion | Subtle reveal + hairline/colour transitions only; fully disabled under `prefers-reduced-motion` |

### Divergence from the reference

The references are blue-on-blue with a cool grey neutral. Anvukta uses **deep ink navy +
warm paper + a restrained brass accent**. This keeps the extracted *structure* (grid, rhythm,
type hierarchy, motifs) while giving Anvukta a distinct, ownable identity.

---

## 2. Colour tokens

Defined in `src/styles/globals.css` under `@theme`.

### Ground

| Token | Value | Use |
| --- | --- | --- |
| `--color-paper` | `#FFFFFF` | Default page ground |
| `--color-paper-warm` | `#F5F3EF` | Alternating section ground, cards on white |
| `--color-paper-warm-2` | `#EDEAE3` | Nested surface, input fill |
| `--color-ink` | `#0A1721` | Dark sections, hero, footer |
| `--color-ink-raised` | `#102A3C` | Cards / panels on an ink ground |

### Text

| Token | Value | On | Contrast |
| --- | --- | --- | --- |
| `--color-text` | `#0A1721` | paper | 17.4:1 |
| `--color-text-muted` | `#485C6B` | paper | 6.9:1 |
| `--color-text-invert` | `#F7F5F1` | ink | 16.6:1 |
| `--color-text-invert-muted` | `#B7C4CE` | ink | 8.9:1 |

### Line

| Token | Value | Use |
| --- | --- | --- |
| `--color-line` | `#E2DED6` | Hairline on paper |
| `--color-line-strong` | `#C8C2B6` | Emphasised hairline |
| `--color-line-invert` | `#27404F` | Hairline on ink |

### Accent (brass)

| Token | Value | Use | Contrast |
| --- | --- | --- | --- |
| `--color-accent` | `#B07A2F` | Rules, marks, graphics, fills | 3.6:1 (non-text UI) |
| `--color-accent-text` | `#835718` | Accent **text** and links on paper | 6.1:1 |
| `--color-accent-invert` | `#DFAE63` | Accent on ink ground | 8.6:1 |

### State

`--color-success #1F6B4A` · `--color-danger #A32B22` · `--color-warning #8A5E1F`

Each is always paired with a text label — never colour alone.

---

## 3. Typography

Two families, both variable, both self-hosted at build time via `next/font/google`
(subset `latin`, `display: swap`, preloaded).

| Role | Family | Notes |
| --- | --- | --- |
| Display / headings | **Source Serif 4** | Transitional serif; editorial authority |
| Body / UI / labels | **Inter** | Neutral grotesque; excellent small-size legibility |

### Scale (fluid)

| Token | Clamp | Family | Tracking | Leading |
| --- | --- | --- | --- | --- |
| `--text-display` | `clamp(2.75rem, 1.55rem + 5.3vw, 6rem)` | serif | `-0.025em` | `1.02` |
| `--text-h1` | `clamp(2.25rem, 1.45rem + 3.6vw, 4.25rem)` | serif | `-0.022em` | `1.06` |
| `--text-h2` | `clamp(1.875rem, 1.25rem + 2.4vw, 3rem)` | serif | `-0.02em` | `1.12` |
| `--text-h3` | `clamp(1.375rem, 1.15rem + 0.95vw, 1.875rem)` | serif | `-0.015em` | `1.2` |
| `--text-h4` | `clamp(1.0625rem, 1rem + 0.35vw, 1.25rem)` | sans | `-0.005em` | `1.35` |
| `--text-body-lg` | `clamp(1.0625rem, 1rem + 0.4vw, 1.25rem)` | sans | `0` | `1.65` |
| `--text-body` | `clamp(0.9375rem, 0.92rem + 0.15vw, 1rem)` | sans | `0` | `1.7` |
| `--text-small` | `0.875rem` | sans | `0` | `1.6` |
| `--text-caption` | `0.8125rem` | sans | `0.01em` | `1.5` |
| `--text-eyebrow` | `0.75rem` | sans | `0.16em` uppercase | `1.2` |
| `--text-nav` | `0.8125rem` | sans | `0.08em` uppercase | `1` |
| `--text-button` | `0.8125rem` | sans | `0.1em` uppercase | `1` |

### Measure

- Editorial body: `--measure: 68ch` (capped at `44rem`)
- Lead paragraphs: `--measure-lead: 54ch`
- Card body: `--measure-tight: 42ch`

---

## 4. Layout

| Token | Value |
| --- | --- |
| `--w-frame` | `90rem` (1440px) — outer frame |
| `--w-content` | `78rem` (1248px) — standard content column |
| `--w-narrow` | `52rem` — article body column |
| `--gutter` | `clamp(1.25rem, 4vw, 4rem)` |
| `--section-y` | `clamp(4rem, 8.5vw, 8.5rem)` |
| `--section-y-lg` | `clamp(5rem, 11vw, 11rem)` |

### Grid

12 columns at `≥1024px`, 6 at `768–1023px`, 1 below `768px`.
`--grid-gap: clamp(1.25rem, 2.5vw, 2.5rem)`.

Recurring column ratios (desktop):

- Editorial split: `5 / 7` (label + prose)
- Feature split: `7 / 5` (content + media)
- Process: `5 / 7` (diagram + steps)
- Card rows: `3 × 4col` or `2 × 6col`

### Breakpoints

`sm 480` · `md 768` · `lg 1024` · `xl 1280` · `2xl 1536`

Layout is fluid between these; breakpoints change *structure*, never just size.

---

## 5. Spacing scale

`--space-1 .25rem` · `2 .5rem` · `3 .75rem` · `4 1rem` · `5 1.5rem` · `6 2rem`
· `7 2.5rem` · `8 3rem` · `9 4rem` · `10 5rem` · `11 6.5rem` · `12 8rem`

No one-off padding values. Section spacing uses `--section-y` only.

---

## 6. Recurring motifs

1. **Bracket mark** — a small square corner bracket set before every eyebrow label.
   Inline SVG, `currentColor`, `12×12`. Signals "a section begins here".
2. **Circular arrow control** — primary CTA pairs an uppercase tracked label with a
   `56px` circle containing an arrow. Circle fills on hover; arrow nudges `4px`.
3. **Hairline stack** — lists are separated by `1px` rules, not cards. The active row
   gets a `2px` accent rule on its leading edge.
4. **Index numerals** — `01 / 05` set in tabular sans, muted, above a heading.
5. **Rule-and-label** — a full-bleed hairline directly under a section header.
6. **Structural line art** — original SVG compositions of architectural / structural
   grids used in place of stock photography (see §9).

---

## 7. Components

| Component | Rules |
| --- | --- |
| Header | Sticky, `72px` mobile / `88px` desktop. Transparent over the dark hero, solid paper once scrolled. Bottom hairline only. |
| Desktop nav | Uppercase `--text-nav`, `2rem` gap, `2px` underline grows from left on hover/focus |
| Mobile nav | Full-screen panel, focus-trapped, `Esc` closes, body scroll locked, `56px` touch rows |
| Button primary | Ink fill, invert text, square, `--text-button`, `18px/32px` padding |
| Button arrow | Label + circle, see motif 2 |
| Button secondary | Transparent, `1px` line border, fills to `--color-paper-warm` on hover |
| Text link | Underline `1px` at 40% opacity → 100% on hover, `--color-accent-text` |
| Section header | Eyebrow + h2 + optional lead, followed by a hairline |
| Capability module | Hairline row, index numeral, title, problem → intervention → value |
| Process step | Numeral, title, purpose, output, gate; 5 steps in a hairline stack, ring diagram alongside at `≥1024px` |
| Proof block | Large tabular numeral + label + qualification footnote |
| Case block | Situation / Intervention / Result / Why it matters, as a labelled definition list |
| Article card | Square hero, category + date + reading time meta row, title, excerpt, hairline |
| Tag | Pill, `1px` line, `--text-caption`, `28px` high |
| Form field | Label above, `1px` border, `48px` min height, error text below wired with `aria-describedby` |
| Pagination | Prev / numbered / next, `44px` targets, `aria-current="page"` |
| Breadcrumbs | `nav[aria-label="Breadcrumb"]` + `BreadcrumbList` schema |
| Footer | Ink ground, 4 columns on desktop → stacked on mobile, hairline dividers |
| Admin controls | Compact density, `--text-small`, table rows `52px` |
| Confirm dialog | Native `<dialog>`, focus-trapped, destructive action in `--color-danger` |
| Loading | Skeleton hairline blocks; never a full-page spinner |
| Empty / success / error | Icon-free. Heading + one sentence + one action |

---

## 8. Motion

| Pattern | Duration | Easing |
| --- | --- | --- |
| Hover / focus colour | `160ms` | `ease-out` |
| Arrow nudge | `220ms` | `cubic-bezier(.2,.7,.3,1)` |
| Section reveal | `600ms` opacity + `16px` translate, once, IntersectionObserver | `cubic-bezier(.16,1,.3,1)` |
| Mobile menu | `260ms` | `cubic-bezier(.16,1,.3,1)` |

All of the above collapse to `0ms` with no transform under
`@media (prefers-reduced-motion: reduce)`.

---

## 9. Imagery

Stock photography is **not** bundled. The site ships original, hand-authored SVG
compositions (`src/components/art/`) in the reference's subject territory — structural
grids, elevation systems, flow and network geometry. They are:

- original work (no licensing or attribution exposure),
- resolution-independent (sharp on any high-DPI display),
- ~2–4 KB each (no LCP or bandwidth cost),
- rendered with an explicit `viewBox` inside aspect-ratio wrappers (zero CLS),
- `role="img"` with a title when meaningful, `aria-hidden` when decorative.

To use real photography instead, drop files in `public/media/` and swap the `<Art* />`
component for `next/image` — the aspect-ratio wrappers already reserve the space.

Ratios in use: `3/2` (article hero), `4/5` (portrait feature), `16/9` (wide band), `1/1` (card).

---

## 10. Accessibility rules baked into the system

- Focus ring: `2px solid var(--color-accent-text)` with `2px` offset, never removed.
- Minimum target: `44×44px` (`48px` on primary mobile controls).
- Heading order enforced per page; exactly one `<h1>`.
- Every form control has a `<label>`; errors use `aria-describedby` + `aria-invalid` and
  are announced via `role="alert"`.
- Landmarks: `header` / `nav` / `main` / `article` / `aside` / `footer` on every page.
- A skip link to `#main` is the first focusable element.
- Colour is never the sole carrier of meaning.
- Layout survives `200%` zoom and `320px` width with no horizontal scroll.
