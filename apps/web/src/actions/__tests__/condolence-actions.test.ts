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

let mockRpcData: unknown[] | null = null;
let mockRpcError: unknown = null;
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => ({
    rpc: vi.fn().mockImplementation((fn: string, args: { p_ref: string }) => {
      if (fn === "track_condolence_booking") {
        const ref = args.p_ref;
        if (!ref || ref.trim().length === 0 || ref.trim().length > 20 || !/^[A-Za-z0-9_-]+$/.test(ref.trim())) {
          return Promise.resolve({ data: [], error: null });
        }
        return Promise.resolve({ data: mockRpcData, error: mockRpcError });
      }
      return Promise.resolve({ data: null, error: null });
    }),
  }),
}));

describe("condolence-actions date collision feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsertResult = { error: null };
    mockRpcData = null;
    mockRpcError = null;
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

describe("condolence-actions trackBooking bounds and PII protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRpcData = null;
    mockRpcError = null;
  });

  it("rejects blank or whitespace-only reference", async () => {
    const { trackBooking } = await import("../condolence-actions");
    const res = await trackBooking("   ");
    expect(res.success).toBe(false);
    expect(res.message).toBe("يرجى إدخال رمز الحجز المرجعي");
  });

  it("rejects malformed reference with special characters", async () => {
    const { trackBooking } = await import("../condolence-actions");
    const res = await trackBooking("COND-123; DROP TABLE;");
    expect(res.success).toBe(false);
    expect(res.message).toContain("لم يتم العثور على حجز بهذا الرمز");
  });

  it("rejects overlong reference exceeding 20 characters", async () => {
    const { trackBooking } = await import("../condolence-actions");
    const res = await trackBooking("COND-12345678901234567890");
    expect(res.success).toBe(false);
    expect(res.message).toContain("لم يتم العثور على حجز بهذا الرمز");
  });

  it("handles nonexistent reference when database returns empty set", async () => {
    mockRpcData = [];
    const { trackBooking } = await import("../condolence-actions");
    const res = await trackBooking("COND-NOTFOUND");
    expect(res.success).toBe(false);
    expect(res.message).toContain("لم يتم العثور على حجز بهذا الرمز");
  });

  it("returns anonymous booking data for valid reference with zero PII", async () => {
    mockRpcData = [
      {
        booking_reference_code: "COND-AB12CD",
        event_date: "2026-10-20",
        slot_time: "مسائي من 6:00 م إلى 10:00 م",
        hall_name: "قاعة العزاء الرئيسية المجهزة",
        status: "approved",
        rejection_reason: null,
      },
    ];

    const { trackBooking } = await import("../condolence-actions");
    const res = await trackBooking("cond-ab12cd");
    expect(res.success).toBe(true);
    if (!res.success) throw new Error("Expected success");

    expect(res.booking).toBeDefined();
    expect(res.booking.booking_reference_code).toBe("COND-AB12CD");
    expect(res.booking.event_date).toBe("2026-10-20");
    expect(res.booking.status).toBe("approved");

    // Strictly verify no PII fields are exposed in the returned booking payload
    const bookingKeys = Object.keys(res.booking);
    expect(bookingKeys).not.toContain("applicant_name");
    expect(bookingKeys).not.toContain("applicant_phone");
    expect(bookingKeys).not.toContain("applicant_national_id");
    expect(bookingKeys).not.toContain("special_requests");
    expect(bookingKeys).not.toContain("admin_response_notes");
    expect(bookingKeys).not.toContain("deceased_full_name");
  });
});
