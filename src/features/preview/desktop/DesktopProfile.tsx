"use client";

import { useEffect, useRef, useState } from "react";
import type { ProfileSnapshot } from "@/features/import/types";
import { displayPostCount, mergeGrid } from "@/features/planner/mergeGrid";
import type { PlannedItem, PreviewTab } from "@/features/planner/types";
import { Highlights } from "../Highlights";
import {
  CreateIcon,
  HeartIcon,
  HomeIcon,
  MenuIcon,
  MoreIcon,
  ReelsIcon,
  SearchIcon,
  VerifiedBadge,
} from "../icons";
import "../ig.css";
import { ProfileGrid } from "../ProfileGrid";
import { ProfileTabs } from "../ProfileTabs";
import { SharedImage } from "../SharedImage";
import { Stats } from "../Stats";
import styles from "./DesktopProfile.module.css";

export function DesktopProfile({
  snapshot,
  planned,
  editMode,
  tab,
  onTabChange,
  chrome = "monitor",
  gridOrder = null,
}: {
  snapshot: ProfileSnapshot;
  planned: PlannedItem[];
  editMode: boolean;
  tab: PreviewTab;
  onTabChange: (tab: PreviewTab) => void;
  /** Device shell around the web preview */
  chrome?: "monitor" | "macbook";
  gridOrder?: string[] | null;
}) {
  const f = snapshot.fields;
  const items = mergeGrid(f.media.value, planned, tab, gridOrder);
  const posts = displayPostCount(f.posts.value, planned.length);
  const stageRef = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = (width: number) => setWide(width >= 880);
    update(el.getBoundingClientRect().width);
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w != null) update(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const content = (
    <div ref={stageRef} className={`ig ${styles.stage}`}>
      <div className={styles.shell}>
        <aside className={[styles.nav, wide ? styles.navWide : ""].filter(Boolean).join(" ")}>
          <div className={styles.logo}>{wide ? "Instagram" : "◎"}</div>
          <div className={`${styles.navItem} ${styles.navItemActive}`}>
            <HomeIcon />
            <span className={styles.navLabel}>Home</span>
          </div>
          <div className={styles.navItem}>
            <SearchIcon />
            <span className={styles.navLabel}>Search</span>
          </div>
          <div className={styles.navItem}>
            <ReelsIcon />
            <span className={styles.navLabel}>Reels</span>
          </div>
          <div className={styles.navItem}>
            <HeartIcon />
            <span className={styles.navLabel}>Notifications</span>
          </div>
          <div className={styles.navItem}>
            <CreateIcon />
            <span className={styles.navLabel}>Create</span>
          </div>
          <div className={`${styles.navItem} ${styles.navItemActive}`}>
            <SharedImage image={f.avatar.value} alt="" className={styles.navAvatar} />
            <span className={styles.navLabel}>Profile</span>
          </div>
          <div className={styles.navSpacer} />
          <div className={styles.navItem}>
            <MenuIcon />
            <span className={styles.navLabel}>More</span>
          </div>
        </aside>

        <div className={styles.main} data-capture-feed>
          <div className={styles.header}>
            <div className={styles.avatarWrap} data-story={snapshot.hasStory || undefined}>
              <SharedImage image={f.avatar.value} alt="" className={styles.avatar} />
            </div>
            <div className={styles.info}>
              <div className={styles.row}>
                <h1 className={styles.username}>
                  {snapshot.username}
                  {f.verified.value ? <VerifiedBadge size={18} /> : null}
                </h1>
                <div className={styles.actions}>
                  <button type="button" className={`${styles.btn} ${styles.btnPrimary}`}>
                    Follow
                  </button>
                  <button type="button" className={styles.btn}>
                    Message
                  </button>
                  <button type="button" className={styles.btn} aria-label="More options">
                    <MoreIcon size={16} />
                  </button>
                </div>
              </div>

              <Stats
                posts={posts}
                followers={f.followers.value}
                following={f.following.value}
                postsApprox={f.posts.approx}
                followersApprox={f.followers.approx}
                followingApprox={f.following.approx}
                desktop
              />

              <div className={styles.meta}>
                {f.displayName.value ?
                  <p className={styles.displayName}>{f.displayName.value}</p>
                : null}
                {f.category.value ?
                  <p className={styles.category}>{f.category.value}</p>
                : null}
                {f.bio.value ?
                  <p className={styles.bio}>{f.bio.value}</p>
                : null}
                {f.website.value ?
                  <a className={styles.link} href={f.website.value} target="_blank" rel="noreferrer">
                    {f.website.value.replace(/^https?:\/\//, "")}
                  </a>
                : null}
              </div>
            </div>
          </div>

          {f.highlights.value ?
            <Highlights items={f.highlights.value} desktop />
          : null}

          <ProfileTabs active={tab} onChange={onTabChange} />
          <ProfileGrid
            items={items}
            editMode={editMode}
            variant={tab === "reels" ? "reels" : "posts"}
            desktop
          />
        </div>
      </div>
    </div>
  );

  if (chrome === "macbook") {
    return (
      <div className={styles.macbook} data-capture-device="macbook">
        <div className={styles.macLid} data-capture-panel>
          <div className={styles.macBezel}>
            <span className={styles.macCamera} aria-hidden />
            <div className={styles.macScreen}>{content}</div>
          </div>
        </div>
        <div className={styles.macBase} aria-hidden>
          <div className={styles.macIndent} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.monitor} data-capture-device="monitor">
      <div className={styles.monitorBezel} data-capture-panel>
        <div className={styles.monitorScreen}>{content}</div>
      </div>
      <div className={styles.monitorNeck} aria-hidden />
      <div className={styles.monitorBase} aria-hidden />
    </div>
  );
}
