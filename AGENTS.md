<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Project overview

Personal portfolio site + headless admin CMS for Yael Rosenberg (product designer). Live at **yaelrosenberg.com**.

**Two distinct areas:**
- `(public)` — the portfolio visitors see, password-protected
- `admin` — CMS for managing all content, protected by a separate admin password

---

## Stack

| | |
|---|---|
| Framework | Next.js **16.2.4**, App Router, React **19** |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS **v4** — utility-first, CSS custom properties for theming |
| Components | shadcn/ui (style: `base-nova`) — primitives in `src/components/ui/` |
| Database | Supabase (Postgres) via `@supabase/ssr` |
| Storage | Supabase Storage — single bucket `portfolio-assets` |
| Animations | Framer Motion v12 |
| Icons | **Phosphor Icons** (`@phosphor-icons/react`) for public UI; **Lucide** for admin UI |
| Font | Manrope (Google Fonts) — loaded via `next/font`, exposed as `--font-manrope` |
| Drag & drop | dnd-kit (project reordering in admin) |
| Lightbox | yet-another-react-lightbox |
| Toasts | Sonner |
| Deployment | Vercel, auto-deploy from `main` |

---

## Folder structure

```
src/
├── app/
│   ├── (public)/          # Visitor-facing portfolio (password-gated)
│   │   ├── layout.tsx     # Auth gate Server Component
│   │   ├── page.tsx       # Homepage — hero + case studies
│   │   ├── projects/
│   │   │   ├── page.tsx   # Redirects to / (projects shown on homepage)
│   │   │   └── [slug]/    # Case study detail
│   │   ├── more-projects/ # Secondary gallery + detail pages
│   │   └── about/         # About Me
│   ├── admin/             # CMS (admin-password-gated)
│   │   ├── layout.tsx     # Sidebar shell (NOT an auth gate — admin has no layout-level guard)
│   │   ├── login/         # Admin login page
│   │   ├── projects/      # CRUD for case studies
│   │   ├── more-projects/ # CRUD for secondary projects
│   │   ├── about/         # Edit bio
│   │   ├── info/          # Edit portfolio-wide copy + links
│   │   ├── settings/      # Portfolio password + cookie duration
│   │   └── design-system/ # Visual reference (read-only)
│   ├── password/          # Visitor password entry page
│   ├── actions/           # Server Actions
│   │   ├── auth.ts        # Admin login/logout
│   │   ├── auth-password.ts # Visitor checkPassword action
│   │   └── settings.ts    # updatePortfolioPassword, updateCookieDuration
│   ├── api/logout/        # GET route — clears portfolio_auth cookie, redirects
│   ├── icon.png           # Favicon (32×32, auto-detected by Next.js)
│   └── globals.css        # Tailwind imports + all CSS custom properties
│
├── components/
│   ├── public/            # All public-facing UI
│   ├── admin/             # All CMS UI
│   ├── providers/
│   │   └── theme-provider.tsx  # Custom theme context (not next-themes)
│   └── ui/                # shadcn/ui primitives
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts      # Browser client (uses anon key)
│   │   ├── server.ts      # createClient() anon + createServiceClient() service role
│   │   ├── queries.ts     # All data functions
│   │   ├── storage.ts     # File upload/delete helpers (bucket: portfolio-assets)
│   │   └── upload.ts      # Upload utilities
│   ├── render-inline.tsx  # **bold** → <strong> inline markdown parser
│   └── utils.ts           # cn() helper
│
├── types/
│   ├── database.ts        # Supabase-generated table types
│   └── index.ts           # Domain types + parseCaseStudy/parseSections
│
└── supabase/migrations/   # SQL files — run manually in Supabase SQL Editor
```

---

## Authentication — two separate systems

### 1. Visitor auth (portfolio_auth cookie)
- Gate is in `src/app/(public)/layout.tsx` — a **Server Component**
- Reads `portfolio_password` from the `settings` Supabase table (falls back to `PORTFOLIO_PASSWORD` env var)
- Compares the `portfolio_auth` cookie value to the stored password (plain-text comparison)
- On mismatch → `redirect("/password")`
- The password page action (`checkPassword` in `auth-password.ts`) sets the cookie on success
- Cookie name: `portfolio_auth` | httpOnly | SameSite=lax | secure in production
- Duration: read from `cookie_duration_hours` settings row (default 24 h)
- **Note:** auth runs in a Server Component, not middleware — Next.js 16 + Turbopack ignores middleware

