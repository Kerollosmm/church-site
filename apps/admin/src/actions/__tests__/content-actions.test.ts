// apps/admin/src/actions/__tests__/content-actions.test.ts
// Unit tests for content type and dynamic content entry server actions (capability gating and validation).

import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  createContentTypeAction,
  createContentFieldAction,
  deleteContentTypeAction,
} from "../content-type-actions";
import {
  createContentEntryAction,
  publishContentEntryAction,
  deleteContentEntryAction,
} from "../content-entry-actions";
import * as requireStaffModule from "../../lib/auth/require-staff";
import * as dataAccessModule from "@church-site/data-access";
import { CAPABILITY_DENIED_MESSAGE_AR } from "@church-site/domain";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}));

describe("Content Types and Entries Server Actions", () => {
  const mockAdminSession = {
    userId: "admin-user-1",
    fullNameAr: "المدير الإداري",
    email: "admin@church.org",
    role: "admin" as const,
  };

  const mockSecretarySession = {
    userId: "secretary-user-1",
    fullNameAr: "سكرتير الكنيسة",
    email: "secretary@church.org",
    role: "secretary" as const,
  };

  const mockViewerSession = {
    userId: "viewer-user-1",
    fullNameAr: "خادم مطلع",
    email: "viewer@church.org",
    role: "editor" as const, // maps to viewer role
  };

  const mockRepo = {
    createContentType: vi.fn().mockImplementation((input) =>
      Promise.resolve({ id: "type-1", ...input })
    ),
    getContentTypeById: vi.fn().mockImplementation((id) =>
      Promise.resolve({ id, slug: "news", nameAr: "الأخبار", template: "default", isActive: true })
    ),
    getContentTypeBySlug: vi.fn().mockImplementation((slug) =>
      Promise.resolve({ id: "type-1", slug, nameAr: "الأخبار", template: "default", isActive: true })
    ),
    deleteContentType: vi.fn().mockResolvedValue(undefined),
    createContentField: vi.fn().mockImplementation((input) =>
      Promise.resolve({ id: "field-1", ...input })
    ),
    listContentFields: vi.fn().mockResolvedValue([
      {
        id: "field-1",
        contentTypeId: "type-1",
        slug: "title",
        labelAr: "العنوان",
        fieldType: "text",
        isRequired: true,
        sortOrder: 1,
      },
    ]),
    createContentEntry: vi.fn().mockImplementation((input) =>
      Promise.resolve({ id: "entry-1", ...input, createdAt: "2026-09-17T00:00:00Z" })
    ),
    getContentEntryById: vi.fn().mockImplementation((id) =>
      Promise.resolve({
        id,
        contentTypeId: "type-1",
        slug: "breaking-news",
        status: "draft",
        data: { title: "خبر هام" },
      })
    ),
    setEntryStatus: vi.fn().mockImplementation((id, status) =>
      Promise.resolve({
        id,
        contentTypeId: "type-1",
        slug: "breaking-news",
        status,
        publishedAt: status === "published" ? "2026-09-17T00:00:00Z" : null,
      })
    ),
    deleteContentEntry: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(dataAccessModule, "getContentTypeRepository").mockReturnValue(mockRepo as any);
  });

  describe("createContentTypeAction", () => {
    it("rejects when role lacks content:manage capability (secretary)", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockSecretarySession);

      const result = await createContentTypeAction({
        slug: "announcements",
        nameAr: "تنويهات هامة",
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(CAPABILITY_DENIED_MESSAGE_AR);
      expect(mockRepo.createContentType).not.toHaveBeenCalled();
    });

    it("succeeds when role has content:manage capability (admin)", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockAdminSession);

      const result = await createContentTypeAction({
        slug: "announcements",
        nameAr: "تنويهات هامة",
      });

      expect(result.success).toBe(true);
      expect(mockRepo.createContentType).toHaveBeenCalled();
    });
  });

  describe("createContentFieldAction", () => {
    it("rejects when role lacks content:manage capability", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockSecretarySession);

      const result = await createContentFieldAction("type-1", {
        slug: "details",
        labelAr: "التفاصيل",
        fieldType: "richtext",
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(CAPABILITY_DENIED_MESSAGE_AR);
    });

    it("succeeds when role is admin", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockAdminSession);

      const result = await createContentFieldAction("type-1", {
        slug: "details",
        labelAr: "التفاصيل",
        fieldType: "richtext",
      });

      expect(result.success).toBe(true);
      expect(mockRepo.createContentField).toHaveBeenCalled();
    });
  });

  describe("createContentEntryAction", () => {
    it("rejects when schema validation fails (missing required field)", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockSecretarySession);

      const result = await createContentEntryAction("news", {
        slug: "empty-title",
        status: "draft",
        data: { title: "" },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toBeDefined();
      }
      expect(mockRepo.createContentEntry).not.toHaveBeenCalled();
    });

    it("creates draft entry when role has content:create", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockSecretarySession);

      const result = await createContentEntryAction("news", {
        slug: "good-news",
        status: "draft",
        data: { title: "بشارة مفرحة" },
      });

      expect(result.success).toBe(true);
      expect(mockRepo.createContentEntry).toHaveBeenCalled();
    });
  });

  describe("publishContentEntryAction", () => {
    it("allows publishing by secretary (has content:publish)", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockSecretarySession);

      const result = await publishContentEntryAction("entry-1");
      expect(result.success).toBe(true);
      expect(mockRepo.setEntryStatus).toHaveBeenCalledWith("entry-1", "published", expect.any(Object));
    });
  });

  describe("deleteContentEntryAction", () => {
    it("rejects deletion by secretary (lacks content:delete)", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockSecretarySession);

      const result = await deleteContentEntryAction("entry-1");
      expect(result.success).toBe(false);
      expect(result.message).toBe(CAPABILITY_DENIED_MESSAGE_AR);
      expect(mockRepo.deleteContentEntry).not.toHaveBeenCalled();
    });

    it("allows deletion by admin (has content:delete)", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockAdminSession);

      const result = await deleteContentEntryAction("entry-1");
      expect(result.success).toBe(true);
      expect(mockRepo.deleteContentEntry).toHaveBeenCalledWith("entry-1", expect.any(Object));
    });
  });
});
