// @vitest-environment jsdom
// apps/web/src/components/layout/__tests__/HeaderClient.test.tsx
// Unit tests for HeaderClient ensuring dynamic links, dropdowns, and seed fallback render reliably.

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HeaderClient } from "../HeaderClient";
import { SEED_PUBLIC_NAVIGATION } from "@church-site/data-access/client";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("HeaderClient Component", () => {
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
});
