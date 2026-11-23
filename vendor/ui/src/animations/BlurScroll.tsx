"use client";

import { forwardRef, useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils/cn";
import { useScrollProgress } from "./useScrollProgress";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

export interface BlurScrollProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Blur at progress 0 (px). Defaults to 22. */
  from?: number;
}

export const BlurScroll = forwardRef<HTMLDivElement, BlurScrollProps>(function BlurScroll(
  { children, from = 22, className, style, ...rest },
  forwardedRef,
) {
  const localRef = useRef<HTMLDivElement | null>(null);
  const progress = useScrollProgress(localRef, { start: 0.95, end: 0.2 });
  const reduced = usePrefersReducedMotion();
  const blur = reduced ? 0 : from * (1 - progress);

  const setRefs = (node: HTMLDivElement | null) => {
    localRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  const motionStyle: CSSProperties = {
    ...style,
    filter: reduced ? undefined : `blur(${blur.toFixed(2)}px)`,
    opacity: reduced ? 1 : 0.35 + progress * 0.65,
    willChange: reduced ? undefined : "filter, opacity",
  };

  return (
    <div ref={setRefs} className={cn(className)} style={motionStyle} {...rest}>
      {children}
    </div>
  );
});
