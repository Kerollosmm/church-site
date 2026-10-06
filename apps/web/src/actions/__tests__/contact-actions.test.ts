import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers({ "x-forwarded-for": "127.0.0.1" })),
}));

vi.mock("@/lib/security/turnstile", () => ({
  verifyTurnstile: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/security/rate-limit", () => ({
  RATE_LIMIT_MESSAGE_AR: "تم تجاوز المعدل",
  checkPublicWriteRateLimit: vi.fn().mockReturnValue({ allowed: true }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

const mockAuditLog = vi.fn().mockResolvedValue({});
const mockRpc = vi.fn().mockResolvedValue({ data: "atomic-rpc-uuid-123", error: null });
const mockInsert = vi.fn();
const mockHasSupabaseAdminEnv = vi.fn().mockReturnValue(true);

vi.mock("@church-site/data-access", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@church-site/data-access")>();
  return {
    ...actual,
    recordAuditLog: (...args: unknown[]) => mockAuditLog(...args),
    snapshot: (val: unknown) => val,
    hasSupabaseAdminEnv: () => mockHasSupabaseAdminEnv(),
    createAdminClient: () => ({
      rpc: (...args: unknown[]) => mockRpc(...args),
      from: () => ({
        insert: (...args: unknown[]) => mockInsert(...args),
      }),
    }),
  };
});

describe("submitContactMessage Contact Action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasSupabaseAdminEnv.mockReturnValue(true);
    mockRpc.mockResolvedValue({ data: "atomic-rpc-uuid-123", error: null });
  });

  const validPayload = {
    senderName: "يوحنا سامي",
    senderPhone: "01234567890",
    senderEmail: "yohanna@example.com",
    urgency: "normal" as const,
    messageContent: "رسالة استفسار روحية",
    turnstileToken: "token-ok",
  };

  it("succeeds when atomic RPC succeeds without falling back to insert", async () => {
    const { submitContactMessage } = await import("../contact-actions");
    mockRpc.mockResolvedValueOnce({ data: "atomic-rpc-uuid-999", error: null });

    const res = await submitContactMessage(validPayload);

    expect(res.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith("submit_contact_message_atomic", expect.objectContaining({
      p_sender_name: "يوحنا سامي",
      p_sender_phone: "01234567890",
      p_message_content: "رسالة استفسار روحية",
    }));
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockAuditLog).not.toHaveBeenCalled();
  });

  it("fails closed when atomic RPC returns an error and never falls back to direct insert", async () => {
    const { submitContactMessage } = await import("../contact-actions");
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: "RPC failed" } });

    const res = await submitContactMessage(validPayload);

    expect(res.success).toBe(false);
    expect(mockInsert).not.toHaveBeenCalled();
    expect(res.message).toContain("تعذر إرسال الرسالة");
  });

  it("fails closed when atomic RPC returns no data/id", async () => {
    const { submitContactMessage } = await import("../contact-actions");
    mockRpc.mockResolvedValueOnce({ data: null, error: null });

    const res = await submitContactMessage(validPayload);

    expect(res.success).toBe(false);
    expect(mockInsert).not.toHaveBeenCalled();
    expect(res.message).toContain("تعذر إرسال الرسالة");
  });

  it("fails closed when Supabase admin environment credentials are missing", async () => {
    const { submitContactMessage } = await import("../contact-actions");
    mockHasSupabaseAdminEnv.mockReturnValue(false);

    const res = await submitContactMessage(validPayload);

    expect(res.success).toBe(false);
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
    expect(res.message).toContain("خدمة الرسائل الإلكترونية غير مفعّلة");
  });

  it("fails closed in production when Supabase admin credentials are missing", async () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      const { submitContactMessage } = await import("../contact-actions");
      mockHasSupabaseAdminEnv.mockReturnValue(false);

      const res = await submitContactMessage(validPayload);

      expect(res.success).toBe(false);
      expect(mockRpc).not.toHaveBeenCalled();
      expect(res.message).toContain("خدمة الرسائل الإلكترونية غير مفعّلة");
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
    }
  });

  it("validates input before verifying Turnstile or consuming rate limit", async () => {
    const { submitContactMessage } = await import("../contact-actions");
    const { verifyTurnstile } = await import("@/lib/security/turnstile");
    const { checkPublicWriteRateLimit } = await import("@/lib/security/rate-limit");

    const invalidPayload = {
      senderName: "",
      senderPhone: "invalid",
      messageContent: "",
      turnstileToken: "token-bad",
    };

    const res = await submitContactMessage(invalidPayload);

    expect(res.success).toBe(false);
    expect(res.message).toContain("بيانات الرسالة غير مكتملة");
    expect(verifyTurnstile).not.toHaveBeenCalled();
    expect(checkPublicWriteRateLimit).not.toHaveBeenCalled();
  });
});
