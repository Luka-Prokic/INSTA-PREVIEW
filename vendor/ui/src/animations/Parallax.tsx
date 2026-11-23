"use client";

import { forwardRef, useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils/cn";
import { useScrollProgress } from "./useScrollProgress";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import styles from "./Parallax.module.css";

export interface ParallaxProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Max translate in rem at progress extremes. Defaults to 5. */
  intensity?: number;
}

/**
 * Light translateY tied to scroll progress through the element. Disabled when
 * reduced-motion is preferred.
 */
export const Parallax = forwardRef<HTMLDivElement, ParallaxProps>(function Parallax(
  { children, intensity = 5, className, style, ...rest },
  forwardedRef,
) {
  const localRef = useRef<HTMLDivElement | null>(null);
  const progress = useScrollProgress(localRef);
  const reduced = usePrefersReducedMotion();

  const offset = reduced ? 0 : (progress - 0.5) * intensity * 2;

  const setRefs = (node: HTMLDivElement | null) => {
    localRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  const motionStyle: CSSProperties = {
    ...style,
    transform: reduced ? undefined : `translate3d(0, ${offset.toFixed(3)}rem, 0)`,
  };

  return (
    <div
      ref={setRefs}
      className={cn(styles.root, className)}
      data-reduced={reduced || undefined}
      style={motionStyle}
      {...rest}
    >
      {children}
    </div>
  );
});
