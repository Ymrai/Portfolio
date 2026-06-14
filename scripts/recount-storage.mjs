// READ-ONLY re-count of the live portfolio-assets bucket. Lists everything, totals,
// per-top-level-folder breakdown, and flags files added since yesterday's cleanup
// (path absent from backup-storage/ mirror, and/or created_at within a recent window).
// Deletes/modifies NOTHING.

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BUCKET = "portfolio-assets";
const BACKUP_DIR = path.join(ROOT, "backup-storage");
const LIST_LIMIT = 1000;

function loadEnv(file){const env={};for(const line of fs.readFileSync(file,"utf8").split("\n")){const t=line.trim();if(!t||t.startsWith("#"))continue;const eq=t.indexOf("=");if(eq===-1)continue;let v=t.slice(eq+1).trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);env[t.slice(0,eq).trim()]=v;}return env;}
const env = loadEnv(path.join(ROOT, ".env.local"));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false,autoRefreshToken:false} });
function human(b){const u=["B","KB","MB","GB","TB"];let i=0,n=b;while(n>=1024&&i<u.length-1){n/=1024;i++;}return `${n.toFixed(2)} ${u[i]}`;}

async function listBucket(prefix=""){const out=[];let off=0;for(;;){const{data,error}=await supabase.storage.from(BUCKET).list(prefix,{limit:LIST_LIMIT,offset:off,sortBy:{column:"name",order:"asc"}});if(error)throw new Error(`list "${prefix}": ${error.message}`);if(!data||!data.length)break;for(const e of data){const full=prefix?`${prefix}/${e.name}`:e.name;if(e.id===null&&!e.metadata)out.push(...await listBucket(full));else out.push({path:full,size:e.metadata?.size??0,created_at:e.created_at??e.metadata?.lastModified??null});}if(data.length<LIST_LIMIT)break;off+=LIST_LIMIT;}return out;}

function tsFromName(p){ const m = (p.split("/").pop()||"").match(/^(\d{13})-/); return m ? Number(m[1]) : null; }

async function run(){
  const now = Date.now();
  const files = await listBucket("");
  const totalBytes = files.reduce((s,f)=>s+f.size,0);

  // per top-level folder
  const folders = {};
  for(const f of files){ const top = f.path.split("/")[0]; (folders[top] ??= {n:0,b:0}); folders[top].n++; folders[top].b += f.size; }

  // new vs existing (path absent from yesterday's backup mirror)
  const backupExists = (p)=> fs.existsSync(path.join(BACKUP_DIR, p));
  const newFiles = files.filter(f=>!backupExists(f.path));
  const newBytes = newFiles.reduce((s,f)=>s+f.size,0);

  // recency by created_at (server) within windows
  const within = (h)=> files.filter(f=> f.created_at && (now - new Date(f.created_at).getTime()) <= h*3600*1000);
  const last18 = within(18), last24 = within(24);
  const sum = (arr)=>arr.reduce((s,f)=>s+f.size,0);

  // recency by filename-embedded epoch (client upload time) for the "new" set
  const newTs = newFiles.map(f=>tsFromName(f.path)).filter(Boolean).sort((a,b)=>a-b);

  console.log("================ LIVE BUCKET — NOW (read-only) ================");
  console.log(`Total files:  ${files.length}`);
  console.log(`Total size:   ${human(totalBytes)} (${totalBytes} bytes)`);
  console.log("\nPer top-level folder:");
  for(const k of Object.keys(folders).sort()) console.log(`  ${k.padEnd(16)} ${String(folders[k].n).padStart(5)} files   ${human(folders[k].b)}`);

  console.log("\n================ COMPARE TO YESTERDAY'S END STATE (136 files, ~583.82 MB) ================");
  console.log(`Files:  136  ->  ${files.length}   (+${files.length-136})`);
  console.log(`Size:   583.82 MB  ->  ${human(totalBytes)}   (+${human(totalBytes-583.82*1024*1024)})`);

  console.log("\n================ FILES ADDED SINCE YESTERDAY ================");
  console.log(`Not present in backup-storage/ mirror (i.e. uploaded after yesterday's backup): ${newFiles.length} files, ${human(newBytes)}`);
  console.log(`created_at within last 18h:  ${last18.length} files, ${human(sum(last18))}`);
  console.log(`created_at within last 24h:  ${last24.length} files, ${human(sum(last24))}`);
  if(newTs.length){
    const d = (ms)=> new Date(ms).toISOString();
    console.log(`\nFilename-embedded upload times of NEW files: earliest ${d(newTs[0])}  …  latest ${d(newTs[newTs.length-1])}`);
    const newWithin18 = newTs.filter(t=> (now-t) <= 18*3600*1000).length;
    console.log(`NEW files whose filename timestamp is within last 18h: ${newWithin18}/${newTs.length}`);
  }

  // which project UUID folders are NEW vs were-here-yesterday
  const topNew = {};
  for(const f of newFiles){ const seg = f.path.split("/").slice(0,2).join("/"); (topNew[seg] ??= {n:0,b:0}); topNew[seg].n++; topNew[seg].b += f.size; }
  console.log("\nNew files grouped by folder/UUID (top 25 by size):");
  Object.entries(topNew).sort((a,b)=>b[1].b-a[1].b).slice(0,25).forEach(([k,v])=>console.log(`  ${k}  — ${v.n} files, ${human(v.b)}`));
}
run().catch(e=>{console.error("Fatal:",e.message);process.exit(1);});
