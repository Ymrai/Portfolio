# Security & bug findings — admin auth + draft editing

_Recorded 2026-06-10. Investigation was read-only except the small draft-edit fix noted below.
No production changes. See also `docs/storage-cleanup-session.md` (storage work) and
`docs/storage-orphan-fix-plan.md` (the separate upload/orphan fix)._

---

## 1. Draft-edit 404 bug — FIXED (on dev, uncommitted)

**Symptom:** After creating a project and saving it as **draft**, the admin redirects to
`/admin/projects/<id>` which returned **404**, even though the row exists in the DB.

**Cause:** the admin edit page loaded the project with `getProjectById`, which used the
**anon** Supabase client. The anon client is subject to RLS
(`projects … FOR SELECT USING (status = 'published')`), so a **draft** row is invisible to it
→ `null` → `notFound()`. Published projects worked, which hid the bug. (The `more_projects`
side already had a service-role `getMoreProjectByIdAdmin`; the `projects` side didn't.)

**Fix applied (scoped):**
- Added `getProjectByIdAdmin()` in `src/lib/supabase/queries.ts` — uses `createServiceClient()`
  (bypasses RLS), mirroring `getMoreProjectByIdAdmin`. The anon `getProjectById` is unchanged.
- `src/app/admin/projects/[id]/page.tsx` now calls `getProjectByIdAdmin`.
- Status: applied on the **dev** branch, **uncommitted**. Revert with:
  `git restore src/lib/supabase/queries.ts "src/app/admin/projects/[id]/page.tsx"`

**Not the same root cause as the storage/orphan problem** — separate bug (admin read path used
the public/anon client instead of the service-role admin client).

---

## 2. Admin auth weakness — OPEN (not yet fixed)

**What protects `/admin` today:** a middleware-equivalent at **`src/proxy.ts`**
(matcher `"/admin/:path*"`). For any `/admin/*` except `/admin/login`, it redirects to login
unless a cookie `admin_auth` exists with value `"true"`. Login (`src/app/actions/auth.ts`,
`loginAction`) checks the password against `ADMIN_PASSWORD` env and sets `admin_auth="true"`.

**Verified in prod (2026-06-10):** hitting `https://yaelrosenberg.com/admin/projects` in a
fresh incognito window **redirects to `/admin/login`** → the proxy guard **is active in
production**. So admin is **not** wide open to normal visitors.

**The weaknesses:**
1. **The session cookie value is a constant, non-secret literal `"true"`** — not signed, not
   derived from the password, not a session token. `httpOnly`/`secure` protect a victim's
   cookie from theft but do **not** stop an attacker from *sending* `Cookie: admin_auth=true`
   in their own requests. So the gate is **forgeable**: anyone who sets that one cookie passes,
   without ever knowing `ADMIN_PASSWORD`. The password is effectively cosmetic.
2. **No per-action authorization.** Every mutating Server Action immediately uses
   `createServiceClient()` (service-role, bypasses RLS) with **no auth check**:
   `createProject` / `updateProject` / `deleteProject` / `reorderProjects` (and the
   `more_projects` equivalents), `uploadImageAction` / `uploadPdfAction` / `deleteImageAction`,
   `updatePortfolioPassword` / `updateCookieDuration`. They rely **entirely** on the proxy.
   Next.js guidance is explicitly *not* to rely on middleware for Server Action authz.
3. **Dev note:** `next dev` (Turbopack) ignores middleware, so `/admin` is unguarded locally —
   acceptable now that dev points at the isolated `portfolio-dev` project, not prod.

**Real-world risk (plain terms):** Not "wide open." The realistic threat is a **targeted
attacker who forges the `admin_auth=true` cookie** — they would then get full read **and write**
to the CMS: view drafts, create/edit/**delete** projects & more-projects, edit About/Info,
**change the public site password**, and upload/delete files in the bucket, all with
service-role privileges. Casual visitors are stopped by the proxy. Risk is gated mainly by the
obscurity of the technique, not by real authentication.

---

## 3. Recommended fix (smallest robust — two parts, needed together)

1. **Unforgeable session credential.** On login, set `admin_auth` to a **signed token**
   (HMAC-SHA256 over a server-side `SESSION_SECRET`, or a signed JWT / `iron-session`) instead
   of the literal `"true"`. The proxy and the guard below verify the signature, so a hand-set
   cookie can't pass.
2. **`requireAdmin()` inside every mutating Server Action** (and the admin-only getters): read
   and verify the signed cookie at the top of each action; throw/redirect if invalid. This is
   the real enforcement and protects writes regardless of where middleware runs.

Keep `src/proxy.ts` for the login-redirect UX, but it must verify the real token and must not
be the only line of defense.

---

## 4. Interaction between the two

The draft-edit fix (#1) makes draft project **detail** loadable via `/admin/projects/<id>`.
Combined with #2, that means until the auth fix lands, a forged-cookie attacker (or any context
where the proxy doesn't run) could view **draft detail**, not just the draft titles already
exposed by the unauthenticated admin list. This **slightly widens draft visibility via admin
URLs** in the interim. It does **not** affect the public site — public routes still use the
anon/RLS path (`getProjectBySlug`), so drafts remain hidden to visitors.

---

## Decision pending
Whether to do the admin-auth fix (#2/#3) now, or return to the storage **step D** work first.
Both are independent. The auth fix is the higher-severity item; step D is the
orphan-prevention work already planned in `docs/storage-orphan-fix-plan.md`.
</content>
