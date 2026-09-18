// apps/admin/src/actions/__tests__/admin-facility-actions.test.ts
// Unit tests for Parish Facility server actions: RBAC capability gating and repo delegation.

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteServiceAction,
  toggleServiceActiveAction,
  upsertServiceAction,
} from "../admin-facility-actions";
import * as requireStaffModule from "../../lib/auth/require-staff";
import * as dataAccessModule from "@church-site/data-access";
import { CAPABILITY_DENIED_MESSAGE_AR } from "@church-site/domain";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}));

describe("Parish Facility Server Actions", () => {
  const mockAdminSession = {
    userId: "admin-user-1",
    fullNameAr: "المدير الإداري",
    email: "admin@church.org",
    role: "admin" as const, // admin has services:read, services:write, services:delete
  };

  const mockEditorSession = {
    userId: "editor-user-1",
    fullNameAr: "محرر الخدمات",
    email: "editor@church.org",
    role: "secretary" as const, // secretary has services:read, services:write, but NOT services:delete
  };

  const mockViewerSession = {
    userId: "viewer-user-1",
    fullNameAr: "خادم مطلع",
    email: "viewer@church.org",
    role: "servant" as const, // servant has services:read only
  };

  const mockRepo = {
    createFacility: vi.fn().mockImplementation((input) =>
      Promise.resolve({ id: "facility-123", ...input })
    ),
    updateFacility: vi.fn().mockImplementation((id, input) =>
      Promise.resolve({ id, ...input })
    ),
    deleteFacility: vi.fn().mockResolvedValue(undefined),
    getFacilityById: vi.fn().mockImplementation((id) =>
      Promise.resolve({ id, nameAr: "خدمة تجريبية", isActive: true })
    ),
    toggleActive: vi.fn().mockImplementation((id, isActive) =>
      Promise.resolve({ id, isActive, nameAr: "خدمة تجريبية" })
    ),
    listFacilities: vi.fn().mockResolvedValue([]),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(dataAccessModule, "getParishFacilityRepository").mockReturnValue(mockRepo as any);
  });

  describe("upsertServiceAction", () => {
    it("denies action when user lacks services:write capability", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockViewerSession as any);

      const result = await upsertServiceAction({
        name_ar: "خدمة غير مسموحة",
        slug: "unauthorized-service",
        service_type: "عام",
        description_ar: "وصف الخدمة غير المصرح بها هنا بالتفصيل",
        working_hours_ar: "9-5",
        location_ar: "الكنيسة",
        display_order: 0,
        is_active: true,
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(CAPABILITY_DENIED_MESSAGE_AR);
      expect(mockRepo.createFacility).not.toHaveBeenCalled();
    });

    it("creates a new facility successfully with editor session", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockEditorSession as any);

      const result = await upsertServiceAction({
        name_ar: "المركز الطبي الخيري",
        name_en: "Charity Medical Center",
        slug: "charity-clinic",
        service_type: "رعاية صحية",
        description_ar: "خدمات كشف وعلاج مجاني أو رمزي لجميع الأهالي بالمنطقة.",
        working_hours_ar: "يومياً من 9 ص حتى 9 م",
        location_ar: "مبنى الخدمات - الدور الثاني",
        contact_phone: "03-5551234",
        display_order: 5,
        is_active: true,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("تمت إضافة");
      expect(mockRepo.createFacility).toHaveBeenCalled();
    });

    it("rejects invalid input with validation errors", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockEditorSession as any);

      const result = await upsertServiceAction({
        name_ar: "أ", // too short (<3)
        slug: "INVALID SLUG", // invalid characters
        service_type: "",
        description_ar: "قصير",
        working_hours_ar: "",
        location_ar: "",
        display_order: 0,
        is_active: true,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("غير صالحة");
    });
  });

  describe("deleteServiceAction", () => {
    it("denies delete when user is editor (owner-only capability)", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockEditorSession as any);

      const result = await deleteServiceAction("facility-123");
      expect(result.success).toBe(false);
      expect(result.message).toBe(CAPABILITY_DENIED_MESSAGE_AR);
      expect(mockRepo.deleteFacility).not.toHaveBeenCalled();
    });

    it("allows delete when user is admin (owner role)", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockAdminSession as any);

      const result = await deleteServiceAction("facility-123");
      expect(result.success).toBe(true);
      expect(mockRepo.deleteFacility).toHaveBeenCalledWith(
        "facility-123",
        expect.objectContaining({ id: "admin-user-1" })
      );
    });
  });

  describe("toggleServiceActiveAction", () => {
    it("toggles active state for editors", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockEditorSession as any);

      const result = await toggleServiceActiveAction("facility-123", false);
      expect(result.success).toBe(true);
      expect(mockRepo.toggleActive).toHaveBeenCalledWith(
        "facility-123",
        false,
        expect.objectContaining({ id: "editor-user-1" })
      );
    });
  });
});
