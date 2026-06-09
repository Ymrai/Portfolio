// GENERIC SAFE DELETER — removes ONLY the exact paths in the list file given as argv[2].
// Re-validates immediately before deleting: every path must be NOT referenced in the DB,
// present in the bucket, and present in backup-storage/. Refuses to touch a referenced
// file. Deletes in batches, then re-lists the bucket and verifies referenced files remain.
//   usage: node scripts/delete-list.mjs deletion-list-pass2.txt

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BUCKET = "portfolio-assets";
const BACKUP_DIR = path.join(ROOT, "backup-storage");
const LIST_LIMIT = 1000, BATCH = 50;
const TABLES = ["portfolio_info", "projects", "more_projects", "about_me", "settings"];

const listArg = process.argv[2];
if (!listArg) { console.error("usage: node scripts/delete-list.mjs <list-file>"); process.exit(1); }
const LIST_FILE = path.resolve(ROOT, listArg);

function loadEnv(file){const env={};for(const line of fs.readFileSync(file,"utf8").split("\n")){const t=line.trim();if(!t||t.startsWith("#"))continue;const eq=t.indexOf("=");if(eq===-1)continue;let v=t.slice(eq+1).trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);env[t.slice(0,eq).trim()]=v;}return env;}
const env = loadEnv(path.join(ROOT, ".env.local"));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false,autoRefreshToken:false} });
function human(b){const u=["B","KB","MB","GB","TB"];let i=0,n=b;while(n>=1024&&i<u.length-1){n/=1024;i++;}return `${n.toFixed(2)} ${u[i]}`;}
const RX = new RegExp(`${BUCKET}/([^"'\\\\)\\s?]+)`, "g");
function extract(s,set){let m;while((m=RX.exec(s))!==null){let p=m[1];try{p=decodeURIComponent(p);}catch{}if(p)set.add(p);}}
async function listBucket(prefix=""){const out=[];let off=0;for(;;){const{data,error}=await supabase.storage.from(BUCKET).list(prefix,{limit:LIST_LIMIT,offset:off,sortBy:{column:"name",order:"asc"}});if(error)throw new Error(error.message);if(!data||!data.length)break;for(const e of data){const full=prefix?`${prefix}/${e.name}`:e.name;if(e.id===null&&!e.metadata)out.push(...await listBucket(full));else out.push({path:full,size:e.metadata?.size??0});}if(data.length<LIST_LIMIT)break;off+=LIST_LIMIT;}return out;}

async function run(){
  const targets = fs.readFileSync(LIST_FILE,"utf8").split("\n").map(s=>s.trim()).filter(Boolean);
  const uniq = [...new Set(targets)];
  console.log(`List: ${path.basename(LIST_FILE)} — ${uniq.length} unique paths`);

  const before = await listBucket("");
  const beforeBytes = before.reduce((s,f)=>s+f.size,0);
  const bucketSet = new Set(before.map(f=>f.path));
  const referenced = new Set();
  for(const t of TABLES){const{data,error}=await supabase.from(t).select("*");if(error)throw new Error(`${t}: ${error.message}`);for(const row of data??[])extract(JSON.stringify(row),referenced);}

  const problems = [];
  for(const p of uniq){
    if(referenced.has(p)) problems.push(`REFERENCED — refusing: ${p}`);
    if(!bucketSet.has(p)) problems.push(`NOT IN BUCKET: ${p}`);
    if(!fs.existsSync(path.join(BACKUP_DIR,p))) problems.push(`NOT BACKED UP: ${p}`);
  }
  if(problems.length){ console.error("ABORT — pre-flight failed, deleting NOTHING:"); problems.slice(0,50).forEach(x=>console.error("  "+x)); process.exit(1); }
  console.log(`Pre-flight OK: none referenced, all present in bucket + backup.`);
  console.log(`Bucket before: ${before.length} files, ${human(beforeBytes)}\n`);

  let removed = 0; const errors = [];
  for(let i=0;i<uniq.length;i+=BATCH){
    const chunk = uniq.slice(i,i+BATCH);
    const { data, error } = await supabase.storage.from(BUCKET).remove(chunk);
    if(error){ errors.push(`batch ${i}: ${error.message}`); continue; }
    removed += data?.length ?? 0;
    console.log(`  removed ${Math.min(i+BATCH,uniq.length)}/${uniq.length}…`);
  }

  const after = await listBucket("");
  const afterBytes = after.reduce((s,f)=>s+f.size,0);
  const afterSet = new Set(after.map(f=>f.path));
  const stillPresent = uniq.filter(p=>afterSet.has(p));
  const referencedNowMissing = [...referenced].filter(p=>!afterSet.has(p));

  console.log("\n===== RESULT =====");
  console.log(`Delete calls acknowledged:    ${removed}`);
  console.log(`Bucket before:                ${before.length} files, ${human(beforeBytes)}`);
  console.log(`Bucket after:                 ${after.length} files, ${human(afterBytes)}`);
  console.log(`Freed:                        ${human(beforeBytes-afterBytes)}`);
  console.log(`Targets still present:        ${stillPresent.length} (expect 0)`);
  console.log(`Referenced files now missing: ${referencedNowMissing.length} (expect 0)`);
  if(errors.length){ console.log(`\n⚠️ errors:`); errors.forEach(e=>console.log("  "+e)); }
  if(stillPresent.length){ console.log(`\n⚠️ still present:`); stillPresent.slice(0,20).forEach(p=>console.log("  "+p)); }
  if(referencedNowMissing.length){ console.log(`\n❌ A REFERENCED FILE WENT MISSING:`); referencedNowMissing.slice(0,30).forEach(p=>console.log("  "+p)); }
  if(!errors.length && !stillPresent.length && !referencedNowMissing.length) console.log(`\n✅ Clean: all ${uniq.length} removed, every referenced file intact.`);
}
run().catch(e=>{console.error("Fatal:",e.message);process.exit(1);});
