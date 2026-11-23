"use client";

import { useEffect, useState } from "react";

const EXIT_MS = 450;

function reducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  if (document.documentElement.dataset.reduceMotion != null) return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Keep a node mounted through enter/exit so CSS close animations can play. */
export function usePresence(open: boolean, exitMs = EXIT_MS) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      return;
    }
    if (!mounted) return;

    const delay = reducedMotion() ? 0 : exitMs;
    if (delay === 0) {
      setMounted(false);
      setClosing(false);
      return;
    }

    setClosing(true);
    const id = window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, delay);
    return () => window.clearTimeout(id);
  }, [open, mounted, exitMs]);

  return { mounted, closing };
}
