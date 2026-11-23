import type { AdapterResult, Field, Highlight, MediaKind, PublishedMedia } from "../types";

/**
 * Experimental: reads data Instagram embeds in the logged-out profile page.
 * Needs a short cookie warm-up; cold requests often get a soft 404 / empty shell.
 * Server-only.
 */

type Json = Record<string, unknown>;

const isObj = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown) => (typeof v === "string" && v.length > 0 ? v : undefined);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const count = (v: unknown) => (isObj(v) ? num(v.count) : num(v));

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function* walk(node: unknown, depth = 0): Generator<Json> {
  if (depth > 40) return;
  if (Array.isArray(node)) {
    for (const item of node) yield* walk(item, depth + 1);
  } else if (isObj(node)) {
    yield node;
    for (const value of Object.values(node)) yield* walk(value, depth + 1);
  }
}

function jsonBlobs(html: string): unknown[] {
  const out: unknown[] = [];
  const re = /<script[^>]*type="application\/(?:ld\+)?json"[^>]*>([\s\S]*?)<\/script>/g;
  for (const match of html.matchAll(re)) {
    try {
      out.push(JSON.parse(match[1] ?? ""));
    } catch {
      // not JSON
    }
  }
  return out;
}

function findUser(blobs: unknown[], username: string): Json | undefined {
  let best: Json | undefined;
  let bestScore = 0;
  for (const blob of blobs) {
    for (const obj of walk(blob)) {
      if (typeof obj.username !== "string" || obj.username.toLowerCase() !== username) continue;
      const score =
        Number("biography" in obj) +
        Number("edge_followed_by" in obj || "follower_count" in obj) +
        Number("full_name" in obj) +
        Number(
          "edge_owner_to_timeline_media" in obj ||
            "polaris_ordered_timeline_connection" in obj ||
            "media_count" in obj ||
            "all_media_count" in obj,
        );
      if (score > bestScore) {
        best = obj;
        bestScore = score;
      }
    }
  }
  return best;
}

function pickImage(node: Json): { url: string; width?: number; height?: number } | undefined {
  const candidates = isObj(node.image_versions2) ? node.image_versions2.candidates : undefined;
  if (Array.isArray(candidates) && isObj(candidates[0])) {
    const c = candidates[0];
    const url = str(c.url);
    if (url) return { url, width: num(c.width), height: num(c.height) };
  }
  const carousel = node.carousel_media;
  if (Array.isArray(carousel) && isObj(carousel[0])) return pickImage(carousel[0]);
  const dims = isObj(node.dimensions) ? node.dimensions : undefined;
  // Logged-out Polaris payloads use display_uri; older embeds used display_url / thumbnail_src.
  const url =
    str(node.display_uri) ??
    str(node.display_url) ??
    str(node.thumbnail_src) ??
    str(node.thumbnail_url) ??
    str(node.cover_media_cropped_thumbnail_url);
  return url ? { url, width: num(dims?.width), height: num(dims?.height) } : undefined;
}

function mediaKindOf(node: Json): MediaKind {
  const typename = str(node.__typename) ?? "";
  const product = str(node.product_type);
  if (
    typename === "GraphSidecar" ||
    typename.includes("Carousel") ||
    node.media_type === 8 ||
    product === "carousel_container"
  ) {
    return "carousel";
  }
  if (product === "clips" || product === "reels") return "reel";
  if (typename === "GraphVideo" || typename.includes("Video") || node.media_type === 2 || node.is_video === true) {
    return "video";
  }
  return "image";
}

function isPinned(node: Json): boolean {
  const a = node.pinned_for_users ?? node.timeline_pinned_user_ids;
  return Array.isArray(a) && a.length > 0;
}

