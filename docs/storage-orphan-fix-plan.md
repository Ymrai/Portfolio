# Storage orphan-prevention fix — implementation plan (REVISED)

Status: **proposal for review — NO code changed.** Revised after today's findings (dev repro,
admin-auth work, prefix audit). Approach unchanged in spirit: **D + B + A′** (+ **E** later as a
sweeper). Implement and validate entirely on dev first.

## Branch note
The auth work (D/B/A′ is unrelated to it) is **uncommitted on `admin-auth-hardening`**.
Recommendation: **finish + commit the auth fix first, then do this on a separate branch**
(e.g. `storage-orphan-prevention`) off `main`, so the two ship and roll back independently.
If you'd rather keep momentum, we can continue on `admin-auth-hardening`, accepting that one
branch then carries two unrelated fixes. (My recommendation: separate branch.)

---

## 1. Approach (re-confirmed)
- **D — per-project keying.** Generate the entity UUID up front so draft uploads land under the
  entity's own `…/<uuid>/…` prefix, never the shared `…/new/…`.
- **B — reconcile-on-save.** After a row is written, delete files under that entity's own
  prefix(es) that the saved row no longer references. **Two hard guards: never operate on a bare
  `new` prefix; never delete a referenced path** (enforced against the saved row *and* a global
  referenced scan).
- **A′ — the editor never deletes from storage.** All deletion happens server-side on save (B).
  Removes the pre-save broken-reference risk and the orphan-on-replace/remove at once.
- **E — monthly sweeper** (age-thresholded, dry-run-first): cleans anything inline logic can't —
  notably **legacy `…/new/…` orphans created before D** (B intentionally won't touch shared
  `new/`). Out of scope for this dev change; noted so the existing dev `new/` orphans are
  expected to remain until E.

---

## 2. What changed since the original plan
- **`requireAdmin()` now guards every mutating action.** B's reconcile runs *inside*
  `createProject` / `updateProject` / `createMoreProject` / `updateMoreProject` — which are
  already admin-guarded — so reconcile (a service-role delete) is admin-only by construction.
  ✅ Confirmed compatible: reconcile runs after `await requireAdmin()` and after the DB write.
- **Draft-edit fix is in** (`getProjectByIdAdmin`) — unrelated to storage, no interaction.
- **Prefix audit (critical correction):** a more_project's files are split across **two**
  prefixes (see §4). The original plan assumed one prefix per type — B must reconcile **both**
  for more_projects.
- **Legacy `CaseStudyEditor` is dead code** — defined but **not imported anywhere**, so no new
  uploads ever go to `projects/<id>/case-study/…`. Nothing to change there. (Old prod data may
  exist under that path; harmless, and B would clean it under `projects/<id>/` anyway.)

---

## 3. Resolved open questions (from the original plan)
| Question | Answer (verified today) |
|---|---|
| Exact save flow / does create accept an id? | `project-form` → `createProject(formData())` returns `{id}`, then `router.push('/admin/projects/<id>')`. **createProject/createMoreProject do NOT accept an id today** (DB `gen_random_uuid()`); D adds an optional `id`. |
| Where do more_project images live? | **cover** → `more-projects/<id>/cover`; **sections** → `projects/<id>/sections/<sectionId>` (shared `SectionsEditor` hardcodes `projects/`). No gallery uploader on more-project-form. |
| Legacy case-study editor still used? | **No** — `CaseStudyEditor` is unreferenced dead code. |

---

## 4. The prefix map (what B must reconcile)
| Entity (UUID) | Prefix(es) holding its files |
|---|---|
| **project** `P` | `projects/P/` (cover, hero, gallery, sections) — single prefix |
| **more_project** `M` | `more-projects/M/` (cover) **and** `projects/M/` (sections) — **two prefixes** |

UUIDs are unique per row, so `projects/M/` for a more_project contains only that more_project's
section files (no project shares the UUID). Cross-entity collision is impossible; the global
referenced cross-check (below) covers it regardless.

---

## 5. File-by-file changes

### D — pre-generate the UUID
- **`src/components/admin/project-form.tsx`**: for a new project, `const draftId = useState(() => crypto.randomUUID())[0]`. Use `project?.id ?? draftId` in the cover/hero/gallery folder strings (lines ~388/402/443) and `projectId={project?.id ?? draftId}` for `<SectionsEditor>` (line ~458). Pass `draftId` to `createProject`.
- **`src/components/admin/more-project-form.tsx`**: same — `draftId`; cover folder (line ~260) and `projectId={project?.id ?? draftId}` for `<SectionsEditor>` (line ~277); pass `draftId` to `createMoreProject`.
- **`src/app/actions/projects.ts` / `more-projects.ts`**: `createProject` / `createMoreProject` accept an optional `id` and `.insert({ id, … })` when provided. (more_projects keeps its slug-retry loop; id is constant across retries.)

### B — reconcile-on-save (server GC)
- **`src/lib/supabase/storage.ts`** (service role; new helpers):
  - `listFilesUnder(prefix): Promise<string[]>` — recursive list (pagination).
  - `referencedPathsIn(value): Set<string>` — regex-extract `portfolio-assets/<path>` from a JSON-serialized row (covers cover/hero/gallery/sections/case_study).
  - `reconcileEntityStorage(id, prefixes: string[], referenced: Set<string>, opts)` — for each `prefix` (e.g. `projects/<id>`, `more-projects/<id>`): list it, delete files **not in `referenced`**. **Guards:** throw/return early if `id` is falsy or `"new"`; never delete a path in `referenced`; only operate under `"<prefix>/"`. Honors a `dryRun` flag (log only). Wrapped so failures are caught/logged and **never block the save**.
