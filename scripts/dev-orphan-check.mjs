// READ-ONLY orphan check for the DEV bucket. Lists portfolio-dev storage and
// cross-references against image URLs referenced in the dev DB. Writes nothing
// (no report file, no bucket/DB changes). Guarded to run only against dev.
//   node scripts/dev-orphan-check.mjs

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BUCKET = "portfolio-assets";
const DEV_REF = "uyktinxdxevqfujiwfvi"; // portfolio-dev project ref (guard)
const LIST_LIMIT = 1000;
const TABLES = ["portfolio_info", "projects", "more_projects", "about_me", "settings"];

function loadEnv(file){const env={};for(const line of fs.readFileSync(file,"utf8").split("\n")){const t=line.trim();if(!t||t.startsWith("#"))continue;const eq=t.indexOf("=");if(eq===-1)continue;let v=t.slice(eq+1).trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);env[t.slice(0,eq).trim()]=v;}return env;}
const env = loadEnv(path.join(ROOT, ".env.local"));
const url = env.NEXT_PUBLIC_SUPABASE_URL || "";
if (!url.includes(DEV_REF)) {
  console.error(`ABORT: .env.local is not pointed at portfolio-dev (${DEV_REF}). Active URL ref does not match. Refusing to run.`);
  process.exit(1);
}
const supabase = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false,autoRefreshToken:false} });
function human(b){const u=["B","KB","MB","GB","TB"];let i=0,n=b;while(n>=1024&&i<u.length-1){n/=1024;i++;}return `${n.toFixed(2)} ${u[i]}`;}
const RX = new RegExp(`${BUCKET}/([^"'\\\\)\\s?]+)`, "g");
function extract(s,set){let m;while((m=RX.exec(s))!==null){let p=m[1];try{p=decodeURIComponent(p);}catch{}if(p)set.add(p);}}
async function listBucket(prefix=""){const out=[];let off=0;for(;;){const{data,error}=await supabase.storage.from(BUCKET).list(prefix,{limit:LIST_LIMIT,offset:off,sortBy:{column:"name",order:"asc"}});if(error)throw new Error(error.message);if(!data||!data.length)break;for(const e of data){const full=prefix?`${prefix}/${e.name}`:e.name;if(e.id===null&&!e.metadata)out.push(...await listBucket(full));else out.push({path:full,size:e.metadata?.size??0});}if(data.length<LIST_LIMIT)break;off+=LIST_LIMIT;}return out;}

const referenced = new Set();
for (const t of TABLES) {
  const { data, error } = await supabase.from(t).select("*");
  if (error) { console.log(`(skip ${t}: ${error.message})`); continue; }
  for (const row of data ?? []) extract(JSON.stringify(row), referenced);
}

const files = await listBucket("");
const isPlaceholder = (p)=>p.endsWith(".emptyFolderPlaceholder");
const keep = files.filter(f=>!isPlaceholder(f.path) && referenced.has(f.path));
const orphans = files.filter(f=>!isPlaceholder(f.path) && !referenced.has(f.path)).sort((a,b)=>b.size-a.size);
const sum = (a)=>a.reduce((s,f)=>s+f.size,0);

console.log(`DEV bucket (${DEV_REF})`);
console.log(`  Total files:        ${files.length}  (${human(sum(files))})`);
console.log(`  Referenced (keep):  ${keep.length}  (${human(sum(keep))})`);
console.log(`  Orphans:            ${orphans.length}  (${human(sum(orphans))})`);
console.log(`  Referenced paths in DB: ${referenced.size}`);
if (orphans.length) {
  console.log(`\n  Sample orphans (largest first):`);
  orphans.slice(0, 12).forEach(f=>console.log(`    ${f.path}  (${human(f.size)})`));
}
