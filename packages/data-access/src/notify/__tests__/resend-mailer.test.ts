// packages/data-access/src/notify/__tests__/resend-mailer.test.ts
// Unit tests for ResendMailer implementation and mailer factory resolution (Phase 5 - Step A).

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ResendMailer, RESEND_API_URL } from "../resend-mailer";
import {
  getMailer,
  MAIL_PROVIDER_ENV_VAR,
  RESEND_API_KEY_ENV_VAR,
  RESEND_FROM_EMAIL_ENV_VAR,
  type MailMessage,
} from "../mailer";
import { noopMailer } from "../noop-mailer";
import { buildSubscriptionWelcomeMessage } from "../index";

describe("ResendMailer (built-in fetch implementation)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env[MAIL_PROVIDER_ENV_VAR];
    delete process.env[RESEND_API_KEY_ENV_VAR];
    delete process.env[RESEND_FROM_EMAIL_ENV_VAR];
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  const sampleMessage: MailMessage = {
    to: "subscriber@example.com",
    toName: "مارك ميخائيل",
    locale: "ar",
    kind: "subscription-welcome",
    subject: "تسجيل الاشتراك في تنبيهات فعاليات الكنيسة",
    bodyText: "أهلاً بك، تم تسجيل بريدك في قائمة التنبيهات.",
  };

  it("exposes provider 'resend' and deliverEmails true", () => {
    const mailer = new ResendMailer({ apiKey: "re_test_123", fromEmail: "church@example.com" });
    expect(mailer.provider).toBe("resend");
    expect(mailer.deliverEmails).toBe(true);
  });

  it("sends POST request to Resend API endpoint with Bearer auth and payload", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: "msg_resend_999" }),
    });

    const mailer = new ResendMailer({
      apiKey: "re_sec_key_456",
      fromEmail: "notifications@church.org",
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const result = await mailer.send(sampleMessage);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe(RESEND_API_URL);
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({
      Authorization: "Bearer re_sec_key_456",
      "Content-Type": "application/json",
    });

    const parsedBody = JSON.parse(options.body as string);
    expect(parsedBody).toEqual({
      from: "notifications@church.org",
      to: ["مارك ميخائيل <subscriber@example.com>"],
      subject: sampleMessage.subject,
      text: sampleMessage.bodyText,
    });

    expect(result).toEqual({
      provider: "resend",
      delivered: true,
      recorded: true,
      note: "تم إرسال بريد الترحيب بنجاح عبر Resend إلى subscriber@example.com (معرف: msg_resend_999).",
    });
  });

  it("formats recipient address correctly when toName is absent or null", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: "msg_no_name" }),
    });

    const mailer = new ResendMailer({
      apiKey: "re_test_key",
      fromEmail: "church@example.com",
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    await mailer.send({
      ...sampleMessage,
      toName: undefined,
    });

    const [, options] = mockFetch.mock.calls[0];
    const parsedBody = JSON.parse(options.body as string);
    expect(parsedBody.to).toEqual(["subscriber@example.com"]);
  });

  it("handles HTTP 4xx API rejection honestly with delivered: false", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      statusText: "Unprocessable Entity",
      text: async () => '{"statusCode":422,"message":"Domain not verified"}',
    });

    const mailer = new ResendMailer({
      apiKey: "re_unverified",
      fromEmail: "unverified@unregistered-domain.com",
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const result = await mailer.send(sampleMessage);

    expect(result.provider).toBe("resend");
    expect(result.delivered).toBe(false);
    expect(result.recorded).toBe(true);
    expect(result.note).toContain("رمز الاستجابة 422");
    expect(result.note).toContain("Domain not verified");
  });

  it("handles HTTP 5xx API error honestly with delivered: false", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => "Internal server error occurred",
    });

    const mailer = new ResendMailer({
      apiKey: "re_error",
      fromEmail: "church@example.com",
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const result = await mailer.send(sampleMessage);

    expect(result.provider).toBe("resend");
    expect(result.delivered).toBe(false);
    expect(result.recorded).toBe(true);
    expect(result.note).toContain("رمز الاستجابة 500");
  });

  it("handles network failure / fetch rejection gracefully without throwing", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Connection refused (ECONNREFUSED)"));

    const mailer = new ResendMailer({
      apiKey: "re_net_fail",
      fromEmail: "church@example.com",
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const result = await mailer.send(sampleMessage);

    expect(result.provider).toBe("resend");
    expect(result.delivered).toBe(false);
    expect(result.recorded).toBe(true);
    expect(result.note).toContain("خطأ شبكة");
    expect(result.note).toContain("ECONNREFUSED");
  });

  it("performs a single attempt without automatic retries", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      text: async () => "Temporarily overloaded",
    });

    const mailer = new ResendMailer({
      apiKey: "re_single_try",
      fromEmail: "church@example.com",
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    await mailer.send(sampleMessage);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe("Mailer Factory (getMailer)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env[MAIL_PROVIDER_ENV_VAR];
    delete process.env[RESEND_API_KEY_ENV_VAR];
    delete process.env[RESEND_FROM_EMAIL_ENV_VAR];
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("resolves noopMailer when MAIL_PROVIDER is absent or empty", async () => {
    const mailer = await getMailer();
    expect(mailer.provider).toBe("noop");
    expect(mailer.deliverEmails).toBe(false);
  });

  it("resolves noopMailer when MAIL_PROVIDER is explicitly 'noop'", async () => {
    process.env[MAIL_PROVIDER_ENV_VAR] = "noop";
    const mailer = await getMailer();
    expect(mailer.provider).toBe("noop");
    expect(mailer.deliverEmails).toBe(false);
  });

  it("resolves ResendMailer when MAIL_PROVIDER=resend and credentials are present", async () => {
    process.env[MAIL_PROVIDER_ENV_VAR] = "resend";
    process.env[RESEND_API_KEY_ENV_VAR] = "re_valid_test_key";
    process.env[RESEND_FROM_EMAIL_ENV_VAR] = "events@church.org";

    const mailer = await getMailer();
    expect(mailer.provider).toBe("resend");
    expect(mailer.deliverEmails).toBe(true);
    expect(mailer instanceof ResendMailer).toBe(true);
  });

  it("falls back to noop and logs loudly when MAIL_PROVIDER=resend but RESEND_API_KEY is missing", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    process.env[MAIL_PROVIDER_ENV_VAR] = "resend";
    delete process.env[RESEND_API_KEY_ENV_VAR];
    process.env[RESEND_FROM_EMAIL_ENV_VAR] = "events@church.org";

    const mailer = await getMailer();
    expect(mailer.provider).toBe("noop");
    expect(mailer.deliverEmails).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();
    const logCall = consoleErrorSpy.mock.calls[0][0];
    expect(logCall).toContain("RESEND_API_KEY is missing or empty");
  });

  it("falls back to noop and logs loudly when MAIL_PROVIDER=resend but RESEND_FROM_EMAIL is missing", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    process.env[MAIL_PROVIDER_ENV_VAR] = "resend";
    process.env[RESEND_API_KEY_ENV_VAR] = "re_valid_test_key";
    delete process.env[RESEND_FROM_EMAIL_ENV_VAR];

    const mailer = await getMailer();
    expect(mailer.provider).toBe("noop");
    expect(mailer.deliverEmails).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();
    const logCall = consoleErrorSpy.mock.calls[0][0];
    expect(logCall).toContain("RESEND_FROM_EMAIL is missing or empty");
  });

  it("falls back to noop and logs loudly for unknown provider names", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    process.env[MAIL_PROVIDER_ENV_VAR] = "sendgrid";

    const mailer = await getMailer();
    expect(mailer.provider).toBe("noop");
    expect(mailer.deliverEmails).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();
    const logCall = consoleErrorSpy.mock.calls[0][0];
    expect(logCall).toContain("MAIL_PROVIDER names no implemented mailer");
  });
});

