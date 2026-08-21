import { describe, expect, it } from "vitest";

import { formatDate, isoDate, readingMinutes, slugify, truncate } from "@/lib/utils";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Why AI Pilots Stall")).toBe("why-ai-pilots-stall");
  });

  it("expands ampersands into a readable word", () => {
    expect(slugify("Strategy & Value")).toBe("strategy-and-value");
  });

  it("strips diacritics rather than dropping the letter", () => {
    expect(slugify("Prioritisé")).toBe("prioritise");
  });

  it("collapses punctuation runs and trims stray hyphens", () => {
    expect(slugify("  --Hello,   World!!  ")).toBe("hello-world");
  });

  it("never returns an empty slug", () => {
    expect(slugify("!!!")).toBe("untitled");
    expect(slugify("")).toBe("untitled");
  });

  it("caps length without leaving a trailing hyphen", () => {
    const slug = slugify("a ".repeat(80));
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("readingMinutes", () => {
  it("returns at least one minute for short text", () => {
    expect(readingMinutes("a few words only")).toBe(1);
  });

  it("scales with word count", () => {
    expect(readingMinutes("word ".repeat(2200))).toBe(10);
  });
});

describe("truncate", () => {
  it("leaves short strings untouched", () => {
    expect(truncate("short", 20)).toBe("short");
  });

  it("cuts on a word boundary and appends an ellipsis", () => {
    const result = truncate("the quick brown fox jumps over the lazy dog", 20);
    expect(result.endsWith("…")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(21);
    expect(result).not.toContain("  ");
  });
});

describe("date helpers", () => {
  it("formats in UTC regardless of the host timezone", () => {
    expect(formatDate(new Date("2026-03-09T23:30:00Z"))).toBe("9 March 2026");
  });

  it("returns an empty string for missing or invalid values", () => {
    expect(formatDate(null)).toBe("");
    expect(formatDate("not a date")).toBe("");
    expect(isoDate(undefined)).toBe("");
  });

  it("produces a machine-readable ISO string", () => {
    expect(isoDate(new Date("2026-03-09T23:30:00Z"))).toBe("2026-03-09T23:30:00.000Z");
  });
});
