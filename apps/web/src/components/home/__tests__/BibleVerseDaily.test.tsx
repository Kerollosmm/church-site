// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
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

  it("handles clipboard.writeText rejection gracefully without throwing unhandled error", async () => {
    const { fireEvent } = await import("@testing-library/react");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValueOnce(new Error("Permission denied")),
      },
    });

    const verse = {
      verse_text: "«الرَّبُّ رَاعِيَّ فَلاَ يُعْوِزُنِي شَيْءٌ»",
      book_name: "مزمور",
      chapter_number: 23,
      verse_number: 1,
    };

    const { container } = render(<BibleVerseDaily verse={verse} />);
    const copyButton = container.querySelector('button[title="نسخ الآية"]') as HTMLButtonElement;
    expect(copyButton).toBeDefined();

    // Clicking should invoke navigator.clipboard.writeText and swallow/warn the error
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "«الرَّبُّ رَاعِيَّ فَلاَ يُعْوِزُنِي شَيْءٌ» (مزمور 23:1)"
    );

    // Wait microtask tick for async/await in handleCopy
    await Promise.resolve();

    expect(warnSpy).toHaveBeenCalledWith(
      "Failed to copy bible verse to clipboard:",
      expect.any(Error)
    );

    warnSpy.mockRestore();
  });
});
