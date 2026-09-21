// packages/domain/src/__tests__/content-options.test.ts
// The `content_fields.options` union: how a raw JSONB blob becomes a typed value, and how a relation
// field's target is read. Replaces the `as any` casts that used to hide these shapes.

import { describe, expect, it } from "vitest";
import { parseContentFieldOptions, resolveRelationTarget } from "../types";

describe("resolveRelationTarget", () => {
  it("reads a bare slug", () => {
    expect(resolveRelationTarget("articles")).toBe("articles");
    expect(resolveRelationTarget("  articles  ")).toBe("articles");
  });

  it("reads an object target", () => {
    expect(resolveRelationTarget({ targetType: "articles" })).toBe("articles");
  });

  it("returns null for an option list, an empty value or nothing at all", () => {
    expect(resolveRelationTarget(["a", "b"])).toBeNull();
    expect(resolveRelationTarget([{ value: "a", labelAr: "أ" }])).toBeNull();
    expect(resolveRelationTarget("")).toBeNull();
    expect(resolveRelationTarget("   ")).toBeNull();
    expect(resolveRelationTarget(null)).toBeNull();
    expect(resolveRelationTarget(undefined)).toBeNull();
  });
});

describe("parseContentFieldOptions", () => {
  it("returns null for a missing or unrecognised blob", () => {
    expect(parseContentFieldOptions(null)).toBeNull();
    expect(parseContentFieldOptions(undefined)).toBeNull();
    expect(parseContentFieldOptions(42)).toBeNull();
    expect(parseContentFieldOptions(true)).toBeNull();
    expect(parseContentFieldOptions([{ nope: 1 }])).toBeNull();
    expect(parseContentFieldOptions({ nope: 1 })).toBeNull();
  });

  it("keeps an array of plain strings as a string list", () => {
    expect(parseContentFieldOptions(["a", "b"])).toEqual(["a", "b"]);
    expect(parseContentFieldOptions([])).toEqual([]);
  });

  it("normalises option objects and falls back on the value as the Arabic label", () => {
    expect(parseContentFieldOptions([{ value: "a", labelAr: "أ", labelEn: "A" }])).toEqual([
      { value: "a", labelAr: "أ", labelEn: "A" },
    ]);
    expect(parseContentFieldOptions([{ value: "a" }])).toEqual([
      { value: "a", labelAr: "a", labelEn: null },
    ]);
  });

  it("upgrades a mixed array into the option-object shape", () => {
    expect(parseContentFieldOptions(["a", { value: "b", labelAr: "ب" }])).toEqual([
      { value: "a", labelAr: "a", labelEn: null },
      { value: "b", labelAr: "ب", labelEn: null },
    ]);
  });

  it("keeps a relation target in both of its shapes", () => {
    expect(parseContentFieldOptions("articles")).toBe("articles");
    expect(parseContentFieldOptions({ targetType: "articles" })).toEqual({ targetType: "articles" });
  });

  it("drops entries that carry no usable value", () => {
    expect(parseContentFieldOptions([{ value: "a", labelAr: "أ" }, { labelAr: "ب" }])).toEqual([
      { value: "a", labelAr: "أ", labelEn: null },
    ]);
  });
});
