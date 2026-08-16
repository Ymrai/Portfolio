"use client";

import { cn } from "@/lib/utils";

/**
 * Ambient brand wash in light tints of the brand gradient — magenta #D6009D,
 * violet #731A80 and the warm #FF9A5A, matching `--brand-stops` in globals.css.
 *
 * Three soft fields travel the four corners of the viewport in a slow loop —
 * top-right, bottom-right, bottom-left, top-left — expanding and contracting as
 * they go. They share one path (see `washOrbit` in globals.css) at different
 * durations, each started partway through with a negative delay, so they trail
 * each other rather than moving as a block.
 *
 * Light and dark palettes swap through CSS custom properties, so there is no JS
 * theme check and no hydration mismatch. Purely decorative: hidden from
 * assistive tech, and it holds still under `prefers-reduced-motion`.
 */
export function GradientWash({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        "bg-[var(--wash-bg)]",
        // Light — one field per hue of the brand gradient, so the wash and the
        // card's ring read as the same palette: magenta, violet, warm.
        "[--wash-bg:#FFFFFF]",
        "[--wash-1:rgba(214,0,157,0.20)] [--wash-2:rgba(115,26,128,0.15)]",
        "[--wash-3:rgba(255,154,90,0.16)] [--wash-blend:normal]",
        // Dark — same three hues, lifted so they glow against the dark page
        "dark:[--wash-bg:#252B3B]",
        "dark:[--wash-1:rgba(214,0,157,0.30)] dark:[--wash-2:rgba(115,26,128,0.34)]",
        "dark:[--wash-3:rgba(255,154,90,0.16)] dark:[--wash-blend:screen]",
        className
      )}
    >
      <div className="gradients-container absolute inset-0 blur-3xl">
        {/* Three fields on one corner circuit, trailing each other. Each starts
            at the top-right; the negative delays on B and C (globals.css) drop
            them a third and two-thirds of the way around. */}
        <div className="absolute top-0 left-0 h-[70vh] w-[70vw] will-change-transform animate-wash-a [background:radial-gradient(circle_at_center,var(--wash-1)_0,transparent_65%)_no-repeat] [mix-blend-mode:var(--wash-blend)]" />
        <div className="absolute top-0 left-0 h-[70vh] w-[70vw] will-change-transform animate-wash-b [background:radial-gradient(circle_at_center,var(--wash-2)_0,transparent_65%)_no-repeat] [mix-blend-mode:var(--wash-blend)]" />
        <div className="absolute top-0 left-0 h-[70vh] w-[70vw] will-change-transform animate-wash-c [background:radial-gradient(circle_at_center,var(--wash-3)_0,transparent_68%)_no-repeat] [mix-blend-mode:var(--wash-blend)]" />
      </div>

      {/* Film grain — inline SVG turbulence, nothing fetched at runtime. Breaks up
          the banding that wide, low-contrast gradients produce on cheap panels. */}
      <div
        className="absolute inset-0 opacity-[0.10] dark:opacity-[0.10]"
        style={{
          mixBlendMode: "overlay",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
