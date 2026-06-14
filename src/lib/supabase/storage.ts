import { createServiceClient } from "./server";

const BUCKET = "portfolio-assets";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
];

async function ensureBucket() {
  const supabase = await createServiceClient();
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (!data) {
    await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024,
      allowedMimeTypes: ALLOWED_TYPES,
    });
  } else {
    const existing = data.allowed_mime_types ?? [];
    const missing = ALLOWED_TYPES.filter((t) => !existing.includes(t));
    if (missing.length > 0) {
      await supabase.storage.updateBucket(BUCKET, {
        public: true,
        allowedMimeTypes: [...existing, ...missing],
      });
    }
  }
}

export async function uploadFile(file: File, path: string): Promise<string> {
  await ensureBucket();
  const supabase = await createServiceClient();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteFile(path: string): Promise<void> {
  const supabase = await createServiceClient();
  await supabase.storage.from(BUCKET).remove([path]);
}

export function pathFromUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

// ── Reconcile-on-save (orphan prevention) ────────────────────────────────────
// Tables whose rows may reference storage paths (for the global safety check).
const REFERENCED_TABLES = ["projects", "more_projects", "portfolio_info", "about_me"];

/** Recursively list every object path under a storage prefix (e.g. "projects/<id>"). */
export async function listFilesUnder(prefix: string): Promise<string[]> {
  const supabase = await createServiceClient();
  const out: string[] = [];
  async function walk(p: string) {
    let offset = 0;
    for (;;) {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .list(p, { limit: 1000, offset, sortBy: { column: "name", order: "asc" } });
      if (error || !data || data.length === 0) break;
      for (const e of data) {
        const full = p ? `${p}/${e.name}` : e.name;
        if (e.id === null && !e.metadata) await walk(full);
        else out.push(full);
      }
      if (data.length < 1000) break;
      offset += 1000;
    }
  }
  await walk(prefix);
  return out;
}

/** Extract every `portfolio-assets/<path>` reference from any JSON-serializable value. */
export function referencedPathsIn(value: unknown): Set<string> {
  const set = new Set<string>();
  const rx = new RegExp(`${BUCKET}/([^"'\\\\)\\s?]+)`, "g");
  const json = JSON.stringify(value ?? "");
  let m: RegExpExecArray | null;
  while ((m = rx.exec(json)) !== null) {
    let p = m[1];
    try {
      p = decodeURIComponent(p);
    } catch {
      /* keep raw */
    }
    if (p) set.add(p);
  }
  return set;
}

/**
 * Delete files under an entity's own storage prefix(es) that are no longer referenced.
 *
 * Hard guards (orphans only, never live data):
 *   • refuses an empty or "new" entityId (never touches the shared new/ prefix),
 *   • only ever lists/deletes under `${base}/${entityId}/`,
 *   • deletes a path ONLY if it is absent from BOTH the saved row's references
 *     AND the global referenced set (all content rows).
 * `dryRun` logs intended deletions without deleting. Never throws to the caller's
 * critical path — callers should still wrap in try/catch so a save is never blocked.
 */
export async function reconcileEntityStorage(
  entityId: string | undefined,
  bases: string[],
  rowReferenced: Set<string>,
  opts: { dryRun?: boolean } = {}
): Promise<{ deleted: string[]; wouldDelete: string[]; dryRun: boolean }> {
  const dryRun = opts.dryRun ?? false;
  const deleted: string[] = [];
  const wouldDelete: string[] = [];

  if (!entityId || entityId === "new") {
    console.warn("[reconcile] refusing: invalid entityId", entityId);
    return { deleted, wouldDelete, dryRun };
  }

  const supabase = await createServiceClient();

  // Global referenced set = saved-row refs ∪ every other row's refs.
  const referenced = new Set(rowReferenced);
  for (const t of REFERENCED_TABLES) {
    const { data } = await supabase.from(t).select("*");
    for (const row of data ?? [])
      for (const p of referencedPathsIn(row)) referenced.add(p);
  }

  for (const base of bases) {
    const prefix = `${base}/${entityId}`;
    const files = await listFilesUnder(prefix);
    const orphans = files.filter(
      (f) => !referenced.has(f) && !f.endsWith(".emptyFolderPlaceholder")
    );
    if (orphans.length === 0) continue;

    if (dryRun) {
      for (const o of orphans) {
        wouldDelete.push(o);
        console.log(`[reconcile dry-run] WOULD delete: ${o}`);
      }
    } else {
      for (let i = 0; i < orphans.length; i += 100) {
        const { error } = await supabase.storage
          .from(BUCKET)
          .remove(orphans.slice(i, i + 100));
        if (error) console.error("[reconcile] delete error:", error.message);
      }
      deleted.push(...orphans);
      console.log(`[reconcile] ${prefix}: deleted ${orphans.length} orphan(s)`);
    }
  }

  return { deleted, wouldDelete, dryRun };
}

/**
 * Reconcile flat (non-entity) prefixes such as "avatars" / "resumes" that each hold a
 * single current file. Same guards as above: only deletes files NOT in the referenced
 * set (saved row ∪ global), refuses empty/"new" prefixes. Used by the Info save.
 */
export async function reconcileFlatPrefixes(
  prefixes: string[],
  rowReferenced: Set<string>,
  opts: { dryRun?: boolean } = {}
): Promise<{ deleted: string[]; wouldDelete: string[]; dryRun: boolean }> {
  const dryRun = opts.dryRun ?? false;
  const deleted: string[] = [];
  const wouldDelete: string[] = [];
  const supabase = await createServiceClient();

  const referenced = new Set(rowReferenced);
  for (const t of REFERENCED_TABLES) {
    const { data } = await supabase.from(t).select("*");
    for (const row of data ?? [])
      for (const p of referencedPathsIn(row)) referenced.add(p);
  }

  for (const prefix of prefixes) {
    if (!prefix || prefix === "new") continue;
    const files = await listFilesUnder(prefix);
    const orphans = files.filter(
      (f) => !referenced.has(f) && !f.endsWith(".emptyFolderPlaceholder")
    );
    if (orphans.length === 0) continue;
    if (dryRun) {
      for (const o of orphans) {
        wouldDelete.push(o);
        console.log(`[reconcile dry-run] WOULD delete: ${o}`);
      }
    } else {
      for (let i = 0; i < orphans.length; i += 100) {
        const { error } = await supabase.storage
          .from(BUCKET)
          .remove(orphans.slice(i, i + 100));
        if (error) console.error("[reconcile] delete error:", error.message);
      }
      deleted.push(...orphans);
      console.log(`[reconcile] ${prefix}: deleted ${orphans.length} orphan(s)`);
    }
  }
  return { deleted, wouldDelete, dryRun };
}
