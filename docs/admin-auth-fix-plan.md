# Admin auth hardening — implementation plan

Status: **proposal for review — NO code changed.** Fixes the two weaknesses in
`docs/security-findings.md`: (a) the admin session cookie is a forgeable constant `"true"`,
and (b) mutating server actions have no internal auth check. Fix = **signed session token** +
**`requireAdmin()` in every admin action and admin page**. Test on dev first, then prod.

## Decisions (confirmed)
1. Helpers live at `src/lib/auth/session.ts` + `src/lib/auth/require-admin.ts`.
2. **Cookie renamed `admin_auth` → `admin_session`** (cleaner; forces a one-time re-login).
3. **Page-level `requireAdmin()` is included** (defense-in-depth; also closes the draft-detail
   visibility gap the draft-edit fix opened).
4. **No `AUTH_V2` flag** — a disable-auth flag is a fail-open risk; rollback is via `git revert`.

---

## 1. Signed-token design (plain terms)

Today: login sets cookie `admin_auth="true"`; the proxy only checks the value equals `"true"`.
Anyone can send `Cookie: admin_auth=true` and pass. We replace the constant with a value that
**can only be produced by someone who knows a server secret**, so it can't be forged.

**The token (new cookie name `admin_session`):**
- On login (after the `ADMIN_PASSWORD` check passes), set `admin_session` to a **signed token**:
  ```
  payload   = "v1." + <issuedAt epoch ms>
  signature = base64url( HMAC-SHA256(SESSION_SECRET, payload) )
  cookie    = payload + "." + signature
  ```
- To **verify** (proxy + every action/page): split off the signature, recompute
  `HMAC-SHA256(SESSION_SECRET, payload)`, compare in **constant time**. Optionally reject if
  `issuedAt` is older than the cookie max-age (defense-in-depth expiry).
- Without `SESSION_SECRET` you can't compute a valid signature → a hand-set `admin_session=true`
  (or any guessed value) fails verification. Cookie keeps `httpOnly` + `secure` (prod) +
  `SameSite=lax`, maxAge 7d.
- The **old `admin_auth` cookie is no longer read** → any current session is treated as logged
  out (re-login required — intended). `logoutAction` will delete `admin_session` (and also clear
  the legacy `admin_auth` for tidiness).

**Cross-runtime note (important):** the proxy runs in the **Edge runtime**, the actions/pages run
in **Node**. The sign/verify helper must use **Web Crypto** (`crypto.subtle`, available in both)
— **not** `node:crypto`. One shared helper works in both places.

**What `SESSION_SECRET` is:** a long, random, server-only secret used as the HMAC key. It is
*not* the admin password (that still gates login); it's the key that makes the session cookie
unforgeable. It must be identical for the code that signs (login) and verifies (proxy / actions /
pages) within one environment, and **different between dev and prod**.

