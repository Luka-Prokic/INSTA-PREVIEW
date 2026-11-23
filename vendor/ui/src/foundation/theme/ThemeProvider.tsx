"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { type Theme } from "@luka-prokic/tokens";

export type ThemePreference = Theme | "system";

interface ThemeContextValue {
  /** The user's preference, including `system`. */
  theme: ThemePreference;
  /** The concrete theme currently applied (`light` or `dark`). */
  resolvedTheme: Theme;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  children: ReactNode;
  /** Initial preference before any stored value is read. Defaults to `system`. */
  defaultTheme?: ThemePreference;
  /** localStorage key for persistence. Set to `null` to disable persistence. */
  storageKey?: string | null;
  /** Element that receives the `data-theme` attribute. Defaults to <html>. */
  targetSelector?: string;
}

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Applies a theme preference to the document via `[data-theme]` and exposes
 * it through context. Consumers switch themes with `useTheme()`.
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "caka-theme",
  targetSelector,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemePreference>(defaultTheme);
  const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme);

  useEffect(() => {
    if (!storageKey) return;
    const stored = window.localStorage.getItem(storageKey) as ThemePreference | null;
    if (stored) setThemeState(stored);
  }, [storageKey]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemTheme(media.matches ? "dark" : "light");
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const resolvedTheme: Theme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    const target = targetSelector
      ? document.querySelector<HTMLElement>(targetSelector)
      : document.documentElement;
    if (target) target.setAttribute("data-theme", resolvedTheme);
  }, [resolvedTheme, targetSelector]);

  const setTheme = useCallback(
    (next: ThemePreference) => {
      setThemeState(next);
      if (storageKey) window.localStorage.setItem(storageKey, next);
    },
    [storageKey],
  );

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Access and control the active theme. Must be used within a ThemeProvider. */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
