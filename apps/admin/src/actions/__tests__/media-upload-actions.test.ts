// apps/admin/src/actions/__tests__/media-upload-actions.test.ts
// Unit tests for media upload action and MediaUploadSchema validation.

import { describe, expect, it, vi, beforeEach } from "vitest";
import { uploadMediaAction } from "../media-upload-actions";
import { MediaUploadSchema, MediaSchema } from "@church-site/data-access";
import * as requireStaffModule from "../../lib/auth/require-staff";
import * as dataAccessModule from "@church-site/data-access";
import { CAPABILITY_DENIED_MESSAGE_AR, MAX_MEDIA_SIZE_BYTES } from "@church-site/domain";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}));

describe("MediaUploadSchema", () => {
  it("accepts valid image payload", () => {
    const payload = {
      filename: "test-photo.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 1024 * 50,
      altAr: "صورة تجريبية",
      altEn: "Test photo",
      isPublic: true,
    };
    const result = MediaUploadSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filename).toBe("test-photo.jpg");
      expect(result.data.isPublic).toBe(true);
    }
  });

  it("accepts pdf document and mp4 video", () => {
    expect(
      MediaUploadSchema.safeParse({
        filename: "doc.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024,
      }).success
    ).toBe(true);

    expect(
      MediaUploadSchema.safeParse({
        filename: "video.mp4",
        mimeType: "video/mp4",
        sizeBytes: 1024 * 1024,
      }).success
    ).toBe(true);
  });

  it("rejects disallowed MIME type", () => {
    const result = MediaUploadSchema.safeParse({
      filename: "archive.zip",
      mimeType: "application/zip",
      sizeBytes: 500,
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero size file", () => {
    const result = MediaUploadSchema.safeParse({
      filename: "empty.png",
      mimeType: "image/png",
      sizeBytes: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects file exceeding MAX_MEDIA_SIZE_BYTES", () => {
    const result = MediaUploadSchema.safeParse({
      filename: "huge.jpg",
      mimeType: "image/jpeg",
      sizeBytes: MAX_MEDIA_SIZE_BYTES + 1,
    });
    expect(result.success).toBe(false);
  });

  it("validates MediaSchema supports storagePath and checksum", () => {
    const record = {
      filename: "banner.webp",
      mimeType: "image/webp",
      sizeBytes: 5000,
      url: "https://example.com/banner.webp",
      storagePath: "2026/09/uuid.webp",
      checksum: "abc123sha256",
      altAr: "شعار الكنيسة",
      altEn: "Church banner",
      isPublic: true,
    };
    const result = MediaSchema.safeParse(record);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.storagePath).toBe("2026/09/uuid.webp");
      expect(result.data.checksum).toBe("abc123sha256");
    }
  });
});

describe("uploadMediaAction", () => {
  const mockStaffSession = {
    userId: "staff-user-1",
    email: "editor@church.org",
    fullNameAr: "محرر النظام",
    role: "admin" as const,
  };

  const mockCreatedMedia = {
    id: "media-uuid-1",
    filename: "uploaded.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 12345,
    url: "/media-mock/2026/09/test.jpg",
    storagePath: "2026/09/test.jpg",
    checksum: "hash123",
    altAr: "صورة",
    altEn: "Photo",
    uploadedBy: "staff-user-1",
    createdAt: "2026-09-17T12:00:00Z",
    isPublic: true,
  };

  const mockRepo = {
    createMedia: vi.fn().mockResolvedValue(mockCreatedMedia),
    updateEvent: vi.fn().mockResolvedValue({ id: "event-1", titleAr: "فعالية" }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockStaffSession);
    vi.spyOn(dataAccessModule, "getEventRepository").mockReturnValue(mockRepo as any);
    vi.spyOn(dataAccessModule, "uploadMedia").mockResolvedValue({
      storagePath: "2026/09/test.jpg",
      publicUrl: "/media-mock/2026/09/test.jpg",
      checksum: "hash123",
      sizeBytes: 12345,
    });
  });

  it("rejects when no file is provided in FormData", async () => {
    const formData = new FormData();
    const result = await uploadMediaAction(formData);
    expect(result.success).toBe(false);
    expect(result.message).toBe("لم يتم تحديد أي ملف للرفع.");
  });

  it("rejects when staff role lacks media:create capability", async () => {
    vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue({
      ...mockStaffSession,
      role: "priest" as any,
    });

    const formData = new FormData();
    const file = new File([new Uint8Array([1, 2, 3])], "test.jpg", { type: "image/jpeg" });
    formData.append("file", file);

    const result = await uploadMediaAction(formData);
    expect(result.success).toBe(false);
    expect(result.message).toBe(CAPABILITY_DENIED_MESSAGE_AR);
  });

  it("successfully uploads file, records in repo, and invalidates caches", async () => {
    const formData = new FormData();
    const file = new File([new Uint8Array([1, 2, 3, 4, 5])], "photo.jpg", { type: "image/jpeg" });
    formData.append("file", file);
    formData.append("altAr", "صورة الفعالية");
    formData.append("altEn", "Event photo");
    formData.append("isPublic", "true");
    formData.append("targetEventId", "event-uuid-1");

    const result = await uploadMediaAction(formData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("media-uuid-1");
      expect(result.message).toBe("تم رفع وحفظ الملف بنجاح.");
    }

    expect(dataAccessModule.uploadMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: "photo.jpg",
        mimeType: "image/jpeg",
        isPublic: true,
      })
    );

    expect(mockRepo.createMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: "photo.jpg",
        mimeType: "image/jpeg",
        storagePath: "2026/09/test.jpg",
        checksum: "hash123",
        altAr: "صورة الفعالية",
        altEn: "Event photo",
      }),
      { id: "staff-user-1", name: "محرر النظام" }
    );

    expect(mockRepo.updateEvent).toHaveBeenCalledWith(
      "event-uuid-1",
      { imageUrl: "/media-mock/2026/09/test.jpg" },
      { id: "staff-user-1", name: "محرر النظام" }
    );
  });
});
