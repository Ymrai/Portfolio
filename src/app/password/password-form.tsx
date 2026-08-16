"use client";

import { use, useActionState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, LockKey } from "@phosphor-icons/react";
import { checkPassword } from "@/app/actions/auth-password";
import { GradientWash } from "@/components/public/gradient-wash";

interface PasswordFormProps {
  searchParams: Promise<{ from?: string }>;
}

const BRAND = "#D6009D";


export function PasswordForm({ searchParams }: PasswordFormProps) {
  const { from = "/" } = use(searchParams);
  const [state, action, pending] = useActionState(checkPassword, null);

  return (
    <div
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: "var(--background)" }}
    >
      <GradientWash />

      {/* Fixed logo — top-left */}
      <div className="fixed top-6 left-8 z-20">
        <span
          className="font-extrabold tracking-tight select-none"
          style={{ fontSize: "22px", color: BRAND }}
        >
          YR.
        </span>
      </div>

      {/* Centered card */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          // `wash-border` (globals.css) draws the rotating gradient ring on a
          // masked ::before, so the card keeps its own translucent fill here.
          className="w-full rounded-[32px] bg-white/45 dark:bg-white/[0.05] wash-border p-8"
          style={{
            maxWidth: "504px",
            backdropFilter: "blur(28px) saturate(180%)",
            WebkitBackdropFilter: "blur(28px) saturate(180%)",
            boxShadow: "0 14px 44px -26px rgba(214,0,157,0.14), 0 3px 12px -8px rgba(0,0,0,0.05)",
          }}
        >
          {/* Eyebrow */}
          <p
            className="text-center"
            style={{
              fontSize: "clamp(11px, 2.6vw, 13px)",
              letterSpacing: "0.14em",
              color: BRAND,
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            Yael Rosenberg <span style={{ fontSize: "16px" }}>·</span> Product Designer
          </p>

          {/* Headline */}
          <h1
            className="mt-6 text-center font-bold text-foreground"
            style={{ fontSize: "clamp(24px, 6vw, 32px)", lineHeight: 1.2, letterSpacing: "-0.02em" }}
          >
            Complex products.
            <br />
            Clear <span style={{ color: BRAND }}>experiences.</span>
          </h1>

          {/* Subtitle */}
          <p
            className="mt-4 text-center text-muted-foreground"
            style={{ fontSize: "14px" }}
          >
            Enter the password to see how
          </p>

          {/* Form */}
          <form action={action} className="mt-9">
            <input type="hidden" name="from" value={from} />

            <div
              // Solid brand border for hover and focus — no gradient here, so the
              // card's rotating ring stays the only gradient on the page.
              className="relative mx-auto flex items-center rounded-full bg-white dark:bg-white/10 border border-black/5 dark:border-white/10 hover:border-[#D6009D]/40 focus-within:border-[#D6009D] dark:hover:border-[#FF47C4]/40 dark:focus-within:border-[#FF47C4] transition-colors duration-200 ease-out"
              style={{ maxWidth: "440px" }}
            >
              <LockKey
                size={18}
                weight="duotone"
                color={BRAND}
                className="absolute left-4 shrink-0"
              />
              <input
                type="password"
                name="password"
                placeholder="Enter password"
                aria-label="Password"
                autoComplete="current-password"
                autoFocus
                required
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                style={{ height: "48px", fontSize: "14px", paddingLeft: "44px", paddingRight: "52px" }}
              />
              <button
                type="submit"
                disabled={pending}
                aria-label="Submit password"
                // Colour lives in classes, not inline style, so the hover and
                // active states can actually override it.
                // Brand magenta per theme — #D6009D light, #FF47C4 dark, matching
                // --primary in globals.css. Colour lives in classes, not inline
                // style, so hover and active can override it. Tailwind v4 emits
                // `scale-*` as the standalone `scale` property, not `transform`.
                className="absolute right-1.5 flex items-center justify-center rounded-full text-white bg-[#D6009D] hover:bg-[#B00480] active:bg-[#96006E] dark:bg-[#FF47C4] dark:hover:bg-[#FF6FD2] dark:active:bg-[#E62FA9] hover:scale-105 active:scale-100 disabled:opacity-60 disabled:hover:bg-[#D6009D] dark:disabled:hover:bg-[#FF47C4] disabled:hover:scale-100 transition-[background-color,scale] duration-200 ease-out"
                style={{ height: "36px", width: "36px" }}
              >
                <ArrowRight size={18} weight="bold" />
              </button>
            </div>

            {state?.error && (
              <p
                className="mt-3 text-center text-sm font-medium"
                role="alert"
                style={{ color: "#e53e3e" }}
              >
                {state.error}
              </p>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
}
