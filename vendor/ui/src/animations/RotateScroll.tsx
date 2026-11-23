"use client";

import { forwardRef, useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils/cn";
import { useScrollProgress } from "./useScrollProgress";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

export interface RotateScrollProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Max rotation in degrees at progress extremes. Defaults to 10. */
  maxDeg?: number;
}

export const RotateScroll = forwardRef<HTMLDivElement, RotateScrollProps>(function RotateScroll(
  { children, maxDeg = 10, className, style, ...rest },
  forwardedRef,
) {
  const localRef = useRef<HTMLDivElement | null>(null);
  const progress = useScrollProgress(localRef, { start: 0.95, end: 0.15 });
  const reduced = usePrefersReducedMotion();
  const deg = reduced ? 0 : (0.5 - progress) * maxDeg * 2;

  const setRefs = (node: HTMLDivElement | null) => {
    localRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  const motionStyle: CSSProperties = {
    ...style,
    transform: reduced ? undefined : `rotate(${deg.toFixed(3)}deg)`,
    willChange: reduced ? undefined : "transform",
  };

  return (
    <div ref={setRefs} className={cn(className)} style={motionStyle} {...rest}>
      {children}
    </div>
  );
});
