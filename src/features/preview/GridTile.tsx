"use client";

import { focusToObjectPosition } from "@/features/planner/media";
import type { GridItem } from "@/features/planner/types";
import { formatCount } from "@/lib/format";
import { CarouselIcon, PinIcon, PlayCountIcon, ReelBadgeIcon } from "./icons";
import { SharedImage } from "./SharedImage";
import styles from "./GridTile.module.css";

export function GridTile({
  item,
  editMode,
  variant = "posts",
  onOpen,
}: {
  item: GridItem;
  editMode: boolean;
  variant?: "posts" | "reels";
  onOpen?: (item: GridItem) => void;
}) {
  const showPlanned = editMode && item.source === "planned";
  return (
    <button
      type="button"
      className={[
        styles.tile,
        variant === "reels" ? styles.tileReels : "",
        showPlanned ? styles.planned : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onOpen?.(item)}
      aria-label={
        item.kind === "reel" || item.kind === "video" ? "Open Reel"
        : item.kind === "carousel" ? "Open carousel"
        : "Open post"
      }
    >
      <SharedImage
        image={item.image}
        alt=""
        className={styles.image}
        style={{
          objectPosition: focusToObjectPosition(item.focusX, item.focusY),
        }}
      />
      <div className={styles.hover} />
      {item.pinned ?
        <span className={styles.badge} aria-label="Pinned">
          <PinIcon />
        </span>
      : item.kind === "carousel" ?
        <span className={styles.badge}>
          <CarouselIcon />
        </span>
      : (item.kind === "reel" || item.kind === "video") && variant === "posts" ?
        <span className={styles.badge}>
          <ReelBadgeIcon />
        </span>
      : null}
      {variant === "reels" && item.viewCount !== undefined ?
        <span className={styles.views}>
          <PlayCountIcon />
          {formatCount(item.viewCount)}
        </span>
      : null}
      {showPlanned ? <span className={styles.plannedTag}>Planned</span> : null}
    </button>
  );
}
