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
vi.mock("@church-site/data-access", () => ({
  recordAuditLog: (...args: unknown[]) => mockAuditLog(...args),
  snapshot: (val: unknown) => val,
}));

const mockInsert = vi.fn().mockResolvedValue({ error: null });
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      insert: mockInsert,
    }),
  }),
}));

describe("submitContactMessage Audit Log", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("records an audit_log entry upon successful message submission", async () => {
    const { submitContactMessage } = await import("../contact-actions");
    const res = await submitContactMessage({
      senderName: "يوحنا سامي",
      senderPhone: "01234567890",
      senderEmail: "yohanna@example.com",
      urgency: "normal",
      messageContent: "رسالة استفسار روحية",
      turnstileToken: "token-ok",
    });

    expect(res.success).toBe(true);
    expect(mockAuditLog).toHaveBeenCalledTimes(1);
    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "create",
        entityType: "contact_message",
        summary: expect.stringContaining("يوحنا سامي"),
      })
    );
  });
});
