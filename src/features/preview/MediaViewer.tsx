"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type UIEvent,
  type WheelEvent,
} from "react";
import type { ImageRef, ProfileSnapshot } from "@/features/import/types";
import type { GridItem } from "@/features/planner/types";
import {
  BackIcon,
  BookmarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  CommentIcon,
  EmojiIcon,
  HeartIcon,
  MoreHorizontalIcon,
  MoreIcon,
  MuteIcon,
  SharePostIcon,
  VerifiedBadge,
} from "./icons";
import type { PhoneFace } from "./devices";
import { SharedImage } from "./SharedImage";
import { StatusBar } from "./StatusBar";
import styles from "./MediaViewer.module.css";

function slidesFor(item: GridItem): ImageRef[] {
  if (item.slides?.length) return item.slides;
  return [item.image];
}

function isReel(item: GridItem) {
  return item.kind === "reel" || item.kind === "video";
}

/** Instagram feed clamps roughly 4:5 … 1.91:1; reels stay 9:16. */
function clampPostAspect(width: number, height: number) {
  const raw = width / height;
  return Math.min(1.91, Math.max(4 / 5, raw));
}

function defaultAspect(item: GridItem) {
  if (isReel(item)) return 9 / 16;
  if (item.width && item.height) return clampPostAspect(item.width, item.height);
  return 1;
}

function ActionRow() {
  return (
    <div className={styles.actions}>
      <button type="button" className={styles.iconBtn} aria-label="Like">
        <HeartIcon />
      </button>
      <button type="button" className={styles.iconBtn} aria-label="Comment">
        <CommentIcon />
      </button>
      <button type="button" className={styles.iconBtn} aria-label="Share">
        <SharePostIcon />
      </button>
      <span className={styles.actionsGrow} />
      <button type="button" className={styles.iconBtn} aria-label="Save">
        <BookmarkIcon />
      </button>
    </div>
  );
}

function MobileChrome({
  statusBarH,
  face,
  homeIndicator,
  children,
}: {
  statusBarH: number;
  face: PhoneFace;
  homeIndicator: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <StatusBar height={statusBarH} face={face} />
      <div className={styles.viewerMain}>{children}</div>
      {homeIndicator ?
        <div className={styles.homeIndicator}>
          <div className={styles.homePill} />
        </div>
      : null}
    </>
  );
}

