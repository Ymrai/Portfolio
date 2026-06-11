// Reset the DEV environment to a clean baseline for the orphan-fix before/after test.
// Deletes ALL files in the portfolio-dev bucket + ALL rows in projects/more_projects.
// GUARDED to portfolio-dev. PREVIEW by default — pass --apply to actually delete.
//   Preview:  node scripts/dev-reset.mjs
//   Execute:  node scripts/dev-reset.mjs --apply
//
// Singletons (portfolio_info, about_me, settings) are left intact.

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BUCKET = "portfolio-assets";
const DEV_REF = "uyktinxdxevqfujiwfvi";
const LIST_LIMIT = 1000;
const APPLY = process.argv.includes("--apply");

function loadEnv(file){const env={};for(const line of fs.readFileSync(file,"utf8").split("\n")){const t=line.trim();if(!t||t.startsWith("#"))continue;const eq=t.indexOf("=");if(eq===-1)continue;let v=t.slice(eq+1).trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);env[t.slice(0,eq).trim()]=v;}return env;}
const env = loadEnv(path.join(ROOT, ".env.local"));
const url = env.NEXT_PUBLIC_SUPABASE_URL || "";
if (!url.includes(DEV_REF)) {
  console.error(`ABORT: .env.local is not portfolio-dev (${DEV_REF}). Refusing to run.`);
  process.exit(1);
}
const supabase = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false,autoRefreshToken:false} });
function human(b){const u=["B","KB","MB","GB","TB"];let i=0,n=b;while(n>=1024&&i<u.length-1){n/=1024;i++;}return `${n.toFixed(2)} ${u[i]}`;}
async function listBucket(prefix=""){const out=[];let off=0;for(;;){const{data,error}=await supabase.storage.from(BUCKET).list(prefix,{limit:LIST_LIMIT,offset:off,sortBy:{column:"name",order:"asc"}});if(error)throw new Error(error.message);if(!data||!data.length)break;for(const e of data){const full=prefix?`${prefix}/${e.name}`:e.name;if(e.id===null&&!e.metadata)out.push(...await listBucket(full));else out.push({path:full,size:e.metadata?.size??0});}if(data.length<LIST_LIMIT)break;off+=LIST_LIMIT;}return out;}

const files = await listBucket("");
const { data: projects } = await supabase.from("projects").select("id,title,status");
const { data: more } = await supabase.from("more_projects").select("id,title,status");

console.log(`Target: portfolio-dev (${DEV_REF})   mode: ${APPLY ? "APPLY (will delete)" : "PREVIEW (no changes)"}\n`);
console.log(`Bucket files to delete: ${files.length} (${human(files.reduce((s,f)=>s+f.size,0))})`);
files.forEach(f=>console.log(`   - ${f.path} (${human(f.size)})`));
console.log(`\nprojects rows to delete: ${projects?.length ?? 0}`);
(projects??[]).forEach(r=>console.log(`   - ${r.id}  "${r.title}" [${r.status}]`));
console.log(`\nmore_projects rows to delete: ${more?.length ?? 0}`);
(more??[]).forEach(r=>console.log(`   - ${r.id}  "${r.title}" [${r.status}]`));
console.log(`\nLeft intact: portfolio_info, about_me, settings (singletons).`);

if (!APPLY) {
  console.log(`\nPREVIEW ONLY — nothing deleted. Re-run with --apply to execute.`);
  process.exit(0);
}

// --- APPLY ---
console.log(`\nDeleting…`);
if (files.length) {
  const paths = files.map(f=>f.path);
  for (let i=0;i<paths.length;i+=100){
    const { error } = await supabase.storage.from(BUCKET).remove(paths.slice(i,i+100));
    if (error) console.error("  bucket delete error:", error.message);
  }
  console.log(`  removed ${paths.length} bucket files`);
}
for (const [tbl, rows] of [["projects", projects], ["more_projects", more]]) {
  for (const r of rows ?? []) {
    const { error } = await supabase.from(tbl).delete().eq("id", r.id);
    if (error) console.error(`  ${tbl} ${r.id} delete error:`, error.message);
  }
  console.log(`  removed ${rows?.length ?? 0} ${tbl} rows`);
}
const after = await listBucket("");
console.log(`\nAfter reset — bucket files: ${after.length} (expect 0)`);
