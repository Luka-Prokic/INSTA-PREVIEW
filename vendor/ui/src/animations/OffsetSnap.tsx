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
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { getIntersectRoot } from "./scrollParent";
import styles from "./OffsetSnap.module.css";

export interface OffsetSnapProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Initial X/Y offset in rem. Defaults to 0.35. */
  offset?: number;
  once?: boolean;
}

/**
 * Rare “corrupt settle” beat - lands slightly offset then snaps clean.
 * Use sparingly as a brand moment, not on every block.
 */
export const OffsetSnap = forwardRef<HTMLDivElement, OffsetSnapProps>(function OffsetSnap(
  { children, offset = 0.35, once = true, className, style, ...rest },
  forwardedRef,
) {
  const localRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<"idle" | "offset" | "snap">("idle");

  useEffect(() => {
    if (reduced) {
      setPhase("snap");
      return;
    }
    const el = localRef.current;
    if (!el) return;
    let timer = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setPhase("offset");
        window.clearTimeout(timer);
        timer = window.setTimeout(() => setPhase("snap"), 90);
        if (once) observer.disconnect();
      },
      { root: getIntersectRoot(el), threshold: 0.35 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [reduced, once]);

  const setRefs = (node: HTMLDivElement | null) => {
    localRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  const motionStyle: CSSProperties = {
    ...style,
    ["--snap-x" as string]: `${offset}rem`,
    ["--snap-y" as string]: `${offset * 0.4}rem`,
  };

  return (
    <div
      ref={setRefs}
      className={cn(styles.root, className)}
      data-phase={phase}
      style={motionStyle}
      {...rest}
    >
      {children}
    </div>
  );
});