### 2. Admin auth (admin_auth cookie)
- No layout-level guard in `admin/layout.tsx` — each page must be protected individually (or rely on the `admin_auth` cookie being checked by Server Actions)
- Login action: `src/app/actions/auth.ts` → compares password to `ADMIN_PASSWORD` env var
- On success sets `admin_auth = "true"` cookie, 7-day maxAge
- No username field — password-only
- Logout: `logoutAction()` in `auth.ts` + `GET /api/logout` route

---

## Supabase usage patterns

**Always use the right client:**

```ts
// Public read — respects RLS, for server components and public queries
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();

// Admin writes + draft reads — bypasses RLS with service role key
import { createServiceClient } from "@/lib/supabase/server";
const supabase = await createServiceClient();
```

**Rule:** Published-only public queries → `createClient()`. Anything that needs to see drafts or write data → `createServiceClient()`. The `settings` table always uses `createServiceClient()`.

**All queries live in `src/lib/supabase/queries.ts`.** Do not write inline Supabase calls in page/component files.

**Storage:** All files go to the single bucket `portfolio-assets`. The `storage.ts` helpers (`uploadFile`, `deleteFile`, `pathFromUrl`) handle the bucket lifecycle. The bucket is auto-created if it doesn't exist on first upload. `next.config.ts` whitelists the project's Supabase hostname for `next/image` optimisation — update that hostname if the Supabase project changes.

---

## Theming

> ⚠️ **Dark mode is currently switched off site-wide.** `DARK_MODE_ENABLED` in `src/lib/theme-config.ts` is `false`, which hides the theme toggle on both the public site and the admin and renders every visitor in light. Everything below still applies and is still maintained — the `.dark` palette, the `dark:` variants and `ThemeToggle` are all in place, they simply never activate. Set the flag to `true` to bring it all back.
>
> The flag is read in three places, and all three are needed: `app/layout.tsx` (SSR ignores the `theme` cookie), `theme-provider.tsx` (a stored preference does not resolve, and `setTheme` is inert), and the two toggle render sites. Hiding the toggle alone would strand anyone who had already chosen dark, since the preference lives in their browser.
>
> **Stored preferences are ignored, never cleared.** Turning the flag back on returns each visitor to the choice they had, rather than resetting everyone — so do not "tidy up" by deleting the cookie or the localStorage key.
>
> **Keep writing `dark:` variants for new work.** They cost nothing while the flag is off and are what makes the switch back a one-word change rather than a re-theming project.

This project uses a **custom ThemeProvider** (`src/components/providers/theme-provider.tsx`), not `next-themes`. It exposes the same API as next-themes (`useTheme`, `resolvedTheme`, `setTheme`) so components are interchangeable.

**Theme storage:** localStorage key `theme` + a cookie also named `theme` (read by `RootLayout` to set the initial `<html class>` on SSR, eliminating flash).

**Brand magenta is theme-aware — do not hardcode it.**

| | Light | Dark |
|---|---|---|
| `--primary` / `--brand` / `--brand-text` | `#D6009D` | `#FF47C4` |

The two values are not interchangeable: `#D6009D` measures 4.83:1 on white but only **2.92:1** on the dark page background, below the 4.5:1 AA threshold. `#FF47C4` measures 4.67:1 on dark. Any brand-coloured **text or icon** must therefore read the token, not the hex:

```tsx
style={{ color: "var(--brand-text)" }}          // ✅ flips per theme
className="text-[var(--brand-text)]"            // ✅ for icons that inherit currentColor
style={{ color: "#D6009D" }}                    // ❌ fails AA in dark
```

Hardcoding `#D6009D` is acceptable only for **surfaces** — a filled button, a tinted background — where the value is paired with an explicit `dark:` variant. Note that Phosphor's `color` prop passes straight through to an SVG attribute, where `var()` does not resolve; colour those icons with a class instead.

Error text follows the same rule via `--destructive-text` (`#B91C1C` light, `#FCA5A5` dark).

**Custom property for secondary body text:**
- Light: `--secondary-body: #5B5B5B`
- Dark: `--secondary-body: #A0A8BC`

Use `color: "var(--secondary-body)"` for secondary paragraphs, captions, and descriptions.

**Dark mode class:** `.dark` on `<html>`. Applied by the ThemeProvider on the client; set by SSR via the `theme` cookie in `RootLayout`.

---

## CSS & Tailwind conventions

