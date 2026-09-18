// apps/admin/src/actions/__tests__/admin-asset-actions.test.ts
// Unit tests for linkExternalAssetAction server action

import { describe, expect, it, vi, beforeEach } from "vitest";
import { linkExternalAssetAction } from "../admin-asset-actions";
import * as requireStaffModule from "../../lib/auth/require-staff";
import * as dataAccessModule from "@church-site/data-access";
import { CAPABILITY_DENIED_MESSAGE_AR } from "@church-site/domain";
import { revalidateTag, revalidatePath } from "next/cache";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}));

describe("linkExternalAssetAction", () => {
  const mockStaffSession = {
    userId: "staff-user-1",
    email: "editor@church.org",
    fullNameAr: "محرر النظام",
    role: "admin" as const,
  };

  const mockRepo = {
    createMedia: vi.fn().mockImplementation((input) =>
      Promise.resolve({
        id: "media-uuid-1",
        uploadedBy: "staff-user-1",
        createdAt: "2026-09-18T12:00:00Z",
        ...input,
      })
    ),
    updateEvent: vi.fn().mockResolvedValue({ id: "event-uuid-1", titleAr: "فعالية" }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockStaffSession);
    vi.spyOn(dataAccessModule, "getEventRepository").mockReturnValue(mockRepo as any);
  });

  it("successfully links YouTube URL", async () => {
    const payload = {
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      altAr: "فيديو تجريبي",
      altEn: "Demo Video",
      isPublic: true,
      targetEventId: "event-uuid-1",
    };

    const result = await linkExternalAssetAction(payload);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.message).toBe("تم التحقق من الرابط وإضافته بنجاح كأصل معتمد.");
      expect(result.data.id).toBe("media-uuid-1");
      expect(result.data.kind).toBe("youtube-thumb");
      expect(result.data.url).toBe("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    }

    expect(mockRepo.createMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        mimeType: "image/jpeg",
        sizeBytes: 0,
        url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        sourceUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        resolvedUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        host: "i.ytimg.com",
        kind: "youtube-thumb",
        altAr: "فيديو تجريبي",
        altEn: "Demo Video",
        isPublic: true,
      }),
      { id: "staff-user-1", name: "محرر النظام" }
    );

    expect(mockRepo.updateEvent).toHaveBeenCalledWith(
      "event-uuid-1",
      { imageUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg" },
      { id: "staff-user-1", name: "محرر النظام" }
    );

    expect(revalidateTag).toHaveBeenCalledWith(dataAccessModule.REVALIDATION_TAGS.media);
    expect(revalidateTag).toHaveBeenCalledWith(dataAccessModule.REVALIDATION_TAGS.events);
  });

  it("successfully links Google Drive URL", async () => {
    const payload = {
      url: "https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p/view",
      isPublic: true,
    };

    const result = await linkExternalAssetAction(payload);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kind).toBe("drive");
      expect(result.data.host).toBe("drive.usercontent.google.com");
      expect(result.data.resolvedUrl).toBe(
        "https://drive.usercontent.google.com/download?id=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p&export=view"
      );
    }

    expect(mockRepo.createMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "drive",
        host: "drive.usercontent.google.com",
        resolvedUrl:
          "https://drive.usercontent.google.com/download?id=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p&export=view",
      }),
      { id: "staff-user-1", name: "محرر النظام" }
    );
  });

  it("rejects unsupported Google Photos share URL with Arabic message", async () => {
    const payload = {
      url: "https://photos.app.goo.gl/abcdef123456",
    };

    const result = await linkExternalAssetAction(payload);

    expect(result.success).toBe(false);
    expect(result.message).toContain(
      "روابط مشاركة ألبومات صور Google ليست روابط صور مباشرة وتتطلب واجهة برمجة تطبيقات خاصة"
    );
    expect(mockRepo.createMedia).not.toHaveBeenCalled();
  });

  it("rejects hostile URLs (http, attacker.com, userinfo)", async () => {
    // 1. Non-https protocol
    const httpResult = await linkExternalAssetAction({
      url: "http://example.com/photo.jpg",
    });
    expect(httpResult.success).toBe(false);
    expect(httpResult.message).toContain("https://");

    // 2. Attacker domain not in allowlist
    const attackerResult = await linkExternalAssetAction({
      url: "https://attacker.com/malicious.jpg",
    });
    expect(attackerResult.success).toBe(false);
    expect(attackerResult.message).toContain("attacker.com");
    expect(attackerResult.message).toContain("غير مسموح به");

    // 3. Userinfo in URL
    const userinfoResult = await linkExternalAssetAction({
      url: "https://user:pass@i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    });
    expect(userinfoResult.success).toBe(false);
    expect(userinfoResult.message).toContain("userinfo");

    expect(mockRepo.createMedia).not.toHaveBeenCalled();
  });

  it("rejects when user lacks assets:link capability", async () => {
    vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue({
      ...mockStaffSession,
      role: "priest" as any,
    });

    const result = await linkExternalAssetAction({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe(CAPABILITY_DENIED_MESSAGE_AR);
    expect(mockRepo.createMedia).not.toHaveBeenCalled();
  });
});
