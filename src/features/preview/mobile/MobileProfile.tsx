"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { ProfileSnapshot } from "@/features/import/types";
import { displayPostCount, mergeGrid } from "@/features/planner/mergeGrid";
import type { PlannedItem, PreviewTab } from "@/features/planner/types";
import {
  FEATURED_PHONE_MODEL_ID,
  getPhoneModel,
  phoneActualScale,
  phoneOuterSize,
  type PhoneModelId,
  type PhoneScaleMode,
} from "../devices";
import { Highlights } from "../Highlights";
import {
  BackIcon,
  ChevronDownIcon,
  CreateIcon,
  HeartIcon,
  HomeIcon,
  MoreIcon,
  NotificationsIcon,
  SearchIcon,
  VerifiedBadge,
} from "../icons";
import "../ig.css";
import { ProfileGrid } from "../ProfileGrid";
import { ProfileTabs } from "../ProfileTabs";
import { SharedImage } from "../SharedImage";
import { Stats } from "../Stats";
import { StatusBar } from "../StatusBar";
import styles from "./MobileProfile.module.css";

function ProfileChrome({
  snapshot,
  planned,
  editMode,
  tab,
  onTabChange,
  statusBarH,
  face,
  homeIndicator,
  gridOrder = null,
}: {
  snapshot: ProfileSnapshot;
  planned: PlannedItem[];
  editMode: boolean;
  tab: PreviewTab;
  onTabChange: (tab: PreviewTab) => void;
  statusBarH: number;
  face: "island" | "notch" | "home";
  homeIndicator: boolean;
  gridOrder?: string[] | null;
}) {
  const f = snapshot.fields;
  const items = mergeGrid(f.media.value, planned, tab, gridOrder);
  const posts = displayPostCount(f.posts.value, planned.length);

  return (
    <>
      <StatusBar height={statusBarH} face={face} />

      <div className={styles.topBar}>
        <BackIcon size={24} />
        <span className={styles.username}>
          {snapshot.username}
          {f.verified.value ? <VerifiedBadge size={14} /> : null}
          <ChevronDownIcon />
        </span>
        <div className={styles.topActions}>
          <NotificationsIcon size={24} />
          <MoreIcon size={24} />
        </div>
      </div>

      <div className={styles.body} data-capture-feed>
        <div className={styles.header}>
          <div className={styles.avatarRing} data-story={snapshot.hasStory || undefined}>
            <SharedImage image={f.avatar.value} alt="" className={styles.avatar} />
          </div>
          <Stats
            posts={posts}
            followers={f.followers.value}
            following={f.following.value}
            postsApprox={f.posts.approx}
            followersApprox={f.followers.approx}
            followingApprox={f.following.approx}
          />
        </div>

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

        <div className={styles.actions}>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`}>
            Follow
          </button>
          <button type="button" className={styles.btn}>
            Message
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnIcon}`} aria-label="More">
            <ChevronDownIcon />
          </button>
        </div>

        {f.highlights.value ?
          <Highlights items={f.highlights.value} />
        : null}

        <ProfileTabs active={tab} onChange={onTabChange} iconOnly />
        <ProfileGrid items={items} editMode={editMode} variant={tab === "reels" ? "reels" : "posts"} />
      </div>

      <nav className={styles.bottomNav} aria-label="Instagram navigation">
        <HomeIcon />
        <SearchIcon />
        <CreateIcon />
        <HeartIcon />
        <SharedImage image={f.avatar.value} alt="" className={styles.navAvatar} />
      </nav>
      {homeIndicator ?
        <div className={styles.homeIndicator}>
          <div className={styles.homePill} />
        </div>
      : null}
    </>
  );
}

