import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers({ "x-forwarded-for": "127.0.0.1" })),
}));

vi.mock("@church-site/ui/server", () => ({
  getLocale: vi.fn().mockResolvedValue("ar"),
}));

vi.mock("@/lib/security/turnstile", () => ({
  verifyTurnstile: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/security/rate-limit", () => ({
  RATE_LIMIT_MESSAGE_AR: "تم تجاوز المعدل",
  checkPublicWriteRateLimit: vi.fn().mockReturnValue({ allowed: true }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

const mockSubscribe = vi.fn().mockResolvedValue({
  subscriber: { id: "sub-1", email: "visitor@example.com" },
  created: true,
});
const mockListTerms = vi.fn().mockResolvedValue([]);
const mockNotify = vi.fn().mockResolvedValue({ result: { delivered: false } });

vi.mock("@church-site/data-access", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@church-site/data-access")>();
  return {
    ...actual,
    isEventSubscriptionsEnabled: vi.fn().mockReturnValue(true),
    getEventRepository: () => ({
      subscribe: (...args: unknown[]) => mockSubscribe(...args),
      listTerms: (...args: unknown[]) => mockListTerms(...args),
    }),
    notifyNewSubscription: (...args: unknown[]) => mockNotify(...args),
  };
});

describe("subscribeToEventsAction preliminary ordering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates input before verifying Turnstile or consuming rate limit", async () => {
    const { subscribeToEventsAction } = await import("../subscription-actions");
    const { verifyTurnstile } = await import("@/lib/security/turnstile");
    const { checkPublicWriteRateLimit } = await import("@/lib/security/rate-limit");

    const invalidPayload = {
      email: "not-an-email",
      topics: [],
      turnstileToken: "bad-token",
    };

    const res = await subscribeToEventsAction(invalidPayload);

    expect(res.success).toBe(false);
    expect(res.code).toBe("invalid");
    expect(verifyTurnstile).not.toHaveBeenCalled();
    expect(checkPublicWriteRateLimit).not.toHaveBeenCalled();
  });

  it("verifies Turnstile before checking rate limit", async () => {
    const { subscribeToEventsAction } = await import("../subscription-actions");
    const { verifyTurnstile } = await import("@/lib/security/turnstile");
    const { checkPublicWriteRateLimit } = await import("@/lib/security/rate-limit");

    vi.mocked(verifyTurnstile).mockResolvedValueOnce(false);

    const validPayload = {
      email: "valid@example.com",
      topics: [],
      turnstileToken: "invalid-turnstile",
    };

    const res = await subscribeToEventsAction(validPayload);

    expect(res.success).toBe(false);
    expect(res.code).toBe("verification-failed");
    expect(verifyTurnstile).toHaveBeenCalled();
    expect(checkPublicWriteRateLimit).not.toHaveBeenCalled();
  });

  it("checks rate limit after successful validation and Turnstile verification", async () => {
    const { subscribeToEventsAction } = await import("../subscription-actions");
    const { verifyTurnstile } = await import("@/lib/security/turnstile");
    const { checkPublicWriteRateLimit } = await import("@/lib/security/rate-limit");

    vi.mocked(verifyTurnstile).mockResolvedValueOnce(true);
    vi.mocked(checkPublicWriteRateLimit).mockReturnValueOnce({ allowed: false, retryAfterMs: 60_000 });

    const validPayload = {
      email: "valid@example.com",
      topics: [],
      turnstileToken: "valid-turnstile",
    };

    const res = await subscribeToEventsAction(validPayload);

    expect(res.success).toBe(false);
    expect(res.code).toBe("rate-limited");
    expect(verifyTurnstile).toHaveBeenCalled();
    expect(checkPublicWriteRateLimit).toHaveBeenCalledWith("subscribe", "127.0.0.1");
  });
});
