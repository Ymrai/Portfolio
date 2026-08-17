# Portfolio Project — Context / Meminder

_Last updated: 2026-08-17_

## Project Info
- **Name:** Yael Rosenberg Portfolio
- **Local path:** `~/Documents/Portfolio/portfolio` (aka `~/Projects/Portfolio/portfolio`)
- **GitHub:** https://github.com/Ymrai/Portfolio (public)
- **Live URL:** https://yaelrosenberg.com
- **Hosting:** Vercel (Hobby / free plan) — auto-deploys on every push to `main`
- **Domain registrar:** Cloudflare Registrar (transfer from Namecheap **completed** July 27, 2026; at-cost renewal ~$10.46/yr; free WHOIS privacy; **expires Nov 26, 2029**; **auto-renew ON**). No longer any billing relationship with Namecheap for this domain.

## Tech Stack
Next.js, TypeScript, Tailwind CSS, shadcn/ui, Supabase (database + storage), Framer Motion, Phosphor Icons, Manrope font.

## What's Built
**Public site:** password protection (cookie-based auth, password in Supabase `settings` table), animated hero homepage, case studies grid, dynamic case study pages, More Projects page, About Me page, footer with contact links, dark/light mode toggle, mobile responsive, Framer Motion animations, custom pink circle favicon (`#D6009D`).

**Password page (redesigned Aug 17, 2026):** two-column split — copy on the left with "experience." in animated brand gradient, form on the right. Sits on `GradientWash`, an ambient background of colour fields orbiting the viewport corners. See the animation section of AGENTS.md for the reusable pieces.

⚠️ **The password page has no theme toggle** — it sits outside the `(public)` layout, so it follows whatever is in `localStorage.theme`, defaulting to the OS setting. Preferences are per-origin, so switching to light on the live site does not carry over to `localhost:3000`.

**Admin CMS at `/admin`:** dashboard, projects manager, more-projects manager, About Me editor, portfolio info editor, settings (password, cookie duration), design system, login page.

## Infrastructure
- **Supabase** — database + storage. Bucket `portfolio-assets` with folders: `avatars`, `more-projects`, `projects`, `resumes`.
- **Vercel** — auto-deploy on push to `main`.
- **Cloudflare DNS → Vercel** (nameservers `kip.ns.cloudflare.com` + `raphaela.ns.cloudflare.com`):
  - A record: `@` → `216.198.79.1`
  - CNAME: `www` → `63c4db7eed96f7b9.vercel-dns-017.com`
  - ⚠️ **Both records MUST stay "DNS only" (grey cloud), never proxied (orange cloud).** Proxying a Vercel origin through Cloudflare causes redirect loops / SSL failures and Vercel marks the domain invalid.

## Environment Variables (Vercel + local `.env.local`)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PORTFOLIO_PASSWORD`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL`.

## Development Workflow
- Code changes → push to GitHub → Vercel auto-deploys.
- Local dev: `cd ~/Documents/Portfolio/portfolio && npm run dev`
- Local URLs: `http://localhost:3000` (public), `http://localhost:3000/admin` (admin).
- For Supabase SQL changes: run in Supabase Dashboard → SQL Editor.

## Completed Phases
**Phase 1 — Build:** full Next.js portfolio from scratch, admin CMS with full CRUD, Supabase DB + storage, password protection, all public pages.

**Phase 2 — Polish:** Framer Motion animations, dark/light mode, mobile responsiveness, custom pink favicon, README.md + AGENTS.md documented, clean-code audit (no secrets exposed, TypeScript clean).

**Phase 3 — Domain & Deployment:** connected `yaelrosenberg.com` to Vercel, SSL working, `www` → bare domain 301 redirect, Wix Premium cancelled (partial refund). Direct Wix → Cloudflare transfer blocked (Cloudflare restriction + 60-day ICANN lock), so transferred Wix → Namecheap (~$11.68, May 2026), switched to Namecheap BasicDNS, added Vercel DNS records, verified Supabase contact, all domains green on Vercel.

**Phase 4 — Security:** explicit Supabase API grants added (ready for Oct 30, 2026 change), fixed `getAllProjects()` bug (was anon client instead of service role), fixed `set_updated_at` function search-path vuln, removed broad storage listing policy (`portfolio_assets_public_read`), added explicit deny policy on settings table. Supabase Security Advisor: 0 errors / 0 warnings / 0 suggestions.

**Phase 5 — Domain move to Cloudflare (July 27, 2026) — COMPLETED:** moved DNS to Cloudflare (Free plan, records kept "DNS only" for Vercel), then transferred the registrar Namecheap → Cloudflare. Steps: nameservers changed at Namecheap to Cloudflare's (`kip` + `raphaela`.ns.cloudflare.com); domain went Active on Cloudflare; unlocked + retrieved EPP code at Namecheap; transfer paid ($10.46, adds 1 yr) and approved via Namecheap email to speed it up. Transfer confirmed complete (Cloudflare "Domain Transfer Complete" email + Registrations page shows yaelrosenberg.com Active, expires Nov 26 2029, auto-renew ON). Site verified live in HTTPS throughout — zero downtime. Note: Cloudflare's proxy/DDoS does NOT apply since records are DNS-only (Vercel provides its own SSL/CDN). Namecheap dashboard may lag a few hours before dropping the domain — no action needed there, no further Namecheap billing.

## Pending / Reminders
- **Oct 30, 2026:** Supabase enforces explicit grants on all existing projects. Already handled.

## Domain History
Originally Wix (builder + registrar). Couldn't transfer Wix → Cloudflare directly (Cloudflare needs an intermediate registrar + 60-day ICANN wait). Path taken: Wix → Namecheap (May 2026) → Cloudflare (July 27, 2026). Current state: domain registered at Cloudflare, DNS managed by Cloudflare (DNS-only records → Vercel), site hosted on Vercel, all working.
