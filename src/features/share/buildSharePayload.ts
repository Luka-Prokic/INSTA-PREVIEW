import type { Highlight, PublishedMedia, ProfileSnapshot } from "@/features/import/types";
import type { PlannedItem, ViewMode } from "@/features/planner/types";
import type { PhoneModelId, PhoneScaleMode } from "@/features/preview/devices";
import { toThumbRef } from "./thumbnails";
import type { CreateShareRequest } from "./types";

async function mapMedia(list: PublishedMedia[] | undefined): Promise<PublishedMedia[] | undefined> {
  if (!list?.length) return list;
  const next: PublishedMedia[] = [];
  for (const item of list) {
    const image = await toThumbRef(item.image);
    if (!image) continue;
    next.push({ ...item, image, permalink: undefined });
  }
  return next;
}

async function mapHighlights(list: Highlight[] | undefined): Promise<Highlight[] | undefined> {
  if (!list?.length) return list;
  const next: Highlight[] = [];
  for (const item of list) {
    const cover = await toThumbRef(item.cover);
    if (!cover) continue;
    next.push({ ...item, cover });
  }
  return next;
}

/** Build a token-free share payload with inlined thumbnail data URLs. */
export async function buildSharePayload(input: {
  snapshot: ProfileSnapshot;
  planned: PlannedItem[];
  viewMode: ViewMode;
  phoneModelId: PhoneModelId;
  phoneScaleMode: PhoneScaleMode;
}): Promise<CreateShareRequest> {
  const { snapshot, planned, viewMode, phoneModelId, phoneScaleMode } = input;
  const fields = { ...snapshot.fields };

  const avatar = await toThumbRef(fields.avatar.value);
  fields.avatar = avatar ?
    { ...fields.avatar, value: avatar }
  : { status: "unavailable" };

  const highlights = await mapHighlights(fields.highlights.value);
  fields.highlights = highlights?.length ?
    { ...fields.highlights, value: highlights }
  : fields.highlights.status === "unavailable" ? fields.highlights
  : { status: "unavailable" };

  const media = await mapMedia(fields.media.value);
  fields.media = media?.length ?
    { ...fields.media, value: media }
  : { status: "unavailable" };

  const portablePlanned: PlannedItem[] = [];
  for (const item of planned) {
    const image = await toThumbRef(item.image);
    if (!image) continue;
    portablePlanned.push({
      id: item.id,
      kind: item.kind,
      image,
      name: item.name,
      createdAt: item.createdAt,
      focusX: item.focusX,
      focusY: item.focusY,
    });
  }

  return {
    username: snapshot.username,
    snapshot: {
      username: snapshot.username,
      fetchedAt: snapshot.fetchedAt,
      fields,
      reports: [],
    },
    planned: portablePlanned,
    viewMode,
    phoneModelId,
    phoneScaleMode,
  };
}
