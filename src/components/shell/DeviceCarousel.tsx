"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type CSSProperties,
} from "react";
import type { ProfileSnapshot } from "@/features/import/types";
import { useWorkspace } from "@/features/planner/store";
import type { PlannedItem, PreviewTab, ViewMode } from "@/features/planner/types";
import { DesktopProfile } from "@/features/preview/desktop/DesktopProfile";
import {
  CAROUSEL_PHONE_IDS,
  getPhoneModel,
  isCarouselPhoneId,
  phoneOuterSize,
  type PhoneModelId,
} from "@/features/preview/devices";
import { MobileProfile } from "@/features/preview/mobile/MobileProfile";
import styles from "./DeviceCarousel.module.css";

export type PreviewDeviceId = PhoneModelId | "desktop" | "macbook" | "bare";

type DeviceEntry =
  | { id: PhoneModelId; kind: "phone"; name: string; subtitle: string; aspect: number }
  | {
      id: "desktop" | "macbook";
      kind: "screen";
      name: string;
      subtitle: string;
      aspect: number;
      chrome: "monitor" | "macbook";
    }
  | { id: "bare"; kind: "bare"; name: string; subtitle: string; aspect: number };

function phoneEntry(id: PhoneModelId): DeviceEntry {
  const m = getPhoneModel(id);
  const outer = phoneOuterSize(m);
  return {
    id: m.id,
    kind: "phone",
    name: m.name,
    subtitle: `${m.sizeLabel} · ${m.screenW}×${m.screenH}`,
    aspect: outer.width / outer.height,
  };
}

const BARE_ENTRY: DeviceEntry = {
  id: "bare",
  kind: "bare",
  name: "No device",
  subtitle: "Full feed · no frame",
  aspect: 390 / 844,
};

const DESKTOP_ENTRY: DeviceEntry = {
  id: "desktop",
  kind: "screen",
  name: "Desktop",
  subtitle: "16:9 display",
  aspect: 16 / 9,
  chrome: "monitor",
};

const MACBOOK_ENTRY: DeviceEntry = {
  id: "macbook",
  kind: "screen",
  name: "MacBook",
  subtitle: "16:10 display",
  aspect: 16 / 10,
  chrome: "macbook",
};

/** Featured carousel strip; injects sidebar-only devices when selected. */
export function buildCarouselDevices(
  phoneModelId: PhoneModelId,
  viewMode: ViewMode = "mobile",
): DeviceEntry[] {
  const phones = CAROUSEL_PHONE_IDS.map(phoneEntry);
  if (viewMode === "mobile" && !isCarouselPhoneId(phoneModelId)) {
    phones.push(phoneEntry(phoneModelId));
  }
  const screens: DeviceEntry[] = [MACBOOK_ENTRY];
  if (viewMode === "desktop") {
    screens.unshift(DESKTOP_ENTRY);
  }
  return [BARE_ENTRY, ...phones, ...screens];
}

export function selectedId(
  viewMode: ViewMode,
  phoneModelId: PhoneModelId,
): PreviewDeviceId {
  if (viewMode === "desktop" || viewMode === "macbook" || viewMode === "bare") {
    return viewMode;
  }
  return phoneModelId;
}

export function getActiveDeviceLabel(
  viewMode: ViewMode,
  phoneModelId: PhoneModelId,
): { name: string; subtitle: string } {
  const id = selectedId(viewMode, phoneModelId);
  const device =
    buildCarouselDevices(phoneModelId, viewMode).find((d) => d.id === id) ??
    (id === "desktop" ? DESKTOP_ENTRY : phoneEntry(phoneModelId));
  return { name: device.name, subtitle: device.subtitle };
}

