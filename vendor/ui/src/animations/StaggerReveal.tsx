"use client";

import {
  Children,
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
import styles from "./StaggerReveal.module.css";

export interface StaggerRevealProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  stagger?: number;
  once?: boolean;
  threshold?: number;
}

/**
 * Stagger children on enter. Wraps each child so visibility styles never depend
 * on consumers forwarding className / data attributes.
 */
export const StaggerReveal = forwardRef<HTMLDivElement, StaggerRevealProps>(function StaggerReveal(
  {
    children,
    stagger = 70,
    once = true,
    threshold = 0.2,
    className,
    style,
    ...rest
  },
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
    <div
      ref={setRefs}
      className={cn(styles.root, className)}
      data-visible={visible || undefined}
      data-reduced={reduced || undefined}
      style={style}
      {...rest}
    >
      {Children.map(children, (child, index) => (
        <div
          key={index}
          className={styles.item}
          data-visible={visible || reduced ? "true" : undefined}
          style={{
            transitionDelay: visible || reduced ? `${index * stagger}ms` : undefined,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
});
