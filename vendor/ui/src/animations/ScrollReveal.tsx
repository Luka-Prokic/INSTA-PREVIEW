"use client";

import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "../utils/cn";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { getIntersectRoot } from "./scrollParent";
import { REVEAL_ROOT_MARGIN } from "./useInView";
import styles from "./ScrollReveal.module.css";

export type ScrollRevealVariant = "fade" | "up" | "left" | "right" | "scale" | "blur";

export interface ScrollRevealProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: ScrollRevealVariant;
  delay?: number;
  stagger?: number;
  threshold?: number;
  /** Defaults to late reveal (`REVEAL_ROOT_MARGIN`) so items must enter further. */
  rootMargin?: string;
  once?: boolean;
}

/**
 * Fades / slides children into view on scroll. Instant when reduced-motion.
 * Defers observation one frame so the hidden state paints before reveal.
 */
export const ScrollReveal = forwardRef<HTMLDivElement, ScrollRevealProps>(
  function ScrollReveal(
    {
      children,
      variant = "up",
      delay = 0,
      stagger = 0,
      threshold = 0.25,
      rootMargin = REVEAL_ROOT_MARGIN,
      once = true,
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
              rootMargin,
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
    }, [reduced, threshold, once, rootMargin]);

    const setRefs = (node: HTMLDivElement | null) => {
      localRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    };

    const content =
      stagger > 0
        ? Children.map(children, (child, index) => {
            if (!isValidElement(child)) return child;
            const el = child as ReactElement<{ style?: CSSProperties }>;
            return cloneElement(el, {
              style: {
                ...el.props.style,
                transitionDelay: visible
                  ? `${delay + index * stagger}ms`
                  : undefined,
              },
            });
          })
        : children;

    return (
      <div
        ref={setRefs}
        className={cn(styles.root, className)}
        data-variant={variant}
        data-visible={visible || undefined}
        data-reduced={reduced || undefined}
        style={{
          ...style,
          transitionDelay: stagger > 0 ? undefined : delay ? `${delay}ms` : undefined,
        }}
        {...rest}
      >
        {content}
      </div>
    );
  },
);
