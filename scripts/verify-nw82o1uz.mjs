// READ-ONLY verification of 4 specific files + the nw82o1uz section context.
// Checks each exact path against EVERY column of EVERY row in all tables, and lists
// what the DB currently references in that section. Modifies nothing.

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BUCKET = "portfolio-assets";
const TABLES = ["portfolio_info", "projects", "more_projects", "about_me", "settings"];
const SECTION = "sections/nw82o1uz/";
const TARGETS = [
  "projects/b0c1bd4c-465b-4385-be4a-708792ed7c16/sections/nw82o1uz/1779709326009-fwdpu219c0o.png",
  "projects/b0c1bd4c-465b-4385-be4a-708792ed7c16/sections/nw82o1uz/1779709526013-dur35v07ms.png",
  "projects/b0c1bd4c-465b-4385-be4a-708792ed7c16/sections/nw82o1uz/1779709643956-8rnpyqbq11x.png",
  "projects/b0c1bd4c-465b-4385-be4a-708792ed7c16/sections/nw82o1uz/1779709775845-fwpwfwzpkl9.png",
];

function loadEnv(file){const env={};for(const line of fs.readFileSync(file,"utf8").split("\n")){const t=line.trim();if(!t||t.startsWith("#"))continue;const eq=t.indexOf("=");if(eq===-1)continue;let v=t.slice(eq+1).trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);env[t.slice(0,eq).trim()]=v;}return env;}
const env = loadEnv(path.join(ROOT, ".env.local"));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false,autoRefreshToken:false} });

const RX = new RegExp(`${BUCKET}/([^"'\\\\)\\s?]+)`, "g");
function extract(s,set){let m;while((m=RX.exec(s))!==null){let p=m[1];try{p=decodeURIComponent(p);}catch{}if(p)set.add(p);}}

async function run(){
  // pull every row of every table, keep raw for substring search
  const rows = []; // {table, id, json}
  const referenced = new Set();
  for(const t of TABLES){
    const {data,error}=await supabase.from(t).select("*");
    if(error){ console.log(`(${t} read error: ${error.message})`); continue; }
    for(const row of data??[]){
      const json = JSON.stringify(row);
      rows.push({ table:t, id:row.id ?? "(no id)", json, row });
      extract(json, referenced);
    }
  }

  console.log("================ TARGET FILES ================");
  for(const target of TARGETS){
    const hits = rows.filter(r => r.json.includes(target));
    console.log(`\n• ${target}`);
    if(hits.length===0){
      console.log("   → NOT referenced in ANY column of ANY row.  (orphan ✔)");
    }else{
      for(const h of hits){
        // pinpoint which top-level field contains it
        const fields = Object.keys(h.row).filter(k => JSON.stringify(h.row[k] ?? "").includes(target));
        console.log(`   → REFERENCED in table "${h.table}" id=${h.id}, field(s): ${fields.join(", ")}  ⚠️ DO NOT DELETE`);
      }
    }
  }

  console.log("\n================ nw82o1uz SECTION — what the DB references ================");
  const inSection = [...referenced].filter(p => p.includes(SECTION)).sort();
  if(inSection.length===0) console.log("  (no nw82o1uz images referenced)");
  for(const p of inSection){
    const ts = (p.split("/").pop()||"").split("-")[0];
    const target = TARGETS.includes(p) ? "  <-- one of the 4 in question" : "";
    console.log(`  KEEP  ${p}   [ts ${ts}]${target}`);
  }

  console.log("\n================ TIMELINE: all nw82o1uz uploads in the bucket vs referenced ================");
  // list bucket files in that section to see the full upload history
  const prefix = "projects/b0c1bd4c-465b-4385-be4a-708792ed7c16/sections/nw82o1uz";
  const { data: listed, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000, sortBy:{column:"name",order:"asc"} });
  if(error){ console.log("list error:", error.message); }
  else {
    const entries = (listed||[]).filter(e=>e.id!==null).map(e=>{
      const full = `${prefix}/${e.name}`;
      const ts = e.name.split("-")[0];
      return { ts, full, referenced: referenced.has(full) };
    }).sort((a,b)=>a.ts.localeCompare(b.ts));
    for(const e of entries){
      console.log(`  [ts ${e.ts}] ${e.referenced ? "REFERENCED (keep)" : "orphan        "}  ${e.full}`);
    }
  }
}
run().catch(e=>{console.error("Fatal:",e.message);process.exit(1);});
