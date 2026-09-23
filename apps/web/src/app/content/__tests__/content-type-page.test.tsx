import { describe, it, expect, vi } from "vitest";
import ContentTypeListingPage, { dynamicParams } from "../[type]/page";

vi.mock("next/navigation", () => ({
  notFound: vi.fn().mockImplementation(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/lib/store", () => ({
  getContentTypeRepository: () => ({
    getContentTypeBySlug: vi.fn().mockResolvedValue(null),
    listContentTypes: vi.fn().mockResolvedValue([]),
  }),
}));

describe("ContentTypeListingPage route", () => {
  it("invokes notFound() immediately when content type does not exist", async () => {
    expect(dynamicParams).toBe(false);

    await expect(
      ContentTypeListingPage({ params: Promise.resolve({ type: "article" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
