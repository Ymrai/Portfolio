// READ-ONLY analysis of the `portfolio-assets` bucket.
// Cross-references every bucket file against image URLs/paths referenced in the
// database, finds orphan candidates, and groups exact-duplicate content.
// Deletes/modifies NOTHING. Writes a markdown report to storage-cleanup-report.md.

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BUCKET = "portfolio-assets";
const BACKUP_DIR = path.join(ROOT, "backup-storage");
const REPORT = path.join(ROOT, "storage-cleanup-report.md");
const LIST_LIMIT = 1000;

// tables + the fact that they may hold image URLs (direct columns or nested JSON)
const TABLES = ["portfolio_info", "projects", "more_projects", "about_me", "settings"];

function loadEnv(file) {
  const env = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[t.slice(0, eq).trim()] = v;
  }
  return env;
}
const env = loadEnv(path.join(ROOT, ".env.local"));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function human(b) {
  const u = ["B", "KB", "MB", "GB", "TB"]; let i = 0, n = b;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(2)} ${u[i]}`;
}

// Extract every referenced storage path from an arbitrary JSON blob.
// Matches both /object/public/<bucket>/ and /render/image/public/<bucket>/ and bare bucket/ paths.
const RX = new RegExp(`${BUCKET}/([^"'\\\\)\\s?]+)`, "g");
function extractPaths(jsonString, sink, source) {
  let m;
  while ((m = RX.exec(jsonString)) !== null) {
    let p = m[1];
    try { p = decodeURIComponent(p); } catch {}
    if (!p) continue;
    if (!sink.has(p)) sink.set(p, new Set());
    sink.get(p).add(source);
  }
}

async function listBucket(prefix = "") {
  const out = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await supabase.storage.from(BUCKET)
      .list(prefix, { limit: LIST_LIMIT, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(`list "${prefix}": ${error.message}`);
    if (!data || data.length === 0) break;
    for (const e of data) {
      const full = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.id === null && !e.metadata) out.push(...await listBucket(full));
      else out.push({ path: full, size: e.metadata?.size ?? 0 });
    }
    if (data.length < LIST_LIMIT) break;
    offset += LIST_LIMIT;
  }
  return out;
}

async function run() {
  // 1) referenced paths from DB ------------------------------------------------
  const referenced = new Map(); // path -> Set(source)
  const dbErrors = [];
  for (const table of TABLES) {
    const { data, error } = await supabase.from(table).select("*");
    if (error) { dbErrors.push(`${table}: ${error.message}`); continue; }
    for (const row of data ?? []) extractPaths(JSON.stringify(row), referenced, table);
  }

  // 2) bucket listing ----------------------------------------------------------
  const files = await listBucket("");
  const totalBytes = files.reduce((s, f) => s + f.size, 0);
  const bucketPaths = new Set(files.map((f) => f.path));

  // 3) classify ----------------------------------------------------------------
  const isPlaceholder = (p) => p.endsWith(".emptyFolderPlaceholder");
  const keep = [], orphans = [], placeholders = [];
  for (const f of files) {
    if (isPlaceholder(f.path)) placeholders.push(f);
    else if (referenced.has(f.path)) keep.push(f);
    else orphans.push(f);
  }
  orphans.sort((a, b) => b.size - a.size);

  // referenced in DB but missing from the bucket (broken refs — safety signal)
  const missing = [...referenced.keys()].filter((p) => !bucketPaths.has(p)).sort();

  // 4) exact-duplicate content (hash the local verified backup mirror) ---------
  const hashes = new Map(); // sha1 -> [{path,size}]
  let hashedAll = true;
  for (const f of files) {
    const local = path.join(BACKUP_DIR, f.path);
    if (!fs.existsSync(local)) { hashedAll = false; continue; }
    const h = crypto.createHash("sha1").update(fs.readFileSync(local)).digest("hex");
    if (!hashes.has(h)) hashes.set(h, []);
    hashes.get(h).push(f);
  }
  const dupGroups = [...hashes.values()].filter((g) => g.length > 1)
    .sort((a, b) => b[0].size * (b.length - 1) - a[0].size * (a.length - 1));
  const dupSavings = dupGroups.reduce((s, g) => s + g[0].size * (g.length - 1), 0);

  // running totals
  const orphanBytes = orphans.reduce((s, f) => s + f.size, 0);
  const placeholderBytes = placeholders.reduce((s, f) => s + f.size, 0);
  const keepBytes = keep.reduce((s, f) => s + f.size, 0);

  // 5) write report ------------------------------------------------------------
  const L = [];
  L.push(`# Storage cleanup — dry run report`);
  L.push(`\nBucket: \`${BUCKET}\`  ·  generated for review  ·  **nothing was deleted or modified.**\n`);
  L.push(`## Totals`);
  L.push(`| | Files | Size |`);
  L.push(`|---|---:|---:|`);
  L.push(`| **Bucket total** | ${files.length} | ${human(totalBytes)} |`);
  L.push(`| Referenced (keep) | ${keep.length} | ${human(keepBytes)} |`);
  L.push(`| Orphan candidates (not referenced) | ${orphans.length} | ${human(orphanBytes)} |`);
  L.push(`| Empty-folder placeholders | ${placeholders.length} | ${human(placeholderBytes)} |`);
  L.push(`\nReferenced paths found in DB: **${referenced.size}** (across ${TABLES.join(", ")}).`);
  if (dbErrors.length) L.push(`\n⚠️ DB read errors: ${dbErrors.join("; ")}`);
  if (!hashedAll) L.push(`\n⚠️ Some files were missing from the local backup mirror, so duplicate hashing was partial. Re-run the backup first.`);

  if (missing.length) {
    L.push(`\n## ⚠️ Referenced in DB but MISSING from bucket (${missing.length})`);
    L.push(`These are referenced by your data but don't exist in storage (broken images / already-deleted). Listed for awareness — not a cleanup target.`);
    for (const p of missing) L.push(`- \`${p}\`  _(via: ${[...referenced.get(p)].join(", ")})_`);
  }

  // referenced (keep) list — grouped by top-level folder
  const keepSorted = [...keep].sort((a, b) => a.path.localeCompare(b.path));
  const byFolder = {};
  for (const f of keepSorted) { const top = f.path.split("/")[0]; (byFolder[top] ??= []).push(f); }
  L.push(`\n## Referenced files — KEEP (${keep.length}, ${human(keepBytes)})`);
  L.push(`Every file below is referenced by your database, so it stays. Grouped by folder.`);
  for (const folder of Object.keys(byFolder).sort()) {
    const g = byFolder[folder];
    const fb = g.reduce((s, f) => s + f.size, 0);
    L.push(`\n### ${folder}/ — ${g.length} files, ${human(fb)}`);
    for (const f of g) L.push(`- \`${f.path}\` (${human(f.size)})  _via: ${[...referenced.get(f.path)].join(", ")}_`);
  }

  L.push(`\n## Orphan candidates — not referenced anywhere (${orphans.length}, ${human(orphanBytes)})`);
  L.push(`Sorted largest-first, with a running total of space that would be freed if removed.`);
  L.push(`\n| # | Path | Size | Running total |`);
  L.push(`|---:|---|---:|---:|`);
  let run1 = 0;
  orphans.forEach((f, i) => { run1 += f.size; L.push(`| ${i + 1} | \`${f.path}\` | ${human(f.size)} | ${human(run1)} |`); });

  if (placeholders.length) {
    L.push(`\n## Empty-folder placeholders (${placeholders.length}, ${human(placeholderBytes)})`);
    L.push(`Supabase \`.emptyFolderPlaceholder\` artifacts — always safe to remove, negligible size.`);
    placeholders.forEach((f) => L.push(`- \`${f.path}\` (${human(f.size)})`));
  }

  L.push(`\n## Exact-duplicate content — same bytes under different names (${dupGroups.length} groups)`);
  L.push(`Potential extra savings if each group is collapsed to one copy: **${human(dupSavings)}**.`);
  L.push(`Each row marks whether the copy is **[referenced]** or **[orphan]** — when collapsing, keep a referenced copy.`);
  dupGroups.forEach((g, i) => {
    L.push(`\n**Group ${i + 1}** — ${human(g[0].size)} each × ${g.length} copies → save ${human(g[0].size * (g.length - 1))}`);
    g.forEach((f) => {
      const tag = isPlaceholder(f.path) ? "placeholder" : referenced.has(f.path) ? "referenced" : "orphan";
      L.push(`- [${tag}] \`${f.path}\``);
    });
  });

  L.push(`\n---\n_Report only. No deletions performed. Review before any cleanup (Step 3)._`);
  fs.writeFileSync(REPORT, L.join("\n"));

  // 6) console summary ---------------------------------------------------------
  console.log(`Bucket total:        ${files.length} files, ${human(totalBytes)}`);
  console.log(`Referenced (keep):   ${keep.length} files, ${human(keepBytes)}`);
  console.log(`Orphan candidates:   ${orphans.length} files, ${human(orphanBytes)}`);
  console.log(`Placeholders:        ${placeholders.length} files, ${human(placeholderBytes)}`);
  console.log(`Referenced paths in DB: ${referenced.size}`);
  console.log(`Referenced-but-missing: ${missing.length}`);
  console.log(`Exact-duplicate groups: ${dupGroups.length}  (collapse savings ${human(dupSavings)})`);
  if (dbErrors.length) console.log(`DB errors: ${dbErrors.join("; ")}`);
  console.log(`\nReport written to: ${REPORT}`);
}
run().catch((e) => { console.error("Fatal:", e.message); process.exit(1); });
