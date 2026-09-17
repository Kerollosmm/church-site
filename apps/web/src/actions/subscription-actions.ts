"use server";

// src/actions/subscription-actions.ts
// The PUBLIC subscribe action — the only write in the events system a visitor can trigger.
//
// IT FOLLOWS THE SAME FOUR STEPS AS EVERY OTHER PUBLIC FORM in this codebase (see
// `src/actions/contact-actions.ts`), in this order:
//
//   1. the feature guard  — `EVENTS_SUBSCRIPTIONS_ENABLED` can switch the whole capability off
//      (`src/lib/env.ts`); a switched-off feature refuses SERVER-SIDE, not by hiding a button.
//   2. rate limit         — `subscribe:${ip}`, the shared public-form budget.
//   3. zod                — the payload is validated at the boundary.
//   4. Turnstile          — verified server-side, FAIL CLOSED (no secret in production = refused).
//
// WHERE THE ROW GOES: through the repository (`src/lib/store`), not a Supabase client. That is what
// makes the form work on BOTH drivers — including the file-backed store, which is the supported
// no-environment mode this repository builds and runs in.
//
// NO EMAIL IS SENT. There is no mail provider; the notification step records what WOULD have been sent
// (`src/lib/notify/`). The answer the visitor sees says so instead of implying a delivery, and the
// `emailDeliveryEnabled` flag is what the form uses to phrase that line in the visitor's language.

import { headers } from "next/headers";
import { isEventSubscriptionsEnabled } from "@/lib/env";
import {
  normalizeSubscriberEmail,
  normalizeSubscriberTopics,
  resolveSubscriberTopics,
} from "@/lib/domain/subscribers";
import { getLocale } from "@/lib/i18n/server";
import { getEventRepository, isStoreError } from "@/lib/store";
import { notifyNewSubscription } from "@/lib/notify";
import { verifyTurnstile } from "@/lib/security/turnstile";
import {
  PUBLIC_FORM_LIMIT,
  PUBLIC_FORM_WINDOW_MS,
  RATE_LIMIT_MESSAGE_AR,
  checkRateLimit,
  getClientIp,
} from "@/lib/security/rate-limit";
import { EventSubscriptionSchema } from "@/lib/validations/church-schemas";

/** What the form can report. The UI maps the code to the visitor's language; `message` is the Arabic
 *  fallback (the same convention the other public forms use). */
export type SubscribeResultCode =
  | "subscribed"
  | "updated"
  | "disabled"
  | "rate-limited"
  | "invalid"
  | "verification-failed"
  | "store-error";

export type SubscribeActionResult =
  | {
      success: true;
      code: "subscribed" | "updated";
      message: string;
      /** False today on every deployment: there is no mail provider (see `src/lib/notify/`). */
      emailDeliveryEnabled: boolean;
      /** The topics actually stored (unknown slugs were dropped), so the UI can echo them back. */
      topics: string[];
    }
  | {
      success: false;
      code: Exclude<SubscribeResultCode, "subscribed" | "updated">;
      message: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

/** Arabic messages for the staff console and for visitors who never load the localized wording. */
const MESSAGES = {
  subscribed: "تم تسجيل اشتراكك في تنبيهات الفعاليات بنجاح.",
  updated: "اشتراكك مسجَّل بالفعل — تم تحديث بياناته بدلاً من تكراره.",
  disabled: "خدمة الاشتراك في التنبيهات غير مفعّلة على هذا الموقع حالياً.",
  verificationFailed: "فشل التحقق من الأمان، يرجى إعادة المحاولة",
  invalid: "يرجى إدخال بريد إلكتروني صحيح",
  storeError: "تعذّر تسجيل الاشتراك الآن، يرجى المحاولة مرة أخرى بعد قليل.",
} as const;

export async function subscribeToEventsAction(rawInput: unknown): Promise<SubscribeActionResult> {
  if (!isEventSubscriptionsEnabled()) {
    return { success: false, code: "disabled", message: MESSAGES.disabled };
  }

  const headerList = await headers();
  const ip = getClientIp(headerList);

  // Best-effort per-instance rate limit — see src/lib/security/rate-limit.ts.
  if (!checkRateLimit(`subscribe:${ip}`, { limit: PUBLIC_FORM_LIMIT, windowMs: PUBLIC_FORM_WINDOW_MS }).allowed) {
    return { success: false, code: "rate-limited", message: RATE_LIMIT_MESSAGE_AR };
  }

  const parsed = EventSubscriptionSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      code: "invalid",
      message: MESSAGES.invalid,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  if (!(await verifyTurnstile(parsed.data.turnstileToken, ip))) {
    return { success: false, code: "verification-failed", message: MESSAGES.verificationFailed };
  }

  const email = normalizeSubscriberEmail(parsed.data.email);
  const requestedTopics = normalizeSubscriberTopics(parsed.data.topics);

  try {
    const repository = getEventRepository();

    // Unknown slugs are DROPPED, not rejected: a form rendered before a term was retired must still
    // work. The stored topics are therefore always terms that exist in the live vocabulary.
    const vocabulary = await repository.listTerms();
    const { matched, unknown } = resolveSubscriberTopics(requestedTopics, vocabulary);
    if (unknown.length > 0) {
      console.warn("[subscribe] dropped unknown topic slugs", { count: unknown.length });
    }
    const topics = matched.map((term) => term.slug);

    // The action runs on the server with the visitor's cookie in scope, so the stored language is the
    // language they were reading — not a value the browser could have tampered with.
    const locale = await getLocale();

    const { subscriber, created } = await repository.subscribe(
      {
        email,
        name: parsed.data.name && parsed.data.name.length > 0 ? parsed.data.name : null,
        locale,
        topics,
      },
      // The visitor is the actor of this public write: no staff id exists for them.
      { id: null, name: `زائر الموقع (نموذج الاشتراك) — ${email}` }
    );

    // BEST EFFORT, and honestly reported: this records a would-send entry and never claims delivery.
    const notification = await notifyNewSubscription(subscriber);

    return {
      success: true,
      code: created ? "subscribed" : "updated",
      message: created ? MESSAGES.subscribed : MESSAGES.updated,
      // `delivered` is TRUE only when a provider accepted the message. With no provider configured it
      // is always false, and the form tells the visitor that e-mail is not switched on yet.
      emailDeliveryEnabled: notification.result.delivered,
      topics,
    };
  } catch (error) {
    console.error("[subscribe] failed", {
      code: isStoreError(error) ? error.code : null,
      reason: error instanceof Error ? error.message : String(error),
    });
    return { success: false, code: "store-error", message: MESSAGES.storeError };
  }
}
