# Storage cleanup — session handoff

_Snapshot for picking this back up (incl. a fresh Claude Code session). Bucket: Supabase
Storage `portfolio-assets`. Connection: `.env.local` → `NEXT_PUBLIC_SUPABASE_URL` +
`SUPABASE_SERVICE_ROLE_KEY` (new-format `sb_secret_…`)._

> **Related:** `docs/security-findings.md` records two things found while setting up the dev
> environment — the draft-edit 404 fix (`getProjectByIdAdmin`) and the admin-auth weakness
> (constant `admin_auth="true"` cookie + no per-action checks; prod proxy guard verified
> active). Decide auth-fix-now vs. storage step-D-first.

## The problem
- `portfolio-assets` was **over quota (~1.3 GB)**, full of duplicate/old images.
- **Root cause:** uploads are immediate and client-side (`uploadFileClient`, `upsert:true`)
  and **decoupled from saving**. The DB row is written only on Save, so replaced / removed /
  abandoned uploads strand as orphans, and there's no reconciliation between storage and DB.

## What we did today
1. **Full backup (verified).** `scripts/backup-storage.mjs` → `backup-storage/` =
   **443 files, ~1.3 GB**, 1:1 mirror, verified (every listed file present on disk).
   `backup-storage/` is gitignored.
2. **Analysis (read-only).** `scripts/analyze-storage.mjs` cross-referenced every bucket file
   against image URLs in the DB (`portfolio_info`, `projects`, `more_projects`, `about_me`,
   `settings`; direct columns + nested `sections`/`case_study` JSON). `src/` has **no**
   hardcoded image refs → **DB is the sole source of truth**. Found 443 files / 136 referenced
   / 307 orphans. Report: `storage-cleanup-report.md` (gitignored).
3. **Pass 1 — 72 stranded `new/` drafts deleted.** Family ①: files under shared `projects/new/`
   & `more-projects/new/` not referenced by any draft. Dry-run list → approval → delete, with
   pre/post validation. Freed 223.94 MB. (`deletion-list-pass1.txt`)
4. **Pass 2 — 235 old/replaced versions deleted.** Family ②: superseded images inside real
   project folders (23 exact-duplicates of a kept file + 212 unreferenced-but-unique, incl. 1
   old résumé PDF). Verified 4 suspicious newer-timestamp files were genuinely unreferenced
   (intermediate uploads from one editing session; the session's final image is kept). Freed
   480.15 MB. (`deletion-list-pass2.txt`, `…-pass2-breakdown.txt`)

### Final state
| | Files | Size |
|---|---:|---:|
| Original | 443 | 1.26 GB |
| After pass 1 | 371 | 1.04 GB |
| **After pass 2 (now)** | **136** | **~584 MB** |

- **Under quota.** Bucket now contains exactly the 136 files the DB references.
- Every delete verified: 0 targets remained, **0 referenced files went missing** (re-listed
  and confirmed after each pass).
- **Live site verified OK** (projects, more-projects, about, résumé all load).

## Safety net still in place
- `backup-storage/` still holds **all 443 originals (~1.3 GB)** → every one of the 307
  deletions is fully recoverable (URLs are deterministic; re-upload by path keeps refs valid).
- Exact deletions recorded in `deletion-list-pass1.txt` / `deletion-list-pass2.txt`
  (+ breakdown). These + the report are **gitignored** (working files).
- Keep `backup-storage/` until the root-cause fix has run cleanly for a full cycle.

## Root-cause fix — PLANNED, NOT YET APPLIED
Today only cleaned up existing orphans; the upload flow is unchanged, so orphans **will**
re-accumulate until the fix lands.

**Plan: `docs/storage-orphan-fix-plan.md`** (file-by-file changes, tests, backward-compat,
rollback). Approach = **B + D + A′ + E**:
- **D** — pre-generate the project UUID so draft uploads go to `projects/<uuid>/…` (not shared `new/`).
- **B** — reconcile-on-save server GC: after writing a row, delete unreferenced files under
  that project's own prefix (flag-gated, guarded: never touches `new/`, never deletes a
  referenced path).
- **A′** — editor never deletes from storage; all deletion happens server-side on save (B).
- **E** — monthly age-thresholded, dry-run-first sweeper as a safety net.

**Agreed rollout order — one step at a time, with the user's approval at each gate:**
1. **D** (additive, deletes nothing) →
2. **B in dry-run** (logs intended deletes only) →
3. **B enforce** →
4. **A′** (remove client-side deletes) →
5. **E** (sweeper, dry-run then scheduled).
Hold at each gate; verify with `analyze-storage.mjs` (referenced must stay **136**,
referenced-but-missing must stay **0**) + live site before continuing.

## Open questions to confirm BEFORE editing code
- Exact action file that saves `portfolio_info` (avatar/résumé) — for the optional avatar/résumé reconcile.
- Whether `more_projects` section images live under `more-projects/<id>/…` or `projects/<id>/…`
  (confirm folder strings) so B reconciles the right prefix(es).
- Whether `case-study-editor.tsx` (legacy editor, uses `projects/<id>/case-study/…`) is still
  reachable from the admin UI.
- Where to schedule **E** (Vercel Cron vs external) and how to auth its trigger route.
- Decision: leave legacy `new/` URLs as-is (minimal risk; E mops leftovers) vs. one-time
  migration of `new/`-hosted referenced files into `<uuid>/` (optional appendix, not yet written).

## Files from today
- Tracked (you may keep): `docs/storage-orphan-fix-plan.md`, `docs/storage-cleanup-session.md` (this file).
- Untracked, left as-is: `scripts/` (`backup-storage.mjs`, `analyze-storage.mjs`,
  `build-deletion-list-pass1.mjs`, `build-deletion-list-pass2.mjs`, `delete-pass1.mjs`,
  `delete-list.mjs`, `verify-nw82o1uz.mjs`).
- Gitignored working files: `backup-storage/`, `deletion-list-*.txt`, `storage-cleanup-report.md`.
- Nothing has been committed.
</content>
