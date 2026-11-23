"use client";

import { toPng } from "html-to-image";
import type { PreviewDeviceId } from "@/components/shell/DeviceCarousel";

function slug(id: PreviewDeviceId, username: string) {
  const who = username.replace(/[^a-z0-9._-]+/gi, "-") || "preview";
  return `${who}-${id}.png`;
}

function captureRoot(deviceId?: PreviewDeviceId): HTMLElement | null {
  if (deviceId) {
    return document.querySelector<HTMLElement>(`[data-device-capture="${deviceId}"]`);
  }
  return document.querySelector<HTMLElement>("[data-device-capture]");
}

async function waitForCaptureRoot(deviceId: PreviewDeviceId, tries = 24): Promise<HTMLElement> {
  for (let i = 0; i < tries; i++) {
    const el = captureRoot(deviceId);
    if (el && el.getBoundingClientRect().width > 8) return el;
    await new Promise((r) => window.requestAnimationFrame(() => r(undefined)));
    await new Promise((r) => window.setTimeout(r, 40));
  }
  throw new Error("Preview device is not ready to capture yet.");
}

type StyleBackup = { el: HTMLElement; cssText: string };

/** Expand frameless profile so html-to-image can rasterize the full feed. */
function expandBareFeed(root: HTMLElement): () => void {
  const backups: StyleBackup[] = [];
  const remember = (el: HTMLElement) => {
    backups.push({ el, cssText: el.style.cssText });
  };

  remember(root);
  root.style.height = "auto";
  root.style.maxHeight = "none";
  root.style.overflow = "visible";

  const stage = root.querySelector<HTMLElement>("[data-scale='bare']");
  if (stage) {
    remember(stage);
    stage.style.height = "auto";
    stage.style.maxHeight = "none";
    stage.style.overflow = "visible";
  }

  const screen = root.querySelector<HTMLElement>(".ig");
  if (screen) {
    remember(screen);
    screen.style.height = "auto";
    screen.style.maxHeight = "none";
    screen.style.overflow = "visible";
  }

  const feed = root.querySelector<HTMLElement>("[data-capture-feed]");
  if (feed) {
    remember(feed);
    feed.style.overflow = "visible";
    feed.style.height = "auto";
    feed.style.maxHeight = "none";
    feed.style.flex = "0 0 auto";
  }

  return () => {
    for (const { el, cssText } of backups) el.style.cssText = cssText;
  };
}

/** Snapshot the on-screen device chrome into a PNG and trigger download. */
export async function downloadDeviceImage(input: {
  deviceId: PreviewDeviceId;
  username: string;
  /** Switch carousel to this device before capture when it is not already active. */
  ensureSelected?: (id: PreviewDeviceId) => void;
  activeId: PreviewDeviceId;
}): Promise<void> {
  const { deviceId, username, ensureSelected, activeId } = input;
  if (deviceId !== activeId) {
    ensureSelected?.(deviceId);
  }
  const node = await waitForCaptureRoot(deviceId);
  // Let scroll/layout settle after a device switch.
  await new Promise((r) => window.setTimeout(r, deviceId === activeId ? 60 : 420));

  const restore = deviceId === "bare" ? expandBareFeed(node) : null;
  if (restore) {
    await new Promise((r) => window.requestAnimationFrame(() => r(undefined)));
    await new Promise((r) => window.setTimeout(r, 80));
  }

  try {
    const dataUrl = await toPng(node, {
      pixelRatio: Math.min(2, window.devicePixelRatio || 2),
      cacheBust: true,
      preferredFontFormat: "woff2",
      ...(deviceId === "bare" ?
        { width: node.scrollWidth, height: node.scrollHeight }
      : null),
    });

    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = slug(deviceId, username);
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    restore?.();
  }
}
