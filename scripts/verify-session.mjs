// Throwaway unit check for src/lib/auth/session.ts.
// Loads SESSION_SECRET from .env.local, transpiles session.ts in-memory (using the
// already-installed `typescript`), imports it, and asserts the verifier behaviour.
// No network, no dev server needed. Run:  node scripts/verify-session.mjs
//
// Safe to delete after use.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// 1) Load SESSION_SECRET (and the rest) from .env.local into process.env.
const envText = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
for (const line of envText.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  const k = t.slice(0, i).trim();
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (!(k in process.env)) process.env[k] = v;
}
if (!process.env.SESSION_SECRET) {
  console.error("✗ SESSION_SECRET is empty in .env.local — paste your dev value first.");
  process.exit(1);
}

// 2) Transpile session.ts → ESM in memory, then import via a data: URL.
const ts = require("typescript");
const src = fs.readFileSync(path.join(ROOT, "src/lib/auth/session.ts"), "utf8");
const js = ts.transpileModule(src, {
  compilerOptions: { module: "ESNext", target: "ES2020" },
}).outputText;
const mod = await import(
  "data:text/javascript;base64," + Buffer.from(js).toString("base64")
);
const { createSessionToken, verifySessionToken } = mod;

// 3) Assertions.
let ok = true;
function check(name, cond) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${name}`);
  if (!cond) ok = false;
}

check('verify("true") === false', (await verifySessionToken("true")) === false);
check("verify(undefined) === false", (await verifySessionToken(undefined)) === false);

const token = await createSessionToken();
check("verify(<fresh token>) === true", (await verifySessionToken(token)) === true);

// Tamper the signature deterministically (flip its first char).
const dot = token.lastIndexOf(".");
const sig = token.slice(dot + 1);
const tampered = token.slice(0, dot + 1) + (sig[0] === "A" ? "B" : "A") + sig.slice(1);
check("verify(<tampered sig>) === false", (await verifySessionToken(tampered)) === false);

console.log(ok ? "\n✅ ALL CHECKS PASSED" : "\n❌ SOME CHECKS FAILED");
process.exit(ok ? 0 : 1);
