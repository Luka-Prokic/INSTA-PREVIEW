export type AdapterId = "graph" | "public" | "manual";

export type FieldStatus = "ok" | "manual" | "unavailable";

export type Field<T> = {
  status: FieldStatus;
  value?: T;
  source?: AdapterId;
  /** Value was parsed from a rounded display string (e.g. "12K"). */
  approx?: boolean;
};

/** Remote URLs expire; imported images are cached as IndexedDB blobs. */
export type ImageRef = { kind: "remote"; url: string } | { kind: "blob"; key: string };

export type MediaKind = "image" | "carousel" | "reel" | "video";

export type PublishedMedia = {
  id: string;
  kind: MediaKind;
  image: ImageRef;
  width?: number;
  height?: number;
  permalink?: string;
  timestamp?: string;
  pinned?: boolean;
  viewCount?: number;
};

export type Highlight = {
  id: string;
  title: string;
  cover: ImageRef;
};

export type ProfileFields = {
  displayName: Field<string>;
  avatar: Field<ImageRef>;
  bio: Field<string>;
  website: Field<string>;
  category: Field<string>;
  verified: Field<boolean>;
  posts: Field<number>;
  followers: Field<number>;
  following: Field<number>;
  highlights: Field<Highlight[]>;
  media: Field<PublishedMedia[]>;
};

export type FieldKey = keyof ProfileFields;

export type AdapterReport = {
  adapter: AdapterId;
  ok: boolean;
  message?: string;
};

/** What a single adapter returns: only the fields it could actually read. */
export type AdapterResult = {
  adapter: AdapterId;
  ok: boolean;
  message?: string;
  username?: string;
  fields: Partial<{ [K in FieldKey]: Field<NonNullable<ProfileFields[K]["value"]>> }>;
};

export type ProfileSnapshot = {
  username: string;
  fetchedAt: number;
  fields: ProfileFields;
  reports: AdapterReport[];
  /** Preview-only: gradient story ring around the avatar. */
  hasStory?: boolean;
};

/** User-entered corrections and additions, kept separately so reloads never wipe them. */
export type ManualOverrides = {
  displayName?: string;
  avatar?: ImageRef;
  bio?: string;
  website?: string;
  category?: string;
  verified?: boolean;
  posts?: number;
  followers?: number;
  following?: number;
  highlights?: Highlight[];
  /** Used only when no adapter returned published media. */
  media?: PublishedMedia[];
  /** Published media ids pinned to the top of the grid (max 3, in order). */
  pinnedIds?: string[];
  /** Show the Instagram “active story” ring on the profile photo. */
  hasStory?: boolean;
};

export const FIELD_LABELS: Record<FieldKey, string> = {
  displayName: "Display name",
  avatar: "Profile photo",
  bio: "Bio",
  website: "Link",
  category: "Category",
  verified: "Verified badge",
  posts: "Posts count",
  followers: "Followers",
  following: "Following",
  highlights: "Story highlights",
  media: "Published posts",
};

export const FIELD_KEYS = Object.keys(FIELD_LABELS) as FieldKey[];

export const MAX_PINNED = 3;
