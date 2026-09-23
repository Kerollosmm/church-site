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

const mockRpc = vi.fn().mockResolvedValue({ data: null, error: { message: "RPC not available" } });
const mockSingle = vi.fn().mockResolvedValue({ data: { id: "test-uuid-msg-123" }, error: null });
const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: () => ({
      insert: (...args: unknown[]) => mockInsert(...args),
    }),
  }),
}));

describe("submitContactMessage Contact Action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRpc.mockResolvedValue({ data: null, error: { message: "RPC not available" } });
    mockSingle.mockResolvedValue({ data: { id: "test-uuid-msg-123" }, error: null });
  });

  const validPayload = {
    senderName: "يوحنا سامي",
    senderPhone: "01234567890",
    senderEmail: "yohanna@example.com",
    urgency: "normal" as const,
    messageContent: "رسالة استفسار روحية",
    turnstileToken: "token-ok",
  };

  it("successful message + successful audit (entityId matches returned message ID)", async () => {
    const { submitContactMessage } = await import("../contact-actions");
    mockSingle.mockResolvedValueOnce({ data: { id: "returned-uuid-777" }, error: null });

    const res = await submitContactMessage(validPayload);

    expect(res.success).toBe(true);
    expect(mockAuditLog).toHaveBeenCalledTimes(1);
    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "create",
        entityType: "contact_message",
        entityId: "returned-uuid-777",
        summary: expect.stringContaining("يوحنا سامي"),
      })
    );
  });

  it("message insert failure returns success: false", async () => {
    const { submitContactMessage } = await import("../contact-actions");
    mockSingle.mockResolvedValueOnce({ data: null, error: new Error("DB connection failure") });

    const res = await submitContactMessage(validPayload);

    expect(res.success).toBe(false);
    expect(mockAuditLog).not.toHaveBeenCalled();
    expect(res.message).toContain("تعذر إرسال الرسالة");
  });

  it("audit failure after message insert still returns success: true", async () => {
    const { submitContactMessage } = await import("../contact-actions");
    mockSingle.mockResolvedValueOnce({ data: { id: "returned-uuid-888" }, error: null });
    mockAuditLog.mockRejectedValueOnce(new Error("Audit log storage failure"));

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await submitContactMessage(validPayload);

    expect(res.success).toBe(true);
    expect(mockAuditLog).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Audit log recording failed"),
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it("succeeds when atomic RPC succeeds without falling back to insert", async () => {
    const { submitContactMessage } = await import("../contact-actions");
    mockRpc.mockResolvedValueOnce({ data: "atomic-rpc-uuid-999", error: null });

    const res = await submitContactMessage(validPayload);

    expect(res.success).toBe(true);
    expect(mockInsert).not.toHaveBeenCalled();
    // Audit log was already written atomically inside the DB function
    expect(mockAuditLog).not.toHaveBeenCalled();
  });
});
