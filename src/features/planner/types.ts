import type { ImageRef, MediaKind } from "@/features/import/types";

export type PlannedKind = Extract<MediaKind, "image" | "carousel" | "reel">;

export type PlannedItem = {
  id: string;
  kind: PlannedKind;
  /** Local blob key or remote URL used as the grid cover. */
  image: ImageRef;
  /** Original file name, for the sidebar list. */
  name: string;
  createdAt: number;
  /** Focal point for the 3:4 crop, as fractions of the image (0–1). Default center. */
  focusX: number;
  focusY: number;
  /** Preview pin — counts toward the same 3-pin cap as published pins. */
  pinned?: boolean;
};

export type ViewMode = "mobile" | "desktop" | "macbook" | "bare";

export type { PhoneModelId, PhoneScaleMode } from "@/features/preview/devices";

export type PreviewTab = "posts" | "reels" | "tagged";

export type GridItem = {
  id: string;
  kind: MediaKind;
  image: ImageRef;
  source: "planned" | "published";
  pinned?: boolean;
  focusX?: number;
  focusY?: number;
  viewCount?: number;
};
