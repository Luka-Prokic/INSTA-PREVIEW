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

async function waitForCaptureRoot(deviceId: PreviewDeviceId, tries = 36): Promise<HTMLElement> {
  for (let i = 0; i < tries; i++) {
    const el = captureRoot(deviceId);
    if (el && el.getBoundingClientRect().width > 8) return el;
    await new Promise((r) => window.requestAnimationFrame(() => r(undefined)));
    await new Promise((r) => window.setTimeout(r, 50));
  }
  throw new Error("Preview device is not ready to capture yet.");
}

type StyleBackup = { el: HTMLElement; cssText: string };

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read image."));
    reader.readAsDataURL(blob);
  });
}

const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/** Draw an already-decoded <img> to a data URL (works for blob:/same-origin). */
function canvasFromImage(img: HTMLImageElement): string | null {
  try {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) return null;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.92);
  } catch {
    // Tainted canvas (cross-origin without CORS) — caller falls back to fetch.
    return null;
  }
}

async function fetchToDataUrl(src: string): Promise<string | null> {
  try {
    let fetchUrl = src;
    if (/^https?:\/\//i.test(src) && !src.startsWith(window.location.origin)) {
      fetchUrl = `/api/media?url=${encodeURIComponent(src)}`;
    }
    const res = await fetch(fetchUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    // IndexedDB / blob: responses often have an empty MIME — still encode them.
    if (blob.type && !blob.type.startsWith("image/") && blob.type !== "application/octet-stream") {
      return null;
    }
    return blobToDataUrl(blob);
  } catch {
    return null;
  }
}

/**
 * Replace every <img> src with an embedded data URL so html-to-image never
 * hits CORS / expired CDN URLs. Prefer the already-decoded bitmap on screen.
 */
async function inlineImages(root: HTMLElement): Promise<() => void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  const backups: { img: HTMLImageElement; src: string; srcset: string }[] = [];
  const cache = new Map<string, string>();

  await Promise.all(
    imgs.map(async (img) => {
      const src = img.currentSrc || img.getAttribute("src") || "";
      if (!src || src.startsWith("data:")) return;
      backups.push({ img, src: img.getAttribute("src") || src, srcset: img.getAttribute("srcset") || "" });

      let dataUrl = cache.get(src) ?? null;
      if (!dataUrl) {
        if (img.complete && img.naturalWidth > 0) {
          dataUrl = canvasFromImage(img);
        }
        if (!dataUrl) dataUrl = await fetchToDataUrl(src);
        if (dataUrl) cache.set(src, dataUrl);
      }

      img.removeAttribute("srcset");
      img.src = dataUrl ?? TRANSPARENT_PIXEL;
    }),
  );

  await Promise.all(
    imgs.map(
      (img) =>
        img.complete ?
          Promise.resolve()
        : new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }),
    ),
  );

  return () => {
    for (const { img, src, srcset } of backups) {
      img.src = src;
      if (srcset) img.setAttribute("srcset", srcset);
      else img.removeAttribute("srcset");
    }
  };
}

function rememberStyle(backups: StyleBackup[], el: HTMLElement) {
  backups.push({ el, cssText: el.style.cssText });
}

function restoreStyles(backups: StyleBackup[]) {
  for (const { el, cssText } of backups) el.style.cssText = cssText;
}

/** Prefer the real device chrome; fall back to the carousel slot. */
function captureSubject(root: HTMLElement, deviceId: PreviewDeviceId): HTMLElement {
  if (deviceId === "bare") {
    return (
      root.querySelector<HTMLElement>("[data-scale='bare']") ??
      root.querySelector<HTMLElement>(".ig") ??
      root
    );
  }
  return (
    root.querySelector<HTMLElement>("[data-capture-phone]") ??
    root.querySelector<HTMLElement>("[data-capture-device]") ??
    root
  );
}

/**
 * Put the device at natural (unscaled) size and stop ancestors from clipping it
 * so we can measure the full chrome before cloning off-screen.
 */
