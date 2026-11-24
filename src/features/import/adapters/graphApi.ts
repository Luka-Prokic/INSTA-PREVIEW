import type { AdapterResult, MediaKind, PublishedMedia } from "../types";

/** Instagram API with Instagram Login (own Business/Creator account). Server-only. */

const GRAPH = "https://graph.instagram.com";
const PROFILE_FIELDS =
  "user_id,username,name,profile_picture_url,followers_count,follows_count,media_count,biography,website";
const MEDIA_FIELDS =
  "id,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,children{media_type,media_url,thumbnail_url}";
const MAX_MEDIA = 300;

export type GraphMe = {
  username?: string;
  name?: string;
  profile_picture_url?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
  biography?: string;
  website?: string;
};

export type GraphChild = { media_type?: string; media_url?: string; thumbnail_url?: string };

export type GraphMedia = {
  id: string;
  media_type?: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_product_type?: "FEED" | "REELS" | "STORY" | "AD";
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
  children?: { data?: GraphChild[] };
};

/** Parses `INSTAGRAM_TOKENS=user:token,user2:token2`. */
export function tokenFor(username: string, env = process.env.INSTAGRAM_TOKENS ?? ""): string | null {
  for (const pair of env.split(",")) {
    const idx = pair.indexOf(":");
    if (idx < 1) continue;
    if (pair.slice(0, idx).trim().replace(/^@/, "").toLowerCase() === username) {
      return pair.slice(idx + 1).trim() || null;
    }
  }
  return null;
}

function mediaKind(m: GraphMedia): MediaKind {
  if (m.media_type === "CAROUSEL_ALBUM") return "carousel";
  if (m.media_product_type === "REELS") return "reel";
  if (m.media_type === "VIDEO") return "video";
  return "image";
}

function coverUrl(m: GraphMedia): string | undefined {
  if (m.media_type === "CAROUSEL_ALBUM") {
    const first = m.children?.data?.[0];
    return first?.thumbnail_url ?? first?.media_url ?? m.media_url ?? m.thumbnail_url;
  }
  if (m.media_type === "VIDEO") return m.thumbnail_url ?? m.media_url;
  return m.media_url ?? m.thumbnail_url;
}

export function normalizeGraph(me: GraphMe, media: GraphMedia[] | null): AdapterResult {
  const fields: AdapterResult["fields"] = {};
  const ok = <T>(value: T | undefined | null) =>
    value === undefined || value === null ? undefined : { status: "ok" as const, value };

  fields.displayName = me.name ? ok(me.name) : undefined;
  fields.avatar = me.profile_picture_url ? ok({ kind: "remote" as const, url: me.profile_picture_url }) : undefined;
  fields.bio = ok(me.biography);
  fields.website = me.website ? ok(me.website) : undefined;
  fields.posts = ok(me.media_count);
  fields.followers = ok(me.followers_count);
  fields.following = ok(me.follows_count);

  if (media) {
    const items: PublishedMedia[] = [];
    for (const m of media) {
      if (m.media_product_type === "STORY" || m.media_product_type === "AD") continue;
      const url = coverUrl(m);
      if (!url) continue;
      const kind = mediaKind(m);
      const childUrls =
        kind === "carousel" ?
          (m.children?.data ?? [])
            .map((c) => c.thumbnail_url ?? c.media_url)
            .filter((u): u is string => Boolean(u))
        : [];
      items.push({
        id: m.id,
        kind,
        image: { kind: "remote", url },
        slides:
          childUrls.length > 1 ? childUrls.map((u) => ({ kind: "remote" as const, url: u })) : undefined,
        permalink: m.permalink,
        timestamp: m.timestamp,
      });
    }
    fields.media = { status: "ok", value: items };
  }

  for (const key of Object.keys(fields) as (keyof typeof fields)[]) {
    if (fields[key] === undefined) delete fields[key];
  }

  return { adapter: "graph", ok: true, username: me.username?.toLowerCase(), fields };
}

type GraphError = { error?: { message?: string; code?: number } };

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const body = (await res.json().catch(() => ({}))) as T & GraphError;
  if (!res.ok || body.error) {
    throw new Error(body.error?.message ?? `Instagram API responded ${res.status}`);
  }
  return body;
}

export async function fetchGraphProfile(username: string, token: string): Promise<AdapterResult> {
  const auth = `access_token=${encodeURIComponent(token)}`;
  const me = await getJson<GraphMe>(`${GRAPH}/me?fields=${PROFILE_FIELDS}&${auth}`);

  if (me.username && me.username.toLowerCase() !== username) {
    return {
      adapter: "graph",
      ok: false,
      message: `The token belongs to @${me.username}, not @${username}.`,
      fields: {},
    };
  }

  let media: GraphMedia[] | null = [];
  let mediaError: string | undefined;
  try {
    let next: string | undefined = `${GRAPH}/me/media?fields=${MEDIA_FIELDS}&limit=50&${auth}`;
    while (next && media.length < MAX_MEDIA) {
      const page: { data?: GraphMedia[]; paging?: { next?: string } } = await getJson(next);
      media.push(...(page.data ?? []));
      next = page.paging?.next;
    }
  } catch (error) {
    media = null;
    mediaError = error instanceof Error ? error.message : String(error);
  }

  const result = normalizeGraph(me, media);
  if (mediaError) result.message = `Profile loaded; media failed: ${mediaError}`;
  return result;
}