function mediaFromNode(node: Json): PublishedMedia | undefined {
  const image = pickImage(node);
  const code = str(node.code) ?? str(node.shortcode);
  const id = str(node.pk) ?? str(node.id) ?? code;
  if (!image || !id) return undefined;
  const kind = mediaKindOf(node);
  const path = kind === "reel" ? "reel" : "p";
  return {
    id,
    kind,
    image: { kind: "remote", url: image.url },
    width: image.width,
    height: image.height,
    permalink: code ? `https://www.instagram.com/${path}/${code}/` : undefined,
    pinned: isPinned(node),
    viewCount: num(node.play_count) ?? num(node.video_view_count),
  };
}

function extractMedia(blobs: unknown[], user: Json): PublishedMedia[] | undefined {
  const edgeSources: unknown[] = [];
  if (isObj(user.edge_owner_to_timeline_media)) edgeSources.push(user.edge_owner_to_timeline_media.edges);
  if (isObj(user.polaris_ordered_timeline_connection)) {
    edgeSources.push(user.polaris_ordered_timeline_connection.edges);
  }
  for (const blob of blobs) {
    for (const obj of walk(blob)) {
      const conn =
        obj.xdt_api__v1__feed__user_timeline_graphql_connection ??
        obj.polaris_ordered_timeline_connection;
      if (isObj(conn)) edgeSources.push(conn.edges);
    }
  }

  const seen = new Set<string>();
  for (const edges of edgeSources) {
    if (!Array.isArray(edges) || edges.length === 0) continue;
    const items: PublishedMedia[] = [];
    for (const edge of edges) {
      const node = isObj(edge) && isObj(edge.node) ? edge.node : isObj(edge) ? edge : undefined;
      if (!node) continue;
      const item = mediaFromNode(node);
      if (!item || seen.has(item.id)) continue;
      seen.add(item.id);
      items.push(item);
    }
    if (items.length) return items;
  }

  // Fallback: collect Polaris media nodes scattered in the Relay payload.
  const loose: PublishedMedia[] = [];
  for (const blob of blobs) {
    for (const obj of walk(blob)) {
      if (!obj.__isXIGPolarisMedia && !str(obj.display_uri)) continue;
      if (!str(obj.code) && !str(obj.shortcode)) continue;
      const item = mediaFromNode(obj);
      if (!item || seen.has(item.id)) continue;
      seen.add(item.id);
      loose.push(item);
    }
  }
  return loose.length ? loose : undefined;
}

function highlightFromNode(node: Json): Highlight | undefined {
  const id = str(node.id) ?? str(node.pk);
  const title = str(node.title) ?? str(node.name);
  const cover =
    str(node.cover_media_cropped_thumbnail_url) ??
    str(node.cover_media_thumbnail_url) ??
    (isObj(node.cover_media) ?
      str(node.cover_media.thumbnail_src) ?? str(node.cover_media.display_url) ?? str(node.cover_media.display_uri)
    : undefined);
  if (!id || !title || !cover) return undefined;
  return { id, title, cover: { kind: "remote", url: cover } };
}

function extractHighlights(blobs: unknown[], user: Json): Highlight[] | undefined {
  const edgeSources: unknown[] = [];
  if (isObj(user.edge_highlight_reels)) edgeSources.push(user.edge_highlight_reels.edges);
  if (isObj(user.lox_highlights_connection)) edgeSources.push(user.lox_highlights_connection.edges);

  for (const blob of blobs) {
    for (const obj of walk(blob)) {
      const conn = obj.lox_highlights_connection ?? obj.edge_highlight_reels;
      if (isObj(conn)) edgeSources.push(conn.edges);
    }
  }

  const seen = new Set<string>();
  const items: Highlight[] = [];
  for (const edges of edgeSources) {
    if (!Array.isArray(edges)) continue;
    for (const edge of edges) {
      const node = isObj(edge) && isObj(edge.node) ? edge.node : isObj(edge) ? edge : undefined;
      if (!node) continue;
      const item = highlightFromNode(node);
      if (!item || seen.has(item.id)) continue;
      seen.add(item.id);
      items.push(item);
    }
  }

  if (items.length) return items;

  for (const blob of blobs) {
    for (const obj of walk(blob)) {
      if (str(obj.__typename) !== "XIGHighlightReel" && !str(obj.cover_media_cropped_thumbnail_url)) continue;
      const item = highlightFromNode(obj);
      if (!item || seen.has(item.id)) continue;
      seen.add(item.id);
      items.push(item);
    }
  }
  return items.length ? items : undefined;
}

