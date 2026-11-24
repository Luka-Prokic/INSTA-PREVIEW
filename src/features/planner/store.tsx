"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { clearCredentials, loadCredentials, saveCredentials } from "@/features/import/credentials";
import { applyManual, emptySnapshot } from "@/features/import/mergeSnapshot";
import { importProfile } from "@/features/import/importService";
import type { ManualOverrides, MediaKind, ProfileSnapshot } from "@/features/import/types";
import { MAX_PINNED } from "@/features/import/types";
import { normalizeUsername } from "@/features/import/username";
import {
  clearWorkspace,
  deleteBlob,
  loadWorkspace,
  putBlob,
  revokeImageUrl,
  saveWorkspace,
} from "./persistence";
import {
  DEFAULT_PHONE_MODEL_ID,
  DEFAULT_PHONE_SCALE_MODE,
  getPhoneModel,
  isPhoneModelId,
  type PhoneModelId,
  type PhoneScaleMode,
} from "@/features/preview/devices";
import { mergeGrid, reconcileGridOrder } from "./mergeGrid";
import type { PlannedItem, PlannedKind, PreviewTab, ViewMode } from "./types";

type Status = "idle" | "loading" | "ready" | "error";

type State = {
  usernameInput: string;
  tokenInput: string;
  username: string | null;
  token: string | null;
  status: Status;
  error: string | null;
  snapshot: ProfileSnapshot | null;
  manual: ManualOverrides;
  planned: PlannedItem[];
  /** Custom Content / posts-grid order. null = default merge order. */
  gridOrder: string[] | null;
  viewMode: ViewMode;
  editMode: boolean;
  sidebarOpen: boolean;
  phoneModelId: PhoneModelId;
  phoneScaleMode: PhoneScaleMode;
  previewTab: PreviewTab;
  hydrated: boolean;
  connectOpen: boolean;
  profileEditOpen: boolean;
};

type Actions = {
  setUsernameInput: (v: string) => void;
  setTokenInput: (v: string) => void;
  setSidebarOpen: (v: boolean) => void;
  setViewMode: (v: ViewMode) => void;
  setEditMode: (v: boolean) => void;
  setPhoneModelId: (v: PhoneModelId) => void;
  setPhoneScaleMode: (v: PhoneScaleMode) => void;
  setPreviewTab: (v: PreviewTab) => void;
  setConnectOpen: (v: boolean) => void;
  setProfileEditOpen: (v: boolean) => void;
  connectProfile: (usernameRaw: string, tokenRaw: string) => Promise<void>;
  startBlankProfile: (usernameRaw: string) => Promise<void>;
  loadProfile: () => Promise<void>;
  reloadProfile: () => Promise<void>;
  disconnectProfile: () => Promise<void>;
  clearPreview: () => Promise<void>;
  setManual: (patch: ManualOverrides) => void;
  addPlanned: (item: PlannedItem, blob?: Blob) => Promise<void>;
  removePlanned: (id: string) => Promise<void>;
  reorderPlanned: (orderedIds: string[]) => void;
  reorderGrid: (orderedIds: string[]) => void;
  updatePlanned: (id: string, patch: Partial<PlannedItem>) => void;
  setItemKind: (id: string, kind: PlannedKind) => void;
  setItemPinned: (id: string, pinned: boolean) => void;
  removeGridItem: (id: string) => Promise<void>;
};

const initial: State = {
  usernameInput: "",
  tokenInput: "",
  username: null,
  token: null,
  status: "idle",
  error: null,
  snapshot: null,
  manual: {},
  planned: [],
  gridOrder: null,
  viewMode: "mobile",
  editMode: true,
  sidebarOpen: true,
  phoneModelId: DEFAULT_PHONE_MODEL_ID,
  phoneScaleMode: DEFAULT_PHONE_SCALE_MODE,
  previewTab: "posts",
  hydrated: false,
  connectOpen: false,
  profileEditOpen: false,
};

function defaultOrderIds(snapshot: ProfileSnapshot | null, planned: PlannedItem[]): string[] {
  return mergeGrid(snapshot?.fields.media.value, planned, "posts").map((i) => i.id);
}

function syncedGridOrder(
  order: string[] | null | undefined,
  snapshot: ProfileSnapshot | null,
  planned: PlannedItem[],
): string[] | null {
  return reconcileGridOrder(order, defaultOrderIds(snapshot, planned));
}

type Store = {
  get: () => State;
  set: (patch: Partial<State> | ((s: State) => Partial<State>)) => void;
  subscribe: (fn: () => void) => () => void;
};

