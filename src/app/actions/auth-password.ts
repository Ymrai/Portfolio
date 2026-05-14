"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "portfolio_auth";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function checkPassword(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const password = formData.get("password") as string;
  const from = (formData.get("from") as string) || "/";

  const expected = process.env.PORTFOLIO_PASSWORD;

  if (!expected || password !== expected) {
    return { error: "Incorrect password" };
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
    sameSite: "lax",
  });

  redirect(from.startsWith("/") ? from : "/");
}
