// packages/data-access/src/notify/resend-mailer.ts
// Real transactional email delivery implementation via Resend API (built-in fetch).
//
// HONEST DELIVERY CONTRACT:
//   - HTTP 2xx: { provider: "resend", delivered: true, recorded: true, note }
//   - HTTP 4xx/5xx or Network Error: { provider: "resend", delivered: false, recorded: true, note }
//   - Single attempt, no automatic retries (never silently re-send or duplicate welcome mail).

import type { Mailer, MailMessage, MailSendResult } from "./mailer";

export const RESEND_API_URL = "https://api.resend.com/emails";

export interface ResendMailerConfig {
  apiKey: string;
  fromEmail: string;
  fetchFn?: typeof fetch;
}

export class ResendMailer implements Mailer {
  readonly provider = "resend";
  readonly deliverEmails = true;

  private readonly apiKey: string;
  private readonly fromEmail: string;
  private readonly fetchFn: typeof fetch;

  constructor(config: ResendMailerConfig) {
    this.apiKey = config.apiKey.trim();
    this.fromEmail = config.fromEmail.trim();
    this.fetchFn = config.fetchFn ?? fetch;
  }

  async send(message: MailMessage): Promise<MailSendResult> {
    const to = message.toName ? `${message.toName} <${message.to}>` : message.to;

    try {
      const response = await this.fetchFn(RESEND_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: [to],
          subject: message.subject,
          text: message.bodyText,
        }),
      });

      if (response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { id?: string };
        const idSuffix = payload?.id ? ` (معرف: ${payload.id})` : "";
        const note = `تم إرسال بريد الترحيب بنجاح عبر Resend إلى ${message.to}${idSuffix}.`;

        console.info("[notify] Resend email accepted for delivery", {
          to: message.to,
          id: payload?.id,
          kind: message.kind,
        });

        return {
          provider: "resend",
          delivered: true,
          recorded: true,
          note,
        };
      }

      const errorBody = await response.text().catch(() => "");
      const note = `فشل إرسال البريد عبر Resend (رمز الاستجابة ${response.status}): ${errorBody || response.statusText}`;

      console.error("[notify] Resend API rejected message", {
        status: response.status,
        statusText: response.statusText,
        error: errorBody,
        to: message.to,
      });

      return {
        provider: "resend",
        delivered: false,
        recorded: true,
        note,
      };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      const note = `فشل الاتصال بخدمة Resend (خطأ شبكة): ${reason}`;

      console.error("[notify] Resend network error during send", {
        reason,
        to: message.to,
      });

      return {
        provider: "resend",
        delivered: false,
        recorded: true,
        note,
      };
    }
  }
}

export const DELIVERY_ACTOR_NAME_AR = "نظام إرسال البريد (Resend)";

/**
 * Records a delivery audit entry for one subscriber after a real mail send attempt.
 *
 * NEVER THROWS BY DESIGN: the subscriber row is already committed, so an audit write
 * failure is logged and returns false rather than crashing the subscription confirmation.
 */
export async function recordDeliveryAuditNote(
  subscriber: { id: string; email: string },
  result: MailSendResult
): Promise<boolean> {
  const { getEventRepository } = await import("../store");
  const actor = { id: null, name: DELIVERY_ACTOR_NAME_AR };

  try {
    await getEventRepository().recordAuditNote(
      {
        action: "notify",
        entityType: "subscriber",
        entityId: subscriber.id,
        summary: `${result.note} — البريد: ${subscriber.email}`,
      },
      actor
    );
    return true;
  } catch (error) {
    console.error("[notify] could not record delivery audit note", {
      subscriberId: subscriber.id,
      reason: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
