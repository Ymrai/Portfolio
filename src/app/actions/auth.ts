"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken } from "@/lib/auth/session";

export async function loginAction(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const password = formData.get("password") as string;

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return { error: "Invalid password" };
  }

  const cookieStore = await cookies();
  // Signed, unforgeable session token (HMAC of SESSION_SECRET) — not a constant.
  cookieStore.set("admin_session", await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  redirect("/admin");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  cookieStore.delete("admin_auth"); // clear the legacy constant cookie too
  redirect("/admin/login");
}
