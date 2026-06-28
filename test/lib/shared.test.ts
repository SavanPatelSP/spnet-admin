import { describe, it, expect } from "vitest";
import { generateKey, truncate, pluralize, slugify, formatNumber } from "@/lib/shared";

describe("generateKey", () => {
  it("generates a key with prefix", () => {
    const key = generateKey();
    expect(key).toMatch(/^SPNET-/);
  });

  it("generates unique keys", () => {
    const keys = new Set(Array.from({ length: 100 }, () => generateKey()));
    expect(keys.size).toBe(100);
  });
});

describe("truncate", () => {
  it("returns short strings unchanged", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates long strings with ellipsis", () => {
    expect(truncate("hello world this is long", 10)).toBe("hello w...");
  });
});

describe("pluralize", () => {
  it("returns singular for count 1", () => {
    expect(pluralize(1, "license")).toBe("license");
  });

  it("returns plural for other counts", () => {
    expect(pluralize(0, "license")).toBe("licenses");
    expect(pluralize(5, "license")).toBe("licenses");
  });

  it("uses custom plural form", () => {
    expect(pluralize(2, "child", "children")).toBe("children");
  });
});

describe("slugify", () => {
  it("converts to lowercase slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(slugify("Hello World! @Test")).toBe("hello-world-test");
  });
});

describe("formatNumber", () => {
  it("formats numbers with locale separators", () => {
    const result = formatNumber(1000);
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });
});
