import { get, set, del, createStore, type UseStore } from "idb-keyval";
import type { ManualOverrides, ProfileSnapshot } from "@/features/import/types";
import type { PhoneModelId, PhoneScaleMode } from "@/features/preview/devices";
import type { PlannedItem, ViewMode } from "./types";

let store: UseStore | null = null;

function getStore(): UseStore {
  if (!store) store = createStore("insta-preview", "v1");
  return store;
}

export type PersistedWorkspace = {
  username: string;
  snapshot: ProfileSnapshot | null;
  manual: ManualOverrides;
  planned: PlannedItem[];
  /** Custom posts-grid / Content-list order (ids). */
  gridOrder?: string[] | null;
  viewMode: ViewMode;
  editMode: boolean;
  sidebarOpen: boolean;
  phoneModelId?: PhoneModelId;
  phoneScaleMode?: PhoneScaleMode;
  updatedAt: number;
};

const key = (username: string) => `workspace:${username}`;

export async function loadWorkspace(username: string): Promise<PersistedWorkspace | null> {
  if (typeof indexedDB === "undefined") return null;
  return (await get<PersistedWorkspace>(key(username), getStore())) ?? null;
}

export async function saveWorkspace(data: PersistedWorkspace): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  await set(key(data.username), { ...data, updatedAt: Date.now() }, getStore());
}

export async function clearWorkspace(username: string): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  await del(key(username), getStore());
}

export async function putBlob(id: string, blob: Blob): Promise<string> {
  const blobKey = `blob:${id}`;
  await set(blobKey, blob, getStore());
  return blobKey;
}

export async function getBlob(blobKey: string): Promise<Blob | undefined> {
  if (typeof indexedDB === "undefined") return undefined;
  return get<Blob>(blobKey, getStore());
}

export async function deleteBlob(blobKey: string): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  await del(blobKey, getStore());
}

const urlCache = new Map<string, string>();

/** Resolve an ImageRef to a displayable URL. Blob keys become object URLs (cached). */
export async function resolveImageUrl(
  image: { kind: "remote"; url: string } | { kind: "blob"; key: string },
): Promise<string | null> {
  if (image.kind === "remote") return image.url;
  const cached = urlCache.get(image.key);
  if (cached) return cached;
  const blob = await getBlob(image.key);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urlCache.set(image.key, url);
  return url;
}

export function revokeImageUrl(blobKey: string): void {
  const url = urlCache.get(blobKey);
  if (url) {
    URL.revokeObjectURL(url);
    urlCache.delete(blobKey);
  }
}
