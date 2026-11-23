"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils/cn";
import styles from "./HorizontalScroll.module.css";

export interface HorizontalScrollProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Label for the scroll region (required for a11y when no visible heading). */
  label?: string;
  /** Snap alignment. Defaults to `start`. */
  snap?: "start" | "center" | "none";
}

/**
 * Aggressive horizontal runway for galleries / helmet halls / case strips.
 * Native overflow scroll - no fake scrollbar chrome.
 */
export const HorizontalScroll = forwardRef<HTMLDivElement, HorizontalScrollProps>(
  function HorizontalScroll(
    { children, label = "Horizontal gallery", snap = "start", className, ...rest },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn(styles.root, className)}
        data-snap={snap}
        role="region"
        aria-label={label}
        tabIndex={0}
        {...rest}
      >
        <div className={styles.track}>{children}</div>
      </div>
    );
  },
);

export interface HorizontalScrollItemProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const HorizontalScrollItem = forwardRef<HTMLDivElement, HorizontalScrollItemProps>(
  function HorizontalScrollItem({ children, className, ...rest }, ref) {
    return (
      <div ref={ref} className={cn(styles.item, className)} {...rest}>
        {children}
      </div>
    );
  },
);