export function MobileProfile({
  snapshot,
  planned,
  editMode,
  tab,
  onTabChange,
  phoneModelId = FEATURED_PHONE_MODEL_ID,
  phoneScaleMode: _phoneScaleMode,
  variant = "stage",
  gridOrder = null,
}: {
  snapshot: ProfileSnapshot;
  planned: PlannedItem[];
  editMode: boolean;
  tab: PreviewTab;
  onTabChange: (tab: PreviewTab) => void;
  phoneModelId?: PhoneModelId;
  phoneScaleMode?: PhoneScaleMode;
  /** `slide` — framed phone in carousel; `bare` — frameless; `stage` — standalone */
  variant?: "stage" | "slide" | "bare";
  gridOrder?: string[] | null;
}) {
  void _phoneScaleMode;
  const model = useMemo(() => getPhoneModel(phoneModelId), [phoneModelId]);
  const outer = useMemo(() => phoneOuterSize(model), [model]);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (variant === "bare") return;
    const stage = stageRef.current;
    if (!stage) return;
    const update = () => {
      const life = phoneActualScale(model);
      let next = Number.isFinite(life) && life > 0 ? life : 1;
      // Fit inside carousel height so Safari doesn't clip the chassis/shadows.
      if (variant === "slide") {
        const raw = getComputedStyle(stage).getPropertyValue("--carousel-h").trim();
        const maxH = Number.parseFloat(raw);
        if (Number.isFinite(maxH) && maxH > 0) {
          next = Math.min(next, maxH / outer.height);
        }
      }
      setScale(Number.isFinite(next) && next > 0 ? next : 1);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(stage);
    const slot = stage.parentElement;
    if (slot) ro.observe(slot);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [model, outer.width, outer.height, variant]);

  const profile = (
    <ProfileChrome
      snapshot={snapshot}
      planned={planned}
      editMode={editMode}
      tab={tab}
      onTabChange={onTabChange}
      statusBarH={variant === "bare" ? 54 : model.statusBarH}
      face={variant === "bare" ? "island" : model.face}
      homeIndicator={variant === "bare" ? true : model.homeIndicator}
      gridOrder={gridOrder}
    />
  );

  if (variant === "bare") {
    return (
      <div className={styles.bareStage} data-scale="bare">
        <div className={`ig ${styles.bareScreen}`}>{profile}</div>
      </div>
    );
  }

  const phoneStyle = {
    "--phone-bezel": `${model.bezel}px`,
    "--phone-forehead": `${model.forehead}px`,
    "--phone-chin": `${model.chin}px`,
    "--phone-body-radius": `${model.bodyRadius}px`,
    "--phone-screen-radius": `${model.screenRadius}px`,
    "--phone-screen-w": `${model.screenW}px`,
    "--phone-screen-h": `${model.screenH}px`,
    "--island-w": `${model.island?.width ?? 0}px`,
    "--island-h": `${model.island?.height ?? 0}px`,
    "--island-top": `${model.island?.top ?? 0}px`,
    "--notch-w": `${model.notch?.width ?? 0}px`,
    "--notch-h": `${model.notch?.height ?? 0}px`,
    "--btn-silent-top": `${model.buttons.silent ?? 0}px`,
    "--btn-volume-up-top": `${model.buttons.volumeUp}px`,
    "--btn-volume-down-top": `${model.buttons.volumeDown}px`,
    "--btn-power-top": `${model.buttons.power}px`,
    width: outer.width,
    height: outer.height,
    transform: scale === 1 ? undefined : `scale(${scale})`,
    transformOrigin: "top left",
  } as CSSProperties;

  return (
    <div
      ref={stageRef}
      className={variant === "slide" ? styles.slideStage : styles.stage}
      data-scale="actual"
    >
      <div
        className={styles.scaleSlot}
        data-capture-scale-slot
        style={{ width: outer.width * scale, height: outer.height * scale }}
      >
        <div className={styles.phone} data-face={model.face} data-capture-phone style={phoneStyle}>
          {model.buttons.silent != null ?
            <span className={styles.btnSilent} aria-hidden />
          : null}
          <span className={styles.btnVolumeUp} aria-hidden />
          <span className={styles.btnVolumeDown} aria-hidden />
          <span className={styles.btnPower} aria-hidden />

          {model.face === "home" ?
            <div className={styles.seSensors} aria-hidden>
              <span className={styles.earpiece} />
              <span className={styles.frontCamera} />
            </div>
          : null}

          <div className={`ig ${styles.screen}`}>
            {model.face === "island" ?
              <div className={styles.dynamicIsland} aria-hidden>
                <span className={styles.islandCamera} />
              </div>
            : null}
            {model.face === "notch" ?
              <div className={styles.notch} aria-hidden />
            : null}
            {profile}
          </div>

          {model.homeButton ?
            <span className={styles.homeButton} aria-hidden>
              <span className={styles.homeButtonRing} />
            </span>
          : null}
        </div>
      </div>
    </div>
  );
}
