"use client";

import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ElementType,
  type HTMLAttributes,
} from "react";
import { cn } from "../utils/cn";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { getIntersectRoot } from "./scrollParent";
import styles from "./FillText.module.css";

export interface FillTextProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  children: string;
  as?: ElementType;
  once?: boolean;
}

/** Ink-fill type - muted → ink as the line enters view. */
export const FillText = forwardRef<HTMLElement, FillTextProps>(function FillText(
  { children, as: Comp = "p", once = true, className, ...rest },
  forwardedRef,
) {
  const localRef = useRef<HTMLElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = useState(false);

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
        } else if (!once) setVisible(false);
      },
      { root: getIntersectRoot(el), threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced, once]);

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
      {...rest}
    >
      {children}
    </Comp>
  );
});
