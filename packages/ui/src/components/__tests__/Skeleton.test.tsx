// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, it, expect } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import {
  Skeleton,
  MassCardSkeleton,
  EventCardSkeleton,
  TableSkeleton,
} from "../Skeleton";

describe("Skeleton UI Components (Invariant INV-FEEDBACK-ANIMATION)", () => {
  afterEach(() => {
    cleanup();
  });

  describe("<Skeleton /> base primitive", () => {
    it("renders with role='status' and accessible default aria-label", () => {
      render(<Skeleton data-testid="base-skeleton" />);

      const skeleton = screen.getByRole("status");
      expect(skeleton).toBeDefined();
      expect(skeleton.getAttribute("aria-label")).toBe("جاري التحميل...");
      expect(skeleton.getAttribute("data-testid")).toBe("base-skeleton");
      expect(skeleton.className).toContain("animate-pulse");
    });

    it("allows custom aria-label and className overrides", () => {
      render(
        <Skeleton
          aria-label="جاري تحميل البيانات..."
          className="custom-w-32 h-8"
        />
      );

      const skeleton = screen.getByRole("status");
      expect(skeleton.getAttribute("aria-label")).toBe("جاري تحميل البيانات...");
      expect(skeleton.className).toContain("custom-w-32");
      expect(skeleton.className).toContain("h-8");
    });
  });

  describe("<MassCardSkeleton />", () => {
    it("renders mass card skeleton with accessible loading elements", () => {
      const { container } = render(<MassCardSkeleton className="test-mass-card" />);

      const card = container.firstElementChild;
      expect(card).toBeDefined();
      expect(card?.className).toContain("test-mass-card");

      // Multiple skeleton primitives with role="status"
      const skeletons = screen.getAllByRole("status");
      expect(skeletons.length).toBeGreaterThanOrEqual(6);
      skeletons.forEach((s) => {
        expect(s.getAttribute("aria-label")).toBe("جاري التحميل...");
      });
    });
  });

  describe("<EventCardSkeleton />", () => {
    it("renders event card skeleton with banner by default", () => {
      const { container } = render(<EventCardSkeleton />);

      const skeletons = screen.getAllByRole("status");
      expect(skeletons.length).toBeGreaterThanOrEqual(5);

      // Verify banner skeleton exists (h-40)
      const banner = container.querySelector(".h-40");
      expect(banner).toBeDefined();
      expect(banner).not.toBeNull();
    });

    it("renders event card skeleton without banner when hasBanner={false}", () => {
      const { container } = render(<EventCardSkeleton hasBanner={false} />);

      const banner = container.querySelector(".h-40");
      expect(banner).toBeNull();

      const skeletons = screen.getAllByRole("status");
      expect(skeletons.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("<TableSkeleton />", () => {
    it("renders table skeleton with default 5 rows and 4 columns", () => {
      render(<TableSkeleton />);

      // Total skeletons: 4 header + (5 rows * 4 cols) = 24
      const skeletons = screen.getAllByRole("status");
      expect(skeletons.length).toBe(4 + 5 * 4);
    });

    it("supports customizable rows and cols count", () => {
      render(<TableSkeleton rows={2} cols={3} />);

      // Total skeletons: 3 header + (2 rows * 3 cols) = 9
      const skeletons = screen.getAllByRole("status");
      expect(skeletons.length).toBe(3 + 2 * 3);
    });
  });
});
