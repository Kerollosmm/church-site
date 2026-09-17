// src/lib/notify/index.ts
// The notification seam the application actually calls. SERVER-ONLY: the no-op implementation writes
// to the store, and nothing in this folder may be imported by a client component.
//
// ONE ENTRY POINT, ONE HONEST ANSWER. `notifyNewSubscription()` builds the message, hands it to the
// selected mailer (`getMailer()` in `mailer.ts` — today always the no-op), and when that mailer does
// not deliver (which is every deployment right now) records what WOULD have been sent as an audit
// entry. The returned outcome says exactly what happened, so the caller can tell the visitor the
// truth instead of a generic "check your inbox".
//
// The parish-facing consequence is stated once, in the public confirmation message: the subscription
// is saved and listed in the office's screen, and e-mail delivery is not switched on yet.

import type { Locale } from "../i18n/locales";
import type { SubscriberRecord } from "@church-site/domain";
import { getMailer, type MailMessage, type MailSendResult } from "./mailer";
import { recordWouldSendNote } from "./noop-mailer";

export * from "./mailer";

export type NotificationOutcome = MailSendResult;

/**
 * The welcome message's text. Arabic or English by the visitor's locale, and — deliberately — it does
 * not promise a delivery: with no provider, the message is only ever recorded.
 */
export function buildSubscriptionWelcomeMessage(
  subscriber: Pick<SubscriberRecord, "email" | "name" | "locale">
): MailMessage {
  const locale: Locale = subscriber.locale;
  const greetingAr = subscriber.name ? `أهلاً ${subscriber.name}،` : "أهلاً بك،";

  return {
    to: subscriber.email,
    toName: subscriber.name,
    locale,
    kind: "subscription-welcome",
    subject: locale === "ar" ? "تسجيل الاشتراك في تنبيهات فعاليات الكنيسة" : "Your parish events subscription",
    bodyText:
      locale === "ar"
        ? `${greetingAr}\nتم تسجيل بريدك في قائمة تنبيهات فعاليات الكنيسة.\n` +
          `ملاحظة مهمة: إرسال البريد الإلكتروني غير مفعّل على هذا الموقع حالياً، فهذه الرسالة مسجَّلة في سجل الكنيسة ولم تُرسل فعلياً.`
        : `Hello${subscriber.name ? ` ${subscriber.name}` : ""},\n` +
          `Your address has been added to the parish events notification list.\n` +
          `Important: e-mail delivery is not enabled on this site yet, so this message is recorded in the parish log and has NOT actually been sent.`,
  };
}

/**
 * Notifies a subscriber that their subscription is stored.
 *
 * Failure to RECORD is not failure of the subscription: the row is already saved when this runs, so
 * the boolean in the outcome is reported (and logged) rather than thrown.
 */
export async function notifyNewSubscription(
  subscriber: Pick<SubscriberRecord, "id" | "email" | "name" | "locale">
): Promise<{ message: MailMessage; result: NotificationOutcome; notificationLogged: boolean }> {
  const message = buildSubscriptionWelcomeMessage(subscriber);
  const mailer = await getMailer();
  const result = await mailer.send(message);

  const notificationLogged = mailer.deliverEmails ? false : await recordWouldSendNote(subscriber, message);

  if (!mailer.deliverEmails) {
    console.warn("[notify] subscription stored, NO e-mail sent", {
      subscriberId: subscriber.id,
      provider: mailer.provider,
      notificationLogged,
    });
  }

  return { message, result: { ...result, recorded: notificationLogged }, notificationLogged };
}
