// Signed admin-session token utilities.
//
// Edge- AND Node-safe: uses Web Crypto (`crypto.subtle`) only — no `node:crypto`,
// no `next/headers` — so the SAME verifier runs in the Edge proxy and in Node
// server actions/pages.
//
// Token format:  `${payload}.${signature}`
//   payload   = "v1.<issuedAtEpochMs>"
//   signature = base64url( HMAC-SHA256(SESSION_SECRET, payload) )
//
// A valid token can only be produced by code that knows SESSION_SECRET, so a
// hand-set cookie value (e.g. "true") can never pass verification.

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days — matches the cookie maxAge

function getSecret(): string | null {
  const s = process.env.SESSION_SECRET;
  return s && s.length > 0 ? s : null;
}

function toBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return toBase64Url(sig);
}

// Length-checked constant-time comparison (Edge has no crypto.timingSafeEqual).
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Create a fresh signed session token. Throws if SESSION_SECRET is unset. */
export async function createSessionToken(): Promise<string> {
  const secret = getSecret();
  if (!secret) throw new Error("SESSION_SECRET is not set");
  const payload = `v1.${Date.now()}`;
  const signature = await sign(payload, secret);
  return `${payload}.${signature}`;
}

/**
 * Verify a session token. Returns false (fails closed) when the secret is
 * missing, the token is absent/malformed, the signature doesn't match, or the
 * token is older than MAX_AGE_MS.
 */
export async function verifySessionToken(
  token?: string | null
): Promise<boolean> {
  const secret = getSecret();
  if (!secret || !token) return false;

  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;

  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!payload.startsWith("v1.") || !signature) return false;

  const expected = await sign(payload, secret);
  if (!timingSafeEqual(signature, expected)) return false;

  const issuedAt = Number(payload.slice(3));
  if (!Number.isFinite(issuedAt)) return false;
  if (Date.now() - issuedAt > MAX_AGE_MS) return false;

  return true;
}
