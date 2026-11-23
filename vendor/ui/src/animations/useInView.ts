"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";
import { getIntersectRoot } from "./scrollParent";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

export type UseInViewOptions = {
  once?: boolean;
  threshold?: number | number[];
  rootMargin?: string;
  /** When false, skip observing and stay hidden (controlled parents). Default true. */
  enabled?: boolean;
};

/**
 * Shrink the scrollport from the bottom so entrance reveals wait until
 * content is further into view (not the first peeking pixel).
 */
export const REVEAL_ROOT_MARGIN = "0px 0px -20% 0px";

/**
 * Scroll-driven visibility with a paint frame before reveal (so CSS transitions run).
 * `once: false` collapses when leaving the scrollport and replays on re-enter.
 */
export function useInView(
  ref: RefObject<Element | null>,
  {
    once = false,
    threshold = 0.12,
    rootMargin = REVEAL_ROOT_MARGIN,
    enabled = true,
  }: UseInViewOptions = {},
): boolean {
  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = useState(false);

  const reveal = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
  }, []);

  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      return;
    }

    if (reduced) {
      setVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    let revealed = false;
    const root = getIntersectRoot(el);

    const markVisible = () => {
      if (revealed && once) return;
      revealed = true;
      reveal();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          markVisible();
          if (once) observer.disconnect();
        } else if (!once) {
          revealed = false;
          setVisible(false);
        }
      },
      { root, threshold, rootMargin },
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [ref, reduced, once, threshold, rootMargin, reveal, enabled]);

  return visible;
}
