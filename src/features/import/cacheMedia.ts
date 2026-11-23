import { putBlob } from "@/features/planner/persistence";
import type { Field, Highlight, ImageRef, ProfileSnapshot, PublishedMedia } from "./types";

async function cacheRef(image: ImageRef, id: string): Promise<ImageRef> {
  if (image.kind === "blob") return image;
  try {
    const res = await fetch(`/api/media?url=${encodeURIComponent(image.url)}`);
    if (!res.ok) return image;
    const blob = await res.blob();
    if (!blob.type.startsWith("image/")) return image;
    const key = await putBlob(id, blob);
    return { kind: "blob", key };
  } catch {
    return image;
  }
}

async function cacheMediaList(media: PublishedMedia[]): Promise<PublishedMedia[]> {
  return Promise.all(
    media.map(async (m) => ({ ...m, image: await cacheRef(m.image, `media-${m.id}`) })),
  );
}

async function cacheHighlights(list: Highlight[]): Promise<Highlight[]> {
  return Promise.all(
    list.map(async (h) => ({ ...h, cover: await cacheRef(h.cover, `hl-${h.id}`) })),
  );
}

async function mapFieldImage(
  field: Field<ImageRef>,
  id: string,
): Promise<Field<ImageRef>> {
  if (field.status === "unavailable" || !field.value) return field;
  return { ...field, value: await cacheRef(field.value, id) };
}

/** Persist remote Instagram CDN images as IndexedDB blobs so they survive URL expiry. */
export async function cacheSnapshotMedia(snapshot: ProfileSnapshot): Promise<ProfileSnapshot> {
  const f = snapshot.fields;
  const avatar = await mapFieldImage(f.avatar, `avatar-${snapshot.username}`);
  const media =
    f.media.value ?
      { ...f.media, value: await cacheMediaList(f.media.value) }
    : f.media;
  const highlights =
    f.highlights.value ?
      { ...f.highlights, value: await cacheHighlights(f.highlights.value) }
    : f.highlights;
  return { ...snapshot, fields: { ...f, avatar, media, highlights } };
}
