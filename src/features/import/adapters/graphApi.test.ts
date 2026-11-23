import { describe, expect, it } from "vitest";
import { normalizeGraph, tokenFor, type GraphMedia, type GraphMe } from "./graphApi";

describe("tokenFor", () => {
  it("finds a username:token pair", () => {
    expect(tokenFor("lavanda.pozarevac", "lavanda.pozarevac:AAA,other:BBB")).toBe("AAA");
    expect(tokenFor("missing", "lavanda.pozarevac:AAA")).toBeNull();
  });
});

describe("normalizeGraph", () => {
  it("maps profile and media without inventing fields", () => {
    const me: GraphMe = {
      username: "lavanda.pozarevac",
      name: "Lavanda",
      profile_picture_url: "https://cdninstagram.com/a.jpg",
      followers_count: 10,
      follows_count: 5,
      media_count: 2,
      biography: "Hello",
    };
    const media: GraphMedia[] = [
      {
        id: "1",
        media_type: "IMAGE",
        media_product_type: "FEED",
        media_url: "https://cdninstagram.com/1.jpg",
      },
      {
        id: "2",
        media_type: "VIDEO",
        media_product_type: "REELS",
        thumbnail_url: "https://cdninstagram.com/2.jpg",
      },
      {
        id: "3",
        media_type: "CAROUSEL_ALBUM",
        media_product_type: "FEED",
        children: { data: [{ media_url: "https://cdninstagram.com/3.jpg" }] },
      },
    ];
    const result = normalizeGraph(me, media);
    expect(result.ok).toBe(true);
    expect(result.fields.displayName?.value).toBe("Lavanda");
    expect(result.fields.verified).toBeUndefined();
    expect(result.fields.highlights).toBeUndefined();
    expect(result.fields.media?.value?.map((m) => m.kind)).toEqual(["image", "reel", "carousel"]);
  });
});
