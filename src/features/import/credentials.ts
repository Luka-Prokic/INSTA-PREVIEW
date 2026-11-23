import { get, set, del, createStore, type UseStore } from "idb-keyval";

export type ProfileCredentials = {
  username: string;
  token: string;
};

const KEY = "credentials";
let store: UseStore | null = null;

function getStore(): UseStore {
  if (!store) store = createStore("insta-preview-creds", "v1");
  return store;
}

export async function loadCredentials(): Promise<ProfileCredentials | null> {
  if (typeof indexedDB === "undefined") return null;
  return (await get<ProfileCredentials>(KEY, getStore())) ?? null;
}

export async function saveCredentials(creds: ProfileCredentials): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  await set(KEY, creds, getStore());
}

export async function clearCredentials(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  await del(KEY, getStore());
}
