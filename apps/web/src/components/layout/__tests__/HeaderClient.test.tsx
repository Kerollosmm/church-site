// @vitest-environment jsdom
// apps/web/src/components/layout/__tests__/HeaderClient.test.tsx
// Unit tests for HeaderClient ensuring dynamic links, accessible dropdowns, keyboard navigation,
// semantic ARIA roles, and mobile drawer interactions render reliably.

import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HeaderClient } from "../HeaderClient";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("HeaderClient Component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders navigation using provided dynamic hierarchy", () => {
    const customNav = {
      main: [
        {
          id: "custom-1",
          key: "home",
          labelAr: "الرئيسية المخصصة",
          labelEn: "Custom Home",
          href: "/",
          section: "main" as const,
          parentId: null,
          sortOrder: 1,
        },
        {
          id: "custom-2",
          key: "services",
          labelAr: "خدماتنا الجديدة",
          labelEn: "Our New Services",
          href: "/services",
          section: "main" as const,
          parentId: null,
          sortOrder: 2,
        },
      ],
      secondary: [],
    };

    render(<HeaderClient navigation={customNav} />);
    expect(screen.getAllByText("الرئيسية المخصصة").length).toBeGreaterThan(0);
    expect(screen.getAllByText("خدماتنا الجديدة").length).toBeGreaterThan(0);
  });

  it("renders seed fallback when navigation is empty or undefined", () => {
    render(<HeaderClient navigation={{ main: [], secondary: [] }} />);
    // Should render baseline items like 'الرئيسية' and 'عن الكنيسة'
    expect(screen.getAllByText("الرئيسية").length).toBeGreaterThan(0);
    expect(screen.getAllByText("عن الكنيسة").length).toBeGreaterThan(0);
  });

  it("supports keyboard navigation: Enter/Space toggles dropdown and Escape closes it", () => {
    render(<HeaderClient />);

    // Find the 'عن الكنيسة' dropdown trigger button
    const aboutTrigger = screen.getByRole("button", { name: /عن الكنيسة/i });
    expect(aboutTrigger).toBeDefined();
    expect(aboutTrigger.getAttribute("aria-expanded")).toBe("false");
    expect(aboutTrigger.getAttribute("aria-haspopup")).toBe("true");

    // Press Enter to open dropdown
    fireEvent.keyDown(aboutTrigger, { key: "Enter", code: "Enter" });
    expect(aboutTrigger.getAttribute("aria-expanded")).toBe("true");

    // Menu should have role="menu" and items with role="menuitem"
    const menu = screen.getByRole("menu");
    expect(menu).toBeDefined();
    const menuItems = screen.getAllByRole("menuitem");
    expect(menuItems.length).toBeGreaterThanOrEqual(4);

    // Press Escape to close dropdown
    fireEvent.keyDown(aboutTrigger, { key: "Escape", code: "Escape" });
    expect(aboutTrigger.getAttribute("aria-expanded")).toBe("false");

    // Space toggles dropdown
    fireEvent.keyDown(aboutTrigger, { key: " ", code: "Space" });
    expect(aboutTrigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("opens and closes mobile drawer on hamburger button click and Escape key", () => {
    render(<HeaderClient />);

    // Hamburger button
    const hamburger = screen.getByRole("button", { name: /فتح القائمة/i });
    expect(hamburger).toBeDefined();
    expect(hamburger.getAttribute("aria-expanded")).toBe("false");

    // Click to open mobile drawer
    fireEvent.click(hamburger);
    expect(screen.getByRole("dialog", { name: "قائمة التنقل الجوال" })).toBeDefined();

    // Close on Escape
    fireEvent.keyDown(window, { key: "Escape", code: "Escape" });
    expect(screen.queryByRole("dialog", { name: "قائمة التنقل الجوال" })).toBeNull();
  });
});
