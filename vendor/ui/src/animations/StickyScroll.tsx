"use client";

import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils/cn";
import styles from "./StickyScroll.module.css";

export interface StickyScrollProps extends HTMLAttributes<HTMLDivElement> {
  /** Sticky layer (media, hero type, product). Stays pinned while the track scrolls. */
  sticky: ReactNode;
  /** Scrolling narrative / steps beside or under the sticky layer. */
  children: ReactNode;
  /** Track height. Defaults to `220vh`. */
  height?: string | number;
  /** Sticky offset from viewport top. */
  stickyTop?: string;
}

/**
 * Tall scroll stage with a pinned panel - Lando-style storytelling structure
 * without racing chrome. Content scrolls; sticky stays.
 */
export const StickyScroll = forwardRef<HTMLDivElement, StickyScrollProps>(
  function StickyScroll(
    {
      sticky,
      children,
      height = "220vh",
      stickyTop = "12vh",
      className,
      style,
      ...rest
    },
    ref,
  ) {
    const trackStyle: CSSProperties = {
      ...style,
      minHeight: typeof height === "number" ? `${height}px` : height,
      ["--sticky-top" as string]: stickyTop,
    };

    return (
      <div ref={ref} className={cn(styles.track, className)} style={trackStyle} {...rest}>
        <div className={styles.sticky}>{sticky}</div>
        <div className={styles.content}>{children}</div>
      </div>
    );
  },
);
