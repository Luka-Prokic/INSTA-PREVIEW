"use client";

import { forwardRef, useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils/cn";
import { useScrollProgress } from "./useScrollProgress";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

export interface OpacityScrollProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  from?: number;
  to?: number;
}

export const OpacityScroll = forwardRef<HTMLDivElement, OpacityScrollProps>(function OpacityScroll(
  { children, from = 0, to = 1, className, style, ...rest },
  forwardedRef,
) {
  const localRef = useRef<HTMLDivElement | null>(null);
  const progress = useScrollProgress(localRef, { start: 0.95, end: 0.2 });
  const reduced = usePrefersReducedMotion();
  const opacity = reduced ? to : from + (to - from) * progress;

  const setRefs = (node: HTMLDivElement | null) => {
    localRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  return (
    <div
      ref={setRefs}
      className={cn(className)}
      style={{ ...style, opacity } as CSSProperties}
      {...rest}
    >
      {children}
    </div>
  );
});
