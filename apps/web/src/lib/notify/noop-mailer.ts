// src/lib/notify/noop-mailer.ts
// The ONLY mail implementation this deployment has — and it does NOT send mail.
//
// WHAT IT DOES INSTEAD: it records the message it would have sent as an `audit_log` entry of action
// `notify` on the subscriber it belongs to, and logs the same thing to the server console. That makes
// the intent VISIBLE and AUDITABLE without ever implying a delivery: the entry's Arabic label is
// «إشعار بريدي (لم يُرسل)» and the summary names the reason.
//
// WHY THE AUDIT LOG: it is the one store this project already writes without a mail provider — the
// notification outcome and the mutation that caused it end up side by side, which is exactly what a
// future operator needs to see ("everything subscribed, nothing sent").
//
// The audit write is BEST EFFORT (the repository's `recordAuditNote` is): a store that cannot be
// written must not turn a successful subscription into an error the visitor has to handle.

import { getEventRepository } from "@/lib/store";
import type { Actor, SubscriberRecord } from "@/lib/domain/types";
import type { Mailer, MailMessage, MailSendResult } from "@/lib/notify/mailer";

/**
 * The actor recorded on a would-send entry. `id: null` because no member of staff caused it — the
 * subscriber did, through the public form.
 */
export const NOTIFICATION_ACTOR_NAME_AR = "نظام الإشعارات (بلا مزوّد بريد)";

/** One-line Arabic summary stored on the audit entry. */
export function describeWouldSend(message: MailMessage): string {
  return `لم يُرسل أي بريد فعلياً: لا يوجد مزوّد بريد مضبوط على هذا الموقع. الرسالة المُعدّة (${message.kind}) كان موضوعها «${message.subject}».`;
}

export const noopMailer: Mailer = {
  provider: "noop",
  /** The whole point of this implementation: it never reaches a mail server. */
  deliverEmails: false,

  async send(message: MailMessage): Promise<MailSendResult> {
    console.info("[notify] would-send — NO EMAIL IS SENT (no mail provider configured)", {
      to: message.to,
      kind: message.kind,
      subject: message.subject,
      locale: message.locale,
    });

    return {
      provider: "noop",
      delivered: false,
      // `recorded` is reported by `recordWouldSendNote()` below, which knows the stored subscriber.
      recorded: false,
      note: describeWouldSend(message),
    };
  },
};

/**
 * Records a would-send entry for one subscriber. Kept beside the mailer (rather than inside `send()`)
 * because the mailer does not know — and must not fetch — the stored row it belongs to.
 *
 * NEVER THROWS BY DESIGN: the subscriber is already stored by the time this runs, so a failure here
 * is logged and reported as `false` instead of failing the visitor's confirmation.
 */
export async function recordWouldSendNote(
  subscriber: Pick<SubscriberRecord, "id" | "email">,
  message: MailMessage
): Promise<boolean> {
  const actor: Actor = { id: null, name: NOTIFICATION_ACTOR_NAME_AR };

  try {
    await getEventRepository().recordAuditNote(
      {
        action: "notify",
        entityType: "subscriber",
        entityId: subscriber.id,
        summary: `${describeWouldSend(message)} — البريد: ${subscriber.email}`,
      },
      actor
    );
    return true;
  } catch (error) {
    console.error("[notify] could not record the would-send entry", {
      subscriberId: subscriber.id,
      reason: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
