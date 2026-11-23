"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { getScrollParent, getScrollPort } from "./scrollParent";

export type UseScrollProgressOptions = {
  /** Progress 0 when element top is at this fraction of the scrollport height. */
  start?: number;
  /** Progress 1 when element top is at this fraction of the scrollport height. */
  end?: number;
  /** When false, skip listeners and keep progress at 0. Defaults to true. */
  enabled?: boolean;
};

/**
 * Maps an element's position through its nearest scrollport to 0-1 progress.
 * Works with nested scrollers (e.g. Playground AppShellPreview), not only window.
 * Scroll handlers are rAF-coalesced; sub-0.002 deltas are skipped.
 */
export function useScrollProgress(
  ref: RefObject<HTMLElement | null>,
  options: UseScrollProgressOptions = {},
): number {
  const { start = 0.9, end = 0.1, enabled = true } = options;
  const reduced = usePrefersReducedMotion();
  const [progress, setProgress] = useState(0);
  const active = enabled && !reduced;
  const progressRef = useRef(0);
  const rafRef = useRef(0);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) {
      if (progressRef.current !== 0) {
        progressRef.current = 0;
        setProgress(0);
      }
      return;
    }

    const scroller = getScrollParent(el);
    const port = getScrollPort(scroller);
    const rect = el.getBoundingClientRect();
    const startY = port.top + port.height * start;
    const endY = port.top + port.height * end;
    const raw = (startY - rect.top) / (startY - endY || 1);
    const next = Math.min(1, Math.max(0, raw));
    if (Math.abs(next - progressRef.current) < 0.002) return;
    progressRef.current = next;
    setProgress(next);
  }, [ref, start, end]);

  useEffect(() => {
    if (!active) {
      progressRef.current = 0;
      setProgress(0);
      return;
    }

    let scroller: HTMLElement | Window | null = null;
    let ro: ResizeObserver | null = null;
    let cancelled = false;
    let bindRaf = 0;

    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        measure();
      });
    };

    const cleanupListeners = () => {
      if (!scroller) return;
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      ro?.disconnect();
      ro = null;
      scroller = null;
    };

    const bind = (): boolean => {
      const el = ref.current;
      if (!el) return false;

      cleanupListeners();
      scroller = getScrollParent(el);
      measure();
      scroller.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(onScroll);
        ro.observe(el);
        if (scroller instanceof HTMLElement) ro.observe(scroller);
      }
      return true;
    };

    const tryBind = () => {
      if (cancelled) return;
      if (bind()) return;
      bindRaf = requestAnimationFrame(tryBind);
    };

    tryBind();

    return () => {
      cancelled = true;
      cancelAnimationFrame(bindRaf);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      cleanupListeners();
    };
  }, [active, measure, ref]);

  return active ? progress : 0;
}
