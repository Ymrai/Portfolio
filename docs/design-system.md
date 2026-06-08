# Design System

The portfolio's design system, built in Figma and mirrored from this codebase.

**Figma file:** https://www.figma.com/design/wOPmkvgZ7QhK3w4L91k07a/My-Portfolio
(Cover page is the entry point; foundations and one page per component follow.)

Every token was extracted from the production code (`src/app/globals.css`, `src/components/ui`, `src/components/public`). The **code is the source of truth** — when Figma and code disagree, code wins.

---

## Foundations

### Variables — 5 collections, 94 variables

| Collection | Modes | Count | Contents |
|---|---|---|---|
| **Primitives** | Value | 20 | Raw values, hidden from pickers. `brand/primary` `#D6009D` (light magenta), `brand/primary-light` `#FF47C4` (the single dark-mode magenta), `base/white`·`black`, `neutral/50–900`, `pink/accent`, `slate/400–900` + `slate/accent`, `red/400`·`500`, `card-img/default` `#F5F5F0`. |
| **Color** | Light / Dark | 26 | Semantic tokens aliased to primitives (see below), incl. the translucent line tokens `divider`, `border-muted`, `border-emphasis`. |
| **Radius** | Value | 8 | `sm` 6 · `md` 8 · `lg` 10 · `xl` 14 · `2xl` 18 · `3xl` 22 · `4xl` 26 · `full`. From `--radius: 0.625rem`. |
| **Spacing** | Value | 20 | Scale `0.5`→`32` (2px→128px) plus `size/max-w-5xl` 1024, `size/max-w-7xl` 1280, `size/nav-h` 80. |
| **Typography** | Value | 20 | `font-family/sans` (Manrope), `font-weight/regular–extrabold` (400–800), `font-size/xs–4xl` (12–48), `line-height/tight–loose` (110–160%). |

All variables carry explicit **scopes** (no `ALL_SCOPES`) and **Dev Mode code syntax** pointing at the real CSS variable (e.g. `var(--foreground)`).

### Color tokens (Light / Dark)

`background`, `foreground`, `card`, `card-foreground`, `popover`, `muted`, `muted-foreground`, `secondary`, `secondary-foreground`, `secondary-body`, `accent`, `accent-foreground`, `border`, `input`, `primary`, `primary-foreground`, `ring`, `destructive`, `link`, the translucent line tokens `divider`, `border-muted`, `border-emphasis`, and the always-dark `footer/background`, `footer/foreground`, `footer/muted`, `footer/accent`.

