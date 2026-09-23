import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers({ "x-forwarded-for": "127.0.0.1" })),
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/security/turnstile", () => ({
  verifyTurnstile: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/security/rate-limit", () => ({
  RATE_LIMIT_MESSAGE_AR: "تم تجاوز المعدل",
  checkPublicWriteRateLimit: vi.fn().mockReturnValue({ allowed: true }),
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  TRACKING_LIMIT: 10,
  PUBLIC_FORM_WINDOW_MS: 60000,
}));

const mockAuditLog = vi.fn().mockResolvedValue({});
vi.mock("@church-site/data-access", () => ({
  recordAuditLog: (...args: unknown[]) => mockAuditLog(...args),
  snapshot: (val: unknown) => val,
}));

let mockInsertResult: { error: unknown } = { error: null };
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      insert: vi.fn().mockImplementation(() => Promise.resolve(mockInsertResult)),
    }),
  }),
}));

describe("condolence-actions date collision feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsertResult = { error: null };
  });

  it("returns specific Arabic collision message when uq_condolence_active_date is violated", async () => {
    mockInsertResult = {
      error: {
        code: "23505",
        message: 'duplicate key value violates unique constraint "uq_condolence_active_date"',
      },
    };

    const { submitCondolenceBooking } = await import("../condolence-actions");
    const res = await submitCondolenceBooking({
      deceasedFullName: "المرحوم فلان الفلاني",
      applicantName: "مينا بطرس",
      applicantPhone: "01234567890",
      relationshipToDeceased: "ابن",
      eventDate: "2026-10-15",
      slotTime: "مسائي من 6:00 م إلى 10:00 م",
      hallName: "قاعة العزاء الرئيسية المجهزة",
      specialRequests: "لا يوجد",
      turnstileToken: "valid-token",
    });

    expect(res.success).toBe(false);
    expect(res.message).toBe("هذا الموعد محجوز مسبقاً، يرجى اختيار موعد آخر أو التواصل هاتفياً");
  });
});
