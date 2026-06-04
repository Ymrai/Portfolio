# Design System

The portfolio's design system, built in Figma and mirrored from this codebase.

**Figma file:** https://www.figma.com/design/wOPmkvgZ7QhK3w4L91k07a/My-Portfolio
(Cover page is the entry point; foundations and one page per component follow.)

Every token was extracted from the production code (`src/app/globals.css`, `src/components/ui`, `src/components/public`). The **code is the source of truth** — when Figma and code disagree, code wins.

---

## Foundations

### Variables — 5 collections, 91 variables

| Collection | Modes | Count | Contents |
|---|---|---|---|
| **Primitives** | Value | 20 | Raw values, hidden from pickers. `brand/primary` `#D6009D` (light magenta), `brand/primary-light` `#FF47C4` (the single dark-mode magenta), `base/white`·`black`, `neutral/50–900`, `pink/accent`, `slate/400–900` + `slate/accent`, `red/400`·`500`, `card-img/default` `#F5F5F0`. |
| **Color** | Light / Dark | 23 | Semantic tokens aliased to primitives (see below). |
| **Radius** | Value | 8 | `sm` 6 · `md` 8 · `lg` 10 · `xl` 14 · `2xl` 18 · `3xl` 22 · `4xl` 26 · `full`. From `--radius: 0.625rem`. |
| **Spacing** | Value | 20 | Scale `0.5`→`32` (2px→128px) plus `size/max-w-5xl` 1024, `size/max-w-7xl` 1280, `size/nav-h` 80. |
| **Typography** | Value | 20 | `font-family/sans` (Manrope), `font-weight/regular–extrabold` (400–800), `font-size/xs–4xl` (12–48), `line-height/tight–loose` (110–160%). |

All variables carry explicit **scopes** (no `ALL_SCOPES`) and **Dev Mode code syntax** pointing at the real CSS variable (e.g. `var(--foreground)`).

### Color tokens (Light / Dark)

`background`, `foreground`, `card`, `card-foreground`, `popover`, `muted`, `muted-foreground`, `secondary`, `secondary-foreground`, `secondary-body`, `accent`, `accent-foreground`, `border`, `input`, `primary`, `primary-foreground`, `ring`, `destructive`, `link`, and the always-dark `footer/background`, `footer/foreground`, `footer/muted`, `footer/accent`.

**Rules baked into the tokens:**
- **One brand magenta per theme.** Light = `#D6009D`; dark = a single calibrated **`#FF47C4`**. In dark mode `primary`, `link`, `ring` and `footer/accent` all resolve to `#FF47C4`, so fills, borders, icons, nav, links and text share one pink — no two-pink mismatch. `#FF47C4` meets WCAG AA (**4.67:1** on the dark page background; ~4.0:1 on the slightly lighter card surface, accepted for small card labels).
- **Filled magenta buttons use dark text in dark mode.** `primary-foreground` is white in light, **`#202020`** in dark, so labels stay legible on the lighter dark magenta. In code, `--color-primary` / `--color-primary-foreground` are mode-aware (`var(--primary)` / `var(--primary-foreground)`), and `--brand-text` / `text-brand-text` mirror the same magenta.
- **Light mode is unchanged** — `#D6009D` brand with white button text, exactly as before.
- **The footer surface is always dark.** `footer/background`·`foreground`·`muted` are identical in both modes; `footer/accent` follows the per-theme brand magenta (`#D6009D` light / `#FF47C4` dark).

### Typography — 14 text styles (Manrope)

`Display/Hero` (44/SemiBold) · `Display/More-Project H1` (48/ExtraBold) · `Heading/H1` (30/Bold) · `Heading/Section Title` (24/Bold) · `Heading/Card Title` (24/SemiBold) · `Body/Large` (20/Regular) · `Body/Large Bold` (20/Bold) · `Body/Base` (18/Regular) · `Body/Detail Kind` (20/Medium) · `Label/Tagline` (16/SemiBold) · `Label/Caption (Upper)` (16/SemiBold, uppercase + tracking) · `Label/Chip` (16/Medium) · `Label/Small` (14/Medium) · `Caption/Meta` (12/Regular).

Each style's font size is bound to a `font-size/*` variable. Line height is set per style in % (intentionally not variable-bound — Figma interprets a numeric line-height variable as pixels).

### Elevation — 4 effect styles

`Elevation/sm` · `md` · `lg` · `xl` — the Tailwind shadow scale. Project/More-Project cards use them on hover. The `Card` component uses a 1px ring, not a shadow.

### Gradient — 1 paint style

`Gradient/Brand` — magenta → purple → slate linear gradient, used for media placeholders (avatar image fills, project cover art). Figma variables can't hold gradients, so it lives as a shared **paint style**; Avatar, More-Project Card and Project Card all reference it.

### Icons

Dedicated **Icons** page documenting the set: **Phosphor** for public UI (Arrow Up-Right, Arrow Down), **Lucide** for social/resume links (Mail, External Link, File Text, Git Branch), and the theme-toggle Moon/Sun glyphs. Drawn at 24px on a 1.75px stroke, colored with `color/foreground`.

---

## Components — 12, each shown in Light and Dark

`Theme Toggle` · `Avatar` · `Badge` · `Button` · `Pill Link` · `Input` · `Card` · `Section Header` · `More-Project Card` · `Project Card` · `Nav` · `Footer`

Every component uses auto-layout, variants/states, and token-bound visual properties. Each page shows a light set and a Dark-mode preview.

**Molecules reuse atoms as nested instances:** `Card` footer → `Button`; `Project Card` CTA → `Pill Link`; `Nav` → `Theme Toggle`.

**Component-specific notes:**
- **Badge / Button destructive** — background is a 10% tint of `color/destructive` (20% on hover, both modes) paired with a dedicated `destructive-text` color (**`#B91C1C`** light / **`#FCA5A5`** dark). This passes WCAG AA (**≥4.5:1**) for the text in both modes at rest and hover — full-strength `destructive` text previously failed (down to ~3.3:1). Backgrounds use `color/destructive`; text uses `color/destructive-text`.
- **Project Card** — themes to dark like the More-Project Card: `bg-card` surface, `foreground` title, `secondary-body` description, `link` company label, `muted` image backing, `border/60`. Light card in light mode, dark card in dark mode.
- **Nav** — `background @ 90%` + 12px backdrop blur (`bg-background/90` + `backdrop-blur-md`); bottom `border/30`.

---

## Figma file organization

```
📐 Cover
🚀 Getting Started
———— FOUNDATIONS ————
🎨 Colors
🔤 Typography
📏 Spacing & Radius
🌑 Elevation
🔣 Icons
———— COMPONENTS ————
🔘 Avatar
🏷️ Badge
🔲 Button
💊 Pill Link
⌨️ Input
🗂️ Card
✳️ Section Header
🖼️ More-Project Card
📇 Project Card
🌓 Theme Toggle
🧭 Nav
🦶 Footer
———— SCREENS ————
Portfolio screens   (original page, preserved)
```

In Figma, components live in the **Assets** panel, text styles + the gradient in the **Text**/**Styles** panels, and only the variable collections appear in the **Variables** panel.

---

## Code Connect — intentionally skipped

Code Connect was deliberately not set up: this is a solo project where the code is already the source of truth, and Code Connect requires a Figma Organization/Enterprise plan.
