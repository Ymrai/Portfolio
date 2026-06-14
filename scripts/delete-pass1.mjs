// PASS 1 DELETION — removes ONLY the exact paths in deletion-list-pass1.txt.
// Re-validates (each path under new/, not referenced, exists in bucket, backed up)
// immediately before deleting. Deletes in batches, then re-lists the bucket.

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BUCKET = "portfolio-assets";
const LIST_FILE = path.join(ROOT, "deletion-list-pass1.txt");
const BACKUP_DIR = path.join(ROOT, "backup-storage");
const LIST_LIMIT = 1000;
const BATCH = 50;
const TABLES = ["portfolio_info", "projects", "more_projects", "about_me", "settings"];

function loadEnv(file){const env={};for(const line of fs.readFileSync(file,"utf8").split("\n")){const t=line.trim();if(!t||t.startsWith("#"))continue;const eq=t.indexOf("=");if(eq===-1)continue;let v=t.slice(eq+1).trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);env[t.slice(0,eq).trim()]=v;}return env;}
const env = loadEnv(path.join(ROOT, ".env.local"));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false,autoRefreshToken:false} });
function human(b){const u=["B","KB","MB","GB","TB"];let i=0,n=b;while(n>=1024&&i<u.length-1){n/=1024;i++;}return `${n.toFixed(2)} ${u[i]}`;}

const RX = new RegExp(`${BUCKET}/([^"'\\\\)\\s?]+)`, "g");
function extract(s,set){let m;while((m=RX.exec(s))!==null){let p=m[1];try{p=decodeURIComponent(p);}catch{}if(p)set.add(p);}}
async function listBucket(prefix=""){const out=[];let off=0;for(;;){const{data,error}=await supabase.storage.from(BUCKET).list(prefix,{limit:LIST_LIMIT,offset:off,sortBy:{column:"name",order:"asc"}});if(error)throw new Error(error.message);if(!data||!data.length)break;for(const e of data){const full=prefix?`${prefix}/${e.name}`:e.name;if(e.id===null&&!e.metadata)out.push(...await listBucket(full));else out.push({path:full,size:e.metadata?.size??0});}if(data.length<LIST_LIMIT)break;off+=LIST_LIMIT;}return out;}

async function run(){
  const targets = fs.readFileSync(LIST_FILE,"utf8").split("\n").map(s=>s.trim()).filter(Boolean);
  console.log(`Loaded ${targets.length} paths from ${path.basename(LIST_FILE)}`);

  // --- pre-flight: snapshot bucket + referenced set, then re-validate every target
  const before = await listBucket("");
  const beforeBytes = before.reduce((s,f)=>s+f.size,0);
  const bucketSet = new Set(before.map(f=>f.path));
  const referenced = new Set();
  for(const t of TABLES){const{data,error}=await supabase.from(t).select("*");if(error)throw new Error(`${t}: ${error.message}`);for(const row of data??[])extract(JSON.stringify(row),referenced);}

  const isNew = (p)=> p.startsWith("projects/new/")||p.startsWith("more-projects/new/");
  const problems = [];
  for(const p of targets){
    if(!isNew(p)) problems.push(`NOT new/: ${p}`);
    if(referenced.has(p)) problems.push(`REFERENCED — refusing: ${p}`);
    if(!bucketSet.has(p)) problems.push(`NOT IN BUCKET: ${p}`);
    if(!fs.existsSync(path.join(BACKUP_DIR,p))) problems.push(`NOT BACKED UP: ${p}`);
  }
  if(problems.length){
    console.error("ABORT — pre-flight validation failed, deleting NOTHING:");
    problems.slice(0,50).forEach(x=>console.error("  "+x));
    process.exit(1);
  }
  console.log(`Pre-flight OK: all ${targets.length} under new/, none referenced, all exist + backed up.`);
  console.log(`Bucket before: ${before.length} files, ${human(beforeBytes)}\n`);

  // --- delete in batches
  let removed = 0;
  const errors = [];
  for(let i=0;i<targets.length;i+=BATCH){
    const chunk = targets.slice(i,i+BATCH);
    const { data, error } = await supabase.storage.from(BUCKET).remove(chunk);
    if(error){ errors.push(`batch ${i}-${i+chunk.length}: ${error.message}`); continue; }
    removed += data?.length ?? 0;
    console.log(`  removed ${Math.min(i+BATCH,targets.length)}/${targets.length}…`);
  }

  // --- post: re-list + verify
  const after = await listBucket("");
  const afterBytes = after.reduce((s,f)=>s+f.size,0);
  const afterSet = new Set(after.map(f=>f.path));
  const stillPresent = targets.filter(p=>afterSet.has(p));
  const referencedNowMissing = [...referenced].filter(p=>!afterSet.has(p));

  console.log("\n===== PASS 1 RESULT =====");
  console.log(`Delete calls acknowledged:   ${removed}`);
  console.log(`Bucket before:               ${before.length} files, ${human(beforeBytes)}`);
  console.log(`Bucket after:                ${after.length} files, ${human(afterBytes)}`);
  console.log(`Freed:                       ${human(beforeBytes-afterBytes)}`);
  console.log(`Targets still present:       ${stillPresent.length} (expect 0)`);
  console.log(`Referenced files now missing:${referencedNowMissing.length} (expect 0)`);
  if(errors.length){ console.log(`\n⚠️ errors:`); errors.forEach(e=>console.log("  "+e)); }
  if(stillPresent.length){ console.log(`\n⚠️ still present:`); stillPresent.slice(0,20).forEach(p=>console.log("  "+p)); }
  if(referencedNowMissing.length){ console.log(`\n❌ A REFERENCED FILE WENT MISSING:`); referencedNowMissing.forEach(p=>console.log("  "+p)); }
  if(!errors.length && !stillPresent.length && !referencedNowMissing.length) console.log(`\n✅ Clean: all 72 removed, every referenced file intact.`);
}
run().catch(e=>{console.error("Fatal:",e.message);process.exit(1);});