function createStore(): Store {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set: (patch) => {
      const next = typeof patch === "function" ? patch(state) : patch;
      state = { ...state, ...next };
      listeners.forEach((l) => l());
    },
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

const StoreCtx = createContext<Store | null>(null);
const ActionsCtx = createContext<Actions | null>(null);

function useStoreApi(): Store {
  const s = useContext(StoreCtx);
  if (!s) throw new Error("WorkspaceProvider missing");
  return s;
}

export function useWorkspace(): State & Actions {
  const store = useStoreApi();
  const actions = useContext(ActionsCtx);
  if (!actions) throw new Error("WorkspaceProvider missing");
  const state = useSyncExternalStore(store.subscribe, store.get, store.get);
  return { ...state, ...actions };
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<Store | null>(null);
  if (!storeRef.current) storeRef.current = createStore();
  const store = storeRef.current;

  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(() => {
    const s = store.get();
    if (!s.username || !s.hydrated) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      const cur = store.get();
      if (!cur.username) return;
      void saveWorkspace({
        username: cur.username,
        snapshot: cur.snapshot,
        manual: cur.manual,
        planned: cur.planned,
        gridOrder: cur.gridOrder,
        viewMode: cur.viewMode,
        editMode: cur.editMode,
        sidebarOpen: cur.sidebarOpen,
        phoneModelId: cur.phoneModelId,
        phoneScaleMode: cur.phoneScaleMode,
        updatedAt: Date.now(),
      });
    }, 250);
  }, [store]);

  useEffect(() => {
    void (async () => {
      const creds = await loadCredentials();
      if (!creds) {
        store.set({ hydrated: true, connectOpen: true });
        return;
      }
      const saved = await loadWorkspace(creds.username);
      store.set({
        usernameInput: creds.username,
        tokenInput: "",
        username: creds.username,
        token: creds.token,
        snapshot: saved?.snapshot ? applyManual(saved.snapshot, saved.manual) : null,
        manual: saved?.manual ?? {},
        planned: saved?.planned ?? [],
        gridOrder: saved?.gridOrder ?? null,
        viewMode:
          saved?.viewMode === "desktop" ||
          saved?.viewMode === "macbook" ||
          saved?.viewMode === "mobile" ||
          saved?.viewMode === "bare" ?
            saved.viewMode
          : "mobile",
        editMode: saved?.editMode ?? true,
        sidebarOpen: saved?.sidebarOpen ?? true,
        phoneModelId:
          saved?.phoneModelId && isPhoneModelId(saved.phoneModelId) ?
            getPhoneModel(saved.phoneModelId).id
          : DEFAULT_PHONE_MODEL_ID,
        phoneScaleMode: DEFAULT_PHONE_SCALE_MODE,
        status: saved?.snapshot ? "ready" : "idle",
        hydrated: true,
        connectOpen: !saved?.snapshot,
      });
    })();
  }, [store]);

  const runImport = useCallback(
    async (
      username: string,
      token: string,
      manual: ManualOverrides,
      planned: PlannedItem[],
      gridOrder: string[] | null,
    ) => {
      store.set({ status: "loading", error: null, usernameInput: username });
      const snapshot = await importProfile(username, { token: token || undefined, manual });
      store.set({
        username,
        token: token || null,
        snapshot,
        manual,
        planned,
        gridOrder: syncedGridOrder(gridOrder, snapshot, planned),
        status: "ready",
        error: null,
        connectOpen: false,
      });
      await saveCredentials({ username, token });
      persist();
    },
    [persist, store],
  );

  const connectProfile = useCallback(
    async (usernameRaw: string, tokenRaw: string) => {
      const username = normalizeUsername(usernameRaw);
      const token = tokenRaw.trim();
      if (!username) {
        store.set({ error: "Enter a valid Instagram username.", status: "error" });
        return;
      }
      try {
        const existing = await loadWorkspace(username);
        await runImport(
          username,
          token,
          existing?.manual ?? {},
          existing?.planned ?? [],
          existing?.gridOrder ?? null,
        );
      } catch (error) {
        store.set({
          status: "error",
          error: error instanceof Error ? error.message : "Import failed.",
        });
      }
    },
    [runImport, store],
  );

  const startBlankProfile = useCallback(
    async (usernameRaw: string) => {
      const username = normalizeUsername(usernameRaw);
      if (!username) {
        store.set({ error: "Enter a valid Instagram username.", status: "error" });
        return;
      }
      const existing = await loadWorkspace(username);
      const manual = existing?.manual ?? {};
      const planned = existing?.planned ?? [];
      const base = existing?.snapshot ?? emptySnapshot(username);
      const snapshot = applyManual(base, manual);
      store.set({
        username,
        token: null,
        usernameInput: username,
        tokenInput: "",
        snapshot,
        manual,
        planned,
        gridOrder: syncedGridOrder(existing?.gridOrder ?? null, snapshot, planned),
        status: "ready",
        error: null,
        connectOpen: false,
      });
      await saveCredentials({ username, token: "" });
      persist();
    },
    [persist, store],
  );

  const loadProfile = useCallback(async () => {
    const { username, token, manual, planned, gridOrder } = store.get();
    if (!username) {
      store.set({ connectOpen: true });
      return;
    }
    try {
      await runImport(username, token ?? "", manual, planned, gridOrder);
    } catch (error) {
      store.set({
        status: "error",
        error: error instanceof Error ? error.message : "Import failed.",
      });
    }
  }, [runImport, store]);

  const reloadProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  const disconnectProfile = useCallback(async () => {
    const { username, planned } = store.get();
    for (const item of planned) {
      if (item.image.kind === "blob") {
        revokeImageUrl(item.image.key);
        await deleteBlob(item.image.key);
      }
    }
    if (username) await clearWorkspace(username);
    await clearCredentials();
    store.set({
      ...initial,
      hydrated: true,
      connectOpen: true,
    });
  }, [store]);

  const clearPreview = useCallback(async () => {
    await disconnectProfile();
  }, [disconnectProfile]);

  const setManual = useCallback(
    (patch: ManualOverrides) => {
      const next = { ...store.get().manual, ...patch };
      const snap = store.get().snapshot;
      store.set({
        manual: next,
        snapshot: snap ? applyManual(snap, next) : snap,
      });
      persist();
    },
    [persist, store],
  );

  const addPlanned = useCallback(
    async (item: PlannedItem, blob?: Blob) => {
      let next = item;
      if (blob) {
        const key = await putBlob(item.id, blob);
        next = { ...item, image: { kind: "blob", key } };
      }
      const { planned, gridOrder, snapshot } = store.get();
      const nextPlanned = [next, ...planned];
      const nextOrder =
        gridOrder ?
          [next.id, ...gridOrder.filter((id) => id !== next.id)]
        : syncedGridOrder(
            [next.id, ...defaultOrderIds(snapshot, planned)],
            snapshot,
            nextPlanned,
          );
      store.set({ planned: nextPlanned, gridOrder: nextOrder });
      persist();
    },
    [persist, store],
  );

  const removePlanned = useCallback(
    async (id: string) => {
      const item = store.get().planned.find((p) => p.id === id);
      if (item?.image.kind === "blob") {
        revokeImageUrl(item.image.key);
        await deleteBlob(item.image.key);
      }
      const { planned, gridOrder } = store.get();
      store.set({
        planned: planned.filter((p) => p.id !== id),
        gridOrder: gridOrder ? gridOrder.filter((x) => x !== id) : null,
      });
      persist();
    },
    [persist, store],
  );

  const reorderPlanned = useCallback(
    (orderedIds: string[]) => {
      const map = new Map(store.get().planned.map((p) => [p.id, p]));
      const ordered = orderedIds.map((id) => map.get(id)).filter(Boolean) as PlannedItem[];
      const rest = store.get().planned.filter((p) => !orderedIds.includes(p.id));
      store.set({ planned: [...ordered, ...rest] });
      persist();
    },
    [persist, store],
  );

  const reorderGrid = useCallback(
    (orderedIds: string[]) => {
      store.set({ gridOrder: orderedIds });
      persist();
    },
    [persist, store],
  );

  const updatePlanned = useCallback(
    (id: string, patch: Partial<PlannedItem>) => {
      store.set({
        planned: store.get().planned.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      });
      persist();
    },
    [persist, store],
  );

  /** Newest-first pin order (published + planned). Used for the 3-pin FIFO cap. */
  const seedPinnedIds = useCallback((): string[] => {
    const { manual, snapshot, planned } = store.get();
    const pubIds = new Set((snapshot?.fields.media.value ?? []).map((m) => m.id));
    const planIds = new Set(planned.map((p) => p.id));
    const exists = (id: string) => pubIds.has(id) || planIds.has(id);

    if (manual.pinnedIds !== undefined) {
      // Stored order wins; still include planned pins that were only flagged on the item
      // (legacy / before we kept planned ids in pinnedIds).
      const stored = manual.pinnedIds.filter(exists);
      const storedSet = new Set(stored);
      const orphanPlan = planned.filter((p) => p.pinned && !storedSet.has(p.id)).map((p) => p.id);
      return [...stored, ...orphanPlan];
    }

    const fromPub = (snapshot?.fields.media.value ?? []).filter((m) => m.pinned).map((m) => m.id);
    const fromPlan = planned.filter((p) => p.pinned).map((p) => p.id);
    return [...fromPub, ...fromPlan];
  }, [store]);

  const setItemKind = useCallback(
    (id: string, kind: PlannedKind) => {
      const { planned, manual } = store.get();
      if (planned.some((p) => p.id === id)) {
        store.set({
          planned: planned.map((p) => (p.id === id ? { ...p, kind } : p)),
        });
        persist();
        return;
      }
      const mediaKinds = { ...manual.mediaKinds, [id]: kind as MediaKind };
      const next = { ...manual, mediaKinds };
      const snap = store.get().snapshot;
      store.set({
        manual: next,
        snapshot: snap ? applyManual(snap, next) : snap,
      });
      persist();
    },
    [persist, store],
  );

  const setItemPinned = useCallback(
    (id: string, pinned: boolean) => {
      const { planned, manual, snapshot } = store.get();
      // Newest first. Pinning a 4th drops the oldest (end of the list) — FIFO.
      let ids = seedPinnedIds().filter((x) => x !== id);
      if (pinned) {
        ids = [id, ...ids];
        if (ids.length > MAX_PINNED) ids = ids.slice(0, MAX_PINNED);
      }

      const pinnedSet = new Set(ids);
      const nextPlanned = planned.map((p) => ({
        ...p,
        pinned: pinnedSet.has(p.id) ? true : undefined,
      }));
      // Keep the full ordered list (planned + published) so the next pin sees all 3.
      const nextManual: ManualOverrides = {
        ...manual,
        pinnedIds: ids,
      };
      store.set({
        planned: nextPlanned,
        manual: nextManual,
        snapshot: snapshot ? applyManual(snapshot, nextManual) : snapshot,
      });
      persist();
    },
    [persist, seedPinnedIds, store],
  );

  const removeGridItem = useCallback(
    async (id: string) => {
      const { planned, manual, snapshot, gridOrder } = store.get();
      if (planned.some((p) => p.id === id)) {
        await removePlanned(id);
        return;
      }
      const hiddenMediaIds = [...new Set([...(manual.hiddenMediaIds ?? []), id])];
      const pinnedIds = (manual.pinnedIds ?? seedPinnedIds()).filter((x) => x !== id);
      const mediaKinds = { ...manual.mediaKinds };
      delete mediaKinds[id];
      const next: ManualOverrides = {
        ...manual,
        hiddenMediaIds,
        pinnedIds,
        mediaKinds: Object.keys(mediaKinds).length ? mediaKinds : undefined,
      };
      store.set({
        manual: next,
        snapshot: snapshot ? applyManual(snapshot, next) : snapshot,
        gridOrder: gridOrder ? gridOrder.filter((x) => x !== id) : null,
      });
      persist();
    },
    [persist, removePlanned, seedPinnedIds, store],
  );

  const actions = useMemo<Actions>(
    () => ({
      setUsernameInput: (v) => store.set({ usernameInput: v }),
      setTokenInput: (v) => store.set({ tokenInput: v }),
      setSidebarOpen: (v) => {
        store.set({ sidebarOpen: v });
        persist();
      },
      setViewMode: (v) => {
        store.set({ viewMode: v });
        persist();
      },
      setEditMode: (v) => {
        store.set({ editMode: v });
        persist();
      },
      setPhoneModelId: (v) => {
        store.set({ phoneModelId: v });
        persist();
      },
      setPhoneScaleMode: (v) => {
        store.set({ phoneScaleMode: v });
        persist();
      },
      setPreviewTab: (v) => store.set({ previewTab: v }),
      setConnectOpen: (v) => store.set({ connectOpen: v }),
      setProfileEditOpen: (v) => store.set({ profileEditOpen: v }),
      connectProfile,
      startBlankProfile,
      loadProfile,
      reloadProfile,
      disconnectProfile,
      clearPreview,
      setManual,
      addPlanned,
      removePlanned,
      reorderPlanned,
      reorderGrid,
      updatePlanned,
      setItemKind,
      setItemPinned,
      removeGridItem,
    }),
    [
      addPlanned,
      connectProfile,
      disconnectProfile,
      loadProfile,
      persist,
      reloadProfile,
      removeGridItem,
      removePlanned,
      reorderGrid,
      reorderPlanned,
      clearPreview,
      setItemKind,
      setItemPinned,
      setManual,
      startBlankProfile,
      store,
      updatePlanned,
    ],
  );

  return (
    <StoreCtx.Provider value={store}>
      <ActionsCtx.Provider value={actions}>{children}</ActionsCtx.Provider>
    </StoreCtx.Provider>
  );
}
