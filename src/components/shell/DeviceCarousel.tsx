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

function centerSlide(viewport: HTMLElement, slide: HTMLElement, behavior: ScrollBehavior) {
  const left = Math.max(0, slide.offsetLeft + slide.offsetWidth / 2 - viewport.clientWidth / 2);
  viewport.scrollTo({ left, behavior });
}

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
  /** True while we programmatically center — don't fight scroll with selection sync. */
  const programmaticScroll = useRef(false);
  const didMount = useRef(false);

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

  // Sidebar / external selection → center active slide.
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const slide = slideRefs.current.get(active);
    if (!viewport || !slide) return;

    const behavior: ScrollBehavior = didMount.current ? "smooth" : "auto";
    didMount.current = true;
    programmaticScroll.current = true;
    centerSlide(viewport, slide, behavior);

    const clear = window.setTimeout(
      () => {
        programmaticScroll.current = false;
      },
      behavior === "smooth" ? 450 : 50,
    );
    return () => window.clearTimeout(clear);
  }, [active]);

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

    const settleToNearest = () => {
      if (programmaticScroll.current) return;
      const id = nearest();
      if (!id) return;
      const slide = slideRefs.current.get(id);
      if (slide) {
        programmaticScroll.current = true;
        centerSlide(viewport, slide, "smooth");
        window.setTimeout(() => {
          programmaticScroll.current = false;
        }, 420);
      }
      if (id !== activeRef.current) select(id);
    };

    let settleTimer: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (programmaticScroll.current) return;
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(settleToNearest, 120);
    };

    const onScrollEnd = () => {
      if (settleTimer) clearTimeout(settleTimer);
      settleToNearest();
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
      // Ignore mostly-vertical gestures (keep feed / page vertical).
      if (!event.shiftKey && Math.abs(dy) > Math.abs(dx) * 1.25) return;

      event.preventDefault();
      viewport.scrollLeft += delta;
    };

    // Horizontal drag to scrub; clicks still select.
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
        t.closest("[data-capture-feed], button, a, [role='tab']")
      ) {
        return;
      }
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
        settleToNearest();
        return;
      }
      const el = document.elementFromPoint(event.clientX, event.clientY);
      const slide = el instanceof Element ? el.closest("[data-device-slide]") : null;
      const id = slide?.getAttribute("data-device-slide") as PreviewDeviceId | null;
      if (id && id !== activeRef.current) select(id);
    };

    viewport.addEventListener("scroll", onScroll, { passive: true });
    viewport.addEventListener("scrollend", onScrollEnd);
    // capture so trackpad wheel reaches us even over nested preview nodes
    viewport.addEventListener("wheel", onWheel, { passive: false, capture: true });
    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", onPointerUp);
    viewport.addEventListener("pointercancel", onPointerUp);

    return () => {
      viewport.removeEventListener("scroll", onScroll);
      viewport.removeEventListener("scrollend", onScrollEnd);
      viewport.removeEventListener("wheel", onWheel, true);
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      viewport.removeEventListener("pointerup", onPointerUp);
      viewport.removeEventListener("pointercancel", onPointerUp);
      if (settleTimer) clearTimeout(settleTimer);
    };
  }, [select, devices]);

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
