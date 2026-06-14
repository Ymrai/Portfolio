# Storage orphan fix — implementation plan (B + D + A′ + E)

Status: **proposal for review — no code changed.** Goal: stop the `portfolio-assets` bucket
from re-accumulating orphans, without breaking the 136 currently-referenced files.

## Root cause (recap)
Uploads are immediate, client-side, and decoupled from saving (`uploadFileClient`,
browser anon client, `upsert:true`). The DB row is written only on Save. So storage and
DB are never reconciled → replaced/removed/abandoned uploads strand as orphans, and
client-side deletes-before-save can break live references.

## Design (the four pieces)
- **D — Per-project keying.** Generate the project UUID up front so every draft upload
  lands under `projects/<uuid>/…` (or `more-projects/<uuid>/…`), never the shared `new/`.
- **B — Reconcile-on-save (server GC).** After a project row is written, list that
  project's own prefix, diff against the URLs the saved row actually references, and delete
  only the unreferenced extras. Service-role, behind a flag, dry-run first.
- **A′ — Editing never deletes from storage.** Remove all client-side `deleteFileClient`
  calls; deletion becomes the exclusive job of B (on save). Eliminates the pre-save
  broken-reference risk and orphan-on-replace/remove in one move.
- **E — Monthly safety-net sweeper.** Age-thresholded, dry-run-first script that deletes
  anything the inline path misses (e.g. abandoned drafts, legacy `new/` leftovers).

### Why this is safe for existing data
- D changes only **new** drafts. Existing saved projects keep their stored URLs (including
  legacy `new/` ones).
- B deletes **only within a single project's own `projects/<uuid>/` prefix** and **only
  files not in the referenced set**. Two hard guards: (1) never run GC when the prefix
  resolves to the shared `projects/new` / `more-projects/new`; (2) never delete a path that
  appears in the referenced set. → the 136 referenced files (incl. the 7 under `new/`) are
  untouched.
- Legacy projects whose files live under `new/`: editing/replacing now writes under their
  real `<uuid>/` (the folder string already uses `project.id` for existing projects), B
  cleans only the `<uuid>/` prefix, and the legacy `new/` referenced files stay referenced
  and untouched. Any *replaced* legacy `new/` file becomes an orphan under shared `new/`
  that B intentionally won't touch — left to E (age-based).

---

## File-by-file changes

### D — pre-generate the UUID
**`src/components/admin/project-form.tsx`**
- On mount for a *new* project, generate `const draftId = crypto.randomUUID()` once
  (stable across the editing session, e.g. `useState(() => crypto.randomUUID())`).
- Replace the `project?.id ?? "new"` folder values (lines ~388 cover, ~402 hero, ~443
  gallery) with `project?.id ?? draftId`.
- Pass `projectId={project?.id ?? draftId}` to `<SectionsEditor>` (so its folders use the
  uuid, not `"new"`).
- On submit for a new project, pass `draftId` to `createProject` as the explicit id.

**`src/components/admin/more-project-form.tsx`**
- Same pattern: `draftId`, folder at ~260 (`cover`) and gallery, `projectId` to the editor,
  pass `draftId` to `createMoreProject`.

**`src/components/admin/sections-editor.tsx`**
- No logic change needed — it already takes `projectId` and builds
  `projects/${projectId ?? "new"}/…` (lines 536/581/596/605). With D, `projectId` is always
  set, so `"new"` is never used. (Optionally drop the `?? "new"` fallback to fail loud.)

**`src/components/admin/case-study-editor.tsx`** (legacy editor, line 47)
- If still reachable, same treatment; otherwise note it as deprecated.

**`src/app/actions/projects.ts` / `actions/more-projects.ts`**
- Extend the create input/Zod schema to accept an optional `id`; on create, insert with the
  provided id (`.insert({ id, ... })`). Confirm the table PK accepts an explicit UUID
  (it does — `id` is a uuid PK; we just stop relying on the DB default for creates).

### B — reconcile-on-save (server GC)
**`src/lib/supabase/storage.ts`** (add helpers, service-role)
- `listFilesUnder(prefix): Promise<string[]>` — recursive list of object paths under a
  prefix (pagination), mirroring the analyze script.
