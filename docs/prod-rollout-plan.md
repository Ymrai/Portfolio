# Production rollout plan — admin-auth + storage-orphan-prevention

Status: **SHIPPED — all phases live in production; storage fully reconciled (0 orphans). `main` = b99f07f (last functional change a67ad17).**

> **WHERE WE ARE (shipped — production complete):**
> All fixes are merged to `main` and live in production. `main` = `b99f07f` (last functional
> change `a67ad17`); local and `origin/main` are in sync.
>
> - **Auth hardening — SHIPPED** (merge #1 `3626f66`). Signed-session `admin_session` cookie
>   (HMAC of `SESSION_SECRET`) + `requireAdmin()` on all mutating actions and admin pages;
>   forged constant cookie is rejected. Verified on prod (incognito redirect, forged cookie
>   307→/admin/login, login, own-session re-login).
> - **Anon-upload fix — SHIPPED** (merge #3 `a67ad17`). Browser uploader uses `upsert:false`
>   (plain INSERT, unique filenames) to avoid the storage UPDATE/upsert RLS path the anon role
>   is denied. **Image replaces now succeed in production.**
> - **Storage orphan prevention — SHIPPED + ENFORCED** (merge #2 `06d1648`). Pre-generated UUID
>   (D) + reconcile-on-save (B) + editor-never-deletes (A′). `STORAGE_RECONCILE_DRYRUN=false`
>   in Vercel → reconcile actively deletes superseded files on save. Verified on prod: re-saving
>   a project removed its superseded cover (138 → 137), referenced unchanged at 136.
> - **Final orphan cleanup — DONE.** The one legacy orphan
>   `projects/new/cover/1777533149336-0xv9rym5838d.png` (under the shared `new/` prefix, which
>   reconcile-on-save never touches) was deleted via a guarded one-off service-role remove.
>   **Bucket is now 136 files / 136 referenced / 0 orphans — fully reconciled, none remaining.**
> - **Security / GitHub auth — DONE.** PAT rotated and the `origin` remote URL cleaned (no embedded
>   token). A direct `git push` then failed (no cached credential); re-authenticated via Cursor's
>   GitHub sign-in (device code), and `b99f07f` pushed to `origin/main`. Local and remote `main`
>   in sync.
>
> **Remaining: none.** The 3 merged feature branches were deleted on GitHub, so only `main`
> remains both locally and on `origin`. Repo is fully clean; rollout complete.

## Git state (current)
- Remote `origin` = `github.com/Ymrai/Portfolio` (no token embedded in the URL; auth via the
  credential helper after the Cursor GitHub re-auth).
- `main` = `b99f07f`; local `main` and `origin/main` are **in sync** (clean working tree).
- The 3 feature branches (`admin-auth-hardening`, `storage-orphan-prevention`,
  `fix/anon-upsert-upload`) are **merged into `main` and deleted on both local and `origin`**.
  Only `main` remains anywhere — repo fully clean.

## ⚠️ Two things to internalize before anything
1. **SELF-LOCKOUT RISK (auth):** `SESSION_SECRET` **must be set in Vercel _Production_ before the
   auth code reaches production.** Without it, login can't sign and the proxy/guards can't
   verify → admin login loop. (Recoverable: set the env var + redeploy. But avoid it.)
2. **Vercel Preview is NOT isolated from prod data.** There is only one cloud Supabase project
   (prod); the dev project is local-only (via `.env.local`, never in Vercel). So Preview
   deployments read/write the **production** Supabase DB and the **production** storage bucket.
   → Preview tests must be **non-destructive** (gate/redirect/login checks; dry-run logs only).
   The destructive validation already happened on the isolated dev project.

---

## Step 0 — Vercel env vars (set BEFORE any deploy)
Vercel → Project → Settings → Environment Variables. Generate secrets locally
(`openssl rand -base64 48`); never commit them.

| Var | Scope | Value | When |
|---|---|---|---|
| `SESSION_SECRET` | **Production** + **Preview** | strong random (prod value; may differ from dev) | **before** the auth Preview/Prod deploys |
| `STORAGE_RECONCILE_DRYRUN` | **Production** + **Preview** | `true` | for the storage phase (observe-only first) |
| `ADMIN_PASSWORD` | (unchanged) | — | do **not** change it in the same rollout |

Notes:
- Env changes on Vercel only take effect on a **new deploy/redeploy** (not retroactively).
- Keep `STORAGE_RECONCILE_DRYRUN=true` everywhere until prod observation looks right (below).

## Deploy mechanics (confirm once in Vercel)
- **Auto-deploy from `main`** → pushing/merging to `main` triggers a **Production** deploy
  (per AGENTS.md). 
- **Per-branch / per-PR Preview deploys** are Vercel's default for a connected Git repo.
- Confirm the **Preview** env scope has `SESSION_SECRET` + `STORAGE_RECONCILE_DRYRUN=true`,
  else Preview builds of the auth/storage code won't behave.

---

## Phase 1 — AUTH (`admin-auth-hardening` → prod)

**Pre-req:** `SESSION_SECRET` present in Vercel **Production + Preview** (Step 0). ← the lockout guard.

1. **Push the branch:** `git push -u origin admin-auth-hardening` → Vercel builds a **Preview**.
2. **Preview checks (non-destructive — it's prod data):**
   - Incognito → `https://<preview-url>/admin/projects` → **redirects to `/admin/login`**.
   - `curl -sI -H 'Cookie: admin_session=true' https://<preview-url>/admin/projects` → still a
     redirect to login (forged constant cookie **rejected** — the edge check we couldn't test on dev).
   - Log in with `ADMIN_PASSWORD` → reaches admin. **Do not create/delete content on Preview.**
3. **Ship to prod:** open a PR `admin-auth-hardening → main` and merge (or fast-forward `main`).
   Merge to `main` → **Production deploy**.
4. **Post-deploy prod verification:**
   - Incognito `https://yaelrosenberg.com/admin` → redirect to login.
   - Forged `Cookie: admin_session=true` → still redirected.
   - Log in (your existing admin_auth="true" session is now invalid → you re-login once).
   - Sanity: edit + save something small in admin → succeeds (action guard allows a valid session).
5. **Rollback (auth):**
   - `git revert ea2ab22` (or revert the merge) → push → redeploy restores the old constant-cookie
     behavior. Existing users re-login. No DB/schema impact.
   - If you get locked out: it's almost certainly a missing/mismatched `SESSION_SECRET` — set it in
     Vercel Production and redeploy.

---

## Phase 2 — STORAGE (`storage-orphan-prevention` → prod)

This branch already contains the auth commit, so after Phase 1 is merged, its only delta is
`ceca4d3`. Keep `STORAGE_RECONCILE_DRYRUN=true` for the whole observe stage.

1. **Push the branch:** `git push -u origin storage-orphan-prevention` → Preview build.
2. **Preview check (build/load only — NON-destructive):** confirm the Preview builds and the app
   loads. **Do not exercise create/replace/save on Preview** (it writes to prod data). Real
   reconcile behavior was already proven on dev (`Orphans: 0`).
3. **Ship to prod (still dry-run):** merge `storage-orphan-prevention → main` → Production deploy
   with `STORAGE_RECONCILE_DRYRUN=true`.
4. **Observe on prod (dry-run = deletes nothing):**
   - In prod admin, make a controlled edit (e.g. open a real project, replace one image, Save).
   - In Vercel → the deployment's **Function logs**, look for
     `[reconcile dry-run] WOULD delete: projects/<id>/…` — it should list **only** the
     just-superseded file(s), never a referenced path, never anything under `new/`.
   - Read-only confirm nothing changed: run the orphan check pointed at prod
     (`analyze-storage.mjs` / a prod-pointed `dev-orphan-check`-style read) → bucket unchanged.
5. **Enforce:** set `STORAGE_RECONCILE_DRYRUN=false` (or delete the var) in Vercel **Production**
   → **redeploy** (env change needs a new deploy). Now saves actually reconcile.
6. **Post-enforce verification:** repeat a controlled edit → logs show `deleted N orphan(s)`; the
   read-only orphan check shows the new orphan is gone and **referenced count unchanged**.
7. **Rollback (storage):**
   - **Kill-switch:** set `STORAGE_RECONCILE_DRYRUN=true` in Vercel Production + **redeploy** →
     deletion stops immediately (safe direction; D and A′ remain but nothing is deleted).
   - **Full revert:** `git revert ceca4d3` → push → redeploy restores prior upload/delete behavior.
   - **Recovery net:** `backup-storage/` (the pre-cleanup prod mirror) still exists locally;
     and reconcile only ever deletes *unreferenced* files, so live images are never removed.

---

## Suggested order & guards recap
1. Vercel env first (`SESSION_SECRET` prod+preview; `STORAGE_RECONCILE_DRYRUN=true`).
2. Auth: Preview gate-checks → merge → prod verify. (Lockout guard = SESSION_SECRET present.)
3. Storage: deploy with dry-run → observe prod logs → flip to enforce → verify.
4. Later (separate): schedule **E** (age-thresholded sweeper) to mop up any legacy `new/` orphans;
   add a real Supabase migration workflow so future schema changes don't drift.

## What is NOT changing
- No schema changes (drift audit was clean; `more_projects.sections` already on prod; the new
  migration file is just repo bookkeeping).
- `main`/prod untouched until you explicitly push + merge. This document changes nothing.
</content>
