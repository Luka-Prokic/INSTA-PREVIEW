"use client";

import type { Highlight } from "@/features/import/types";
import { SharedImage } from "./SharedImage";
import styles from "./Highlights.module.css";

export function Highlights({
  items,
  desktop = false,
}: {
  items: Highlight[];
  desktop?: boolean;
}) {
  if (!items.length) return null;
  return (
    <div className={[styles.row, desktop ? styles.desktop : ""].filter(Boolean).join(" ")}>
      {items.map((h) => (
        <div key={h.id} className={styles.item}>
          <div className={styles.ring}>
            <SharedImage image={h.cover} alt="" className={styles.cover} />
          </div>
          <p className={styles.title}>{h.title}</p>
        </div>
      ))}
    </div>
  );
}