**Rules baked into the tokens:**
- **One brand magenta per theme.** Light = `#D6009D`; dark = a single calibrated **`#FF47C4`**. In dark mode `primary`, `link`, `ring` and `footer/accent` all resolve to `#FF47C4`, so fills, borders, icons, nav, links and text share one pink — no two-pink mismatch. `#FF47C4` meets WCAG AA (**4.67:1** on the dark page background; ~4.0:1 on the slightly lighter card surface, accepted for small card labels).
- **Filled magenta buttons use dark text in dark mode.** `primary-foreground` is white in light, **`#202020`** in dark, so labels stay legible on the lighter dark magenta. In code, `--color-primary` / `--color-primary-foreground` are mode-aware (`var(--primary)` / `var(--primary-foreground)`), and `--brand-text` / `text-brand-text` mirror the same magenta.
- **Light mode is unchanged** — `#D6009D` brand with white button text, exactly as before.
- **The footer surface is always dark.** `footer/background`·`foreground`·`muted` are identical in both modes; `footer/accent` follows the per-theme brand magenta (`#D6009D` light / `#FF47C4` dark).
- **Translucent line tokens bake their alpha into the value.** `divider` = `rgba(0,0,0,0.15)` light / `rgba(255,255,255,0.15)` dark (snapshot row + table dividers); `border-muted` = `border` @ 60% (pager pill borders + the pager wrapper's top divider); `border-emphasis` = `foreground` @ 40% (pager hover border). The alpha lives in the variable value rather than a paint opacity, so instances inherit it correctly — a paint's `opacity` field does **not** propagate to instances.

### Typography — 20 text styles (Manrope)

`Display/Hero` (44/SemiBold) · `Display/Hero Mobile` (32/SemiBold) · `Display/More-Project H1` (48/ExtraBold) · `Display/More-Project H1 Mobile` (24/ExtraBold) · `Display/Case Study H1 Mobile` (20/ExtraBold) · `Heading/H1` (30/Bold) · `Heading/Section H2` (32/SemiBold) · `Heading/Section Title` (24/Bold) · `Heading/Card Title` (24/SemiBold) · `Body/Large` (20/Regular) · `Body/Large Bold` (20/Bold) · `Body/Base` (18/Regular) · `Body/Small` (16/Regular) · `Body/Detail Kind` (20/Medium) · `Label/Tagline` (16/SemiBold) · `Label/Caption (Upper)` (16/SemiBold, uppercase + tracking) · `Label/Caption Sm (Upper)` (12/SemiBold, uppercase + tracking) · `Label/Chip` (16/Medium) · `Label/Small` (14/Medium) · `Caption/Meta` (12/Regular).

**Responsive titles.** Desktop screens use `Display/Hero` (44), `Display/More-Project H1` (48); the matching **Mobile** styles carry the real mobile sizes from code — Home hero `text-[2rem]` → 32, more-project detail title `text-2xl` → 24, case-study detail title `text-xl` → 20. `Heading/Section H2` (32/SemiBold) matches the live body-section `<h2>` (`font-semibold` + `32px`).

Each style's font size is bound to a `font-size/*` variable where one exists. The 32px styles (`Display/Hero Mobile`, `Heading/Section H2`) are set directly — there is no 32px size token. Line height is set per style in % (intentionally not variable-bound — Figma interprets a numeric line-height variable as pixels).

### Elevation — 4 effect styles

`Elevation/sm` · `md` · `lg` · `xl` — the Tailwind shadow scale. Project/More-Project cards use them on hover. The `Card` component uses a 1px ring, not a shadow.

### Gradient — 1 paint style

`Gradient/Brand` — magenta → purple → slate linear gradient, used for media placeholders (avatar image fills, project cover art). Figma variables can't hold gradients, so it lives as a shared **paint style**; Avatar, More-Project Card and Project Card all reference it.

### Icons

The **Icons** page is a set of **8 reusable 24px icon components** (grouped as `Icon/*` in the Assets panel), drawn on a ~1.75px stroke and colored with `color/foreground`:
- **Phosphor** (public UI): `Icon/Arrow Up-Right` (footer & nav links), `Icon/Arrow Down` (scroll indicator).
- **Theme toggle**: `Icon/Moon`, `Icon/Sun`.
- **Lucide — reference set, not currently used in the UI**: `Icon/Mail`, `Icon/External Link`, `Icon/File Text`, `Icon/Git Branch`. The footer renders email / Resume / LinkedIn as plain **text** links, so these are kept for reference only.

The arrows already drawn inside `Pill Link`, `Pager Button`, `Footer` / `Footer — Mobile`, and the `Theme Toggle` moon/sun are intentionally left as inline vectors (not repointed to these components) — code imports Phosphor/Lucide directly, so there's no custom icon system to mirror, and rewiring working variants carried no benefit.

---

## Components — 12 core (each shown in Light and Dark) + screen-phase additions

`Theme Toggle` · `Avatar` · `Badge` · `Button` · `Pill Link` · `Input` · `Card` · `Section Header` · `More-Project Card` · `Project Card` · `Nav` · `Footer`

Every component uses auto-layout, variants/states, and token-bound visual properties. Each page shows a light set and a Dark-mode preview.

**Molecules reuse atoms as nested instances:** `Card` footer → `Button`; `Project Card` CTA → `Pill Link`; `Nav` → `Nav Tab` + `Theme Toggle`.

**Component-specific notes:**
- **Badge / Button destructive** — background is a 10% tint of `color/destructive` (20% on hover, both modes) paired with a dedicated `destructive-text` color (**`#B91C1C`** light / **`#FCA5A5`** dark). This passes WCAG AA (**≥4.5:1**) for the text in both modes at rest and hover — full-strength `destructive` text previously failed (down to ~3.3:1). Backgrounds use `color/destructive`; text uses `color/destructive-text`.
- **Project Card** — themes to dark like the More-Project Card: `bg-card` surface, `foreground` title, `secondary-body` description, `link` company label, `muted` image backing, `border/60`. Light card in light mode, dark card in dark mode.
- **Nav** — `background @ 90%` + 12px backdrop blur (`bg-background/90` + `backdrop-blur-md`); bottom `border/30`.
- **Pill Link** — has an optional trailing **icon slot** (`Show icon` BOOLEAN, default **off**) using ArrowUpRight, color following the text per state. Enabled only where the live site shows it — About "View Resume". The detail-page "Live Site" links have no arrow in code, so the slot stays off there.

### Screen-phase additions

Built while generating the full-page screens; all are instanced on the screens.

- **Footer — Mobile** — single-column stacked footer with the copyright **last** (the desktop `Footer` puts it first, top block then copyright). Used on every mobile screen.
- **Nav Tab** (atom) — one nav link with `State = Inactive / Hover / Active` (Inactive `muted-foreground` · Hover `foreground` · Active `link`, matching the code's `hover:text-foreground` on inactive links) and a `Label` text property. The **Nav** is composed from three `Nav Tab` instances + the `YR.` logo + `Theme Toggle`; the active page is the tab whose `State` is `Active` (no duplicated full-nav variants).
- **Chip** (atom) — 16px tech-stack chip (`Label/Chip` on `secondary`, rounded-full, `Label` text prop), used for the More-Project detail tech chips. Distinct from the 12px `Badge` (the case-study tech chips, which are `text-xs`, still use `Badge`).
- **Detail Components** — reusable parts of the case-study / more-project detail pages, on their own page:
  - **Snapshot Row** — case-study snapshot row; `Size = Desktop` (20px) / `Mobile` (14px), `Label` + `Value` text props, faint `divider` bottom line. The table container adds a `divider` top line.
  - **Pager Button** — prev/next/top pager pill; `Direction = Prev / Next / Top` × `State = Default / Hover`, `Label` text prop. Border is `border-muted` at rest, `border-emphasis` on hover. The detail-page pager wrapper carries only a `border-t` divider (per `border-t border-border/60`) — no enclosing box.
  - **Section Header** — body-section header (caption + title + optional subtitle via `Show subtitle`; `Caption` / `Title` / `Subtitle` text props). Title uses `Heading/Section H2` (32px). This is the dynamic-section header, distinct from the homepage `Section Header`.

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
🧭 Nav            (Nav + Nav Tab atom)
🦶 Footer         (Footer + Footer — Mobile)
🧩 Detail Components   (Snapshot Row · Pager Button · Section Header)
———— SCREENS ————
Portfolio screens     (original page, preserved)
Screens — Generated   (full-page screens, see below)
```

The `Chip` atom lives on the 🏷️ Badge page. In Figma, components live in the **Assets** panel, text styles + the gradient in the **Text**/**Styles** panels, and only the variable collections appear in the **Variables** panel.

---

## Screens

Full-page screens were generated on a dedicated **Screens — Generated** page (the original *Portfolio screens* page is left untouched):

- **Home**, **More Projects**, **About Me**, **Project detail** (case study), **More-Project detail** — each at **desktop (1440)** and **mobile (390)**.
- **Light mode** only.
- **Fully instance-based** — every screen is assembled from component instances (`Nav` with the active tab set, `Footer` / `Footer — Mobile`, `Pill Link`, `Badge` / `Chip`, `Avatar`, `Snapshot Row`, `Pager Button`, `Section Header`); every text layer uses a text style; image placeholders use `Gradient/Brand`. Detail-page body content (paragraphs, images, two-column blocks) is laid out inline, as the live `DynamicSectionRenderer` permutations are too divergent to componentize.

---

## Code Connect — intentionally skipped

Code Connect was deliberately not set up: this is a solo project where the code is already the source of truth, and Code Connect requires a Figma Organization/Enterprise plan.