**Generate a strong value (run locally; do NOT paste the output anywhere shared):**
```bash
openssl rand -base64 48
# or:
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

**Where it goes (never commit a real value):**
| Location | Scope | How |
|---|---|---|
| `.env.local` (currently the dev file) | local dev | add `SESSION_SECRET=<dev value>` |
| `.env.local.dev` | local dev template | add `SESSION_SECRET=<dev value>` (so switching keeps it) |
| `.env.local.example` | committed template | add `SESSION_SECRET=your_session_secret_here` (placeholder only) |
| **Vercel** → Project → Settings → Environment Variables | **Production** (and **Preview**) | add `SESSION_SECRET=<prod value>` **before deploying** |
| `.env.local.prod-backup` | local-against-prod restore | only if you ever run locally against prod — use the **prod** value |

All `.env.local*` files are already gitignored; only `.env.local.example` (placeholder) is
tracked. Use a **different** secret for dev vs prod.

---

## 2. `requireAdmin()` + the exact actions that must call it

**Helper:** `requireAdmin()` (Node, server-only) reads the `admin_session` cookie via
`next/headers`, runs `verifySessionToken()`, and **throws `Unauthorized`** if invalid. Each admin
action calls `await requireAdmin()` as its **first line**. Throwing (not returning) means a
missing/invalid session can never fall through to a service-role write.

**Every action exported under `src/app/actions/` (19 total):**

**MUST guard (16):**
| File | Action | Why |
|---|---|---|
| `projects.ts` | `createProject` | insert |
| `projects.ts` | `updateProject` | update |
| `projects.ts` | `deleteProject` | delete |
| `projects.ts` | `reorderProjects` | update order |
| `more-projects.ts` | `createMoreProject` | insert |
| `more-projects.ts` | `updateMoreProject` | update |
| `more-projects.ts` | `deleteMoreProject` | delete |
| `more-projects.ts` | `reorderMoreProjects` | update order |
| `more-projects.ts` | `getMoreProject` | reads drafts via service role (admin-only) |
| `portfolio-info.ts` | `savePortfolioInfo` | update |
| `about-me.ts` | `saveAboutMe` | update |
| `settings.ts` | `updatePortfolioPassword` | changes the public site password |
| `settings.ts` | `updateCookieDuration` | update |
| `storage.ts` | `uploadImageAction` | writes storage |
| `storage.ts` | `uploadPdfAction` | writes storage |
| `storage.ts` | `deleteImageAction` | deletes storage |

**MUST NOT guard (3):**
| File | Action | Why |
|---|---|---|
| `auth.ts` | `loginAction` | the entry point that *creates* the session |
| `auth.ts` | `logoutAction` | only clears the caller's own cookie |
| `auth-password.ts` | `checkPassword` | the **public visitor** password gate (`portfolio_auth`) — a different system |

Exhaustive — confirmed via `grep "export async function" src/app/actions` (19 exports; 16
guarded, 3 intentionally not).

**Page-level guard (now included).** Add `await requireAdmin()` at the top of each admin **page
server component** (all under `/admin` **except** `/admin/login`):
- **Essential (expose draft data):** `admin/projects/page.tsx` (list),
  `admin/projects/[id]/page.tsx` (edit), `admin/more-projects/page.tsx`,
  `admin/more-projects/[id]/page.tsx`.
- **For completeness:** `admin/projects/new/page.tsx`, `admin/more-projects/new/page.tsx`,
  `admin/about/page.tsx`, `admin/info/page.tsx`, `admin/settings/page.tsx`,
  `admin/design-system/page.tsx`, and the admin dashboard page if present.
- **Excluded:** `admin/login/page.tsx` (must stay public; it's a client component anyway).
- Note: we guard per-page rather than in `admin/layout.tsx`, because the shared layout also wraps
  `/admin/login` (guarding there would create a login redirect loop). A future cleaner option is
  an `(authed)` route group with its own guarded layout — out of scope for this fix.

---

## 3. File-by-file changes

1. **New `src/lib/auth/session.ts`** (edge-safe; Web Crypto only; no `next/headers`, no `node:crypto`):
   - `createSessionToken(): Promise<string>` — build `payload`, HMAC-sign with `SESSION_SECRET`.
   - `verifySessionToken(token?: string): Promise<boolean>` — recompute + constant-time compare +
     optional age check. Returns `false` (fail closed) if token missing/malformed or
     `SESSION_SECRET` unset. Constant-time compare implemented manually (Edge has no
     `timingSafeEqual`).
2. **New `src/lib/auth/require-admin.ts`** (Node): `requireAdmin()` — read `admin_session` via
   `cookies()` (`next/headers`), `verifySessionToken`, throw `Error("Unauthorized")` if invalid.
3. **`src/proxy.ts`** — make `proxy` **async**; read `admin_session`; replace
   `auth.value !== "true"` with `!(await verifySessionToken(auth?.value))`. Same matcher
   (`/admin/:path*`), same redirect to `/admin/login`. It now verifies the **real signed token**,
   not mere presence/constant.
4. **`src/app/actions/auth.ts`** — `loginAction`: after the password check, set `admin_session`
   to `await createSessionToken()` (keep cookie flags). `logoutAction`: delete `admin_session`
   (and also delete legacy `admin_auth`).
5. **The 16 action functions** (`projects.ts`, `more-projects.ts`, `portfolio-info.ts`,
   `about-me.ts`, `settings.ts`, `storage.ts`) — add `import { requireAdmin }` and
   `await requireAdmin();` as the first statement of each.
6. **Admin page server components** (list in §2) — add `await requireAdmin();` at top.
7. **Env templates** — add `SESSION_SECRET` placeholder to `.env.local.example`; real values in
   `.env.local` / `.env.local.dev` (dev) and Vercel (prod), per §1.

Confirmation: **`proxy.ts` verifies the signed token** (recompute HMAC + constant-time compare),
not just cookie presence or a constant.

---

## 4. Backward-compat, lockout safety, rollback

**Your current session:** after deploy, the old `admin_auth="true"` cookie is no longer read, so
you'll be redirected to `/admin/login` on the next admin navigation. Log in once → a new signed
`admin_session` cookie is set. No data impact. **Public site unaffected** (separate
`portfolio_auth` cookie + `checkPassword`, untouched).

**How you avoid locking yourself out of prod (critical):**
- **Set `SESSION_SECRET` in Vercel (Production + Preview) BEFORE deploying the code.** If the new
  code runs without it, login can't sign and the proxy/guards can't verify → admin login loop.
- **Do not change `ADMIN_PASSWORD`** in the same change (one variable at a time).
- The helper **fails closed** (no secret ⇒ verification fails). Intended — the env var must exist
  first.
- You can **never be permanently locked out** — you control Vercel env and git. Recovery =
  set/fix `SESSION_SECRET` and redeploy, or revert (below).

**Rollback:**
- `git revert <commit>` → restores old behavior (login sets `"true"`, proxy checks the constant),
  redeploy. Existing users re-login. Leaving `SESSION_SECRET` set is harmless (old code ignores
  it). No DB/storage migration involved — rollback is purely code + redeploy.

---

## 5. Dev test checklist

> ⚠️ **`next dev` (Turbopack) ignores middleware**, so the **proxy redirect cannot be fully
> verified locally**. What dev **can** verify: login + the signed-token helper + the **per-action
> guard** + the **per-page guard** (pages/actions run in Node regardless of middleware — the
> page-level `requireAdmin()` is exactly why this matters: even with the proxy off, admin pages
> are protected). What dev **cannot** verify: the edge proxy redirect / edge forged-cookie
> rejection — those are checked on a Vercel **Preview** (§6).

After adding `SESSION_SECRET` to `.env.local` and restarting `npm run dev`:

1. **Login still works:** `/admin/login` with the dev `ADMIN_PASSWORD` → lands in admin; inspect
   the `admin_session` cookie — it's a `payload.signature` string, **not** `"true"`, and there's
   no functional `admin_auth` cookie anymore.
2. **Verifier unit check (deterministic, no server):** a throwaway script importing
   `verifySessionToken` asserts: `verify("true")===false`, `verify(undefined)===false`,
   `verify(<freshly signed token>)===true`, `verify(<tampered sig>)===false`.
3. **Pages reject without a valid session (page guard):** log out, then open
   `/admin/projects/<id>` directly → should bounce/Unauthorized (the page `requireAdmin()` runs in
   Node even though middleware is off). This is the local proxy-substitute proof.
4. **Actions reject without a valid session:** logged out, attempt a mutation (e.g., save a
   project) → fails `Unauthorized`. Re-login → it succeeds.
5. **Normal admin use works** once logged in: create/edit/delete project & more-project,
   upload/replace/remove image, edit About/Info, change settings — all succeed.
6. **Public site unaffected:** visitor `/password` flow works; drafts still hidden on public
   routes.

---

## 6. Safe rollout order (dev → preview → prod)

1. **Dev:** implement; add `SESSION_SECRET` to `.env.local` (+ `.env.local.dev`); run §5.
2. **Vercel env first:** add `SESSION_SECRET` to **Preview** and **Production** scopes (a strong,
   prod-only value, different from dev). Keep `ADMIN_PASSWORD` as-is.
3. **Preview deploy:** push a branch → on the Preview URL verify what dev can't:
   - incognito `/admin/projects` → redirects to `/admin/login` ✅
   - `curl` with `Cookie: admin_session=true` to an `/admin` page → **still redirected** ✅
   - login works; a mutation without a valid session is rejected ✅
4. **Production deploy:** merge → immediately test in incognito: `/admin` redirects to login,
   login works, admin functions work, forged cookie rejected.
5. **If anything is wrong:** `git revert` + redeploy (and/or re-check `SESSION_SECRET` in Vercel).

**The one must-do to avoid self-lockout:** `SESSION_SECRET` set in Vercel **Production before the
production deploy**. Everything else is recoverable via revert.

---

_Decisions resolved (see top). Ready to implement on dev on your go-ahead — no code written yet._
</content>
