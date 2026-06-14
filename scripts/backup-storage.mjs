// Read-only backup of the `portfolio-assets` Supabase Storage bucket.
// Lists every file recursively and downloads it into ./backup-storage/,
// preserving the subfolder structure. Never deletes or uploads anything.
// Resumable: files already present locally with a matching size are skipped.

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BUCKET = "portfolio-assets";
const OUT_DIR = path.join(ROOT, "backup-storage");
const LIST_LIMIT = 1000;
const CONCURRENCY = 6;

// --- load env from .env.local (no external deps) ---
function loadEnv(file) {
  const env = {};
  const raw = fs.readFileSync(file, "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const env = loadEnv(path.join(ROOT, ".env.local"));
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function humanSize(bytes) {
  const u = ["B", "KB", "MB", "GB", "TB"];
  let i = 0, n = bytes;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(2)} ${u[i]}`;
}

// Recursively collect every file path in the bucket.
async function listAllFiles(prefix = "") {
  const files = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(prefix, { limit: LIST_LIMIT, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(`list "${prefix}": ${error.message}`);
    if (!data || data.length === 0) break;

    for (const entry of data) {
      const full = prefix ? `${prefix}/${entry.name}` : entry.name;
      // Folders come back with id === null and no metadata.
      if (entry.id === null && !entry.metadata) {
        const nested = await listAllFiles(full);
        files.push(...nested);
      } else {
        files.push({ path: full, size: entry.metadata?.size ?? null });
      }
    }
    if (data.length < LIST_LIMIT) break;
    offset += LIST_LIMIT;
  }
  return files;
}

async function downloadOne(file) {
  const dest = path.join(OUT_DIR, file.path);
  // Resume: skip if already downloaded with matching size.
  if (file.size != null && fs.existsSync(dest) && fs.statSync(dest).size === file.size) {
    return { path: file.path, bytes: file.size, skipped: true };
  }
  const { data, error } = await supabase.storage.from(BUCKET).download(file.path);
  if (error) throw new Error(`download "${file.path}": ${error.message}`);
  const buf = Buffer.from(await data.arrayBuffer());
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  return { path: file.path, bytes: buf.length, skipped: false };
}

async function run() {
  console.log(`Backing up bucket "${BUCKET}" from ${SUPABASE_URL}`);
  console.log(`Output: ${OUT_DIR}\n`);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log("Listing files (recursive)…");
  const files = await listAllFiles("");
  console.log(`Found ${files.length} files. Downloading (concurrency ${CONCURRENCY})…\n`);

  let downloaded = 0, skipped = 0, totalBytes = 0, done = 0;
  const errors = [];
  const queue = [...files];

  async function worker() {
    for (;;) {
      const file = queue.shift();
      if (!file) return;
      try {
        const r = await downloadOne(file);
        totalBytes += r.bytes;
        if (r.skipped) skipped++; else downloaded++;
      } catch (e) {
        errors.push(e.message);
      }
      done++;
      if (done % 25 === 0 || done === files.length) {
        process.stdout.write(`\r  ${done}/${files.length} processed…`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  process.stdout.write("\n");

  // Verify against what's actually on disk.
  let onDiskCount = 0, onDiskBytes = 0;
  for (const f of files) {
    const dest = path.join(OUT_DIR, f.path);
    if (fs.existsSync(dest)) { onDiskCount++; onDiskBytes += fs.statSync(dest).size; }
  }

  console.log("\n===== BACKUP SUMMARY =====");
  console.log(`Files in bucket (listed):     ${files.length}`);
  console.log(`Downloaded this run:          ${downloaded}`);
  console.log(`Skipped (already present):    ${skipped}`);
  console.log(`Files verified on disk:       ${onDiskCount}`);
  console.log(`Total size on disk:           ${humanSize(onDiskBytes)} (${onDiskBytes} bytes)`);
  if (errors.length) {
    console.log(`\n⚠️  ${errors.length} error(s):`);
    errors.slice(0, 20).forEach((e) => console.log("   - " + e));
  } else {
    console.log("\n✅ No errors.");
  }
  if (onDiskCount !== files.length) {
    console.log(`\n⚠️  MISMATCH: ${files.length} listed vs ${onDiskCount} on disk — backup incomplete.`);
    process.exitCode = 2;
  } else {
    console.log("\n✅ Verified: every listed file is present on disk.");
  }
}

run().catch((e) => { console.error("\nFatal:", e.message); process.exit(1); });
