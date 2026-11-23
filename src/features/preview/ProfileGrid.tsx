"use client";

import type { GridItem } from "@/features/planner/types";
import { GridTile } from "./GridTile";
import styles from "./ProfileGrid.module.css";

export function ProfileGrid({
  items,
  editMode,
  variant = "posts",
  desktop = false,
}: {
  items: GridItem[];
  editMode: boolean;
  variant?: "posts" | "reels";
  desktop?: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>{variant === "reels" ? "No Reels yet" : "No Posts yet"}</p>
        <p className={styles.emptyBody}>
          {variant === "reels" ?
            "Reels you publish or plan will show up here."
          : "When you share photos and videos, they'll appear on your profile."}
        </p>
      </div>
    );
  }

  return (
    <div className={[styles.grid, desktop ? styles.gridDesktop : ""].filter(Boolean).join(" ")}>
      {items.map((item) => (
        <GridTile key={item.id} item={item} editMode={editMode} variant={variant} />
      ))}
    </div>
  );
}
