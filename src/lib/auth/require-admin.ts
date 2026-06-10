// Server-side admin authorization guards (Node runtime — uses next/headers).
//
// - requireAdmin()      → for Server Actions: THROWS if the caller has no valid
//                         admin session, so a mutation can never proceed.
// - requireAdminPage()  → for admin page Server Components: REDIRECTS to the
//                         login page (nicer UX, and protects pages even when the
//                         Edge proxy doesn't run, e.g. `next dev` / Turbopack).
//
// Both read the signed `admin_session` cookie and verify it with the shared,
// edge-safe verifier in ./session.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken } from "./session";

export const ADMIN_COOKIE = "admin_session";

async function hasValidAdminSession(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

/** Server Actions: throw Unauthorized if there is no valid admin session. */
export async function requireAdmin(): Promise<void> {
  if (!(await hasValidAdminSession())) {
    throw new Error("Unauthorized");
  }
}

/** Admin page Server Components: redirect to login if not authenticated. */
export async function requireAdminPage(): Promise<void> {
  if (!(await hasValidAdminSession())) {
    redirect("/admin/login");
  }
}
