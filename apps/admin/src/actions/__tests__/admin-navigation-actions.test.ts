// apps/admin/src/actions/__tests__/admin-navigation-actions.test.ts
// Unit tests for Parish Navigation server actions: RBAC capability gating and repo delegation.

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteNavItemAction,
  reorderNavItemsAction,
  toggleNavItemAction,
  upsertNavItemAction,
} from "../admin-navigation-actions";
import * as requireStaffModule from "../../lib/auth/require-staff";
import * as dataAccessModule from "@church-site/data-access";
import { CAPABILITY_DENIED_MESSAGE_AR } from "@church-site/domain";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}));

describe("Parish Navigation Server Actions", () => {
  const mockEditorSession = {
    userId: "editor-user-1",
    fullNameAr: "محرر الموقع",
    email: "editor@church.org",
    role: "secretary" as const, // secretary has navigation:write
  };

  const mockViewerSession = {
    userId: "viewer-user-1",
    fullNameAr: "خادم مطلع",
    email: "viewer@church.org",
    role: "servant" as const, // servant has navigation:read only, NO navigation:write
  };

  const mockRepo = {
    createItem: vi.fn().mockImplementation((input) =>
      Promise.resolve({ id: "nav-123", ...input })
    ),
    updateItem: vi.fn().mockImplementation((id, input) =>
      Promise.resolve({ id, ...input })
    ),
    deleteItem: vi.fn().mockResolvedValue(undefined),
    reorderItems: vi.fn().mockImplementation((input) =>
      Promise.resolve(input.items.map((i: any) => ({ id: i.id, sortOrder: i.sortOrder })))
    ),
    toggleActive: vi.fn().mockImplementation((id, isActive) =>
      Promise.resolve({ id, isActive, labelAr: "عنصر تجريبي" })
    ),
    getItemById: vi.fn().mockImplementation((id) =>
      Promise.resolve({ id, labelAr: "عنصر تجريبي", isActive: true })
    ),
    listItems: vi.fn().mockResolvedValue([]),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(dataAccessModule, "getParishNavigationRepository").mockReturnValue(mockRepo as any);
  });

  describe("upsertNavItemAction", () => {
    it("denies action when user lacks navigation:write capability", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockViewerSession as any);

      const result = await upsertNavItemAction({
        key: "test-link",
        label_ar: "رابط اختبار",
        href: "/test",
        section: "main",
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(CAPABILITY_DENIED_MESSAGE_AR);
      expect(mockRepo.createItem).not.toHaveBeenCalled();
    });

    it("creates item when user has navigation:write capability", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockEditorSession as any);

      const result = await upsertNavItemAction({
        key: "live-stream",
        label_ar: "البث المباشر",
        label_en: "Live Stream",
        href: "/live",
        section: "main",
        sort_order: 3,
        is_active: true,
        is_public: true,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("تمت إضافة");
      expect(mockRepo.createItem).toHaveBeenCalled();
    });

    it("rejects invalid key with format errors", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockEditorSession as any);

      const result = await upsertNavItemAction({
        key: "INVALID KEY WITH SPACES",
        label_ar: "رابط",
        href: "/test",
        section: "main",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("غير صالحة");
    });
  });

  describe("reorderNavItemsAction", () => {
    it("reorders items successfully", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockEditorSession as any);

      const result = await reorderNavItemsAction({
        items: [
          { id: "nav-1", sort_order: 2 },
          { id: "nav-2", sort_order: 1 },
        ],
      });

      expect(result.success).toBe(true);
      expect(mockRepo.reorderItems).toHaveBeenCalled();
    });
  });

  describe("deleteNavItemAction", () => {
    it("deletes item when authorized", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockEditorSession as any);

      const result = await deleteNavItemAction("nav-1");
      expect(result.success).toBe(true);
      expect(mockRepo.deleteItem).toHaveBeenCalledWith("nav-1", expect.any(Object));
    });
  });

  describe("toggleNavItemAction", () => {
    it("toggles active state", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockEditorSession as any);

      const result = await toggleNavItemAction("nav-1", false);
      expect(result.success).toBe(true);
      expect(mockRepo.toggleActive).toHaveBeenCalledWith("nav-1", false, expect.any(Object));
    });
  });
});
