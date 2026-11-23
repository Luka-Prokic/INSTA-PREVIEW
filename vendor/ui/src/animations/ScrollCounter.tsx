"use client";

import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
} from "react";
import { cn } from "../utils/cn";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { getIntersectRoot } from "./scrollParent";
import { REVEAL_ROOT_MARGIN } from "./useInView";
import styles from "./ScrollCounter.module.css";

export interface ScrollCounterProps extends HTMLAttributes<HTMLSpanElement> {
  to: number;
  from?: number;
  duration?: number;
  /** Decimal places. Defaults to 0. */
  decimals?: number;
  prefix?: string;
  suffix?: string;
  once?: boolean;
}

/**
 * Tall-number brand moment - counts up when scrolled into view.
 */
export const ScrollCounter = forwardRef<HTMLSpanElement, ScrollCounterProps>(
  function ScrollCounter(
    {
      to,
      from = 0,
      duration = 1200,
      decimals = 0,
      prefix = "",
      suffix = "",
      once = true,
      className,
      ...rest
    },
    forwardedRef,
  ) {
    const localRef = useRef<HTMLSpanElement | null>(null);
    const reduced = usePrefersReducedMotion();
    const [value, setValue] = useState(from);
    const [runId, setRunId] = useState(0);

    useEffect(() => {
      if (reduced) {
        setValue(to);
        return;
      }
      const el = localRef.current;
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return;
          if (entry.isIntersecting) {
            setValue(from);
            setRunId((n) => n + 1);
            if (once) observer.disconnect();
          } else if (!once) {
            setValue(from);
          }
        },
        {
          root: getIntersectRoot(el),
          threshold: 0.45,
          rootMargin: REVEAL_ROOT_MARGIN,
        },
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, [reduced, once, to, from]);

    useEffect(() => {
      if (reduced || runId === 0) return;
      let raf = 0;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setValue(from + (to - from) * eased);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, [runId, reduced, from, to, duration]);

    const setRefs = (node: HTMLSpanElement | null) => {
      localRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    };

    const display = Number(value).toFixed(decimals);

    return (
      <span ref={setRefs} className={cn(styles.root, className)} {...rest}>
        {prefix}
        {display}
        {suffix}
      </span>
    );
  },
);
