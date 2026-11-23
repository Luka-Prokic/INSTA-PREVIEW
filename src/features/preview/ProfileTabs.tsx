"use client";

import type { PreviewTab } from "@/features/planner/types";
import { GridIcon, ReelsIcon, TaggedIcon } from "./icons";
import styles from "./ProfileTabs.module.css";

const TABS: {
  id: PreviewTab;
  label: string;
  Icon: typeof GridIcon;
}[] = [
  { id: "posts", label: "Posts", Icon: GridIcon },
  { id: "reels", label: "Reels", Icon: ReelsIcon },
  { id: "tagged", label: "Tagged", Icon: TaggedIcon },
];

export function ProfileTabs({
  active,
  onChange,
  iconOnly = false,
}: {
  active: PreviewTab;
  onChange: (tab: PreviewTab) => void;
  iconOnly?: boolean;
}) {
  return (
    <div
      className={[styles.tabs, iconOnly ? styles.iconOnly : ""].filter(Boolean).join(" ")}
      role="tablist"
    >
      {TABS.map(({ id, label, Icon }) => {
        const selected = active === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            data-active={selected || undefined}
            className={styles.tab}
            onClick={() => onChange(id)}
          >
            <Icon size={iconOnly ? 24 : 12} filled={selected} />
            <span className={styles.label}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
