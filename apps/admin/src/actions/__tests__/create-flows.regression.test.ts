// apps/admin/src/actions/__tests__/create-flows.regression.test.ts
// Comprehensive regression suite for admin create flows:
// - createMassAction (valid write, invalid payload rejection, audit log recording)
// - createParishVideoAction (valid URLs, SSRF / untrusted domain rejection with audit denial, validation errors)

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMassAction } from "../admin-mass-actions";
import { createParishVideoAction } from "../admin-video-actions";
import * as requireStaffModule from "../../lib/auth/require-staff";
import * as getStaffSessionModule from "../../lib/auth/require-staff";
import * as dataAccessModule from "@church-site/data-access";
import { CAPABILITY_DENIED_MESSAGE_AR } from "@church-site/domain";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}));

describe("Create Flows Regression Suite", () => {
  const mockAdminSession = {
    userId: "admin-user-001",
    fullNameAr: "المشرف الإداري",
    email: "admin@church.org",
    role: "admin" as const,
  };

  const mockServantSession = {
    userId: "servant-user-002",
    fullNameAr: "خادم مطلع",
    email: "servant@church.org",
    role: "servant" as any,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("createMassAction Flow", () => {
    const validMassPayload = {
      day_of_week: "Sunday" as const,
      altar_id: "altar-uuid-main",
      title_ar: "قداس الأحد الصباحي",
      start_time: "06:30",
      end_time: "09:00",
      target_group_ar: "عام لجميع الشعب",
      notes_ar: "حضور باكر",
      is_active: true,
    };

    it("writes correctly and records audit log when authorized", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockAdminSession);
      vi.spyOn(getStaffSessionModule, "getStaffSession").mockResolvedValue(mockAdminSession);
      const auditSpy = vi.spyOn(dataAccessModule, "recordAuditLog").mockResolvedValue({} as any);

      const result = await createMassAction(validMassPayload);

      expect(result.success).toBe(true);
      expect(result.message).toContain("تم حفظ القداس بنجاح");

      // Verify audit log entry was recorded with action "create"
      expect(auditSpy).toHaveBeenCalled();
      const auditCall = auditSpy.mock.calls[0][0];
      expect(auditCall.action).toBe("create");
      expect(auditCall.entityType).toBe("mass");
      expect(auditCall.actor.id).toBe(mockAdminSession.userId);
      expect(auditCall.summary).toContain("قداس الأحد الصباحي");
    });

    it("rejects invalid payload without writing or reaching repository", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockAdminSession);
      vi.spyOn(getStaffSessionModule, "getStaffSession").mockResolvedValue(mockAdminSession);
      const auditSpy = vi.spyOn(dataAccessModule, "recordAuditLog").mockResolvedValue({} as any);

      const invalidPayload = {
        ...validMassPayload,
        title_ar: "قد", // Less than 3 characters
        day_of_week: "InvalidDay" as any,
      };

      const result = await createMassAction(invalidPayload);

      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      // SafeParse rejected early before creation audit
      expect(auditSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ action: "create" })
      );
    });

    it("logs audit entry with action 'denied' when user lacks permission", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockServantSession);
      vi.spyOn(getStaffSessionModule, "getStaffSession").mockResolvedValue(mockServantSession);
      const auditSpy = vi.spyOn(dataAccessModule, "recordAuditLog").mockResolvedValue({} as any);

      const result = await createMassAction(validMassPayload);

      expect(result.success).toBe(false);
      expect(result.message).toBe(CAPABILITY_DENIED_MESSAGE_AR);

      // Verify audit log entry was logged for denial
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "denied",
          entityType: "mass",
          actor: expect.objectContaining({ id: mockServantSession.userId }),
        })
      );
    });
  });

  describe("createParishVideoAction Flow", () => {
    const validVideoPayload = {
      title_ar: "عظة قداس الأحد",
      source_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      sort_order: 1,
      is_public: true,
      is_active: true,
    };

    it("accepts valid URLs, normalizes provider, and creates video", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockAdminSession);
      const mockRepo = {
        createVideo: vi.fn().mockImplementation((input) =>
          Promise.resolve({ id: "vid-new-123", ...input })
        ),
      };
      vi.spyOn(dataAccessModule, "getParishVideoRepository").mockReturnValue(mockRepo as any);
      const auditSpy = vi.spyOn(dataAccessModule, "recordAuditLog").mockResolvedValue({} as any);

      const result = await createParishVideoAction(validVideoPayload);

      expect(result.success).toBe(true);
      expect(result.message).toContain("تمت إضافة الفيديو بنجاح");
      expect(mockRepo.createVideo).toHaveBeenCalledWith(
        expect.objectContaining({
          titleAr: "عظة قداس الأحد",
          provider: "youtube",
          embedUrl: expect.stringContaining("youtube-nocookie.com"),
        }),
        expect.objectContaining({ id: mockAdminSession.userId })
      );
    });

    it("blocks SSRF / untrusted domains with audit denial entry", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockAdminSession);
      const mockRepo = { createVideo: vi.fn() };
      vi.spyOn(dataAccessModule, "getParishVideoRepository").mockReturnValue(mockRepo as any);
      const auditSpy = vi.spyOn(dataAccessModule, "recordAuditLog").mockResolvedValue({} as any);

      const ssrfPayload = {
        ...validVideoPayload,
        source_url: "http://169.254.169.254/latest/meta-data",
      };

      const result = await createParishVideoAction(ssrfPayload);

      expect(result.success).toBe(false);
      expect(result.message).toContain("غير معتمد أمنياً");
      expect(mockRepo.createVideo).not.toHaveBeenCalled();

      // Verify audit denial was logged
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "denied",
          entityType: "video",
          summary: expect.stringContaining("رفض رابط فيديو غير معتمد أمنياً"),
        })
      );
    });

    it("surfaces validation errors on invalid inputs", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockAdminSession);

      const invalidPayload = {
        ...validVideoPayload,
        title_ar: "أ", // Too short (< 3 chars)
        source_url: "not-a-url",
      };

      const result = await createParishVideoAction(invalidPayload);

      expect(result.success).toBe(false);
      expect(result.message).toContain("بيانات الإدخال غير صالحة");
      if (!result.success && result.errors) {
        expect(result.errors.title_ar).toBeDefined();
        expect(result.errors.source_url).toBeDefined();
      }
    });
  });
});
