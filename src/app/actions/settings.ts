"use server";

import { upsertSetting } from "@/lib/supabase/queries";

export async function updatePortfolioPassword(
  _prevState: { error?: string; success?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const newPassword = (formData.get("new_password") as string)?.trim();
  const confirmPassword = (formData.get("confirm_password") as string)?.trim();

  if (!newPassword) return { error: "Password cannot be empty" };
  if (newPassword !== confirmPassword) return { error: "Passwords do not match" };
  if (newPassword.length < 6) return { error: "Password must be at least 6 characters" };

  await upsertSetting("portfolio_password", newPassword);
  return { success: "Password updated successfully" };
}

export async function updateCookieDuration(
  _prevState: { error?: string; success?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const hours = formData.get("cookie_duration_hours") as string;
  const valid = ["1", "6", "12", "24", "48", "168"];

  if (!valid.includes(hours)) return { error: "Invalid duration selected" };

  await upsertSetting("cookie_duration_hours", hours);
  return { success: "Cookie duration updated" };
}
