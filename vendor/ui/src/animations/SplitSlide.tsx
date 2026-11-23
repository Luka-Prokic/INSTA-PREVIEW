"use client";

import { forwardRef, useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils/cn";
import { useScrollProgress } from "./useScrollProgress";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import styles from "./SplitSlide.module.css";

export interface SplitSlideProps extends HTMLAttributes<HTMLDivElement> {
  left: ReactNode;
  right: ReactNode;
  /** Tall runway so you can scrub the split. Defaults to `200vh`. */
  height?: string | number;
  /** How far panes start apart (rem). Defaults to 8. */
  distance?: number;
}

/**
 * Sticky stage: two halves start offset and slam together as you scroll.
 * Vertical travel drives the lock-up - not a one-frame flash.
 */
export const SplitSlide = forwardRef<HTMLDivElement, SplitSlideProps>(function SplitSlide(
  { left, right, height = "200vh", distance = 8, className, style, ...rest },
  forwardedRef,
) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const progress = useScrollProgress(trackRef, { start: 0.85, end: 0.15 });
  const reduced = usePrefersReducedMotion();
  const t = reduced ? 1 : progress;
  const shift = (1 - t) * distance;

  const setRefs = (node: HTMLDivElement | null) => {
    trackRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  const trackStyle: CSSProperties = {
    ...style,
    minHeight: typeof height === "number" ? `${height}px` : height,
  };

  return (
    <div ref={setRefs} className={cn(styles.track, className)} style={trackStyle} {...rest}>
      <div className={styles.sticky}>
        <p className={styles.hint} aria-hidden>
          Scroll - halves lock together
        </p>
        <div className={styles.root}>
          <div
            className={styles.pane}
            style={{ transform: `translate3d(${(-shift).toFixed(3)}rem, 0, 0)` }}
          >
            {left}
          </div>
          <div
            className={styles.pane}
            style={{ transform: `translate3d(${shift.toFixed(3)}rem, 0, 0)` }}
          >
            {right}
          </div>
        </div>
      </div>
    </div>
  );
});
