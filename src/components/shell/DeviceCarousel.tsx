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
  const ignoreScrollSync = useRef(false);

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

  // Sidebar / click only — don't re-center after a user scroll (snap already did).
  const didMount = useRef(false);
  const skipCenterRef = useRef(false);
  useLayoutEffect(() => {
    if (skipCenterRef.current) {
      skipCenterRef.current = false;
      return;
    }
    const slide = slideRefs.current.get(active);
    if (!slide) return;
    ignoreScrollSync.current = true;
    slide.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: didMount.current ? "smooth" : "auto",
    });
    didMount.current = true;
    const t = window.setTimeout(() => {
      ignoreScrollSync.current = false;
    }, 400);
    return () => window.clearTimeout(t);
  }, [active]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const sync = () => {
      viewport.style.setProperty(
        "--carousel-h",
        `${Math.max(0, viewport.clientHeight - 48)}px`,
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

    const onScrollEnd = () => {
      if (ignoreScrollSync.current) return;
      const id = nearest();
      if (!id || id === activeRef.current) return;
      skipCenterRef.current = true;
      select(id);
    };

    let snapTimer: ReturnType<typeof setTimeout> | null = null;
    const onWheel = (event: WheelEvent) => {
      if (!(event.target instanceof Node) || !viewport.contains(event.target)) return;
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      if (event.deltaX === 0) return;
      event.preventDefault();
      viewport.style.scrollSnapType = "none";
      viewport.scrollLeft += event.deltaX;
      if (snapTimer) clearTimeout(snapTimer);
      snapTimer = setTimeout(() => {
        viewport.style.scrollSnapType = "";
      }, 120);
    };

    viewport.addEventListener("scrollend", onScrollEnd);
    viewport.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => {
      viewport.removeEventListener("scrollend", onScrollEnd);
      viewport.removeEventListener("wheel", onWheel, true);
      if (snapTimer) clearTimeout(snapTimer);
      viewport.style.scrollSnapType = "";
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
              data-active={isActive || undefined}
              role="group"
              aria-label={device.name}
              onClick={() => {
                if (!isActive) select(device.id);
              }}
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
                    editMode={editMode}
                    tab={tab}
                    onTabChange={onTabChange}
                    phoneModelId={device.id}
                    phoneScaleMode="actual"
                    variant="slide"
                    gridOrder={gridOrder}
                  />
                </div>
              : device.kind === "bare" ?
                <div
                  className={styles.bareSlot}
                  data-device-capture={isActive ? "bare" : undefined}
                >
                  <MobileProfile
                    snapshot={snapshot}
                    planned={planned}
                    editMode={editMode}
                    tab={tab}
                    onTabChange={onTabChange}
                    variant="bare"
                    gridOrder={gridOrder}
                  />
                </div>
              : <div
                  className={styles.screenSlot}
                  data-device-capture={isActive ? device.id : undefined}
                >
                  <DesktopProfile
                    snapshot={snapshot}
                    planned={planned}
                    editMode={editMode}
                    tab={tab}
                    onTabChange={onTabChange}
                    chrome={device.chrome}
                    gridOrder={gridOrder}
                  />
                </div>
              }
              <p className={styles.dimLabel} aria-hidden={!isActive ? undefined : true}>
                {device.name}
                <span className={styles.dimSub}>{device.subtitle}</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
