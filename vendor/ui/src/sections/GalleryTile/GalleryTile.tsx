"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Image } from "../../primitives/Image";
import styles from "./GalleryTile.module.css";

export type GalleryTileProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "children" | "media"
> & {
  /**
   * Preferred: primary image src. Uses collection `Image` (fallback on by default).
   * Omit and pass `media` only when you need a custom media node.
   */
  src?: string | null;
  alt?: string;
  /** Custom media node. Ignored when `src` is provided. */
  media?: ReactNode;
  caption?: ReactNode;
  /** Keep caption always visible (no hover reveal). */
  staticCaption?: boolean;
  /** Skip entrance fade (e.g. during density reflow). */
  skipEntrance?: boolean;
  /** Render as a non-link surface when `href` is omitted. */
  as?: "a" | "div";
};

/** Aspect-ratio 1 gallery cell with optional caption. */
export function GalleryTile({
  src,
  alt = "",
  media,
  caption,
  staticCaption = false,
  skipEntrance = false,
  as,
  href,
  className,
  ...rest
}: GalleryTileProps) {
  const Tag = as ?? (href != null ? "a" : "div");
  const mediaNode =
    media != null && src === undefined ? (
      media
    ) : (
      <Image fill src={src} alt={alt} className={styles.media} />
    );

  const content = (
    <>
      <span className={styles.mediaSlot}>{mediaNode}</span>
      {caption != null ? (
        <span className={styles.caption}>{caption}</span>
      ) : null}
    </>
  );

  if (Tag === "a") {
    return (
      <a
        href={href}
        className={cn(styles.tile, className)}
        data-static-caption={staticCaption || undefined}
        data-skip-entrance={skipEntrance || undefined}
        {...rest}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      className={cn(styles.tile, className)}
      data-static-caption={staticCaption || undefined}
      data-skip-entrance={skipEntrance || undefined}
      {...(rest as AnchorHTMLAttributes<HTMLDivElement>)}
    >
      {content}
    </div>
  );
}
