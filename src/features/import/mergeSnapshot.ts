import {
  FIELD_KEYS,
  type AdapterResult,
  type Field,
  type FieldKey,
  type ManualOverrides,
  type ProfileFields,
  type ProfileSnapshot,
} from "./types";

const unavailable = <T>(): Field<T> => ({ status: "unavailable" });

function emptyFields(): ProfileFields {
  return {
    displayName: unavailable(),
    avatar: unavailable(),
    bio: unavailable(),
    website: unavailable(),
    category: unavailable(),
    verified: unavailable(),
    posts: unavailable(),
    followers: unavailable(),
    following: unavailable(),
    highlights: unavailable(),
    media: unavailable(),
  };
}

function fieldUsable(key: FieldKey, field: Field<unknown> | undefined): boolean {
  if (!field || field.status !== "ok" || field.value === undefined) return false;
  // Empty media/highlights from Graph must not block public data.
  if (
    (key === "media" || key === "highlights") &&
    Array.isArray(field.value) &&
    field.value.length === 0
  ) {
    return false;
  }
  return true;
}

/** First adapter (in order) that returned a usable field wins. */
export function mergeAdapterResults(username: string, results: AdapterResult[]): ProfileSnapshot {
  const fields = emptyFields();
  for (const key of FIELD_KEYS) {
    for (const result of results) {
      const field = result.fields[key];
      if (fieldUsable(key, field as Field<unknown> | undefined)) {
        (fields as Record<FieldKey, Field<unknown>>)[key] = {
          ...(field as Field<unknown>),
          source: result.adapter,
        };
        break;
      }
    }
  }
  return {
    username,
    fetchedAt: Date.now(),
    fields,
    reports: results.map(({ adapter, ok, message }) => ({ adapter, ok, message })),
  };
}

function manualField<T>(value: T | undefined, base: Field<T>): Field<T> {
  if (value === undefined) return base;
  return { status: "manual", value, source: "manual" };
}

/** Manual entries override imported values; pinned ids are applied to published media. */
export function applyManual(snapshot: ProfileSnapshot, manual: ManualOverrides): ProfileSnapshot {
  const f = snapshot.fields;
  let media = f.media;
  if (media.status === "unavailable" && manual.media?.length) {
    media = { status: "manual", value: manual.media, source: "manual" };
  }
  if (media.value) {
    let list = media.value;
    if (manual.hiddenMediaIds?.length) {
      const hidden = new Set(manual.hiddenMediaIds);
      list = list.filter((m) => !hidden.has(m.id));
    }
    if (manual.mediaKinds) {
      list = list.map((m) => {
        const kind = manual.mediaKinds?.[m.id];
        return kind && kind !== m.kind ? { ...m, kind } : m;
      });
    }
    if (manual.pinnedIds) {
      const pinned = new Set(manual.pinnedIds);
      list = list.map((m) => ({ ...m, pinned: pinned.has(m.id) }));
    }
    if (list !== media.value) media = { ...media, value: list };
  }

  const highlights =
    manual.highlights !== undefined ?
      ({ status: "manual", value: manual.highlights, source: "manual" } as const)
    : f.highlights;

  return {
    ...snapshot,
    hasStory: manual.hasStory ?? snapshot.hasStory,
    fields: {
      displayName: manualField(manual.displayName, f.displayName),
      avatar: manualField(manual.avatar, f.avatar),
      bio: manualField(manual.bio, f.bio),
      website: manualField(manual.website, f.website),
      category: manualField(manual.category, f.category),
      verified: manualField(manual.verified, f.verified),
      posts: manualField(manual.posts, f.posts),
      followers: manualField(manual.followers, f.followers),
      following: manualField(manual.following, f.following),
      highlights,
      media,
    },
  };
}

export function emptySnapshot(username: string): ProfileSnapshot {
  return { username, fetchedAt: Date.now(), fields: emptyFields(), reports: [] };
}
