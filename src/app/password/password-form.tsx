"use client";

import { use, useActionState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, LockKey } from "@phosphor-icons/react";
import { checkPassword } from "@/app/actions/auth-password";
import { GradientWash } from "@/components/public/gradient-wash";

interface PasswordFormProps {
  searchParams: Promise<{ from?: string }>;
}

/**
 * Theme-aware brand magenta: #D6009D on light surfaces, #FF47C4 on dark. Both
 * are documented in globals.css as meeting WCAG AA against their own
 * background — the light value does not clear AA on the dark page, so brand
 * text must never hardcode it.
 */
const BRAND = "var(--brand-text)";


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

      {/* Two-column split — copy on the left, form on the right */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          // Columns are sized to their contents, not split in half: with equal
          // halves the copy filled 472px of a 488px column and the form 440px of
          // the other, so the gap the eye saw was 128px rather than the 64px set
          // here. A fixed 440px form column closes that dead space.
          className="w-full grid gap-12 md:gap-16 md:grid-cols-[1fr_440px] md:items-center"
          style={{ maxWidth: "1000px" }}
        >
          {/* ── Left: copy ── */}
          <div>
            <p
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

            <h1
              className="mt-6 font-bold text-foreground"
              style={{
                fontSize: "clamp(32px, 5.2vw, 52px)",
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
              }}
            >
              Enter the password.
              <br />
              Step into the{" "}
              {/* `wash-text` clips the rotating brand gradient to the glyphs.
                  inline-block keeps the gradient box tight to the word. */}
              <span className="wash-text inline-block">experience.</span>
            </h1>
          </div>

          {/* ── Right: form ── */}
          {/* Nudged down 26px on wide screens: the grid centres the two columns
              against each other, but the left column is three lines of display
              type against two quiet controls, so its optical centre sits lower
              than its geometric one. Transform rather than margin, so the shift
              does not feed back into the grid's own centring. */}
          <form
            action={action}
            className="w-full md:justify-self-end md:translate-y-[26px]"
            style={{ maxWidth: "440px" }}
          >
            <input type="hidden" name="from" value={from} />

            <div
              // Neutral grey on hover, softened brand on focus. Both colours come
              // from tokens that already flip per theme (--muted-foreground and
              // --primary), so no colour needs a dark: variant — but the states
              // do: `dark:border-white/10` compiles with `:is(.dark *)` and would
              // otherwise tie on specificity and win by source order.
              className="relative flex items-center rounded-full bg-white dark:bg-white/10 border border-black/5 dark:border-white/10 hover:border-muted-foreground/35 focus-within:border-primary/65 dark:hover:border-muted-foreground/35 dark:focus-within:border-primary transition-colors duration-200 ease-out"
            >
              {/* Colour comes from the class, not the `color` prop — Phosphor
                  passes that straight through as an SVG attribute, where a
                  var() reference does not resolve. */}
              <LockKey
                size={18}
                weight="duotone"
                className="absolute left-5 shrink-0 text-[var(--brand-text)]"
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                aria-label="Password"
                autoComplete="current-password"
                autoFocus
                required
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                style={{ height: "52px", fontSize: "14px", paddingLeft: "48px", paddingRight: "20px" }}
              />
            </div>

            {state?.error && (
              <p
                className="mt-3 text-sm font-medium"
                role="alert"
                // --destructive-text flips per theme for the same reason: the
                // light red does not clear AA on the dark page.
                style={{ color: "var(--destructive-text)" }}
              >
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              // Brand magenta per theme — #D6009D light, #FF47C4 dark, matching
              // --primary in globals.css. Colour lives in classes, not inline
              // style, so hover and active can override it. Tailwind v4 emits
              // `scale-*` as the standalone `scale` property, not `transform`.
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-full font-semibold text-white bg-[#D6009D] hover:bg-[#B00480] active:bg-[#96006E] dark:bg-[#FF47C4] dark:hover:bg-[#FF6FD2] dark:active:bg-[#E62FA9] disabled:opacity-60 disabled:hover:bg-[#D6009D] dark:disabled:hover:bg-[#FF47C4] transition-colors duration-200 ease-out"
              // paddingTop nudges the label 1px down. It measures dead-centred \u2014
              // ink centre is 0.1px off the button centre \u2014 but "Continue" has no
              // descenders, so the empty descender space below the baseline reads
              // as extra room and the label looks high. Optical, not geometric.
              style={{ height: "52px", fontSize: "15px", paddingTop: "2px" }}
            >
              {pending ? "Checking\u2026" : "Continue"}
              {!pending && <ArrowRight size={18} weight="bold" />}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