- `referencedPathsIn(payload): Set<string>` — regex-extract `portfolio-assets/<path>` from
  a JSON-serialized row (covers direct columns + nested `sections`/`case_study`).
- `reconcilePrefix(prefix, referenced, { dryRun }): { deleted, skipped }` —
  list prefix → for each file not in `referenced`, delete (or log if dryRun).
  **Guards inside:** refuse if `prefix` is empty / `projects/new` / `more-projects/new`;
  never delete a path in `referenced`.

**`src/app/actions/projects.ts`**
- After a successful insert/update, call:
  `await reconcilePrefix(`projects/${id}`, referencedPathsIn(savedRow), { dryRun: GC_DRY_RUN })`
  guarded by `if (process.env.GC_ON_SAVE === "true")`.
- For maximum safety, compute `referenced` as the **union of this row's URLs and a global
  referenced scan** (optional; per-prefix is already safe because the prefix is exclusive to
  one project after D).

**`src/app/actions/more-projects.ts`**
- Same call with `more-projects/${id}` (and the project's own `projects/${id}` if it also
  stores section images there — confirm folder usage during implementation).

### A′ — editing no longer deletes from storage
**`src/components/admin/image-upload.tsx`**
- `handleRemove` (lines 50–53): drop the `deleteFileClient(value)` call — just
  `onChange("")`. (Replace already doesn't delete; that's now correct, B handles it.)

**`src/components/admin/gallery-upload.tsx`**
- `remove` (lines 47–51): drop `deleteFileClient(url)` — just update the array.

**`src/components/admin/pdf-upload.tsx`** (resume)
- `handleRemove` (~56): drop `deleteFileClient`.

> Net: the editor only *adds* to storage (uploads) and edits state. All *removal* happens
> server-side on save via B. No deletion can happen before a save commits.

### Optional — avatar / résumé (portfolio_info)
The old-résumé orphan we found came from the same replace-without-delete in
`pdf-upload`/`image-upload`. To cover it:
- In the info/settings save action that writes `portfolio_info.avatar_url` / `resume_url`,
  call `reconcilePrefix("avatars", referenced)` and `reconcilePrefix("resumes", referenced)`
  where `referenced` = the saved avatar/resume URLs. (Confirm the exact action file during
  implementation — likely `src/app/actions/*` for the info page.)

### E — monthly safety-net sweeper
**`scripts/sweep-orphans.mjs`** (new; based on `analyze-storage.mjs`)
- List bucket, build referenced set from DB, compute orphans, **delete only orphans whose
  `created_at` is older than `SWEEP_MIN_AGE_DAYS` (default 7)**, dry-run unless `--apply`.
- Schedule monthly (Vercel Cron hitting a protected route, or a local/CI cron). Always keep
  the age threshold so in-progress drafts are never swept.

### Config / flags
- `GC_ON_SAVE` (default `"false"` until verified) — master switch for B.
- `GC_DRY_RUN` (default `"true"` on first deploy) — B logs intended deletions without
  deleting.
- `SWEEP_MIN_AGE_DAYS` (default `7`) for E.

---

## Test plan (run after each rollout step)
Use a throwaway test project plus one real existing project; verify storage with the
existing `analyze-storage.mjs` and the live site after each.

1. **Create project**: new draft → upload cover, hero, 1 section image, 2 gallery → Save.
   - Expect: row has `projects/<uuid>/…` URLs; those files exist; **no extra files** under
     the prefix; live detail page renders.
2. **Edit (text only)**: change title/description → Save. Expect: zero storage changes.
3. **Replace image**: replace the cover → Save.
   - Expect: new file referenced and present; **old file gone** (deleted by B); live shows
     new image; `analyze-storage` shows no orphan added.
4. **Remove image**: delete a gallery image / a section block → Save.
   - Expect: removed file gone after save; **before** save the file still exists (no pre-save
     delete); if you remove then **navigate away without saving**, the file is still present
     and still referenced → live image not broken.
5. **Abandon draft**: new draft, upload images, leave without saving.
   - Expect: files isolated under that draft's `projects/<uuid>/`, unreferenced; **not** in
     shared `new/`; E will sweep them after the age threshold.