- **`src/app/actions/projects.ts`**: in `createProject` and `updateProject`, after a successful write, compute `referenced = referencedPathsIn(parsed.data) ∪ globalReferenced()` and call `reconcileEntityStorage(id, ["projects/"+id], referenced, {dryRun: STORAGE_RECONCILE_DRYRUN})`.
- **`src/app/actions/more-projects.ts`**: same in `createMoreProject` / `updateMoreProject`, with `["more-projects/"+id, "projects/"+id]`.
- `globalReferenced()` = union of referenced paths across all content rows (projects, more_projects, portfolio_info, about_me) — the belt-and-suspenders guard so a path referenced by *any* row is never deleted.

### A′ — editor never deletes
- **`src/components/admin/image-upload.tsx`**: `handleRemove` → just `onChange("")` (drop `deleteFileClient`).
- **`src/components/admin/gallery-upload.tsx`**: `remove()` → just update the array (drop `deleteFileClient`).
- **`src/components/admin/pdf-upload.tsx`**: `handleRemove` → drop `deleteFileClient`.
- "Replace" already doesn't delete (unchanged) — B now cleans the superseded file on save.

### Config
- `STORAGE_RECONCILE_DRYRUN` (env): when `"true"`, B logs intended deletions but deletes nothing.
  Default behavior: **off (deletes)** on dev for testing; **on (dry-run) for the first prod
  deploy** to observe logs, then flip off. (This flag only ever makes B *safer* — it can't
  fail open — so it's fine here, unlike the rejected auth flag.)

---

## 6. The safety guarantee (most important)
**B can never delete a still-referenced file.** A path is deleted only if **all** hold:
1. it is under the saved entity's own `"<prefix>/<id>/"` (never a bare `new`/empty id), **and**
2. it is **not** in `referencedPathsIn(saved row)`, **and**
3. it is **not** in the **global** referenced set (any row), **and**
4. `dryRun` is off.

Because any path present in the saved row (or any row) is in the referenced set and therefore
excluded, a referenced file is structurally impossible to delete. Reconcile runs **after the DB
write commits**, so "referenced" reflects persisted truth, and reconcile **failures are caught
and logged, never block the save** (worst case: a harmless orphan lingers for E — never data
loss). This is exactly what `scripts/dev-orphan-check.mjs` verifies: after a save, the
**referenced (keep) count is unchanged** and only unreferenced extras disappear.

---

## 7. Rollout order
1. **Dev:** implement D + B + A′ (this branch or `storage-orphan-prevention`). `STORAGE_RECONCILE_DRYRUN` unset (deletes). Run the §8 before/after test.
2. **Preview (prod-like):** deploy a branch with `STORAGE_RECONCILE_DRYRUN=true` → exercise edits → read logs to confirm it would delete only unreferenced `<uuid>/`-prefixed files (never referenced, never `new/`).
3. **Production:** flip `STORAGE_RECONCILE_DRYRUN=false`. Re-verify with the orphan check against prod.
4. **E:** add the age-thresholded sweeper later to mop up legacy `new/` orphans.

## Rollback
- `git revert <commit>` → restores prior behavior (uploads to `new/`, no server GC, editor
  deletes client-side). No DB/storage migration involved.
- **Instant kill without redeploy:** set `STORAGE_RECONCILE_DRYRUN=true` — disables all save-time
  deletion immediately (safe direction). D and A′ are inert without B and revert cleanly.
- `backup-storage/` (prod mirror) remains the recovery net for prod.

---

## 8. Before/after test (dev) — exact steps with `scripts/dev-orphan-check.mjs`

**Baseline (now, pre-fix):** `node scripts/dev-orphan-check.mjs` → **12 files / 6 referenced / 6 orphans** (today's repro). The 6 orphans include pre-D `projects/new/…` files that **B will not touch** (E's job).

Because those legacy `new/` orphans persist, use one of these to get an unambiguous result:
- **Option A (cleanest): reset the dev bucket first** (dev is disposable) — delete the dev test
  project rows + their files so the check reads `Total = Referenced, Orphans 0`, then run the
  fixed flow and assert **Orphans: 0** total. *(I'll script this read-confirm + delete only if
  you approve — it's the one destructive step, and only on dev.)*
- **Option B (non-destructive): measure the delta** — note the current 6 orphans are all under
  `projects/new/…` (or the old test UUID); after the fixed flow, assert **no new orphans appear
  under the new project's `projects/<newUUID>/` prefix**.

**The fixed-flow test (the real proof):**
1. Create a **new** project in the admin (D gives it a UUID up front).
2. Upload a cover + hero + a section image; **replace the cover twice**; add 2 gallery images then **remove one**; Save (draft).
3. `node scripts/dev-orphan-check.mjs` →
   - **Expected: the new project contributes 0 orphans** — every file under `projects/<newUUID>/` is referenced; the replaced covers and the removed gallery image were deleted by B on save.
   - Referenced (keep) count = exactly the project's live images.
4. Re-open the saved project, replace the section image again, Save → re-run → still **0 new orphans** (B cleans the superseded file each save).
5. Repeat for a **more_project** (cover replace + section replace) → assert **0 orphans** across **both** `more-projects/<id>/` and `projects/<id>/` (validates the two-prefix reconcile).

**Pass criteria:** after the fixed flow, `dev-orphan-check` shows **0 orphans** attributable to
the edited entity (and, if you reset first, **Orphans: 0** total), while the **referenced count
never drops** for files that are still in use — proving the §6 guarantee in practice.

---

_No code written. Review, pick the branch (separate vs continue) and the test option (A reset
vs B delta), and I'll implement on dev._
</content>