/** "1,234" / "12.3K" / "4M" → number. */
export function parseDisplayCount(raw: string): { value: number; approx: boolean } | undefined {
  const m = raw.trim().match(/^([\d.,]+)\s*([KMB])?$/i);
  if (!m?.[1]) return undefined;
  const suffix = m[2]?.toUpperCase();
  if (!suffix) {
    const value = Number(m[1].replace(/[.,]/g, ""));
    return Number.isFinite(value) ? { value, approx: false } : undefined;
  }
  const base = Number(m[1].replace(/,/g, ""));
  const mult = suffix === "K" ? 1e3 : suffix === "M" ? 1e6 : 1e9;
  return Number.isFinite(base) ? { value: Math.round(base * mult), approx: true } : undefined;
}

function meta(html: string, property: string): string | undefined {
  const re = new RegExp(`<meta[^>]+(?:property|name)="${property}"[^>]+content="([^"]*)"`, "i");
  const alt = new RegExp(`<meta[^>]+content="([^"]*)"[^>]+(?:property|name)="${property}"`, "i");
  const v = html.match(re)?.[1] ?? html.match(alt)?.[1];
  return v ? decodeEntities(v) : undefined;
}

function fromMeta(html: string, username: string): AdapterResult["fields"] {
  const fields: AdapterResult["fields"] = {};
  const desc = meta(html, "og:description") ?? meta(html, "description");
  if (desc) {
    const grab = (label: string) => {
      const m = desc.match(new RegExp(`([\\d.,]+\\s*[KMB]?)\\s+${label}`, "i"));
      return m?.[1] ? parseDisplayCount(m[1]) : undefined;
    };
    const put = (key: "followers" | "following" | "posts", parsed: ReturnType<typeof grab>) => {
      if (parsed) fields[key] = { status: "ok", value: parsed.value, approx: parsed.approx || undefined };
    };
    put("followers", grab("Followers"));
    put("following", grab("Following"));
    put("posts", grab("Posts"));
  }
  const title = meta(html, "og:title");
  const nameMatch = title?.match(/^(.*?)\s*\(@([^)]+)\)/);
  if (nameMatch?.[1] && nameMatch[2]?.toLowerCase() === username) {
    fields.displayName = { status: "ok", value: nameMatch[1].trim() };
  }
  const image = meta(html, "og:image");
  if (image) fields.avatar = { status: "ok", value: { kind: "remote", url: image } };
  return fields;
}

function emptyShellMessage(html: string): string {
  if (
    html.includes("httpErrorPage") ||
    html.includes("show_lox_redesigned_404_page") ||
    /Page Not Found/i.test(html)
  ) {
    return "Instagram blocked the request (soft 404). The profile may still be public in a browser — try again, or use Edit profile.";
  }
  if (/log\s*in|not-logged-in|loginPage/i.test(html)) {
    return "Instagram showed a login page instead of the profile.";
  }
  return "Instagram returned no readable profile data.";
}

