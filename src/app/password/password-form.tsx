"use client";

import { use, useActionState } from "react";
import { motion } from "framer-motion";
import { Key } from "@phosphor-icons/react";
import { checkPassword } from "@/app/actions/auth-password";

interface PasswordFormProps {
  searchParams: Promise<{ from?: string }>;
}

export function PasswordForm({ searchParams }: PasswordFormProps) {
  const { from = "/" } = use(searchParams);
  const [state, action, pending] = useActionState(checkPassword, null);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(to bottom, rgba(214,0,157,0.12) 0%, rgba(214,0,157,0.04) 30%, transparent 60%)",
        backgroundColor: "var(--background)",
      }}
    >
      {/* Fixed logo — top-left */}
      <div className="fixed top-6 left-8 z-10">
        <span
          className="font-extrabold tracking-tight select-none"
          style={{ fontSize: "22px", color: "#D6009D" }}
        >
          YR.
        </span>
      </div>

      {/* Centered card */}
      <div className="flex-1 flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full bg-background rounded-2xl shadow-xl space-y-6"
          style={{ maxWidth: "420px", padding: "48px" }}
        >
          {/* Label */}
          <p className="text-center" style={{ fontSize: "12px", letterSpacing: "0.12em", color: "#D6009D", fontWeight: 600, textTransform: "uppercase" }}>
            Yael Rosenberg <span style={{ fontSize: "16px" }}>·</span> Product Designer
          </p>

          {/* Icon */}
          <div className="flex justify-center">
            <div
              className="flex items-center justify-center w-14 h-14 rounded-full"
              style={{ backgroundColor: "rgba(214,0,157,0.10)" }}
            >
              <Key size={32} weight="light" color="#D6009D" />
            </div>
          </div>

          {/* Text */}
          <div className="text-center space-y-1.5">
            <h1 className="font-bold text-foreground" style={{ fontSize: "24px" }}>
              Nice to meet you,
            </h1>
            <p className="text-sm text-muted-foreground leading-snug">
              Enter the password to view my portfolio.
            </p>
          </div>

          {/* Form */}
          <form action={action} className="space-y-3">
            <input type="hidden" name="from" value={from} />

            <input
              type="password"
              name="password"
              placeholder="Password"
              autoComplete="current-password"
              autoFocus
              required
              className="w-full rounded-lg border border-border bg-background px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition"
              style={{ height: "44px", fontSize: "14px" }}
            />

            {state?.error && (
              <p className="text-sm font-medium" style={{ color: "#e53e3e" }}>
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg font-semibold text-white text-base transition hover:opacity-90 active:opacity-80 disabled:opacity-60"
              style={{ backgroundColor: "#D6009D", height: "44px" }}
            >
              {pending ? "Checking…" : "View Portfolio"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
