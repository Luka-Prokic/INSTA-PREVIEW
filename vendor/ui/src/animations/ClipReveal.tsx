"use client";

import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../utils/cn";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { getIntersectRoot } from "./scrollParent";
import styles from "./ClipReveal.module.css";

export type ClipRevealEdge = "up" | "down" | "left" | "right";

export interface ClipRevealProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  edge?: ClipRevealEdge;
  once?: boolean;
  threshold?: number;
}

/**
 * Clip-path wipe on enter. The observer watches an unclipped shell so a fully
 * clipped face cannot starve IntersectionObserver.
 */
export const ClipReveal = forwardRef<HTMLDivElement, ClipRevealProps>(function ClipReveal(
  { children, edge = "up", once = true, threshold = 0.25, className, style, ...rest },
  forwardedRef,
) {
  const localRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (reduced) {
      setVisible(true);
      return;
    }

    const el = localRef.current;
    if (!el) return;

    let observer: IntersectionObserver | null = null;
    let cancelled = false;

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cancelled || !localRef.current) return;
        observer = new IntersectionObserver(
          ([entry]) => {
            if (!entry) return;
            if (entry.isIntersecting) {
              setVisible(true);
              if (once) observer?.disconnect();
            } else if (!once) {
              setVisible(false);
            }
          },
          {
            root: getIntersectRoot(localRef.current),
            threshold,
            rootMargin: "0px 0px -12% 0px",
          },
        );
        observer.observe(localRef.current);
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [reduced, once, threshold]);

  const setRefs = (node: HTMLDivElement | null) => {
    localRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  return (
    <div ref={setRefs} className={cn(styles.root, className)} style={style} {...rest}>
      <div
        className={styles.face}
        data-edge={edge}
        data-visible={visible || undefined}
        data-reduced={reduced || undefined}
      >
        {children}
      </div>
    </div>
  );
});
