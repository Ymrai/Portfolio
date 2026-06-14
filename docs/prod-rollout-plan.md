# Production rollout plan — admin-auth + storage-orphan-prevention

Status: **plan for review — nothing pushed, no Vercel/prod changes made.** Covers both
locally-committed branches, shipped **auth first, then storage**.

> **WHERE WE ARE (paused, resume Sunday):**
> - `SESSION_SECRET` is **set in Vercel (Production + Preview)** ✅ — lockout guard in place.
> - **`admin-auth-hardening` pushed** to origin (`ea2ab22`) and its Vercel **Preview PASSED all 3
>   Phase-1 checks**: (1) incognito `/admin` → redirect to `/admin/login`; (2) forged
>   `Cookie: admin_session=true` → **rejected (307 → /admin/login)**; (3) real login with
>   `ADMIN_PASSWORD` works. ✅
> - Vercel **"Require Log In" Preview protection** was toggled **off** during testing and is now
>   back **ON**. ✅
> - **`storage-orphan-prevention` still local-only / unpushed.** `origin/main` unchanged at
>   `2a6b200` — **nothing deployed to production; `main` untouched.**
> - Local `.env.local` is on **production** (`moeninunhdbrklxbfprt`).
>
> **NEXT ACTION (Sunday):** merge `admin-auth-hardening` → `main` (this triggers the **production
> deploy of auth**) → verify on prod (incognito redirect, forged cookie rejected, login, re-login
> of your own session). Then **Phase 2**: push `storage-orphan-prevention`, deploy with
> `STORAGE_RECONCILE_DRYRUN=true` (observe logs) before enforcing.
>
> **Still open (security):** **rotate the exposed GitHub token** that's embedded in the `origin`
> remote URL (replace it with a fresh PAT / switch to SSH or the gh credential helper).

## Git state (read-only, verified)
- Remote `origin` = `github.com/Ymrai/Portfolio` (URL embeds a **valid** token — push works).
- Remote has only `main` @ `2a6b200`. Local `main` is **ahead 1** (`a37df00`, unpushed).
- `admin-auth-hardening` (`ea2ab22`) ahead 3; `storage-orphan-prevention` (`ceca4d3`) ahead 4
  and **includes the auth commit** (it was branched from it).
- Neither feature branch is on the remote yet (no upstream).

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
