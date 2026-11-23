import { describe, expect, it } from "vitest";
import { normalizeUsername } from "./username";
import { parseDisplayCount } from "./adapters/publicPage";

describe("normalizeUsername", () => {
  it("strips @ and lowercases", () => {
    expect(normalizeUsername("@Lavanda.Pozarevac")).toBe("lavanda.pozarevac");
  });

  it("accepts profile URLs", () => {
    expect(normalizeUsername("https://www.instagram.com/lavanda.pozarevac/")).toBe("lavanda.pozarevac");
  });

  it("rejects invalid handles", () => {
    expect(normalizeUsername("has space")).toBeNull();
    expect(normalizeUsername("")).toBeNull();
  });
});

describe("parseDisplayCount", () => {
  it("parses plain and compact counts", () => {
    expect(parseDisplayCount("1,234")).toEqual({ value: 1234, approx: false });
    expect(parseDisplayCount("12.5K")).toEqual({ value: 12500, approx: true });
    expect(parseDisplayCount("4M")).toEqual({ value: 4_000_000, approx: true });
  });
});