function MobileReelViewer({
  reelItems,
  reelIndex,
  items,
  snapshot,
  statusBarH,
  face,
  homeIndicator,
  username,
  verified,
  avatar,
  onIndexChange,
  onClose,
  stopWheel,
}: {
  reelItems: GridItem[];
  reelIndex: number;
  items: GridItem[];
  snapshot: ProfileSnapshot;
  statusBarH: number;
  face: PhoneFace;
  homeIndicator: boolean;
  username: string;
  verified: boolean;
  avatar: ImageRef | undefined;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  stopWheel: (event: WheelEvent) => void;
}) {
  const pagerRef = useRef<HTMLDivElement>(null);
  const scrolling = useRef(false);

  useEffect(() => {
    const pager = pagerRef.current;
    if (!pager) return;
    const page = pager.children[reelIndex] as HTMLElement | undefined;
    if (!page) return;
    scrolling.current = true;
    pager.scrollTop = page.offsetTop;
    const t = window.setTimeout(() => {
      scrolling.current = false;
    }, 80);
    return () => window.clearTimeout(t);
  }, [reelIndex, reelItems.length]);

  const onPagerScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      if (scrolling.current) return;
      const pager = event.currentTarget;
      const pageH = pager.clientHeight || 1;
      const next = Math.round(pager.scrollTop / pageH);
      const clamped = Math.max(0, Math.min(reelItems.length - 1, next));
      if (clamped === reelIndex) return;
      const reel = reelItems[clamped];
      if (!reel) return;
      const globalIndex = items.findIndex((i) => i.id === reel.id);
      if (globalIndex >= 0) onIndexChange(globalIndex);
    },
    [items, onIndexChange, reelIndex, reelItems],
  );

  return (
    <div
      className={`ig ${styles.overlay} ${styles.overlayReel}`}
      data-media-viewer
      role="dialog"
      aria-modal="true"
      aria-label={`Reel by ${username}`}
      onWheel={stopWheel}
    >
      <MobileChrome statusBarH={statusBarH} face={face} homeIndicator={homeIndicator}>
        <div className={`${styles.topBar} ${styles.topBarReel}`}>
          <button type="button" className={styles.iconBtn} aria-label="Back" onClick={onClose}>
            <BackIcon />
          </button>
          <p className={styles.title}>Reels</p>
          <button type="button" className={styles.iconBtn} aria-label="More">
            <MoreIcon />
          </button>
        </div>

        <div
          ref={pagerRef}
          className={styles.reelPager}
          onScroll={onPagerScroll}
        >
          {reelItems.map((reel) => {
            const caption =
              reel.source === "planned" ? "Planned Reel preview"
              : (snapshot.fields.displayName.value ?? username);
            return (
              <div key={reel.id} className={styles.reelPage}>
                <SharedImage
                  image={slidesFor(reel)[0]}
                  alt=""
                  className={`${styles.media} ${styles.mediaCover}`}
                />
                <div className={styles.reelSide}>
                  <button type="button" className={styles.reelSideBtn} aria-label="Like">
                    <HeartIcon />
                    <span>Like</span>
                  </button>
                  <button type="button" className={styles.reelSideBtn} aria-label="Comment">
                    <CommentIcon />
                    <span>0</span>
                  </button>
                  <button type="button" className={styles.reelSideBtn} aria-label="Share">
                    <SharePostIcon />
                    <span>Share</span>
                  </button>
                  <button type="button" className={styles.reelSideBtn} aria-label="More">
                    <MoreIcon />
                  </button>
                </div>
                <div className={styles.reelBottom}>
                  <div className={styles.reelUserRow}>
                    <SharedImage image={avatar} alt="" className={styles.reelAvatar} />
                    <p className={styles.reelUser}>
                      {username}
                      {verified ? <VerifiedBadge size={12} /> : null}
                    </p>
                    <button type="button" className={styles.reelFollow}>
                      Follow
                    </button>
                  </div>
                  <p className={styles.reelCaption}>{caption}</p>
                </div>
              </div>
            );
          })}
        </div>
      </MobileChrome>
    </div>
  );
}