export function parsePublicProfileHtml(html: string, username: string): AdapterResult {
  const blobs = jsonBlobs(html);
  const user = findUser(blobs, username);
  const fields: AdapterResult["fields"] = {};
  const set = (key: keyof AdapterResult["fields"], value: unknown) => {
    if (value !== undefined) (fields as Record<string, Field<unknown>>)[key] = { status: "ok", value };
  };

  if (user) {
    set("displayName", str(user.full_name));
    const pic =
      (isObj(user.hd_profile_pic_url_info) ? str(user.hd_profile_pic_url_info.url) : undefined) ??
      str(user.profile_pic_url_hd) ??
      str(user.profile_pic_url);
    if (pic) set("avatar", { kind: "remote", url: pic });
    if (typeof user.biography === "string") set("bio", user.biography);
    const link =
      str(user.external_url) ??
      (Array.isArray(user.bio_links) && isObj(user.bio_links[0]) ? str(user.bio_links[0].url) : undefined);
    set("website", link);
    set("category", str(user.category_name) ?? str(user.category));
    if (typeof user.is_verified === "boolean") set("verified", user.is_verified);
    set("followers", count(user.edge_followed_by) ?? num(user.follower_count));
    set("following", count(user.edge_follow) ?? num(user.following_count));
    set("posts", count(user.edge_owner_to_timeline_media) ?? num(user.media_count) ?? num(user.all_media_count));
    set("media", extractMedia(blobs, user));
    set("highlights", extractHighlights(blobs, user));
  }

  if (!fields.highlights) {
    const highlights = extractHighlights(blobs, user ?? {});
    set("highlights", highlights);
  }

  const metaFields = fromMeta(html, username);
  for (const [key, field] of Object.entries(metaFields)) {
    if (!(key in fields) && field) (fields as Record<string, Field<unknown>>)[key] = field;
  }

  const found = Object.keys(fields).length;
  return {
    adapter: "public",
    ok: found > 0,
    message: found > 0 ? undefined : emptyShellMessage(html),
    username,
    fields,
  };
}

function collectCookies(res: Response, jar: Map<string, string>) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  const list = raw.length ? raw : (() => {
    const single = res.headers.get("set-cookie");
    return single ? [single] : [];
  })();
  for (const line of list) {
    const pair = line.split(";", 1)[0];
    const eq = pair?.indexOf("=") ?? -1;
    if (eq <= 0 || !pair) continue;
    jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
}

function cookieHeader(jar: Map<string, string>) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function igGet(url: string, jar: Map<string, string>, extra: HeadersInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "User-Agent": BROWSER_UA,
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-User": "?1",
    ...(extra as Record<string, string>),
  };
  if (jar.size) headers.Cookie = cookieHeader(jar);
  const res = await fetch(url, { cache: "no-store", redirect: "manual", headers });
  collectCookies(res, jar);
  return res;
}

async function warmSession(jar: Map<string, string>) {
  try {
    const home = await igGet("https://www.instagram.com/", jar, {
      "Sec-Fetch-Site": "none",
    });
    if (home.status >= 300 && home.status < 400) {
      const loc = home.headers.get("location");
      if (loc) {
        const follow = await igGet(new URL(loc, "https://www.instagram.com/").href, jar, {
          "Sec-Fetch-Site": "same-origin",
        });
        await follow.text().catch(() => undefined);
      }
    } else {
      await home.text().catch(() => undefined);
    }
  } catch {
    // Proceed without cookies — parse may still work occasionally.
  }
}

async function fetchProfileHtml(username: string, jar: Map<string, string>): Promise<Response> {
  return igGet(`https://www.instagram.com/${encodeURIComponent(username)}/`, jar, {
    Referer: "https://www.instagram.com/",
    "Sec-Fetch-Site": "same-origin",
  });
}

export async function fetchPublicProfile(username: string): Promise<AdapterResult> {
  const jar = new Map<string, string>();
  await warmSession(jar);

  let res = await fetchProfileHtml(username, jar);
  if (res.status >= 300 && res.status < 400) {
    return { adapter: "public", ok: false, message: "Instagram redirected away from the profile page.", fields: {} };
  }
  if (res.status === 404) {
    return { adapter: "public", ok: false, message: `@${username} was not found.`, fields: {} };
  }
  if (!res.ok) {
    return { adapter: "public", ok: false, message: `Instagram responded ${res.status}.`, fields: {} };
  }

  let parsed = parsePublicProfileHtml(await res.text(), username);

  // Soft-404 shells are common on the first try; re-warm and retry once.
  if (!parsed.ok) {
    jar.clear();
    await warmSession(jar);
    res = await fetchProfileHtml(username, jar);
    if (res.ok) parsed = parsePublicProfileHtml(await res.text(), username);
  }

  return parsed;
}
