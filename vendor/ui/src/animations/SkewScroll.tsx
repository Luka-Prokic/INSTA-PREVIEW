"use client";

import { forwardRef, useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils/cn";
import { useScrollProgress } from "./useScrollProgress";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

export interface SkewScrollProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Max skew in degrees. Defaults to 8. */
  maxDeg?: number;
}

export const SkewScroll = forwardRef<HTMLDivElement, SkewScrollProps>(function SkewScroll(
  { children, maxDeg = 8, className, style, ...rest },
  forwardedRef,
) {
  const localRef = useRef<HTMLDivElement | null>(null);
  const progress = useScrollProgress(localRef, { start: 0.95, end: 0.15 });
  const reduced = usePrefersReducedMotion();
  const skew = reduced ? 0 : (0.5 - progress) * maxDeg * 2;

  const setRefs = (node: HTMLDivElement | null) => {
    localRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  return (
    <div
      ref={setRefs}
      className={cn(className)}
      style={
        {
          ...style,
          transform: reduced ? undefined : `skewY(${skew.toFixed(3)}deg)`,
          willChange: reduced ? undefined : "transform",
        } as CSSProperties
      }
      {...rest}
    >
      {children}
    </div>
  );
});