/** Target scrollLeft so `slide`’s center sits on the viewport’s center. */
function targetScrollLeft(viewport: HTMLElement, slide: HTMLElement): number {
  const vRect = viewport.getBoundingClientRect();
  const sRect = slide.getBoundingClientRect();
  const delta = sRect.left + sRect.width / 2 - (vRect.left + vRect.width / 2);
  const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  return Math.min(max, Math.max(0, viewport.scrollLeft + delta));
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

/** Quiet after last scroll input before we ease the active slide to center. */
const SCROLL_IDLE_MS = 180;
const CENTER_MS = 420;

export function DeviceCarousel({
  snapshot,
  planned,
  editMode,
  tab,
  onTabChange,
  viewMode: viewModeProp,
  phoneModelId: phoneModelIdProp,
  onViewModeChange,
  onPhoneModelIdChange,
}: {
  snapshot: ProfileSnapshot;
  planned: PlannedItem[];
  editMode: boolean;
  tab: PreviewTab;
  onTabChange: (tab: PreviewTab) => void;
  viewMode?: ViewMode;
  phoneModelId?: PhoneModelId;
  phoneScaleMode?: "actual" | "fill";
  onViewModeChange?: (mode: ViewMode) => void;
  onPhoneModelIdChange?: (id: PhoneModelId) => void;
}) {
  const workspace = useWorkspace();
  const viewMode = viewModeProp ?? workspace.viewMode;
  const phoneModelId = phoneModelIdProp ?? workspace.phoneModelId;
  const setViewMode = onViewModeChange ?? workspace.setViewMode;
  const setPhoneModelId = onPhoneModelIdChange ?? workspace.setPhoneModelId;
  const gridOrder = workspace.gridOrder;

  const devices = useMemo(
    () => buildCarouselDevices(phoneModelId, viewMode),
    [phoneModelId, viewMode],
  );
  const active = selectedId(viewMode, phoneModelId);
  const activeRef = useRef(active);
  activeRef.current = active;

  const viewportRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef(new Map<string, HTMLDivElement>());
  const didMount = useRef(false);
  /** Selection came from belt scroll — don't auto-center via the active effect. */
  const fromBelt = useRef(false);
  /** True while we ease scrollLeft — ignore selection sync / don't restart. */
  const centering = useRef(false);
  const centerRaf = useRef(0);

  const setSlideRef = useCallback((id: string, node: HTMLDivElement | null) => {
    if (node) slideRefs.current.set(id, node);
    else slideRefs.current.delete(id);
  }, []);

  const select = useCallback(
    (id: PreviewDeviceId) => {
      if (id === "desktop" || id === "macbook" || id === "bare") {
        setViewMode(id);
        return;
      }
      setPhoneModelId(id);
      setViewMode("mobile");
    },
    [setPhoneModelId, setViewMode],
  );

  const cancelCenter = useCallback(() => {
    if (centerRaf.current) {
      cancelAnimationFrame(centerRaf.current);
      centerRaf.current = 0;
    }
    centering.current = false;
  }, []);

  /** Ease a slide to center — never jumps. */
  const scrollSlideToCenter = useCallback(
    (deviceId: PreviewDeviceId, instant = false) => {
      const viewport = viewportRef.current;
      const slide = slideRefs.current.get(deviceId);
      if (!viewport || !slide) return;

      const left = targetScrollLeft(viewport, slide);
      const from = viewport.scrollLeft;
      if (Math.abs(from - left) < 1) return;

      cancelCenter();

      if (
        instant ||
        (typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      ) {
        viewport.scrollLeft = left;
        return;
      }

      centering.current = true;
      const dist = left - from;
      const start = performance.now();

      const step = (now: number) => {
        const t = Math.min(1, (now - start) / CENTER_MS);
        viewport.scrollLeft = from + dist * easeOutCubic(t);
        if (t < 1) {
          centerRaf.current = requestAnimationFrame(step);
        } else {
          centerRaf.current = 0;
          viewport.scrollLeft = left;
          centering.current = false;
        }
      };
      centerRaf.current = requestAnimationFrame(step);
    },
    [cancelCenter],
  );

  const scrollActiveToCenter = useCallback(
    (instant = false) => scrollSlideToCenter(activeRef.current, instant),
    [scrollSlideToCenter],
  );

  // Sidebar / click selection → ease to center. Belt scroll schedules its own ease.
  useLayoutEffect(() => {
    if (fromBelt.current) {
      fromBelt.current = false;
      return;
    }
    const instant = !didMount.current;
    didMount.current = true;
    const id = window.requestAnimationFrame(() => scrollActiveToCenter(instant));
    return () => window.cancelAnimationFrame(id);
  }, [active, scrollActiveToCenter]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const sync = () => {
      viewport.style.setProperty(
        "--carousel-h",
        `${Math.max(0, viewport.clientHeight - 96)}px`,
      );
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(viewport);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const nearest = (): PreviewDeviceId | null => {
      const mid = viewport.getBoundingClientRect();
      const centerX = mid.left + mid.width / 2;
      let best: { id: PreviewDeviceId; dist: number } | null = null;
      for (const device of devices) {
        const el = slideRefs.current.get(device.id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const dist = Math.abs(r.left + r.width / 2 - centerX);
        if (!best || dist < best.dist) best = { id: device.id, dist };
      }
      return best?.id ?? null;
    };

    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const clearIdle = () => {
      if (idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }
    };

    /** Light-up: nearest device tracks the viewport center while you scroll. */
    const syncSelection = () => {
      if (centering.current) return;
      const id = nearest();
      if (!id || id === activeRef.current) return;
      fromBelt.current = true; // don't center mid-scroll
      select(id);
    };

    /** After the gesture stops: ease the lit-up (nearest) slide to center. */
    const onScrollIdle = () => {
      idleTimer = null;
      if (centering.current) return;
      const id = nearest() ?? activeRef.current;
      if (id !== activeRef.current) {
        fromBelt.current = true;
        select(id);
      }
      scrollSlideToCenter(id, false);
    };

    const bumpIdle = () => {
      if (centering.current) return;
      clearIdle();
      idleTimer = setTimeout(onScrollIdle, SCROLL_IDLE_MS);
    };

    const onScroll = () => {
      if (centering.current) return;
      syncSelection();
      bumpIdle();
    };

    /**
     * Horizontal only — never map vertical trackpad/wheel into the strip.
     * Shift+vertical is the mouse shortcut for horizontal scroll.
     */
    const onWheel = (event: WheelEvent) => {
      let dx = event.deltaX;
      let dy = event.deltaY;
      if (event.deltaMode === 1) {
        dx *= 16;
        dy *= 16;
      } else if (event.deltaMode === 2) {
        dx *= viewport.clientWidth;
        dy *= viewport.clientHeight;
      }

      const delta = event.shiftKey ? dy || dx : dx;
      if (delta === 0) return;
      if (!event.shiftKey && Math.abs(dy) > Math.abs(dx) * 1.25) return;

      event.preventDefault();
      if (centering.current) cancelCenter();
      viewport.scrollLeft += delta;
      syncSelection();
      bumpIdle();
    };

    let pointerId: number | null = null;
    let startX = 0;
    let startScroll = 0;
    let dragging = false;
    const DRAG = 8;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const t = event.target;
      if (
        t instanceof Element &&
        t.closest("[data-capture-feed], [data-media-viewer], button, a, [role='tab']")
      ) {
        return;
      }
      if (centering.current) cancelCenter();
      clearIdle();
      pointerId = event.pointerId;
      startX = event.clientX;
      startScroll = viewport.scrollLeft;
      dragging = false;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      const dist = event.clientX - startX;
      if (!dragging && Math.abs(dist) < DRAG) return;
      if (!dragging) {
        dragging = true;
        viewport.setPointerCapture(event.pointerId);
      }
      viewport.scrollLeft = startScroll - dist;
      syncSelection();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      const wasDrag = dragging;
      pointerId = null;
      dragging = false;
      try {
        viewport.releasePointerCapture(event.pointerId);
      } catch {
        /* ok */
      }
      if (wasDrag) {
        syncSelection();
        bumpIdle();
        return;
      }
      const el = document.elementFromPoint(event.clientX, event.clientY);
      const slide = el instanceof Element ? el.closest("[data-device-slide]") : null;
      const id = slide?.getAttribute("data-device-slide") as PreviewDeviceId | null;
      if (id && id !== activeRef.current) {
        fromBelt.current = false; // layout effect eases to center
        select(id);
      } else if (id) {
        scrollActiveToCenter(false);
      }
    };

    viewport.addEventListener("scroll", onScroll, { passive: true });
    viewport.addEventListener("wheel", onWheel, { passive: false, capture: true });
    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", onPointerUp);
    viewport.addEventListener("pointercancel", onPointerUp);

    return () => {
      viewport.removeEventListener("scroll", onScroll);
      viewport.removeEventListener("wheel", onWheel, true);
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      viewport.removeEventListener("pointerup", onPointerUp);
      viewport.removeEventListener("pointercancel", onPointerUp);
      clearIdle();
      cancelCenter();
    };
  }, [select, devices, scrollActiveToCenter, scrollSlideToCenter, cancelCenter]);

  return (
    <div
      ref={viewportRef}
      className={styles.viewport}
      aria-label="Device preview carousel"
    >
      <div className={styles.track}>
        {devices.map((device) => {
          const isActive = device.id === active;
          return (
            <div
              key={device.id}
              ref={(node) => setSlideRef(device.id, node)}
              className={styles.slide}
              data-device-slide={device.id}
              data-active={isActive || undefined}
              role="group"
              aria-label={device.name}
            >
              {device.kind === "phone" ?
                <div
                  className={styles.phoneSlot}
                  style={{ "--slide-aspect": String(device.aspect) } as CSSProperties}
                  data-device-capture={isActive ? device.id : undefined}
                >
                  <MobileProfile
                    snapshot={snapshot}
                    planned={planned}
                    editMode={editMode && isActive}
                    tab={tab}
                    onTabChange={onTabChange}
                    phoneModelId={device.id}
                    phoneScaleMode="actual"
                    variant="slide"
                    gridOrder={gridOrder}
                  />
                  <p className={styles.dimLabel} aria-hidden={isActive || undefined}>
                    {device.name}
                    <span className={styles.dimSub}>{device.subtitle}</span>
                  </p>
                </div>
              : device.kind === "bare" ?
                <div
                  className={styles.bareSlot}
                  data-device-capture={isActive ? "bare" : undefined}
                >
                  <MobileProfile
                    snapshot={snapshot}
                    planned={planned}
                    editMode={editMode && isActive}
                    tab={tab}
                    onTabChange={onTabChange}
                    variant="bare"
                    gridOrder={gridOrder}
                  />
                  <p className={styles.dimLabel} aria-hidden={isActive || undefined}>
                    {device.name}
                    <span className={styles.dimSub}>{device.subtitle}</span>
                  </p>
                </div>
              : <div
                  className={styles.screenSlot}
                  data-device-capture={isActive ? device.id : undefined}
                >
                  <DesktopProfile
                    snapshot={snapshot}
                    planned={planned}
                    editMode={editMode && isActive}
                    tab={tab}
                    onTabChange={onTabChange}
                    chrome={device.chrome}
                    gridOrder={gridOrder}
                  />
                  <p className={styles.dimLabel} aria-hidden={isActive || undefined}>
                    {device.name}
                    <span className={styles.dimSub}>{device.subtitle}</span>
                  </p>
                </div>
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}