- Tailwind v4: no `tailwind.config.js`. Config lives entirely in `globals.css` via `@theme inline { ... }`.
- Use Tailwind utility classes for layout, spacing, and responsive behaviour.
- Use **inline `style={}`** for dynamic values (colours from DB, custom font sizes, etc.).
- **Responsive pattern:** mobile-first. Breakpoints used: `sm` (640 px), `md` (768 px), `lg` (1024 px).
- Max content width: `max-w-7xl mx-auto px-4 md:px-6` on all public pages.
- Max prose/content width inside a page: `max-w-5xl` (left-aligned, no `mx-auto`).
- Body text font size: **18 px** (`style={{ fontSize: "18px" }}`). Do not use `text-xl` (20 px) for body copy.
- Section labels: `font-semibold uppercase tracking-widest` at 16 px.

---

## Animation conventions

**Framer Motion for anything triggered** — entrances, scroll reveals, page transitions, state changes. **CSS keyframes for anything ambient** — decorative motion that simply runs.

The split is not stylistic. Framer Motion drives transforms from `requestAnimationFrame`, which the browser suspends whenever the page is hidden; a long ambient loop then freezes and resumes out of phase. CSS animations are handed to the compositor and keep their own timeline. Ambient keyframes live in `globals.css` — there is no `tailwind.config.js` in this project — and are registered as Tailwind v4 tokens:

```css
@theme { --animate-wash-a: washOrbit 40s ease-in-out infinite; }
@keyframes washOrbit { /* … */ }
```

Every ambient animation must be silenced under reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  .gradients-container > *, .wash-text { animation: none; }
}
```

⚠️ **Never gate content on a Framer Motion entrance.** `initial={{ opacity: 0 }}` is rendered into the SSR markup, so the element ships invisible and only appears once the script has run. If the bundle fails, is blocked, or is merely slow on a phone, the user is left staring at whatever sits *outside* the wrapper. This shipped on `/password`: the logo and background rendered while the login form itself stayed at `opacity:0`, making the site impossible to enter.

Use a CSS entrance for anything the page cannot function without — `rise-in` in `globals.css` is the fade-and-lift used there, and needs nothing but the stylesheet:

```tsx
<div className="rise-in">{/* form, copy, anything load-bearing */}</div>
```

Framer Motion entrances are still fine for decorative or below-the-fold content. To check, curl the route and search the markup for `opacity:0` — anything load-bearing should not appear.

### Scroll-reveal: `FadeIn` (individual), `FadeInGroup` + `FadeInItem` (staggered list)

`FadeIn` — use this for **individual sections and detail page content**:
```tsx
import { FadeIn } from "@/components/public/fade-in";
// Triggers when the element itself enters the viewport
<FadeIn delay={0.1}><MyComponent /></FadeIn>
```

`FadeInGroup` + `FadeInItem` — use only for **short lists of cards** (homepage, more-projects grid):
```tsx
<FadeInGroup className="grid ...">
  {items.map(item => <FadeInItem key={item.id}><Card /></FadeInItem>)}
</FadeInGroup>
```

⚠️ **Do NOT wrap long-form page content in `FadeInGroup`/`FadeInItem`.** The group's `whileInView` fires only when 5% of the *entire* group is visible — for a 3000 px case study body that means 150 px of scroll before anything appears, so content looks invisible on mobile. Use individual `FadeIn` per section instead.

### Page transitions
`PageTransition` in `(public)/layout.tsx` wraps nav + main + footer with an opacity fade (250 ms) keyed on `usePathname`. `AnimatePresence` has no `initial={false}` — first-load animations work correctly.

### Easing
Standard easing: `[0.22, 1, 0.36, 1]` (custom spring-like ease). Always define as `const ease = [...] as const` to satisfy TypeScript's `Easing` type.

### Ambient background: `GradientWash`

`src/components/public/gradient-wash.tsx` — three blurred colour fields orbiting the four corners of the viewport, plus a film grain that stops wide gradients from banding. Drop it into any full-bleed page as the first child of a `relative` container:

```tsx
<div className="relative min-h-screen overflow-hidden">
  <GradientWash />
  <div className="relative z-10">{/* content */}</div>
</div>
```

Colours come from CSS custom properties set on the wrapper with `dark:` variants, so the palette swaps without a JS theme check and without a hydration mismatch. Currently used only by `/password`.

### Brand gradient: `--brand-stops` + `.wash-text`

`--brand-stops` (globals.css) is the shared multi-hue ramp — violet → magenta → pink → warm. `.wash-text` clips it to glyphs for animated gradient type:

```tsx
<span className="wash-text inline-block">experience.</span>
```

Two things to know. The sweep is **linear, not conic**: a conic gradient centres on the middle of the word and leaves half the glyphs washed out. And `.dark` overrides `--brand-stops` with a lifted set — the `#731A80` end of the light ramp sinks into the dark page and the letters it lands on stop reading.

