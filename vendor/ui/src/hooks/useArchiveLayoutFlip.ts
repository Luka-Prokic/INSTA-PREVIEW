"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";

const LAYOUT_MS = 100;
const LAYOUT_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * FLIP layout animation for archive cells when column density changes.
 * Matches GALERIJA_012 galleryCellTransition layout timing (~100ms).
 */
export function useArchiveLayoutFlip(
  containerRef: RefObject<HTMLElement | null>,
  layoutKey: unknown,
  enabled = true,
) {
  const previous = useRef<Map<string, DOMRect>>(new Map());
  const firstPaint = useRef(true);

  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const motionOn = enabled && !prefersReducedMotion();
    const cells = Array.from(
      root.querySelectorAll<HTMLElement>("[data-archive-id]"),
    );
    const next = new Map<string, DOMRect>();

    for (const el of cells) {
      const id = el.dataset.archiveId;
      if (!id) continue;
      next.set(id, el.getBoundingClientRect());
    }

    const skip = !motionOn || firstPaint.current || previous.current.size === 0;
    firstPaint.current = false;

    if (!skip) {
      for (const el of cells) {
        const id = el.dataset.archiveId;
        if (!id) continue;
        const last = next.get(id);
        const first = previous.current.get(id);
        if (!first || !last) continue;

        const dx = first.left - last.left;
        const dy = first.top - last.top;
        const sx = first.width / (last.width || 1);
        const sy = first.height / (last.height || 1);

        if (
          Math.abs(dx) < 0.5 &&
          Math.abs(dy) < 0.5 &&
          Math.abs(sx - 1) < 0.01 &&
          Math.abs(sy - 1) < 0.01
        ) {
          continue;
        }

        el.style.transformOrigin = "0 0";
        el.style.transition = "none";
        el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;

        void el.offsetWidth;

        el.style.transition = `transform ${LAYOUT_MS}ms ${LAYOUT_EASE}`;
        el.style.transform = "";
      }
    }

    previous.current = next;

    const clear = window.setTimeout(() => {
      for (const el of cells) {
        el.style.transition = "";
        el.style.transform = "";
        el.style.transformOrigin = "";
      }
    }, LAYOUT_MS + 40);

    return () => window.clearTimeout(clear);
  }, [containerRef, layoutKey, enabled]);
}
