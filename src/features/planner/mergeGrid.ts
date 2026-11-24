import type { PublishedMedia } from "@/features/import/types";
import { MAX_PINNED } from "@/features/import/types";
import type { GridItem, PlannedItem, PreviewTab } from "./types";

/** Apply a saved sidebar/grid order; unknown ids keep their relative default place at the end. */
export function applyGridOrder(items: GridItem[], order: string[] | null | undefined): GridItem[] {
  if (!order?.length || items.length <= 1) return items;
  const map = new Map(items.map((item) => [item.id, item]));
  const out: GridItem[] = [];
  for (const id of order) {
    const item = map.get(id);
    if (!item) continue;
    out.push(item);
    map.delete(id);
  }
  for (const item of items) {
    if (map.has(item.id)) out.push(item);
  }
  return out;
}

/** Keep prior order for still-present ids; append new ids in `fallback` order. */
export function reconcileGridOrder(
  order: string[] | null | undefined,
  fallbackIds: string[],
): string[] | null {
  if (!order?.length) return null;
  const want = new Set(fallbackIds);
  const kept = order.filter((id) => want.has(id));
  const missing = fallbackIds.filter((id) => !kept.includes(id));
  return [...kept, ...missing];
}

/**
 * Instagram-like default: up to 3 pinned (published + planned), then planned, then published.
 * Custom `order` reorders within the pinned block and within the unpinned block only —
 * pins always stay at the top.
 */
export function mergeGrid(
  published: PublishedMedia[] | undefined,
  planned: PlannedItem[],
  tab: PreviewTab = "posts",
  order?: string[] | null,
): GridItem[] {
  const pub = published ?? [];

  if (tab === "tagged") return [];

  const pinnedPub = pub
    .filter((m) => m.pinned)
    .map((m) => toPublished(m, true));
  const pinnedPlan = planned
    .filter((p) => p.pinned)
    .map((p) => toPlanned(p, true));
  const pinned = applyGridOrder([...pinnedPub, ...pinnedPlan].slice(0, MAX_PINNED), order);
  const pinnedIds = new Set(pinned.map((p) => p.id));

  const plannedItems: GridItem[] = planned
    .filter((p) => !pinnedIds.has(p.id))
    .map((p) => toPlanned(p, false));

  const rest = pub
    .filter((m) => !pinnedIds.has(m.id))
    .map((m) => toPublished(m, false));
  const unpinned = applyGridOrder([...plannedItems, ...rest], order);
  const posts = [...pinned, ...unpinned];

  if (tab === "reels") {
    return posts.filter((item) => item.kind === "reel" || item.kind === "video");
  }

  return posts;
}

function toPlanned(p: PlannedItem, pinned: boolean): GridItem {
  return {
    id: p.id,
    kind: p.kind,
    image: p.image,
    slides: p.slides,
    source: "planned",
    pinned: pinned || undefined,
    focusX: p.focusX,
    focusY: p.focusY,
  };
}

function toPublished(m: PublishedMedia, pinned: boolean): GridItem {
  return {
    id: m.id,
    kind: m.kind,
    image: m.image,
    slides: m.slides,
    source: "published",
    pinned,
    viewCount: m.viewCount,
    width: m.width,
    height: m.height,
  };
}

/** Displayed posts counter = real media_count + planned items currently in the preview. */
export function displayPostCount(realCount: number | undefined, plannedCount: number): number | undefined {
  if (realCount === undefined) return plannedCount > 0 ? plannedCount : undefined;
  return realCount + plannedCount;
}
