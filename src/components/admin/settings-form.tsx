"use client";

import { useActionState } from "react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updatePortfolioPassword, updateCookieDuration } from "@/app/actions/settings";

const DURATION_OPTIONS = [
  { value: "1",   label: "1 hour" },
  { value: "6",   label: "6 hours" },
  { value: "12",  label: "12 hours" },
  { value: "24",  label: "24 hours (default)" },
  { value: "48",  label: "48 hours" },
  { value: "168", label: "7 days" },
];

interface SettingsFormProps {
  currentDuration: string;
}

export function SettingsForm({ currentDuration }: SettingsFormProps) {
  return (
    <div className="space-y-10 max-w-lg">
      <PasswordSection />
      <div className="border-t border-border" />
      <DurationSection currentDuration={currentDuration} />
    </div>
  );
}

function PasswordSection() {
  const [state, action, pending] = useActionState(updatePortfolioPassword, null);

  useEffect(() => {
    if (state?.success) toast.success(state.success);
    if (state?.error)   toast.error(state.error);
  }, [state]);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Portfolio Password</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          This password is required to access the public portfolio.
        </p>
      </div>

      <form action={action} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="new_password">New password</Label>
          <Input
            id="new_password"
            name="new_password"
            type="password"
            autoComplete="new-password"
            placeholder="Min. 6 characters"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm_password">Confirm new password</Label>
          <Input
            id="confirm_password"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat password"
            required
          />
        </div>
        <Button type="submit" disabled={pending} className="mt-1">
          {pending ? "Saving…" : "Update password"}
        </Button>
      </form>
    </section>
  );
}

function DurationSection({ currentDuration }: { currentDuration: string }) {
  const [state, action, pending] = useActionState(updateCookieDuration, null);

  useEffect(() => {
    if (state?.success) toast.success(state.success);
    if (state?.error)   toast.error(state.error);
  }, [state]);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Session Duration</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          How long visitors stay logged in before being asked for the password again.
        </p>
      </div>

      <form action={action} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="cookie_duration_hours">Session length</Label>
          <select
            id="cookie_duration_hours"
            name="cookie_duration_hours"
            defaultValue={currentDuration}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {DURATION_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={pending} className="mt-1">
          {pending ? "Saving…" : "Update duration"}
        </Button>
      </form>
    </section>
  );
}
