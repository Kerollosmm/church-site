// apps/admin/src/actions/__tests__/admin-mass-actions.test.ts
// Unit tests for mass actions and input validation schema.

import { describe, expect, it, vi, beforeEach } from "vitest";
import { WeeklyMassInputSchema } from "../admin-mass-actions.shared";
import {
  createMassAction,
  updateMassAction,
  toggleMassStatusAction,
  deleteMassAction,
} from "../admin-mass-actions";
import * as requireStaffModule from "../../lib/auth/require-staff";
import { can, CAPABILITY_DENIED_MESSAGE_AR } from "@church-site/domain";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}));

describe("WeeklyMassInputSchema", () => {
  const validPayload = {
    day_of_week: "Sunday",
    altar_id: "altar-uuid-1",
    title_ar: "قداس الأحد الأول",
    start_time: "06:00",
    end_time: "08:30",
    target_group_ar: "عام لجميع الشعب",
    notes_ar: "ملاحظات تجريبية",
    is_active: true,
  };

  it("accepts valid mass input payload", () => {
    const result = WeeklyMassInputSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title_ar).toBe("قداس الأحد الأول");
      expect(result.data.day_of_week).toBe("Sunday");
    }
  });

  it("accepts times with seconds", () => {
    const result = WeeklyMassInputSchema.safeParse({
      ...validPayload,
      start_time: "06:00:00",
      end_time: "08:30:00",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid day_of_week", () => {
    const result = WeeklyMassInputSchema.safeParse({
      ...validPayload,
      day_of_week: "InvalidDay",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title shorter than 3 characters", () => {
    const result = WeeklyMassInputSchema.safeParse({
      ...validPayload,
      title_ar: "قد",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("3 أحرف");
    }
  });

  it("rejects title longer than 150 characters", () => {
    const result = WeeklyMassInputSchema.safeParse({
      ...validPayload,
      title_ar: "أ".repeat(151),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid time formats", () => {
    const invalidTimes = ["25:00", "12:60", "abc", "6:00", "06:0", ""];
    for (const time of invalidTimes) {
      const result = WeeklyMassInputSchema.safeParse({
        ...validPayload,
        start_time: time,
      });
      expect(result.success).toBe(false);
    }
  });

  it("allows optional notes and target group", () => {
    const result = WeeklyMassInputSchema.safeParse({
      day_of_week: "Friday",
      altar_id: "altar-uuid-2",
      title_ar: "قداس الجمعة الصباحي",
      start_time: "07:00",
      end_time: "09:30",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_active).toBe(true); // default
      expect(result.data.target_group_ar).toBeUndefined();
      expect(result.data.notes_ar).toBeUndefined();
    }
  });
});

describe("Admin Mass Server Actions — Security & Capability Gating", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("denies createMassAction when user lacks mass:create capability", async () => {
    vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue({
      userId: "user-servant-1",
      email: "servant@example.com",
      fullNameAr: "شماس خادم",
      role: "servant" as any,
    });

    const result = await createMassAction({
      day_of_week: "Sunday",
      altar_id: "a1",
      title_ar: "قداس الأحد التجريبي",
      start_time: "06:00",
      end_time: "08:30",
      is_active: true,
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe(CAPABILITY_DENIED_MESSAGE_AR);
  });

  it("denies deleteMassAction when editor lacks mass:delete (owner only)", async () => {
    vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue({
      userId: "user-secretary-1",
      email: "secretary@example.com",
      fullNameAr: "سكرتير الكنيسة",
      role: "secretary",
    });

    const result = await deleteMassAction("mass-uuid-1");
    expect(result.success).toBe(false);
    expect(result.message).toBe(CAPABILITY_DENIED_MESSAGE_AR);
  });

  it("allows editor to toggle mass status", async () => {
    vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue({
      userId: "user-secretary-1",
      email: "secretary@example.com",
      fullNameAr: "سكرتير الكنيسة",
      role: "secretary",
    });

    // When DB is offline / in mock/dev mode, gracefully returns success
    const result = await toggleMassStatusAction("mass-uuid-1", false);
    expect(result.success).toBe(true);
  });

  it("allows owner (admin) to delete mass", async () => {
    vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue({
      userId: "user-admin-1",
      email: "admin@example.com",
      fullNameAr: "مسؤول النظام",
      role: "admin",
    });

    const result = await deleteMassAction("mass-uuid-1");
    expect(result.success).toBe(true);
  });

  it("validates input in updateMassAction and rejects invalid times", async () => {
    vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue({
      userId: "user-admin-1",
      email: "admin@example.com",
      fullNameAr: "مسؤول النظام",
      role: "admin",
    });

    const result = await updateMassAction("mass-uuid-1", {
      start_time: "99:99",
    });
    expect(result.success).toBe(false);
    expect(result.message).toContain("غير صالح");
  });
});

describe("Mass Capabilities Matrix", () => {
  it("enforces capability rules: owner can delete, editor cannot delete", () => {
    // Exact requirement check
    expect(can("owner", "mass:delete")).toBe(true);
    expect(can("editor", "mass:delete")).toBe(false);
    expect(can("viewer", "mass:delete")).toBe(false);

    // Create capabilities
    expect(can("owner", "mass:create")).toBe(true);
    expect(can("editor", "mass:create")).toBe(true);
    expect(can("viewer", "mass:create")).toBe(false);

    // Update capabilities
    expect(can("owner", "mass:update")).toBe(true);
    expect(can("editor", "mass:update")).toBe(true);
    expect(can("viewer", "mass:update")).toBe(false);

    // Toggle capabilities
    expect(can("owner", "mass:toggle")).toBe(true);
    expect(can("editor", "mass:toggle")).toBe(true);
    expect(can("viewer", "mass:toggle")).toBe(false);
  });
});
