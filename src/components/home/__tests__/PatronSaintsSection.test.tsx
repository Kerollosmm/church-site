// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PatronSaintsSection } from "../PatronSaintsSection";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("lucide-react", () => ({
  Shield: () => <span data-testid="icon" />,
  Crown: () => <span data-testid="icon" />,
  Flame: () => <span data-testid="icon" />,
  ArrowLeft: () => <span data-testid="icon" />,
  Sparkles: () => <span data-testid="icon" />,
  Calendar: () => <span data-testid="icon" />,
  BookOpen: () => <span data-testid="icon" />,
  Heart: () => <span data-testid="icon" />,
  ExternalLink: () => <span data-testid="icon" />,
}));

describe("PatronSaintsSection Component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the patron saints section title and introductory text", () => {
    render(<PatronSaintsSection />);

    const heading = screen.getByRole("heading", {
      name: "شفعاء كنيستنا وحماتها الروحيون",
      level: 2,
    });
    expect(heading).toBeDefined();
    expect(heading.textContent).toContain("شفعاء كنيستنا وحماتها الروحيون");

    expect(screen.getByText("بركة شفعاء الكنيسة الأطهار")).toBeDefined();
    expect(screen.getByText(/تتشرف كنيستنا في الإسكندرية/i)).toBeDefined();
  });

  it("renders Sts. Maximus & Domadius hagiography and 17 Tobe feast badge", () => {
    render(<PatronSaintsSection />);

    // Name and subtitle
    expect(
      screen.getByRole("heading", { name: "القديسان مكسيموس ودوماديوس", level: 3 })
    ).toBeDefined();
    expect(screen.getByText("أولاد ملك الروم ورهبان برية شيهيت الأبرار")).toBeDefined();

    // Feast badge: 17 Tobe
    expect(screen.getByText("عيد النياحة: 17 طوبة")).toBeDefined();

    // Hagiography summary
    expect(
      screen.getByText(/ولدا في القسطنطينية ابنين لملك الروم فالنتينيانوس/i)
    ).toBeDefined();

    // Altar dedication note
    expect(screen.getByText("مكرس لهما المذبح الأوسط التاريخي بالكنيسة")).toBeDefined();
  });

  it("renders St. Moses the Black hagiography and 24 Paoni feast badge", () => {
    render(<PatronSaintsSection />);

    // Name and subtitle
    expect(
      screen.getByRole("heading", { name: "الشهيد القوي الأنبا موسى الأسود", level: 3 })
    ).toBeDefined();
    expect(screen.getByText("معلم التوبة وشهيد المحبة والإفراز")).toBeDefined();

    // Feast badge: 24 Paoni
    expect(screen.getByText("عيد الاستشهاد: 24 بؤونة")).toBeDefined();

    // Hagiography summary
    expect(
      screen.getByText(/تحول بنعمة المسيح الفائقة من رئيس قطاع طرق/i)
    ).toBeDefined();

    // Altar dedication note
    expect(screen.getByText("مكرس باسمه مذبح الكنيسة ومزاره للتبرك برفاته")).toBeDefined();
  });

  it("renders navigation links to saint biographies and consecrated altars", () => {
    render(<PatronSaintsSection />);

    const historyLinks = screen.getAllByRole("link", { name: /السيرة كاملة|تاريخ الكنيسة والشفعاء/i });
    expect(historyLinks.length).toBeGreaterThanOrEqual(2);
    expect(historyLinks[0]?.getAttribute("href")).toBe("/about/history");

    const altarsLink = screen.getByRole("link", { name: /المذابح والمزارات/i });
    expect(altarsLink).toBeDefined();
    expect(altarsLink.getAttribute("href")).toBe("/about/altars");
  });
});