6. **Legacy project (the 136)**: open an existing project whose hero is a `projects/new/…`
   URL. Edit text → Save (expect new/ file untouched, still referenced). Replace its hero →
   Save (new file under `projects/<uuid>/`, old uuid-prefixed versions GC'd, the legacy
   `new/` file no longer referenced but **not deleted by B**). Verify the live page renders.
7. **Regression sweep**: run `analyze-storage.mjs` → confirm `referenced (keep)` count never
   drops unexpectedly and `referenced-but-missing` stays **0** after every test.

---

## Impact on existing saved projects (the 136 referenced files)
- **No migration of existing URLs.** Saved rows keep their current URLs, including the 7
  legacy `new/` ones. Nothing rewrites them.
- B never touches the shared `new/` prefix and never deletes a referenced path → the 136 are
  safe by construction.
- The only files B ever deletes are unreferenced objects under a *specific project's*
  `projects/<uuid>/` (or `more-projects/<uuid>/`) prefix.
- Verification gate: `analyze-storage.mjs` after enabling B must still show 136 referenced
  and 0 referenced-but-missing.

---

## Rollout order (each step independently verifiable & reversible)
1. **D first (additive, no deletes).** Ship per-project keying. Verify tests 1–2 and that new
   drafts land under `projects/<uuid>/` (not `new/`). Lowest risk; deletes nothing.
2. **B in DRY-RUN.** Deploy reconcile-on-save with `GC_ON_SAVE=true`, `GC_DRY_RUN=true`.
   Save a few projects; read logs to confirm it would delete **only** unreferenced
   `<uuid>/`-prefixed files and **never** anything referenced or under `new/`. Re-run
   `analyze-storage` to confirm nothing changed (dry run deletes nothing).
3. **B enforce.** Flip `GC_DRY_RUN=false`. Run tests 3, 4, 6. Confirm orphans drop on replace
   and the 136 stay intact.
4. **A′.** Remove the client-side `deleteFileClient` calls. Re-run tests 3–4 (removal now
   handled by B on save) and the pre-save-abandon case in test 4.
5. **E.** Land the sweeper in dry-run, review its output for a cycle, then schedule with the
   age threshold.
6. (Optional) avatar/résumé reconcile, same dry-run→enforce gate.

Hold at each step until its tests pass; do not stack steps.

---

## Rollback
- **Per-step git revert.** Each step is a separate commit; revert restores prior behavior.
- **Instant kill switch for B without a deploy:** set `GC_ON_SAVE=false` (or
  `GC_DRY_RUN=true`) in the env — disables all save-time deletion immediately.
- **A′ rollback:** re-adding the client deletes is a clean revert (only restores the old
  behavior; no data loss).
- **Data safety net:** `backup-storage/` (443 files, full pre-cleanup mirror) plus the
  `backup-storage.mjs` script make every deletion recoverable; keep the backup until B+E have
  run cleanly for a full cycle.
- **Worst case (B deleted something wrong):** restore the affected paths from
  `backup-storage/` via a small upload script (re-upload by path); URLs are deterministic so
  references stay valid.

---

## Risks & mitigations
| Risk | Mitigation |
|---|---|
| GC deletes a referenced file | Hard guard: never delete a path in the referenced set; per-`<uuid>` prefix only; dry-run gate; analyze-storage verification |
| GC runs on shared `new/` | Guard refuses prefixes `projects/new` / `more-projects/new` |
| Abandoned draft orphans | Isolated under their own `<uuid>/`; swept by E with age threshold |
| Pre-save delete breaks live image | A′ removes all client-side deletes; deletion only on committed save |
| Explicit-id insert collides | `crypto.randomUUID()`; id is a UUID PK |
| Sweeper deletes an in-progress upload | `SWEEP_MIN_AGE_DAYS` threshold (≥7d) + dry-run review |

## Open questions to confirm during implementation
- Exact action file that saves `portfolio_info` (avatar/résumé) for the optional reconcile.
- Whether `more_projects` section images are stored under `more-projects/<id>/…` or
  `projects/<id>/…` (confirm folder strings) so B reconciles the right prefix(es).
- Whether `case-study-editor.tsx` (legacy) is still reachable from the admin UI.
- Hosting for E's schedule (Vercel Cron vs external) and the auth on its trigger route.
</content>
