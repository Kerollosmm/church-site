// apps/admin/src/actions/__tests__/admin-video-actions.test.ts
// Unit tests for Parish Video server actions: RBAC capability gating, URL validation, and repo delegation.

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteVideoAction,
  toggleVideoActiveAction,
  toggleVideoPublicAction,
  upsertVideoAction,
} from "../admin-video-actions";
import * as requireStaffModule from "../../lib/auth/require-staff";
import * as dataAccessModule from "@church-site/data-access";
import { CAPABILITY_DENIED_MESSAGE_AR } from "@church-site/domain";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}));

describe("Parish Video Server Actions", () => {
  const mockAdminSession = {
    userId: "admin-user-1",
    fullNameAr: "المدير الإداري",
    email: "admin@church.org",
    role: "admin" as const, // admin has videos:read, videos:write, videos:delete (owner role)
  };

  const mockEditorSession = {
    userId: "editor-user-1",
    fullNameAr: "محرر الوسائط",
    email: "editor@church.org",
    role: "secretary" as const, // secretary maps to editor role: videos:read, videos:write, but NOT videos:delete
  };

  const mockViewerSession = {
    userId: "viewer-user-1",
    fullNameAr: "خادم مطلع",
    email: "viewer@church.org",
    role: "servant" as const, // maps to viewer role: videos:read only, NO videos:write
  };

  const mockRepo = {
    createVideo: vi.fn().mockImplementation((input) =>
      Promise.resolve({ id: "video-123", ...input })
    ),
    updateVideo: vi.fn().mockImplementation((id, input) =>
      Promise.resolve({ id, ...input })
    ),
    deleteVideo: vi.fn().mockResolvedValue(undefined),
    getVideoById: vi.fn().mockImplementation((id) =>
      Promise.resolve({ id, titleAr: "فيديو تجريبي", isPublic: true, isActive: true })
    ),
    toggleActive: vi.fn().mockImplementation((id, isActive) =>
      Promise.resolve({ id, isActive, titleAr: "فيديو تجريبي" })
    ),
    togglePublic: vi.fn().mockImplementation((id, isPublic) =>
      Promise.resolve({ id, isPublic, titleAr: "فيديو تجريبي" })
    ),
    listVideos: vi.fn().mockResolvedValue([]),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(dataAccessModule, "getParishVideoRepository").mockReturnValue(mockRepo as any);
  });

  describe("upsertVideoAction", () => {
    it("denies action when user lacks videos:write capability", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockViewerSession as any);

      const result = await upsertVideoAction({
        title_ar: "فيديو غير مسموح",
        source_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        sort_order: 0,
        is_public: true,
        is_active: true,
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(CAPABILITY_DENIED_MESSAGE_AR);
      expect(mockRepo.createVideo).not.toHaveBeenCalled();
    });

    it("creates video when user has videos:write and URL is valid", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockEditorSession as any);

      const result = await upsertVideoAction({
        title_ar: "عظة الأحد",
        title_en: "Sunday Sermon",
        source_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        sort_order: 1,
        is_public: true,
        is_active: true,
      });

      expect(result.success).toBe(true);
      expect(mockRepo.createVideo).toHaveBeenCalledWith(
        expect.objectContaining({
          titleAr: "عظة الأحد",
          provider: "youtube",
          embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
        }),
        expect.objectContaining({ id: mockEditorSession.userId })
      );
    });

    it("fails gracefully with Arabic error when URL is invalid or unsafe", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockEditorSession as any);

      const result = await upsertVideoAction({
        title_ar: "فيديو غير صالح",
        source_url: "https://untrusted-domain.com/video.mp4",
        sort_order: 0,
        is_public: true,
        is_active: true,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("غير معتمد");
      expect(mockRepo.createVideo).not.toHaveBeenCalled();
    });
  });

  describe("deleteVideoAction", () => {
    it("denies deletion when user is editor (not owner)", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockEditorSession as any);

      const result = await deleteVideoAction("video-123");

      expect(result.success).toBe(false);
      expect(result.message).toBe(CAPABILITY_DENIED_MESSAGE_AR);
      expect(mockRepo.deleteVideo).not.toHaveBeenCalled();
    });

    it("allows deletion when user has videos:delete (admin/owner)", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockAdminSession as any);

      const result = await deleteVideoAction("video-123");

      expect(result.success).toBe(true);
      expect(mockRepo.deleteVideo).toHaveBeenCalledWith("video-123", expect.objectContaining({ id: mockAdminSession.userId }));
    });
  });

  describe("toggleVideoActiveAction & toggleVideoPublicAction", () => {
    it("toggles active status when user has videos:write", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockEditorSession as any);

      const result = await toggleVideoActiveAction("video-123", false);

      expect(result.success).toBe(true);
      expect(mockRepo.toggleActive).toHaveBeenCalledWith(
        "video-123",
        false,
        expect.objectContaining({ id: mockEditorSession.userId })
      );
    });

    it("toggles public status when user has videos:write", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockEditorSession as any);

      const result = await toggleVideoPublicAction("video-123", true);

      expect(result.success).toBe(true);
      expect(mockRepo.togglePublic).toHaveBeenCalledWith(
        "video-123",
        true,
        expect.objectContaining({ id: mockEditorSession.userId })
      );
    });
  });
});
