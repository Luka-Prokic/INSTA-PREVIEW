import type { ImageRef } from "@/features/import/types";
import { resolveImageUrl } from "@/features/planner/persistence";

const MAX_EDGE = 480;
const JPEG_QUALITY = 0.72;

async function blobToThumbDataUrl(blob: Blob): Promise<string> {
  const bitmap = await createImageBitmap(blob);
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not encode thumbnail.");
    ctx.drawImage(bitmap, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } finally {
    bitmap.close();
  }
}

/** Turn any ImageRef into a portable remote data-URL thumbnail (or null if missing). */
export async function toThumbRef(image: ImageRef | undefined): Promise<ImageRef | undefined> {
  if (!image) return undefined;
  const url = await resolveImageUrl(image);
  if (!url) return undefined;

  if (url.startsWith("data:image/")) {
    return { kind: "remote", url };
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("fetch failed");
    const blob = await response.blob();
    const dataUrl = await blobToThumbDataUrl(blob);
    return { kind: "remote", url: dataUrl };
  } catch {
    // Fall back to original remote URL when we cannot re-encode (CORS, etc.).
    if (image.kind === "remote") return image;
    return undefined;
  }
}
