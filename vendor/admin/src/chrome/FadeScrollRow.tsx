"use client";

import { forwardRef, useEffect, useRef, type HTMLAttributes, type ReactNode, type Ref } from "react";
import { cn } from "../cn";
import styles from "./FadeScrollRow.module.css";

function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (value: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") ref(value);
      else (ref as { current: T | null }).current = value;
    }
  };
}

/** Horizontal scroller with edge fades when more content sits off-screen. */
export const FadeScrollRow = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { children: ReactNode; watch?: unknown }>(
  function FadeScrollRow({ className, children, watch, ...rest }, ref) {
    const local = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const el = local.current;
      if (!el) return;
      const fade = () => {
        const overflow = el.scrollWidth - el.clientWidth;
        const start = overflow > 8 && el.scrollLeft > 8;
        const end = overflow > 8 && el.scrollLeft < overflow - 8;
        el.dataset.fade = start && end ? "both" : start ? "start" : end ? "end" : "";
      };
      fade();
      const observer = new ResizeObserver(fade);
      observer.observe(el);
      for (const child of el.children) observer.observe(child);
      el.addEventListener("scroll", fade, { passive: true });
      window.addEventListener("resize", fade);
      return () => {
        observer.disconnect();
        el.removeEventListener("scroll", fade);
        window.removeEventListener("resize", fade);
      };
    }, [watch]);

    return (
      <div ref={mergeRefs(local, ref)} className={cn(styles.row, className)} {...rest}>
        {children}
      </div>
    );
  },
);
