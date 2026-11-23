"use client";

import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../utils/cn";
import { useScrollProgress } from "./useScrollProgress";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import styles from "./HorizontalScrub.module.css";

export interface HorizontalScrubProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Track height creating vertical runway. Defaults to `240vh`. */
  height?: string | number;
  /** How far the strip can travel horizontally (0-1 of overflow). Defaults to 1. */
  travel?: number;
}

/**
 * Vertical scroll scrubs a horizontal strip - sticky stage, gallery drive.
 * Inspired by scroll/view-timeline horizontal carousel patterns.
 */
export const HorizontalScrub = forwardRef<HTMLDivElement, HorizontalScrubProps>(
  function HorizontalScrub(
    { children, height = "240vh", travel = 1, className, style, ...rest },
    forwardedRef,
  ) {
    const trackRef = useRef<HTMLDivElement | null>(null);
    const stripRef = useRef<HTMLDivElement | null>(null);
    const [maxShift, setMaxShift] = useState(0);
    const progress = useScrollProgress(trackRef, { start: 0.95, end: 0.05 });
    const reduced = usePrefersReducedMotion();

    useEffect(() => {
      const measure = () => {
        const strip = stripRef.current;
        const sticky = strip?.parentElement;
        if (!strip || !sticky) return;
        setMaxShift(Math.max(0, strip.scrollWidth - sticky.clientWidth));
      };
      measure();
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }, [children]);

    const setRefs = (node: HTMLDivElement | null) => {
      trackRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    };

    const x = reduced ? 0 : -(maxShift * travel * progress);

    const trackStyle: CSSProperties = {
      ...style,
      minHeight: typeof height === "number" ? `${height}px` : height,
    };

    return (
      <div ref={setRefs} className={cn(styles.track, className)} style={trackStyle} {...rest}>
        <div className={styles.sticky}>
          <div
            ref={stripRef}
            className={styles.strip}
            style={{ transform: `translate3d(${x.toFixed(1)}px, 0, 0)` }}
          >
            {children}
          </div>
        </div>
      </div>
    );
  },
);
