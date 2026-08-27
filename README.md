# Yael Rosenberg — Portfolio & CMS

A personal portfolio site with a fully integrated headless CMS. The public-facing site showcases case studies, a secondary project gallery, and an about page. A password-protected admin interface allows all content to be managed without touching code.

**Live:** [yaelrosenberg.com](https://yaelrosenberg.com)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, React 19) |
| Language | TypeScript |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Components | [shadcn/ui](https://ui.shadcn.com) |
| Database & Storage | [Supabase](https://supabase.com) (Postgres + S3-compatible storage) |
| Animations | [Framer Motion](https://www.framer.com/motion/) |
| Icons | [Phosphor Icons](https://phosphoricons.com) + [Lucide](https://lucide.dev) |
| Font | [Manrope](https://fonts.google.com/specimen/Manrope) (Google Fonts) |
| Drag & Drop | [dnd-kit](https://dndkit.com) (project reordering in admin) |
| Image Lightbox | [yet-another-react-lightbox](https://yet-another-react-lightbox.com) |
| Toasts | [Sonner](https://sonner.emilkowal.ski) |
| Deployment | [Vercel](https://vercel.com) |

---

## Project Structure

```
src/
├── app/
│   ├── (public)/              # Public portfolio (password-protected)
│   │   ├── layout.tsx         # Auth gate — reads cookie, redirects if unauthed
│   │   ├── page.tsx           # Homepage — hero + case studies list
│   │   ├── projects/[slug]/   # Case study detail page
│   │   ├── more-projects/     # Secondary project gallery + detail pages
│   │   └── about/             # About Me page
│   ├── admin/                 # CMS (separate auth via admin session cookie)
│   │   ├── layout.tsx         # Admin shell — sidebar layout
│   │   ├── login/             # Admin login page
│   │   ├── projects/          # Manage case studies (list, new, edit)
│   │   ├── more-projects/     # Manage secondary projects (list, new, edit)
│   │   ├── about/             # Edit About Me content
│   │   ├── info/              # Edit Portfolio Info (name, tagline, links…)
│   │   ├── settings/          # Portfolio password + cookie duration
│   │   └── design-system/     # Visual reference for fonts, colours, spacing
│   ├── password/              # Public password entry page
│   ├── actions/               # Server Actions (auth, settings, content)
│   ├── api/                   # API routes (storage upload, reorder, etc.)
│   ├── icon.png               # Favicon — 32×32 pink circle (auto-detected by Next.js)
│   └── globals.css            # Tailwind imports + CSS custom properties
│
├── components/
│   ├── public/                # All public-facing UI components
│   │   ├── project-card.tsx   # Case study card (alternating image/text layout)
│   │   ├── nav.tsx            # Fixed top navigation bar
│   │   ├── footer.tsx         # Footer with links
│   │   ├── fade-in.tsx        # Framer Motion scroll-reveal helpers
│   │   ├── page-transition.tsx# Route-change opacity transition
│   │   ├── snapshot-table.tsx # Project info table (client, role, duration…)
│   │   ├── dynamic-section.tsx# Renders rich content blocks (text, image, slider)
│   │   ├── case-study-section.tsx # Legacy structured case study renderer
│   │   ├── image-gallery.tsx  # Grid gallery with lightbox
│   │   ├── section-slider.tsx # Embla carousel for image sliders
│   │   ├── scroll-to-top.tsx  # "Top" button in page bottom navigation
│   │   ├── scroll-arrow.tsx   # Animated scroll-down arrow on homepage hero
│   │   ├── more-project-card.tsx # Card for secondary project list
│   │   └── theme-toggle.tsx   # Light/dark mode switcher
│   ├── admin/                 # All CMS UI components
│   │   ├── sidebar.tsx        # Admin navigation sidebar
│   │   ├── project-form.tsx   # Case study create/edit form
│   │   ├── more-project-form.tsx
│   │   ├── case-study-editor.tsx  # Structured case study section builder
│   │   ├── sections-editor.tsx    # Dynamic content block editor
│   │   ├── settings-form.tsx      # Password + cookie duration settings
│   │   ├── image-upload.tsx       # Single image uploader (Supabase Storage)
│   │   ├── gallery-upload.tsx     # Multi-image uploader
│   │   ├── pdf-upload.tsx         # Resume PDF uploader
│   │   ├── sortable-project-list.tsx     # dnd-kit drag-to-reorder list
│   │   └── sortable-more-project-list.tsx
│   ├── providers/
│   │   └── theme-provider.tsx # Custom theme context (light / dark / system)
│   └── ui/                    # shadcn/ui primitives (Button, Input, Dialog…)
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Browser Supabase client
│   │   ├── server.ts          # Server Supabase client (SSR cookies)
│   │   ├── queries.ts         # All data-fetching functions
│   │   ├── storage.ts         # Storage bucket helpers
│   │   └── upload.ts          # File upload utilities
│   ├── render-inline.tsx      # Inline markdown parser (**bold**, _italic_)
│   └── utils.ts               # cn() and other shared helpers
│
├── types/
│   ├── database.ts            # Supabase table row/insert/update types
│   └── index.ts               # Domain types (Project, MoreProject, etc.)
│
└── supabase/
    └── migrations/            # SQL migration files (run in Supabase SQL Editor)
```

---

## Features

### Public Site

- **Homepage** — full-viewport hero with animated intro text; case studies list with alternating image/text cards
- **Case Study pages** — hero image, metadata snapshot table, rich dynamic content sections (text blocks, full-width images, image sliders, two-column layouts), lightbox, prev/next project navigation
- **More Projects** — secondary gallery for smaller or older work; full detail pages with the same content block system
- **About Me** — bio paragraphs with portrait image, résumé link
- **Password protection** — visitors enter a password to access the portfolio; auth is cookie-based with a configurable expiry; password is stored in Supabase and changeable from the admin without redeploying
- **Dark / light mode** — toggle in the nav bar, persisted to localStorage and an SSR cookie (zero flash on page load)
- **Mobile responsive** — all pages fully responsive from 375 px upward
- **Animations** — per-section scroll-reveal via Framer Motion `whileInView`, animated page transitions on route change
- **Custom favicon** — 32×32 PNG circle in brand pink (#D6009D)

### Admin CMS (`/admin`)

- **Projects** — create, edit, publish/draft, and drag-to-reorder case studies; rich section builder with text, single images, image sliders, and two-column (text+text or text+image) layouts
- **More Projects** — same editor for secondary work
- **About Me** — edit bio text
- **Portfolio Info** — name, tagline, social links, résumé URL, and all page-level copy (hero text, section titles, footer text)
- **Settings** — change the visitor portfolio password; set cookie duration (1 h / 6 h / 12 h / 24 h / 48 h / 1 week)
- **Design System** — internal visual reference showing the typography scale, brand colours, spacing, and component states

---

## Database Schema

All tables live in Supabase (Postgres). RLS is enabled; the server uses the service role key to bypass row-level security for all reads and writes.

### `projects`
Core case studies displayed on the homepage.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `title`, `slug` | text | `slug` used in URL |
| `status` | enum | `draft` or `published` |
| `order_index` | int | Controls display order |
| `company`, `case_study_title`, `description` | text | |
| `client`, `industry`, `category`, `role`, `team`, `duration` | text | Snapshot table data |
| `image_url`, `hero_image_url` | text | Card thumbnail / detail hero |
| `card_bg_color`, `hero_bg_color` | text | Custom background tints |
| `tech_stack`, `gallery_images` | text[] | Arrays |
| `sections` | jsonb | Dynamic content blocks (primary renderer) |
| `case_study` | jsonb | Legacy structured case study format |
| `live_url`, `github_url` | text | |

### `more_projects`
Secondary project entries (older work, side projects, experiments).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `title`, `slug` | text | |
| `status` | enum | `draft` or `published` |
| `order_index` | int | |
| `description`, `industry`, `kind` | text | |
| `cover_image_url` | text | |
| `tech_stack`, `gallery_images` | text[] | |
| `sections` | jsonb | Dynamic content blocks |
| `live_url`, `github_url` | text | |

### `portfolio_info`
Single-row table (id = 1) for all site-wide copy and links.

| Column | Notes |
|---|---|
| `name`, `tagline`, `bio_short` | Personal info |
| `email`, `github_url`, `linkedin_url`, `resume_url`, `avatar_url` | Links |
| `home_intro_text`, `home_case_studies_title/subtitle/description` | Homepage copy |
| `more_page_title/subtitle/description` | More Projects page copy |
| `about_page_title/subtitle` | About page copy |
| `footer_title`, `footer_subtitle` | Footer copy |

### `about_me`
Single-row table (id = 1) for the About page.

| Column | Type | Notes |
|---|---|---|
| `bio` | text | Full bio (newline-delimited paragraphs) |
| `skills`, `interests` | text[] | |
| `experience`, `education` | jsonb | |

### `settings`
Key/value store for runtime configuration.

| Key | Value |
|---|---|
| `portfolio_password` | Visitor auth password |
| `cookie_duration_hours` | Auth cookie lifetime in hours |

---

## Environment Variables

Create a `.env.local` file at the project root:

```env
# Supabase project credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Site URL — used for redirects (http://localhost:3000 for local dev)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Visitor portfolio password — fallback if the settings table is empty on first run
# Can be changed at runtime via /admin/settings without redeploying
PORTFOLIO_PASSWORD=your-portfolio-password

# Admin CMS password — protects the /admin area (password-only, no username)
ADMIN_PASSWORD=your-admin-password
```

> `SUPABASE_SERVICE_ROLE_KEY`, `PORTFOLIO_PASSWORD`, and `ADMIN_PASSWORD` are server-only secrets — they are never exposed to the browser. `NEXT_PUBLIC_*` variables are safe to expose.

---

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
#    Create .env.local and fill in the values above

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The dev server uses Turbopack by default.

**Database setup:** Run each SQL file in `supabase/migrations/` in filename order via the Supabase Dashboard → SQL Editor. Each migration is additive and safe to re-run.

**Image domains:** `next.config.ts` contains a hardcoded `remotePatterns` entry for the Supabase storage hostname. If you fork this project and use a different Supabase project, update the `hostname` value in `next.config.ts` to match your project's storage URL.

---

## Deployment

Deployed on **Vercel** at **[yaelrosenberg.com](https://yaelrosenberg.com)**.

1. Connect the GitHub repository to a Vercel project
2. Add all `.env.local` variables under **Vercel Dashboard → Settings → Environment Variables**
3. Every push to `main` triggers an automatic deployment

The local dev server uses Turbopack (`next dev`). Production builds use the standard Next.js compiler (`next build`), which is fully supported.

---

## Supabase Storage

Images and files are stored in Supabase Storage buckets and served via public CDN URLs stored in the database.

| Bucket | Contents |
|---|---|
| `project-images` | Case study thumbnails, hero images, section images, gallery images |
| `more-project-images` | Secondary project cover images and gallery images |
| `avatars` | Profile portrait (used on homepage and About page) |
| `resumes` | PDF résumé file |
