import type { CSSProperties, ReactNode } from "react";
import { cn } from "../../utils/cn";
import styles from "./ImageFallback.module.css";

export type ImageFallbackProps = {
  className?: string;
  /** Accessible description. Decorative when omitted. */
  label?: string;
  /**
   * Optional mark content (letter, monogram, icon).
   * Defaults to a quiet empty surface.
   */
  mark?: ReactNode;
  /** Stretch to a positioned parent. */
  fill?: boolean;
  width?: number;
  height?: number;
};

/** Empty / error image surface - not a loading skeleton. */
export function ImageFallback({
  className,
  label,
  mark,
  fill = false,
  width,
  height,
}: ImageFallbackProps) {
  const sized =
    !fill && width != null && height != null && width > 0 && height > 0;
  const style: CSSProperties | undefined = sized
    ? { aspectRatio: `${width} / ${height}` }
    : undefined;

  return (
    <span
      className={cn(
        styles.root,
        fill && styles.fill,
        sized && styles.sized,
        className,
      )}
      style={style}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {mark != null ? (
        <span className={styles.mark} aria-hidden>
          {mark}
        </span>
      ) : null}
    </span>
  );
}