---

## Content systems

### Dynamic sections (primary)
Stored as `sections: jsonb` on `projects` and `more_projects`. Parsed by `parseSections()` in `src/types/index.ts`. Rendered by `DynamicSectionRenderer` in `src/components/public/dynamic-section.tsx`.

Each section has:
- `id`, `title`, `caption?`, `caption_color?`, `subtitle?`
- `blocks: SectionBlock[]` — each block is `text | image | slider`
- Text blocks support `single` or `two-column` layout (text+text or text+image)

### Legacy case study (fallback)
Stored as `case_study: jsonb`. Parsed by `parseCaseStudy()`. Rendered by `CaseStudySection`. Used only when `parseSections()` returns an empty array (`useDynamic = false`).

### Admin editor
`SectionsEditor` (`src/components/admin/sections-editor.tsx`) is the main rich content editor for both projects types. The older `CaseStudyEditor` handles the legacy structured format.

---

## Server Actions patterns

All Server Actions are in `src/app/actions/`. They follow the React 19 `useActionState` pattern:

```ts
"use server";
export async function myAction(
  _prevState: { error?: string; success?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: string }> { ... }
```

Client forms consume them via:
```tsx
const [state, action, pending] = useActionState(myAction, null);
<form action={action}>...</form>
```

Toast feedback is driven by `useEffect` watching `state.success` / `state.error` in the client component.

---

## Inline markdown

`renderInline(text)` in `src/lib/render-inline.tsx` converts `**bold**` to `<strong>`. Works in both Server and Client Components. Use it anywhere CMS text is rendered that may contain bold markup.

---

## Icon library rules

- **Public UI** → `@phosphor-icons/react/dist/ssr` (SSR-safe, tree-shakeable)
- **Admin UI** → `lucide-react`
- Do not mix icon libraries within the same component

---

## Key gotchas

0. **Turbopack serves stale CSS when you add new Tailwind classes.** A newly used utility (`focus-within:border-primary/65`, `md:translate-y-[26px]`) can be present in the HTML but missing from the compiled stylesheet, so the change silently does nothing. Editing the file again does not help. Stop the dev server, then clear the cache, then restart — in that order; deleting `.next` while the server is running takes it down with an Internal Server Error:

   ```bash
   rm -rf .next
   ```

   To confirm a rule actually shipped rather than trusting the browser, fetch the served stylesheet: `curl -sS http://localhost:3000/password | grep -oE '/_next/static/[^"]*\.css'`, then grep that file.

1. **Middleware is not supported** with Turbopack (`next dev`). Auth lives in Server Component layouts, not `middleware.ts`.

2. **`createClient()` vs `createServiceClient()`** — every Supabase call uses `cache: "no-store"`. Never use the browser client (`src/lib/supabase/client.ts`) in Server Components or Server Actions.

3. **`useTheme()`** comes from `@/components/providers/theme-provider`, not `next-themes`. The API is identical but the import path differs.

4. **Inline `style` always beats Tailwind classes.** Use inline style for any value that must win over a utility class (e.g., font-size overrides, brand colours).

5. **`FadeInItem` starts at `opacity: 0`** and only animates when the parent `FadeInGroup` enters the viewport. If a `FadeInGroup` wraps hundreds of pixels of content the items may never appear on mobile. Use `FadeIn` per section for body content.

6. **Admin layout has no auth guard** — the `admin/layout.tsx` is a dumb shell. Admin pages rely on Server Actions failing silently if the cookie is absent. The only enforced admin gate is the login page redirect pattern.

7. **Server Actions body size limit is 50 MB** (`next.config.ts`) — required for image uploads through Server Actions.

8. **`parseSections` and `parseCaseStudy`** defensively handle malformed JSON. Always use these instead of direct JSON casting when reading `sections` or `case_study` columns.

9. **`?? []` pattern on Supabase queries** — all queries return `data ?? []` (never throw). Handle `null` data gracefully.

10. **Image domains** — `next.config.ts` hardcodes the Supabase hostname for `next/image` `remotePatterns`. If the Supabase project changes, update it there.

---

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key (server only) |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Used in `/api/logout` redirect |
| `PORTFOLIO_PASSWORD` | Optional | Visitor auth fallback (if settings table empty) |
| `ADMIN_PASSWORD` | ✅ | Admin CMS login password |

See `.env.local.example` for template values.
