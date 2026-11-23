import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import styles from "./MediaFrame.module.css";

export type MediaFrameAspect = "auto" | "16/9" | "4/3" | "1/1" | "3/4" | "21/9";
export type MediaFrameRadius = "media" | "banner" | "none";

export interface MediaFrameProps extends HTMLAttributes<HTMLElement> {
  /** Media content (`img`, Next Image, video poster still, etc.). */
  children: ReactNode;
  /** Optional caption under the frame. */
  caption?: ReactNode;
  aspect?: MediaFrameAspect;
  radius?: MediaFrameRadius;
  /** Use figure/figcaption semantics when caption is present. */
  as?: "div" | "figure";
}

/**
 * Sharp media wrapper for banners, project visuals, and hero imagery.
 * Applies the collection `.caka-media` recipe.
 */
export const MediaFrame = forwardRef<HTMLElement, MediaFrameProps>(function MediaFrame(
  {
    children,
    caption,
    aspect = "auto",
    radius = "media",
    as,
    className,
    ...rest
  },
  ref,
) {
  const Tag = as ?? (caption ? "figure" : "div");

  return (
    <Tag
      ref={ref as never}
      className={cn(styles.root, "caka-media", className)}
      data-aspect={aspect}
      data-radius={radius}
      {...rest}
    >
      <div className={styles.frame}>{children}</div>
      {caption != null &&
        (Tag === "figure" ? (
          <figcaption className={styles.caption}>{caption}</figcaption>
        ) : (
          <div className={styles.caption}>{caption}</div>
        ))}
    </Tag>
  );
});
