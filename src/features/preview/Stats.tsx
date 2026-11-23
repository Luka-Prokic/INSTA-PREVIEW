"use client";

import { formatCount } from "@/lib/format";
import styles from "./Stats.module.css";

export function Stats({
  posts,
  followers,
  following,
  postsApprox,
  followersApprox,
  followingApprox,
  desktop = false,
}: {
  posts?: number;
  followers?: number;
  following?: number;
  postsApprox?: boolean;
  followersApprox?: boolean;
  followingApprox?: boolean;
  desktop?: boolean;
}) {
  const items = [
    { label: posts === 1 ? "post" : "posts", value: posts, approx: postsApprox },
    { label: "followers", value: followers, approx: followersApprox },
    { label: "following", value: following, approx: followingApprox },
  ];

  return (
    <div className={styles.stats}>
      {items.map((item) => (
        <div
          key={item.label}
          className={[styles.stat, desktop ? styles.statDesktop : ""].filter(Boolean).join(" ")}
        >
          <span className={styles.value}>
            {item.value === undefined ? "—" : formatCount(item.value, item.approx)}
          </span>
          <span className={styles.label}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
