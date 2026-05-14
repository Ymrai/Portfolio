"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
  systemTheme: ResolvedTheme;
  themes: Theme[];
}

// ── Context ───────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  setTheme: () => {},
  resolvedTheme: "light",
  systemTheme: "light",
  themes: ["light", "dark", "system"],
});

// ── Hook — same API as next-themes' useTheme ─────────────────────────────────

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getStoredTheme(key: string, fallback: Theme): Theme {
  if (typeof window === "undefined") return fallback;
  try {
    return (localStorage.getItem(key) as Theme) || fallback;
  } catch {
    return fallback;
  }
}

function applyTheme(resolved: ResolvedTheme) {
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.style.colorScheme = resolved;
}

/** Persist theme to both localStorage and a cookie so SSR can read it. */
function persistTheme(key: string, theme: Theme) {
  try {
    localStorage.setItem(key, theme);
  } catch {}
  // Cookie is read by layout.tsx on the server to set the initial <html> class.
  // Value stored is the *resolved* preference ("dark" or "light") so the server
  // doesn't need to re-resolve "system" — but for "system" we store "system" and
  // the server falls back to "light", which the client corrects on mount if needed.
  try {
    document.cookie = `${key}=${theme}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {}
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  // Accept (and ignore) props that callers pass for next-themes compatibility
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  forcedTheme?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>("light");

  const resolvedTheme: ResolvedTheme =
    theme === "system" ? systemTheme : (theme as ResolvedTheme);

  useEffect(() => {
    // Read system preference and stored preference on mount.
    const sys = getSystemTheme();
    setSystemTheme(sys);

    const stored = getStoredTheme(storageKey, defaultTheme);
    setThemeState(stored);

    const resolved = stored === "system" ? sys : (stored as ResolvedTheme);
    applyTheme(resolved);

    // If localStorage says "system" and that resolved differently from the
    // cookie-set class, the applyTheme call above already corrected the DOM.
    // Ensure the cookie stays in sync with the resolved value so the next SSR
    // render matches what the user actually sees.
    persistTheme(storageKey, stored);

    // Track system preference changes.
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function onSystemChange(e: MediaQueryListEvent) {
      const newSys: ResolvedTheme = e.matches ? "dark" : "light";
      setSystemTheme(newSys);
      setThemeState((current) => {
        if (current === "system") applyTheme(newSys);
        return current;
      });
    }
    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, [storageKey, defaultTheme]);

  function setTheme(newTheme: Theme) {
    const resolved: ResolvedTheme =
      newTheme === "system" ? systemTheme : (newTheme as ResolvedTheme);
    setThemeState(newTheme);
    applyTheme(resolved);
    persistTheme(storageKey, newTheme);
  }

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, resolvedTheme, systemTheme, themes: ["light", "dark", "system"] }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
