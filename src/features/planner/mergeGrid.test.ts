import { describe, expect, it } from "vitest";
import type { PublishedMedia } from "@/features/import/types";
import { displayPostCount, mergeGrid } from "./mergeGrid";
import type { PlannedItem } from "./types";

const img = (id: string, pinned = false): PublishedMedia => ({
  id,
  kind: "image",
  image: { kind: "remote", url: `https://example.com/${id}.jpg` },
  pinned,
});

const plan = (id: string, kind: PlannedItem["kind"] = "image"): PlannedItem => ({
  id,
  kind,
  image: { kind: "blob", key: id },
  name: id,
  createdAt: 0,
  focusX: 0.5,
  focusY: 0.5,
});

describe("mergeGrid", () => {
  it("orders pinned, then planned, then published", () => {
    const published = [img("a"), img("b", true), img("c"), img("d", true)];
    const planned = [plan("p1"), plan("p2")];
    expect(mergeGrid(published, planned).map((i) => i.id)).toEqual(["b", "d", "p1", "p2", "a", "c"]);
  });

  it("never reorders published items relative to each other", () => {
    const published = [img("1"), img("2"), img("3")];
    expect(mergeGrid(published, []).map((i) => i.id)).toEqual(["1", "2", "3"]);
  });

  it("caps pins at 3", () => {
    const published = [img("a", true), img("b", true), img("c", true), img("d", true)];
    const ids = mergeGrid(published, []).filter((i) => i.pinned).map((i) => i.id);
    expect(ids).toEqual(["a", "b", "c"]);
  });

  it("filters the reels tab to reels only", () => {
    const published: PublishedMedia[] = [
      { ...img("r1"), kind: "reel" },
      img("p1"),
      { ...img("r2"), kind: "reel" },
    ];
    const planned = [plan("pr", "reel"), plan("pi", "image")];
    expect(mergeGrid(published, planned, "reels").map((i) => i.id)).toEqual(["pr", "r1", "r2"]);
  });

  it("applies a custom grid order", () => {
    const published = [img("a"), img("b"), img("c")];
    expect(mergeGrid(published, [plan("p1")], "posts", ["c", "p1", "a", "b"]).map((i) => i.id)).toEqual([
      "c",
      "p1",
      "a",
      "b",
    ]);
  });

  it("returns an empty tagged tab", () => {
    expect(mergeGrid([img("a")], [plan("p")], "tagged")).toEqual([]);
  });
});

describe("displayPostCount", () => {
  it("adds planned items to the real count", () => {
    expect(displayPostCount(10, 2)).toBe(12);
    expect(displayPostCount(undefined, 3)).toBe(3);
    expect(displayPostCount(undefined, 0)).toBeUndefined();
  });
});
