"use client";

import { forwardRef, useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils/cn";
import { useScrollProgress } from "./useScrollProgress";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
export interface ScaleScrollProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Scale at progress 0. Defaults to 0.72. */
  from?: number;
  /** Scale at progress 1. Defaults to 1. */
  to?: number;
  /** Opacity at progress 0. Defaults to 0.25. */
  opacityFrom?: number;
  /** Opacity at progress 1. Defaults to 1. */
  opacityTo?: number;
}

/**
 * Maps scrollport progress through the element to scale + opacity.
 * Aggressive cinematic zoom for portfolio heroes / media moments.
 */
export const ScaleScroll = forwardRef<HTMLDivElement, ScaleScrollProps>(function ScaleScroll(
  {
    children,
    from = 0.72,
    to = 1,
    opacityFrom = 0.25,
    opacityTo = 1,
    className,
    style,
    ...rest
  },
  forwardedRef,
) {
  const localRef = useRef<HTMLDivElement | null>(null);
  const progress = useScrollProgress(localRef, { start: 0.95, end: 0.2 });
  const reduced = usePrefersReducedMotion();

  const t = reduced ? 1 : progress;
  const scale = from + (to - from) * t;
  const opacity = opacityFrom + (opacityTo - opacityFrom) * t;

  const setRefs = (node: HTMLDivElement | null) => {
    localRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  const motionStyle: CSSProperties = {
    ...style,
    opacity,
    transform: `scale(${scale.toFixed(4)})`,
    transformOrigin: "center center",
    willChange: reduced ? undefined : "transform, opacity",
  };

  return (
    <div
      ref={setRefs}
      className={cn(className)}
      data-reduced={reduced || undefined}
      style={motionStyle}
      {...rest}
    >
      {children}
    </div>
  );
});
