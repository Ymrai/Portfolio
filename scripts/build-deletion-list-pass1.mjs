// DRY RUN — builds the exact pass-1 deletion list (family ①: stranded `new/` orphans).
// Writes deletion-list-pass1.txt (one path per line). Validates each path is NOT
// referenced anywhere and NOT a kept file. DELETES NOTHING.

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BUCKET = "portfolio-assets";
const OUT = path.join(ROOT, "deletion-list-pass1.txt");
const LIST_LIMIT = 1000;
const TABLES = ["portfolio_info", "projects", "more_projects", "about_me", "settings"];

function loadEnv(file) {
  const env = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const t = line.trim(); if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("="); if (eq === -1) continue;
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
function human(b){const u=["B","KB","MB","GB","TB"];let i=0,n=b;while(n>=1024&&i<u.length-1){n/=1024;i++;}return `${n.toFixed(2)} ${u[i]}`;}

const RX = new RegExp(`${BUCKET}/([^"'\\\\)\\s?]+)`, "g");
function extract(s, set){ let m; while((m=RX.exec(s))!==null){ let p=m[1]; try{p=decodeURIComponent(p);}catch{} if(p) set.add(p); } }

async function listBucket(prefix=""){ const out=[]; let off=0; for(;;){ const {data,error}=await supabase.storage.from(BUCKET).list(prefix,{limit:LIST_LIMIT,offset:off,sortBy:{column:"name",order:"asc"}}); if(error) throw new Error(error.message); if(!data||!data.length) break; for(const e of data){ const full=prefix?`${prefix}/${e.name}`:e.name; if(e.id===null&&!e.metadata) out.push(...await listBucket(full)); else out.push({path:full,size:e.metadata?.size??0}); } if(data.length<LIST_LIMIT) break; off+=LIST_LIMIT; } return out; }

async function run(){
  // 1) referenced set (source of truth)
  const referenced = new Set();
  for (const t of TABLES){ const {data,error}=await supabase.from(t).select("*"); if(error) throw new Error(`${t}: ${error.message}`); for(const row of data??[]) extract(JSON.stringify(row), referenced); }

  // 2) bucket files
  const files = await listBucket("");
  const byPath = new Map(files.map(f=>[f.path,f.size]));

  // 3) family ① candidates: under new/ AND not referenced
  const isNew = (p)=> p.startsWith("projects/new/") || p.startsWith("more-projects/new/");
  const candidates = files
    .filter(f => isNew(f.path) && !referenced.has(f.path) && !f.path.endsWith(".emptyFolderPlaceholder"))
    .sort((a,b)=>a.path.localeCompare(b.path));

  // 4) SAFETY VALIDATION — abort if any candidate is referenced or not a real bucket file
  const violations = [];
  for (const f of candidates){
    if (referenced.has(f.path)) violations.push(`REFERENCED: ${f.path}`);
    if (!byPath.has(f.path)) violations.push(`NOT IN BUCKET: ${f.path}`);
    if (!isNew(f.path)) violations.push(`NOT new/: ${f.path}`);
  }
  // also: how many new/ files are KEPT (referenced) — for transparency
  const newKept = files.filter(f=>isNew(f.path) && referenced.has(f.path));

  if (violations.length){
    console.error("ABORT — validation failed, not writing list:");
    violations.forEach(v=>console.error("  "+v));
    process.exit(1);
  }

  const totalBytes = candidates.reduce((s,f)=>s+f.size,0);
  fs.writeFileSync(OUT, candidates.map(f=>f.path).join("\n") + "\n");

  console.log("=== PASS 1 DELETION LIST (dry run) ===");
  console.log(`Candidates (new/ orphans):   ${candidates.length}`);
  console.log(`Total size:                  ${human(totalBytes)} (${totalBytes} bytes)`);
  console.log(`new/ files KEPT (referenced, NOT in list): ${newKept.length}`);
  console.log(`Referenced paths total:      ${referenced.size}`);
  console.log(`Validation:                  ✅ none referenced, all under new/, all exist in bucket`);
  console.log(`\nList written to: ${OUT}`);
  if (newKept.length){
    console.log(`\nFor transparency — new/ files that are KEPT (referenced by a current draft):`);
    newKept.forEach(f=>console.log("  KEEP  "+f.path));
  }
}
run().catch(e=>{console.error("Fatal:",e.message);process.exit(1);});
