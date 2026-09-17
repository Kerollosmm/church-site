// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import GalleryPage from "../page";
import * as feedModule from "@/lib/events/feed";
import * as serverI18n from "@/lib/i18n/server";

vi.mock("@/lib/i18n/server", () => ({
  getLocale: vi.fn(),
}));

vi.mock("@/lib/events/feed", () => ({
  getPublicGalleryMedia: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("GalleryPage Component", () => {
  beforeEach(() => {
    vi.mocked(serverI18n.getLocale).mockResolvedValue("ar");
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders empty placeholder when no items", async () => {
    vi.mocked(feedModule.getPublicGalleryMedia).mockResolvedValue([]);

    const page = await GalleryPage();
    const { container } = render(page);

    const root = container.querySelector("[data-gallery-state='placeholder']");
    expect(root).toBeDefined();

    const placeholderSection = container.querySelector("[data-gallery-placeholder]");
    expect(placeholderSection).toBeDefined();
    expect(screen.getByRole("status")).toBeDefined();

    const placeholderHeading = screen.getByRole("heading", { level: 2, name: /الصور ستُضاف قريبًا/i });
    expect(placeholderHeading).toBeDefined();

    // Check placeholder badge
    expect(screen.getByText("حالة مؤقتة قابلة للاستبدال")).toBeDefined();
  });

  it("renders image items with caption and alt text", async () => {
    vi.mocked(feedModule.getPublicGalleryMedia).mockResolvedValue([
      {
        id: "media-img-1",
        filename: "altar-consecration.jpg",
        url: "https://test.supabase.co/storage/v1/object/public/media/altar-consecration.jpg",
        mimeType: "image/jpeg",
        altAr: "تدشين مذبح الكنيسة",
        altEn: "Consecration of Church Altar",
      },
      {
        id: "media-img-2",
        filename: "vespers-photo.png",
        url: "https://test.supabase.co/storage/v1/object/public/media/vespers-photo.png",
        mimeType: "image/png",
        altAr: null,
        altEn: null,
      },
    ]);

    const page = await GalleryPage();
    const { container } = render(page);

    const root = container.querySelector("[data-gallery-state='registered']");
    expect(root).toBeDefined();

    // First image card with custom alt caption
    const card1 = container.querySelector("[data-gallery-media='media-img-1']");
    expect(card1).toBeDefined();
    expect(card1?.textContent).toContain("تدشين مذبح الكنيسة");
    expect(card1?.textContent).toContain("altar-consecration.jpg");

    const img1 = card1?.querySelector("img");
    expect(img1).toBeDefined();
    expect(img1?.getAttribute("src")).toBe("https://test.supabase.co/storage/v1/object/public/media/altar-consecration.jpg");
    expect(img1?.getAttribute("alt")).toBe("تدشين مذبح الكنيسة");

    // Second image card with fallback caption
    const card2 = container.querySelector("[data-gallery-media='media-img-2']");
    expect(card2).toBeDefined();
    expect(card2?.textContent).toContain("لم يُسجَّل وصف نصي لهذا الملف بعد.");
    expect(card2?.textContent).toContain("vespers-photo.png");

    const img2 = card2?.querySelector("img");
    expect(img2).toBeDefined();
    expect(img2?.getAttribute("src")).toBe("https://test.supabase.co/storage/v1/object/public/media/vespers-photo.png");
    expect(img2?.getAttribute("alt")).toBe("لم يُسجَّل وصف نصي لهذا الملف بعد.");
  });

  it("renders video items and file cards", async () => {
    vi.mocked(feedModule.getPublicGalleryMedia).mockResolvedValue([
      {
        id: "media-vid-1",
        filename: "liturgy-broadcast.mp4",
        url: "https://test.supabase.co/storage/v1/object/public/media/liturgy-broadcast.mp4",
        mimeType: "video/mp4",
        altAr: "تسجيل القداس الإلهي",
        altEn: "Divine Liturgy Recording",
      },
      {
        id: "media-doc-1",
        filename: "service-schedule.pdf",
        url: "https://test.supabase.co/storage/v1/object/public/media/service-schedule.pdf",
        mimeType: "application/pdf",
        altAr: "دليل الصلوات الأسبوعي",
        altEn: "Weekly Liturgy Schedule",
      },
    ]);

    const page = await GalleryPage();
    const { container } = render(page);

    // Video card verification
    const vidCard = container.querySelector("[data-gallery-media='media-vid-1']");
    expect(vidCard).toBeDefined();
    expect(vidCard?.textContent).toContain("تسجيل القداس الإلهي");
    expect(vidCard?.textContent).toContain("liturgy-broadcast.mp4");

    const videoEl = vidCard?.querySelector("video");
    expect(videoEl).toBeDefined();
    expect(videoEl?.getAttribute("src")).toBe("https://test.supabase.co/storage/v1/object/public/media/liturgy-broadcast.mp4");
    expect(videoEl?.hasAttribute("controls")).toBe(true);
    expect(videoEl?.getAttribute("preload")).toBe("metadata");

    // Document card verification
    const docCard = container.querySelector("[data-gallery-media='media-doc-1']");
    expect(docCard).toBeDefined();
    expect(docCard?.textContent).toContain("service-schedule.pdf");
    expect(docCard?.textContent).toContain("application/pdf");
    expect(docCard?.textContent).toContain("دليل الصلوات الأسبوعي");

    // Open/download link
    const docLink = docCard?.querySelector("a[href='https://test.supabase.co/storage/v1/object/public/media/service-schedule.pdf']");
    expect(docLink).toBeDefined();
    expect(docLink?.getAttribute("target")).toBe("_blank");
  });

  it("renders load-failed alert state when feed reader throws", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(feedModule.getPublicGalleryMedia).mockRejectedValue(new Error("Store down"));

    const page = await GalleryPage();
    render(page);

    const alert = screen.getByRole("alert");
    expect(alert).toBeDefined();
    expect(alert.getAttribute("data-gallery-state")).toBe("load-failed");

    consoleSpy.mockRestore();
  });
});