function revealFullDevice(root: HTMLElement, subject: HTMLElement): () => void {
  const backups: StyleBackup[] = [];

  let el: HTMLElement | null = subject;
  while (el) {
    rememberStyle(backups, el);
    el.style.overflow = "visible";
    el.style.maxHeight = "none";
    el.style.maxWidth = "none";
    if (el === root) break;
    el = el.parentElement;
  }

  rememberStyle(backups, subject);
  subject.style.transform = "none";
  subject.style.margin = "0";
  subject.style.height = "auto";
  subject.style.width = "auto";

  // Phones: expand the scale slot to the phone's intrinsic CSS size.
  const slot = root.querySelector<HTMLElement>("[data-capture-scale-slot]");
  if (slot && subject.hasAttribute("data-capture-phone")) {
    rememberStyle(backups, slot);
    const w = subject.style.width || `${subject.offsetWidth}px`;
    const h = subject.style.height || `${subject.offsetHeight}px`;
    slot.style.width = w;
    slot.style.height = h;
    slot.style.maxHeight = "none";
    slot.style.overflow = "visible";
  }

  // Desktop / MacBook: carousel CSS shrinks the panel to the viewport — force export size.
  const panel = subject.querySelector<HTMLElement>("[data-capture-panel]");
  const kind = subject.getAttribute("data-capture-device");
  if (panel && kind) {
    rememberStyle(backups, panel);
    const exportW = kind === "macbook" ? 1100 : 1280;
    const exportH = kind === "macbook" ? Math.round((exportW * 10) / 16) : Math.round((exportW * 9) / 16);
    panel.style.setProperty("--panel-w", `${exportW}px`);
    panel.style.width = `${exportW}px`;
    panel.style.height = `${exportH}px`;
    panel.style.maxWidth = "none";
    panel.style.maxHeight = "none";
    panel.style.overflow = "hidden";
  }

  rememberStyle(backups, root);
  root.style.overflow = "visible";
  root.style.maxHeight = "none";
  root.style.height = "auto";

  if (root.dataset.deviceCapture === "bare" || subject.matches("[data-scale='bare']")) {
    const feed = subject.querySelector<HTMLElement>("[data-capture-feed]") ?? subject;
    rememberStyle(backups, feed);
    feed.style.overflow = "visible";
    feed.style.height = "auto";
    feed.style.maxHeight = "none";
    feed.style.flex = "0 0 auto";
  }

  return () => restoreStyles(backups);
}

async function waitForCloneImages(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        img.complete ?
          Promise.resolve()
        : new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }),
    ),
  );
}

function triggerDownload(dataUrl: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

/**
 * Clone the full device into an off-screen host so carousel scale/clipping
 * cannot crop the PNG.
 */
async function rasterizeFullDevice(subject: HTMLElement): Promise<string> {
  const width = Math.ceil(subject.offsetWidth || subject.getBoundingClientRect().width);
  const height = Math.ceil(subject.offsetHeight || subject.getBoundingClientRect().height);
  if (width < 8 || height < 8) {
    throw new Error("Preview is too small to capture.");
  }

  const host = document.createElement("div");
  host.setAttribute("data-capture-host", "");
  host.style.cssText = [
    "position:fixed",
    "left:-12000px",
    "top:0",
    `width:${width}px`,
    `height:${height}px`,
    "overflow:visible",
    "pointer-events:none",
    "z-index:-1",
    "background:transparent",
  ].join(";");

  const clone = subject.cloneNode(true) as HTMLElement;
  clone.style.transform = "none";
  clone.style.width = `${width}px`;
  clone.style.height = deviceIdIsBare(subject) ? "auto" : `${height}px`;
  clone.style.maxWidth = "none";
  clone.style.maxHeight = "none";
  clone.style.margin = "0";
  clone.style.position = "relative";
  clone.style.left = "0";
  clone.style.top = "0";
  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    await waitForCloneImages(clone);
    // Re-inline on the clone in case cloneNode dropped long data URLs / blob refs.
    await inlineImages(clone);
    await new Promise((r) => window.requestAnimationFrame(() => r(undefined)));

    const captureH =
      deviceIdIsBare(subject) ?
        Math.ceil(Math.max(clone.scrollHeight, clone.offsetHeight, height))
      : height;

    if (deviceIdIsBare(subject)) {
      host.style.height = `${captureH}px`;
      clone.style.height = `${captureH}px`;
    }

    // Images are already data URLs — cacheBust must stay off (it mangled srcs and
    // blanked posts / avatar / highlights).
    const dataUrl = await toPng(clone, {
      width,
      height: captureH,
      pixelRatio: Math.min(2, window.devicePixelRatio || 2),
      cacheBust: false,
      skipFonts: true,
      imagePlaceholder: TRANSPARENT_PIXEL,
      style: {
        transform: "none",
        margin: "0",
      },
    });

    if (!dataUrl || dataUrl === "data:,") {
      throw new Error("Capture produced an empty image.");
    }
    return dataUrl;
  } finally {
    host.remove();
  }
}

function deviceIdIsBare(subject: HTMLElement) {
  return subject.matches("[data-scale='bare']") || Boolean(subject.closest("[data-device-capture='bare']"));
}

/** Snapshot the full on-screen device chrome into a PNG and trigger download. */
export async function downloadDeviceImage(input: {
  deviceId: PreviewDeviceId;
  username: string;
  ensureSelected?: (id: PreviewDeviceId) => void;
  activeId: PreviewDeviceId;
}): Promise<void> {
  const { deviceId, username, ensureSelected, activeId } = input;
  if (deviceId !== activeId) {
    ensureSelected?.(deviceId);
  }

  const root = await waitForCaptureRoot(deviceId);
  await new Promise((r) => window.setTimeout(r, deviceId === activeId ? 100 : 520));

  const subject = captureSubject(root, deviceId);
  const restoreReveal = revealFullDevice(root, subject);
  await new Promise((r) => window.requestAnimationFrame(() => r(undefined)));
  await new Promise((r) => window.setTimeout(r, 50));

  const restoreImages = await inlineImages(subject);
  await new Promise((r) => window.requestAnimationFrame(() => r(undefined)));

  try {
    const dataUrl = await rasterizeFullDevice(subject);
    triggerDownload(dataUrl, slug(deviceId, username));
  } finally {
    restoreImages();
    restoreReveal();
  }
}
