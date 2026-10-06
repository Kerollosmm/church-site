// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { LatestNewsCarousel } from "../LatestNewsCarousel";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("LatestNewsCarousel Component", () => {
  afterEach(() => {
    cleanup();
  });
  it("renders honest empty state when news is empty or undefined", () => {
    const { container } = render(<LatestNewsCarousel news={[]} />);

    const emptySection = container.querySelector('[data-home-state="empty-news"]');
    expect(emptySection).toBeDefined();
    expect(screen.getByText(/لا توجد بيانات أو إعلانات جديدة منشورة حالياً/)).toBeDefined();
  });

  it("renders honest empty state when news prop is omitted", () => {
    const { container } = render(<LatestNewsCarousel />);

    const emptySection = container.querySelector('[data-home-state="empty-news"]');
    expect(emptySection).toBeDefined();
    expect(screen.getByText(/لا توجد بيانات أو إعلانات جديدة منشورة حالياً/)).toBeDefined();
  });

  it("renders news items when news array is provided", () => {
    const sampleNews: any[] = [
      {
        id: "news-1",
        title_ar: "خبر تجريبي حقيقي",
        summary_ar: "ملخص الخبر الحقيقي",
        category: "liturgical",
        published_at: "2026-10-01T10:00:00Z",
      },
    ];

    const { container } = render(<LatestNewsCarousel news={sampleNews} />);

    const listSection = container.querySelector('[data-home-state="news-list"]');
    expect(listSection).toBeDefined();
    expect(screen.getByText("خبر تجريبي حقيقي")).toBeDefined();
    expect(screen.getByText("ملخص الخبر الحقيقي")).toBeDefined();
  });
});
