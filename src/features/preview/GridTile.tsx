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
}: {
  item: GridItem;
  editMode: boolean;
  variant?: "posts" | "reels";
}) {
  const showPlanned = editMode && item.source === "planned";
  return (
    <div
      className={[
        styles.tile,
        variant === "reels" ? styles.tileReels : "",
        showPlanned ? styles.planned : "",
      ]
        .filter(Boolean)
        .join(" ")}
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
        <span className={styles.pin}>
          <PinIcon />
        </span>
      : null}
      {item.kind === "carousel" ?
        <span className={styles.badge}>
          <CarouselIcon />
        </span>
      : null}
      {(item.kind === "reel" || item.kind === "video") && variant === "posts" ?
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
    </div>
  );
}
