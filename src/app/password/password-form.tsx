"use client";

import { use, useActionState } from "react";
import { checkPassword } from "@/app/actions/auth-password";

interface PasswordFormProps {
  searchParams: Promise<{ from?: string }>;
}

export function PasswordForm({ searchParams }: PasswordFormProps) {
  const { from = "/" } = use(searchParams);
  const [state, action, pending] = useActionState(checkPassword, null);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm space-y-8">

        {/* Logo */}
        <div className="text-center space-y-3">
          <p
            className="font-extrabold tracking-tight"
            style={{ fontSize: "32px", color: "#D6009D" }}
          >
            YR.
          </p>
          <h1 className="font-semibold text-foreground" style={{ fontSize: "20px" }}>
            This portfolio is private
          </h1>
          <p className="text-muted-foreground" style={{ fontSize: "14px" }}>
            Enter the password to continue
          </p>
        </div>

        {/* Form */}
        <form action={action} className="space-y-4">
          {/* Hidden field so the server action knows where to redirect */}
          <input type="hidden" name="from" value={from} />

          <div className="space-y-2">
            <input
              type="password"
              name="password"
              placeholder="Password"
              autoComplete="current-password"
              autoFocus
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition"
              style={{ fontSize: "16px" }}
            />
            {state?.error && (
              <p className="text-sm font-medium" style={{ color: "#e53e3e" }}>
                {state.error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: "#D6009D", fontSize: "16px" }}
          >
            {pending ? "Checking…" : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
