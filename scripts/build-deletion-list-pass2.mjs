// DRY RUN — pass 2 (family ②: old/replaced orphans inside real project folders).
// Writes deletion-list-pass2.txt (pure paths) + deletion-list-pass2-breakdown.txt.
// Validates none are referenced/kept; classifies each as exact-duplicate-of-a-KEPT-file
// vs unreferenced-but-unique; confirms all are in backup-storage/. DELETES NOTHING.

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BUCKET = "portfolio-assets";
const BACKUP_DIR = path.join(ROOT, "backup-storage");
const OUT = path.join(ROOT, "deletion-list-pass2.txt");
const OUT_BREAK = path.join(ROOT, "deletion-list-pass2-breakdown.txt");
const LIST_LIMIT = 1000;
const TABLES = ["portfolio_info", "projects", "more_projects", "about_me", "settings"];

function loadEnv(file){const env={};for(const line of fs.readFileSync(file,"utf8").split("\n")){const t=line.trim();if(!t||t.startsWith("#"))continue;const eq=t.indexOf("=");if(eq===-1)continue;let v=t.slice(eq+1).trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);env[t.slice(0,eq).trim()]=v;}return env;}
const env = loadEnv(path.join(ROOT, ".env.local"));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false,autoRefreshToken:false} });
function human(b){const u=["B","KB","MB","GB","TB"];let i=0,n=b;while(n>=1024&&i<u.length-1){n/=1024;i++;}return `${n.toFixed(2)} ${u[i]}`;}
const RX = new RegExp(`${BUCKET}/([^"'\\\\)\\s?]+)`, "g");
function extract(s,set){let m;while((m=RX.exec(s))!==null){let p=m[1];try{p=decodeURIComponent(p);}catch{}if(p)set.add(p);}}
async function listBucket(prefix=""){const out=[];let off=0;for(;;){const{data,error}=await supabase.storage.from(BUCKET).list(prefix,{limit:LIST_LIMIT,offset:off,sortBy:{column:"name",order:"asc"}});if(error)throw new Error(error.message);if(!data||!data.length)break;for(const e of data){const full=prefix?`${prefix}/${e.name}`:e.name;if(e.id===null&&!e.metadata)out.push(...await listBucket(full));else out.push({path:full,size:e.metadata?.size??0});}if(data.length<LIST_LIMIT)break;off+=LIST_LIMIT;}return out;}
function sha1(p){return crypto.createHash("sha1").update(fs.readFileSync(p)).digest("hex");}

async function run(){
  // 1) referenced set
  const referenced = new Set();
  for(const t of TABLES){const{data,error}=await supabase.from(t).select("*");if(error)throw new Error(`${t}: ${error.message}`);for(const row of data??[])extract(JSON.stringify(row),referenced);}

  // 2) bucket files (post pass-1)
  const files = await listBucket("");
  const totalBytes = files.reduce((s,f)=>s+f.size,0);

  // 3) family ② candidates: NOT referenced, NOT under new/, not placeholder
  const isNew = (p)=> p.startsWith("projects/new/")||p.startsWith("more-projects/new/");
  const candidates = files
    .filter(f => !referenced.has(f.path) && !isNew(f.path) && !f.path.endsWith(".emptyFolderPlaceholder"))
    .sort((a,b)=>a.path.localeCompare(b.path));

  // 4) hash of every KEPT (referenced, present-in-bucket) file -> set of kept content hashes
  const keptFiles = files.filter(f=>referenced.has(f.path));
  const keptHashes = new Map(); // sha1 -> example kept path
  let backupGaps = [];
  for(const f of keptFiles){
    const local = path.join(BACKUP_DIR, f.path);
    if(!fs.existsSync(local)){ backupGaps.push("KEEP not in backup: "+f.path); continue; }
    const h = sha1(local);
    if(!keptHashes.has(h)) keptHashes.set(h, f.path);
  }

  // 5) validate + classify candidates
  const violations = [];
  const dupOfKept = []; // {path,size,twin}
  const unique = [];    // {path,size}
  const notBackedUp = [];
  for(const f of candidates){
    if(referenced.has(f.path)) violations.push("REFERENCED: "+f.path);
    if(isNew(f.path)) violations.push("under new/: "+f.path);
    const local = path.join(BACKUP_DIR, f.path);
    if(!fs.existsSync(local)){ notBackedUp.push(f.path); continue; }
    const h = sha1(local);
    if(keptHashes.has(h)) dupOfKept.push({ ...f, twin: keptHashes.get(h) });
    else unique.push(f);
  }

  if(violations.length){ console.error("ABORT — validation failed:"); violations.slice(0,50).forEach(v=>console.error("  "+v)); process.exit(1); }

  const sumB = (arr)=>arr.reduce((s,f)=>s+f.size,0);
  const candBytes = sumB(candidates);

  // 6) write pure path list (all 235) + breakdown report
  fs.writeFileSync(OUT, candidates.map(f=>f.path).join("\n") + "\n");

  const B = [];
  B.push(`PASS 2 — family ② orphans (old/replaced versions in real project folders)`);
  B.push(`Total candidates: ${candidates.length}  (${human(candBytes)})`);
  B.push(`  • Exact duplicate of a KEPT file: ${dupOfKept.length}  (${human(sumB(dupOfKept))})`);
  B.push(`  • Unreferenced-but-unique:        ${unique.length}  (${human(sumB(unique))})`);
  B.push(`  • Not backed up (BLOCKER):        ${notBackedUp.length}`);
  B.push(``);
  B.push(`=== EXACT DUPLICATES OF A KEPT FILE (safe: identical bytes are retained elsewhere) ===`);
  for(const f of dupOfKept) B.push(`[dup] ${f.path}  (${human(f.size)})  == KEEP: ${f.twin}`);
  B.push(``);
  B.push(`=== UNREFERENCED-BUT-UNIQUE (no identical kept copy — eyeball these) ===`);
  for(const f of unique) B.push(`[uniq] ${f.path}  (${human(f.size)})`);
  if(notBackedUp.length){ B.push(``); B.push(`=== NOT BACKED UP ===`); notBackedUp.forEach(p=>B.push(p)); }
  fs.writeFileSync(OUT_BREAK, B.join("\n") + "\n");

  // 7) console summary
  console.log("=== PASS 2 DELETION LIST (dry run) ===");
  console.log(`Bucket now:                  ${files.length} files, ${human(totalBytes)}`);
  console.log(`Candidates (family ②):       ${candidates.length}  (${human(candBytes)})`);
  console.log(`  exact-dup of a KEPT file:  ${dupOfKept.length}  (${human(sumB(dupOfKept))})`);
  console.log(`  unreferenced-but-unique:   ${unique.length}  (${human(sumB(unique))})`);
  console.log(`All candidates in backup:    ${notBackedUp.length===0 ? "YES ✅" : "NO ❌ ("+notBackedUp.length+" missing)"}`);
  console.log(`Validation:                  ${violations.length===0 ? "✅ none referenced, none under new/" : "❌"}`);
  if(backupGaps.length) console.log(`Note: ${backupGaps.length} KEPT file(s) missing from backup (hash skipped).`);
  console.log(`\nList:      ${OUT}`);
  console.log(`Breakdown: ${OUT_BREAK}`);
  if(unique.length){
    console.log(`\nUnique (no kept twin) — first 25 for a quick look:`);
    unique.slice(0,25).forEach(f=>console.log("  "+f.path+"  ("+human(f.size)+")"));
    if(unique.length>25) console.log(`  …and ${unique.length-25} more (see breakdown file).`);
  }
}
run().catch(e=>{console.error("Fatal:",e.message);process.exit(1);});
