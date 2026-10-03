// @vitest-environment jsdom
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BibleVerseDaily } from "../BibleVerseDaily";

describe("BibleVerseDaily Component", () => {
  it("renders null honestly when verse is undefined or null (no fabricated fallbacks)", () => {
    const { container: c1 } = render(<BibleVerseDaily />);
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(<BibleVerseDaily verse={null} />);
    expect(c2.firstChild).toBeNull();
  });

  it("renders verse when valid verse object is provided", () => {
    const verse = {
      verse_text: "«الرَّبُّ نُورِي وَخَلاَصِي، مِمَّنْ أَخَافُ؟»",
      book_name: "مزمور",
      chapter_number: 27,
      verse_number: 1,
    };

    const { container } = render(<BibleVerseDaily verse={verse} />);
    expect(container.querySelector('[data-home-state="daily-verse"]')).toBeDefined();
    expect(screen.getByText("«الرَّبُّ نُورِي وَخَلاَصِي، مِمَّنْ أَخَافُ؟»")).toBeDefined();
    expect(screen.getByText(/مزمور 27:1/)).toBeDefined();
  });
});
