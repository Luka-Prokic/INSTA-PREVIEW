"use client";

import {
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../../utils/cn";
import { GalleryTile } from "../GalleryTile";
import { useArchiveLayoutFlip } from "../../hooks/useArchiveLayoutFlip";
import styles from "./ArchiveGrid.module.css";

export type ArchiveGridItem = {
  id: string;
  src?: string | null;
  alt?: string;
  caption?: ReactNode;
  href?: string;
  /** Keep caption always visible. */
  staticCaption?: boolean;
};

export type ArchiveGridProps = Omit<
  HTMLAttributes<HTMLUListElement>,
  "children"
> & {
  /**
   * Preferred: items render GalleryTile + collection Image (fallback on).
   * Density changes FLIP-animate cell positions.
   */
  items?: ArchiveGridItem[];
  /** Escape hatch when not using `items`. */
  children?: ReactNode;
  /** Archive column density: 1 | 3 | 9 (or unset for responsive defaults). */
  columns?: number;
  emptyMessage?: string;
  /** Disable FLIP layout animation (`prefers-reduced-motion` is always respected). */
  reduceMotion?: boolean;
};

/** Responsive archive tile grid - GalleryTile + layout motion on density change. */
export function ArchiveGrid({
  items,
  children,
  columns,
  emptyMessage = "No items",
  reduceMotion = false,
  className,
  ...rest
}: ArchiveGridProps) {
  const listRef = useRef<HTMLUListElement>(null);

  useArchiveLayoutFlip(listRef, columns, !reduceMotion);

  const fromItems = items != null;
  const empty =
    fromItems
      ? items.length === 0
      : children == null || (Array.isArray(children) && children.length === 0);

  if (empty) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  return (
    <ul
      ref={listRef}
      className={cn(styles.grid, className)}
      data-cols={columns ?? undefined}
      {...rest}
    >
      {fromItems
        ? items.map((item) => (
            <ArchiveGridCell key={item.id} archiveId={item.id}>
              <GalleryTile
                href={item.href}
                src={item.src}
                alt={item.alt ?? ""}
                caption={item.caption}
                staticCaption={item.staticCaption}
                skipEntrance
              />
            </ArchiveGridCell>
          ))
        : children}
    </ul>
  );
}

export type ArchiveGridCellProps = HTMLAttributes<HTMLLIElement> & {
  children?: ReactNode;
  /** Stable id for FLIP layout animation. */
  archiveId?: string;
};

export function ArchiveGridCell({
  children,
  className,
  archiveId,
  ...rest
}: ArchiveGridCellProps) {
  return (
    <li
      className={cn(styles.cell, className)}
      data-archive-id={archiveId}
      {...rest}
    >
      {children}
    </li>
  );
}
