import type { ProfileSnapshot } from "@/features/import/types";
import type { PlannedItem, ViewMode } from "@/features/planner/types";
import type { PhoneModelId, PhoneScaleMode } from "@/features/preview/devices";

/** Portable plan snapshot for a public share link — thumbnails only, never tokens. */
export type SharedPlan = {
  id: string;
  createdAt: number;
  username: string;
  /** Profile + published media with remote/data-URL thumbs only. */
  snapshot: ProfileSnapshot;
  /** Planned covers as remote/data-URL thumbs only. */
  planned: PlannedItem[];
  viewMode?: ViewMode;
  phoneModelId?: PhoneModelId;
  phoneScaleMode?: PhoneScaleMode;
};

export type CreateShareRequest = Omit<SharedPlan, "id" | "createdAt">;
