"use client";

import { ArrowUp } from "@phosphor-icons/react";

export function ScrollToTopButton() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground border border-border/60 rounded-full px-4 py-2.5 hover:border-foreground/40 transition-all duration-200 shrink-0"
    >
      <ArrowUp size={14} />
      Top
    </button>
  );
}
