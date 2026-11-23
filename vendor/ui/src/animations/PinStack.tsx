"use client";

import {
  Children,
  forwardRef,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../utils/cn";
import { useScrollProgress } from "./useScrollProgress";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import styles from "./PinStack.module.css";

export interface PinStackProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  height?: string | number;
}

/** Sticky stack - children crossfade as the track scrolls (card-deck storytelling). */
export const PinStack = forwardRef<HTMLDivElement, PinStackProps>(function PinStack(
  { children, height = "220vh", className, style, ...rest },
  forwardedRef,
) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const progress = useScrollProgress(trackRef, { start: 0.9, end: 0.1 });
  const reduced = usePrefersReducedMotion();
  const items = Children.toArray(children);
  const count = Math.max(1, items.length);
  const index = reduced ? 0 : Math.min(count - 1, Math.floor(progress * count));

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
        {items.map((child, i) => (
          <div
            key={i}
            className={styles.frame}
            data-active={i === index || undefined}
            aria-hidden={i === index ? undefined : true}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
});
