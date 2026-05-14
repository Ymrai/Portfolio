"use client";

import { Sun, Moon } from "@phosphor-icons/react";
import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      className="text-foreground/60 hover:text-foreground"
    >
      {resolvedTheme === "dark" ? (
        <Moon size={18} />
      ) : (
        <Sun size={18} />
      )}
    </Button>
  );
}
