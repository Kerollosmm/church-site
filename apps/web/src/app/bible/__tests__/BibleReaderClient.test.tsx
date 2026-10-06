// @vitest-environment jsdom
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BibleReaderClient } from "../BibleReaderClient";
import type { Tables } from "@church-site/domain";

describe("BibleReaderClient Component", () => {
  const mockBooks: Tables<"bible_books">[] = [
    {
      id: "b-1",
      slug: "matthew",
      name_ar: "إنجيل متى",
      name_en: "Gospel of Matthew",
      testament: "new",
      is_deuterocanonical: false,
      chapters_count: 28,
      canonical_order: 1,
    },
    {
      id: "b-2",
      slug: "john",
      name_ar: "إنجيل يوحنا",
      name_en: "Gospel of John",
      testament: "new",
      is_deuterocanonical: false,
      chapters_count: 21,
      canonical_order: 4,
    },
  ];

  it("defaults to Gospel of John and clearly labels the prologue excerpt", () => {
    render(<BibleReaderClient books={mockBooks} />);

    // Assert active book heading is Gospel of John
    expect(screen.getByRole("heading", { level: 2, name: /إنجيل يوحنا — الأصحاح 1/i })).toBeDefined();

    // Assert prologue label
    expect(screen.getByText(/يوحنا ١: ١-٥/)).toBeDefined();

    // Assert prologue verses
    expect(screen.getByText(/فِي الْبَدْءِ كَانَ الْكَلِمَةُ/)).toBeDefined();
  });
});
