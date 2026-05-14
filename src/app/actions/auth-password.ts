"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSetting } from "@/lib/supabase/queries";

const COOKIE_NAME = "portfolio_auth";
const DEFAULT_DURATION_HOURS = 24;

async function getAuthSettings(): Promise<{ password: string; maxAge: number }> {
  const [storedPassword, storedDuration] = await Promise.all([
    getSetting("portfolio_password"),
    getSetting("cookie_duration_hours"),
  ]);

  // Fall back to env var if Supabase row is empty (initial setup)
  const password = storedPassword || process.env.PORTFOLIO_PASSWORD || "";
  const hours = storedDuration ? parseInt(storedDuration, 10) : DEFAULT_DURATION_HOURS;
  const maxAge = (isNaN(hours) ? DEFAULT_DURATION_HOURS : hours) * 60 * 60;

  return { password, maxAge };
}

export async function checkPassword(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const input = formData.get("password") as string;
  const from = (formData.get("from") as string) || "/";

  const { password, maxAge } = await getAuthSettings();

  if (!password || input !== password) {
    return { error: "Incorrect password" };
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, password, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
    sameSite: "lax",
  });

  redirect(from.startsWith("/") ? from : "/");
}