export function MediaViewer({
  items,
  index,
  snapshot,
  layout = "mobile",
  statusBarH = 54,
  face = "island",
  homeIndicator = true,
  onIndexChange,
  onClose,
}: {
  items: GridItem[];
  index: number;
  snapshot: ProfileSnapshot;
  layout?: "mobile" | "desktop";
  statusBarH?: number;
  face?: PhoneFace;
  homeIndicator?: boolean;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const item = items[index];
  const slides = useMemo(() => (item ? slidesFor(item) : []), [item]);
  const [slide, setSlide] = useState(0);
  const [measuredAr, setMeasuredAr] = useState<number | null>(null);
  const reel = item ? isReel(item) : false;
  const mediaAr = measuredAr ?? (item ? defaultAspect(item) : 1);
  const mediaStyle = { "--media-ar": String(mediaAr) } as CSSProperties;

  useEffect(() => {
    setSlide(0);
    setMeasuredAr(null);
  }, [item?.id]);

  useEffect(() => {
    setMeasuredAr(null);
  }, [slide]);

  const onNaturalSize = useCallback(
    (size: { width: number; height: number }) => {
      if (!item || isReel(item)) return;
      setMeasuredAr(clampPostAspect(size.width, size.height));
    },
    [item],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "ArrowLeft") {
        if (slides.length > 1 && slide > 0) setSlide((s) => s - 1);
        else if (index > 0) onIndexChange(index - 1);
      }
      if (event.key === "ArrowRight") {
        if (slides.length > 1 && slide < slides.length - 1) setSlide((s) => s + 1);
        else if (index < items.length - 1) onIndexChange(index + 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, items.length, onClose, onIndexChange, slide, slides.length]);

  const stopWheel = useCallback((event: WheelEvent) => {
    event.stopPropagation();
  }, []);

  if (!item) return null;

  const username = snapshot.username;
  const verified = snapshot.fields.verified.value;
  const avatar = snapshot.fields.avatar.value;
  const displayName = snapshot.fields.displayName.value ?? username;
  const caption = item.source === "planned" ? "Planned preview" : displayName;
  const kindLabel =
    reel ? "Reel"
    : item.kind === "carousel" ? "Post"
    : "Post";

  /* —— Desktop web: same modal shell for posts, carousels, and reels —— */
  if (layout === "desktop") {
    return (
      <div
        className={`ig ${styles.overlay} ${styles.overlayDesktop}`}
        data-media-viewer
        role="dialog"
        aria-modal="true"
        aria-label={`${kindLabel} by ${username}`}
        onWheel={stopWheel}
        onClick={onClose}
      >
        <button
          type="button"
          className={styles.overlayClose}
          aria-label="Close"
          onClick={onClose}
        >
          <CloseIcon size={20} />
        </button>

        {index > 0 ?
          <button
            type="button"
            className={`${styles.itemNav} ${styles.itemNavPrev}`}
            aria-label="Previous"
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange(index - 1);
            }}
          >
            <ChevronLeftIcon />
          </button>
        : null}
        {index < items.length - 1 ?
          <button
            type="button"
            className={`${styles.itemNav} ${styles.itemNavNext}`}
            aria-label="Next"
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange(index + 1);
            }}
          >
            <ChevronRightIcon />
          </button>
        : null}

        <div
          className={[styles.dialog, reel ? styles.dialogReel : ""].filter(Boolean).join(" ")}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={[styles.dialogMedia, reel ? styles.dialogMediaReel : ""].filter(Boolean).join(" ")}
            style={reel ? undefined : mediaStyle}
          >
            <SharedImage
              image={slides[slide]}
              alt=""
              className={[styles.media, reel ? styles.mediaCover : ""].filter(Boolean).join(" ")}
              onNaturalSize={onNaturalSize}
            />
            {reel ?
              <button type="button" className={styles.muteBtn} aria-label="Toggle mute">
                <MuteIcon />
              </button>
            : null}
            {!reel && slides.length > 1 ?
              <>
                <button
                  type="button"
                  className={`${styles.navBtn} ${styles.navPrev}`}
                  aria-label="Previous slide"
                  disabled={slide === 0}
                  onClick={() => setSlide((s) => Math.max(0, s - 1))}
                >
                  <ChevronLeftIcon size={18} />
                </button>
                <button
                  type="button"
                  className={`${styles.navBtn} ${styles.navNext}`}
                  aria-label="Next slide"
                  disabled={slide >= slides.length - 1}
                  onClick={() => setSlide((s) => Math.min(slides.length - 1, s + 1))}
                >
                  <ChevronRightIcon size={18} />
                </button>
                <div className={styles.dots} aria-hidden>
                  {slides.map((_, i) => (
                    <span
                      key={i}
                      className={[styles.dot, i === slide ? styles.dotActive : ""].filter(Boolean).join(" ")}
                    />
                  ))}
                </div>
              </>
            : null}
          </div>

          <div className={styles.dialogSide}>
            <div className={styles.dialogHead}>
              <SharedImage image={avatar} alt="" className={styles.dialogAvatar} />
              <div className={styles.dialogHeadText}>
                <p className={styles.dialogUser}>
                  {username}
                  {verified ? <VerifiedBadge size={12} /> : null}
                </p>
                {reel ?
                  <p className={styles.dialogSub}>Original audio</p>
                : null}
              </div>
              <button type="button" className={styles.iconBtn} aria-label="More">
                <MoreHorizontalIcon />
              </button>
            </div>

            <div className={styles.dialogBody}>
              <div className={styles.captionRow}>
                <SharedImage image={avatar} alt="" className={styles.dialogAvatar} />
                <p className={styles.caption}>
                  <span className={styles.captionUser}>{username}</span>
                  {caption}
                </p>
              </div>
            </div>

            <div className={styles.dialogFoot}>
              <ActionRow />
              <p className={styles.likes}>Liked by others</p>
              <p className={styles.time}>Preview</p>
              <div className={styles.commentBox}>
                <EmojiIcon size={24} />
                <span className={styles.commentPlaceholder}>Add a comment…</span>
                <span className={styles.commentPost}>Post</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* —— Mobile reel (vertical snap pager like the app) —— */
  if (reel) {
    const reelItems = items.filter(isReel);
    const reelIndex = Math.max(
      0,
      reelItems.findIndex((r) => r.id === item.id),
    );

    return (
      <MobileReelViewer
        reelItems={reelItems}
        reelIndex={reelIndex}
        items={items}
        snapshot={snapshot}
        statusBarH={statusBarH}
        face={face}
        homeIndicator={homeIndicator}
        username={username}
        verified={Boolean(verified)}
        avatar={avatar}
        onIndexChange={onIndexChange}
        onClose={onClose}
        stopWheel={stopWheel}
      />
    );
  }

  /* —— Mobile post / carousel —— */
  return (
    <div
      className={`ig ${styles.overlay}`}
      data-media-viewer
      role="dialog"
      aria-modal="true"
      aria-label={`${kindLabel} by ${username}`}
      onWheel={stopWheel}
    >
      <MobileChrome statusBarH={statusBarH} face={face} homeIndicator={homeIndicator}>
        <div className={styles.topBar}>
          <button type="button" className={styles.iconBtn} aria-label="Back" onClick={onClose}>
            <BackIcon />
          </button>
          <p className={styles.title}>{kindLabel}</p>
          <button type="button" className={styles.iconBtn} aria-label="More">
            <MoreIcon />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.mediaWrap} style={mediaStyle}>
            <SharedImage
              image={slides[slide]}
              alt=""
              className={styles.media}
              onNaturalSize={onNaturalSize}
            />
            {slides.length > 1 ?
              <>
                <button
                  type="button"
                  className={`${styles.navBtn} ${styles.navPrev}`}
                  aria-label="Previous slide"
                  disabled={slide === 0}
                  onClick={() => setSlide((s) => Math.max(0, s - 1))}
                >
                  <ChevronLeftIcon size={18} />
                </button>
                <button
                  type="button"
                  className={`${styles.navBtn} ${styles.navNext}`}
                  aria-label="Next slide"
                  disabled={slide >= slides.length - 1}
                  onClick={() => setSlide((s) => Math.min(slides.length - 1, s + 1))}
                >
                  <ChevronRightIcon size={18} />
                </button>
                <div className={styles.dots} aria-hidden>
                  {slides.map((_, i) => (
                    <span
                      key={i}
                      className={[styles.dot, i === slide ? styles.dotActive : ""].filter(Boolean).join(" ")}
                    />
                  ))}
                </div>
              </>
            : null}
          </div>

          <ActionRow />

          <div className={styles.meta}>
            <p className={styles.caption}>
              <span className={styles.captionUser}>{username}</span>
              {caption}
            </p>
            {item.kind === "carousel" && slides.length > 1 ?
              <p className={styles.time}>
                {slide + 1} / {slides.length}
              </p>
            : null}
          </div>
        </div>
      </MobileChrome>
    </div>
  );
}
