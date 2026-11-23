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
 * Instagram-like default: up to 3 pinned, then planned, then published.
 * When `order` is set (sidebar DnD), that order wins for the posts tab.
 */
export function mergeGrid(
  published: PublishedMedia[] | undefined,
  planned: PlannedItem[],
  tab: PreviewTab = "posts",
  order?: string[] | null,
): GridItem[] {
  const pub = published ?? [];

  if (tab === "tagged") return [];

  const pinned = pub
    .filter((m) => m.pinned)
    .slice(0, MAX_PINNED)
    .map((m) => toPublished(m, true));
  const pinnedIds = new Set(pinned.map((p) => p.id));

  const plannedItems: GridItem[] = planned.map((p) => ({
    id: p.id,
    kind: p.kind,
    image: p.image,
    source: "planned" as const,
    focusX: p.focusX,
    focusY: p.focusY,
  }));

  const rest = pub.filter((m) => !pinnedIds.has(m.id)).map((m) => toPublished(m, false));
  const posts = applyGridOrder([...pinned, ...plannedItems, ...rest], order);

  if (tab === "reels") {
    return posts.filter((item) => item.kind === "reel" || item.kind === "video");
  }

  return posts;
}

function toPublished(m: PublishedMedia, pinned: boolean): GridItem {
  return {
    id: m.id,
    kind: m.kind,
    image: m.image,
    source: "published",
    pinned,
    viewCount: m.viewCount,
  };
}

/** Displayed posts counter = real media_count + planned items currently in the preview. */
export function displayPostCount(realCount: number | undefined, plannedCount: number): number | undefined {
  if (realCount === undefined) return plannedCount > 0 ? plannedCount : undefined;
  return realCount + plannedCount;
}
