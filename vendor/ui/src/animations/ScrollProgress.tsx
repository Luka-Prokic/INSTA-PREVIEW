"use client";

import { forwardRef, useEffect, useRef, useState, type HTMLAttributes } from "react";
import { cn } from "../utils/cn";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { getScrollParent, getScrollerScrollMetrics } from "./scrollParent";
import styles from "./ScrollProgress.module.css";

export type ScrollProgressTone = "neutral" | "brand";

export interface ScrollProgressProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * `nearest` tracks the nearest scrollport (Playground preview / page).
   * Pass a CSS selector for a specific section track.
   */
  target?: "nearest" | "document" | string;
  tone?: ScrollProgressTone;
  position?: "fixed" | "sticky" | "static";
}

/**
 * Thin scroll meter - secondary by default, signature red when `tone="brand"`.
 */
export const ScrollProgress = forwardRef<HTMLDivElement, ScrollProgressProps>(
  function ScrollProgress(
    {
      target = "nearest",
      tone = "neutral",
      position = "fixed",
      className,
      ...rest
    },
    forwardedRef,
  ) {
    const localRef = useRef<HTMLDivElement | null>(null);
    const reduced = usePrefersReducedMotion();
    const [progress, setProgress] = useState(0);

    useEffect(() => {
      if (reduced) {
        setProgress(1);
        return;
      }

      const host = localRef.current;
      if (!host) return;

      const resolveScroller = (): HTMLElement | Window | null => {
        if (target === "nearest" || target === "document") {
          return getScrollParent(host);
        }
        const section = document.querySelector(target);
        return section instanceof HTMLElement ? section : null;
      };

      const measure = () => {
        if (target !== "nearest" && target !== "document") {
          const section = document.querySelector(target);
          if (!(section instanceof HTMLElement)) {
            setProgress(0);
            return;
          }
          const scroller = getScrollParent(section);
          const portH =
            scroller instanceof Window ? window.innerHeight : scroller.clientHeight;
          const rect = section.getBoundingClientRect();
          const portTop =
            scroller instanceof Window ? 0 : scroller.getBoundingClientRect().top;
          const total = section.offsetHeight - portH;
          const scrolled = portTop - rect.top;
          setProgress(total <= 0 ? 0 : Math.min(1, Math.max(0, scrolled / total)));
          return;
        }

        const scroller = resolveScroller();
        if (!scroller) {
          setProgress(0);
          return;
        }
        const { scrollTop, max } = getScrollerScrollMetrics(scroller);
        setProgress(max <= 0 ? 0 : Math.min(1, Math.max(0, scrollTop / max)));
      };

      const scroller = resolveScroller();
      measure();
      scroller?.addEventListener("scroll", measure, { passive: true });
      window.addEventListener("resize", measure);
      return () => {
        scroller?.removeEventListener("scroll", measure);
        window.removeEventListener("resize", measure);
      };
    }, [reduced, target]);

    const setRefs = (node: HTMLDivElement | null) => {
      localRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    };

    return (
      <div
        ref={setRefs}
        className={cn(styles.root, className)}
        data-tone={tone}
        data-position={position}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        aria-label="Scroll progress"
        {...rest}
      >
        <div className={styles.fill} style={{ transform: `scaleX(${progress})` }} />
      </div>
    );
  },
);
