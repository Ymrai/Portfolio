import type { Metadata } from "next";
import { getAllSettings } from "@/lib/supabase/queries";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getAllSettings();
  const currentDuration = settings["cookie_duration_hours"] ?? "24";

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage portfolio access and session preferences.
        </p>
      </div>

      <div className="rounded-lg border border-border p-6">
        <SettingsForm currentDuration={currentDuration} />
      </div>

      <p className="text-xs text-muted-foreground">
        Changes take effect immediately. Existing visitor sessions use the old
        cookie until it expires — to force everyone to re-authenticate, change
        the password.
      </p>
    </div>
  );
}