describe("buildSubscriptionWelcomeMessage", () => {
  it("generates honest un-sent notice when deliverEmails is false", () => {
    const msgAr = buildSubscriptionWelcomeMessage(
      { email: "user@example.com", name: "مينا", locale: "ar" },
      false
    );
    expect(msgAr.bodyText).toContain("إرسال البريد الإلكتروني غير مفعّل على هذا الموقع");

    const msgEn = buildSubscriptionWelcomeMessage(
      { email: "user@example.com", name: "Mina", locale: "en" },
      false
    );
    expect(msgEn.bodyText).toContain("e-mail delivery is not enabled on this site yet");
  });

  it("generates delivery confirmation message when deliverEmails is true", () => {
    const msgAr = buildSubscriptionWelcomeMessage(
      { email: "user@example.com", name: "مينا", locale: "ar" },
      true
    );
    expect(msgAr.bodyText).toContain("تم تسجيل بريدك في قائمة تنبيهات فعاليات الكنيسة بنجاح");
    expect(msgAr.bodyText).not.toContain("غير مفعّل");

    const msgEn = buildSubscriptionWelcomeMessage(
      { email: "user@example.com", name: "Mina", locale: "en" },
      true
    );
    expect(msgEn.bodyText).toContain("Your address has been added to the parish events notification list");
    expect(msgEn.bodyText).not.toContain("not enabled");
  });
});
