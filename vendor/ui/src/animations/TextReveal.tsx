"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
} from "react";
import { cn } from "../utils/cn";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { getIntersectRoot } from "./scrollParent";
import styles from "./TextReveal.module.css";

export type TextRevealMode = "words" | "lines";

export interface TextRevealProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  children: string;
  as?: ElementType;
  mode?: TextRevealMode;
  /** Stagger between units in ms. Defaults to 45 (words) / 80 (lines). */
  stagger?: number;
  once?: boolean;
  threshold?: number;
}

/**
 * Aggressive editorial text entrance - splits into words/lines and reveals
 * on scroll. Instant when reduced-motion.
 */
export const TextReveal = forwardRef<HTMLElement, TextRevealProps>(function TextReveal(
  {
    children,
    as: Comp = "p",
    mode = "words",
    stagger,
    once = true,
    threshold = 0.35,
    className,
    style,
    ...rest
  },
  forwardedRef,
) {
  const localRef = useRef<HTMLElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = useState(false);
  const reactId = useId();
  const gap = stagger ?? (mode === "lines" ? 80 : 45);

  const units =
    mode === "lines"
      ? children.split(/\n+/).map((s) => s.trim()).filter(Boolean)
      : children.trim().split(/\s+/).filter(Boolean);

  useEffect(() => {
    if (reduced) {
      setVisible(true);
      return;
    }
    const el = localRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { root: getIntersectRoot(el), threshold, rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced, once, threshold]);

  const setRefs = (node: HTMLElement | null) => {
    localRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  return (
    <Comp
      ref={setRefs}
      className={cn(styles.root, className)}
      data-visible={visible || undefined}
      data-reduced={reduced || undefined}
      data-mode={mode}
      style={style}
      {...rest}
    >
      {units.map((unit, i) => {
        const unitStyle: CSSProperties = {
          transitionDelay: visible ? `${i * gap}ms` : undefined,
        };
        return (
          <span key={`${reactId}-${i}`} className={styles.unit} style={unitStyle}>
            <span className={styles.inner}>{unit}</span>
            {mode === "words" && i < units.length - 1 ? "\u00A0" : null}
          </span>
        );
      })}
    </Comp>
  );
});
