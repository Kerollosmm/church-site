"use client";

// src/app/subscribe/SubscribeForm.tsx
// The client half of `/subscribe`: one form, two languages, and an honest answer.
//
// VALIDATION IS SHARED WITH THE SERVER: the resolver is the very schema the action parses
// (`EventSubscriptionSchema`), so a field the browser accepts cannot be rejected by a different rule
// later — and the server still re-validates everything, because the browser is not a boundary.
//
// THE RESULT IS RENDERED FROM A RESULT CODE, not from the Arabic string the action returns. The
// action answers in Arabic (like every other server action in this project), and this component
// translates its outcome through the shared dictionary — falling back to the action's own message if
// it ever returns a code the dictionary does not know, so a new code can never render as a blank line.
//
// NO EMAIL IS SENT: when the action reports that e-mail delivery is not enabled (which is the case on
// every deployment today — see `src/lib/notify/`), the confirmation carries that statement explicitly.

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, BellRing, CheckCircle2, Loader2 } from "lucide-react";
import { subscribeToEventsAction, type SubscribeResultCode } from "@/actions/subscription-actions";
import { TurnstileWidget } from "@/components/security/TurnstileWidget";
import type { SubscribableTopicGroup } from "@/lib/events/subscribers";
import { localized } from "@/lib/i18n/localized";
import { t, type MessageKey } from "@/lib/i18n/messages";
import { LOCALE_DIRECTION, type Locale } from "@/lib/i18n/locales";
import { EventSubscriptionSchema, type EventSubscriptionInput } from "@/lib/validations/church-schemas";

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copticNavy-500";

const INPUT =
  "w-full rounded-xl border border-copticGold-300 bg-copticGold-50/50 px-3 py-2 text-sm text-copticNavy placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-copticNavy";

/** Result code → dictionary key. Keeps the mapping in one place so a code is never left unworded. */
const RESULT_MESSAGE_KEYS: Record<SubscribeResultCode, MessageKey> = {
  subscribed: "subscribe.result.subscribed",
  updated: "subscribe.result.updated",
  disabled: "subscribe.result.disabled",
  "rate-limited": "subscribe.result.rateLimited",
  invalid: "subscribe.result.invalid",
  "verification-failed": "subscribe.result.verificationFailed",
  "store-error": "subscribe.result.storeError",
};

type Feedback =
  | { tone: "success"; code: SubscribeResultCode; message: string; emailDeliveryEnabled: boolean }
  | { tone: "error"; code: SubscribeResultCode; message: string };

export interface SubscribeFormProps {
  locale: Locale;
  groups: SubscribableTopicGroup[];
  emailDeliveryEnabled?: boolean;
}

export function SubscribeForm({ locale, groups, emailDeliveryEnabled = false }: SubscribeFormProps): React.ReactElement {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  // Turnstile tokens are single-use: every completed submit asks the widget for a fresh one.
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EventSubscriptionInput>({
    resolver: zodResolver(EventSubscriptionSchema),
    defaultValues: { email: "", name: "", topics: [], turnstileToken: "" },
  });

  const onSubmit = async (data: EventSubscriptionInput) => {
    setFeedback(null);
    try {
      const result = await subscribeToEventsAction(data);
      if (result.success) {
        setFeedback({
          tone: "success",
          code: result.code,
          message: result.message,
          emailDeliveryEnabled: result.emailDeliveryEnabled,
        });
        reset();
      } else {
        setFeedback({ tone: "error", code: result.code, message: result.message });
      }
    } catch {
      setFeedback({ tone: "error", code: "store-error", message: "" });
    } finally {
      setTurnstileResetSignal((signal) => signal + 1);
    }
  };

  /** The outcome in the visitor's language; the action's own Arabic message is the last resort. */
  const wordFor = (item: Feedback): string => {
    const key = RESULT_MESSAGE_KEYS[item.code];
    const translated = key ? t(locale, key) : "";
    return translated.length > 0 && translated !== key ? translated : item.message || t(locale, "subscribe.result.storeError");
  };

  return (
    <section
      dir={LOCALE_DIRECTION[locale]}
      aria-labelledby="subscribe-form-heading"
      className="rounded-2xl border border-copticGold-200 bg-white p-5 sm:p-6"
    >
      <h2 id="subscribe-form-heading" className="flex items-center gap-2 font-heading text-lg font-bold text-copticNavy">
        <BellRing aria-hidden="true" className="h-5 w-5 text-copticGold-600" />
        <span>{t(locale, "subscribe.formTitle")}</span>
      </h2>

      {/* SAID BEFORE THE FORM, not only after a submit: the visitor must know what they are signing
          up for BEFORE typing an address. The same sentence is repeated on success. */}
      {emailDeliveryEnabled ? (
        <p
          data-subscribe-delivery="on"
          className="mt-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-3 text-[11px] leading-relaxed text-emerald-950"
        >
          {t(locale, "subscribe.deliveryOn")}
        </p>
      ) : (
        <p
          data-subscribe-delivery="off"
          className="mt-3 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900"
        >
          {t(locale, "subscribe.deliveryOff")}
        </p>
      )}

      {feedback ? (
        <div
          role={feedback.tone === "error" ? "alert" : "status"}
          aria-live={feedback.tone === "error" ? "assertive" : "polite"}
          data-subscribe-feedback={feedback.tone}
          className={`mt-4 flex items-start gap-3 rounded-2xl border p-4 text-xs leading-relaxed ${
            feedback.tone === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-950"
              : "border-red-300 bg-red-50 text-red-950"
          }`}
        >
          {feedback.tone === "success" ? (
            <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          )}
          <div className="space-y-1.5">
            <p>{wordFor(feedback)}</p>
            {feedback.tone === "success" ? (
              feedback.emailDeliveryEnabled ? (
                <p className="rounded-xl border border-emerald-300 bg-emerald-50 p-2.5 text-emerald-950">
                  {t(locale, "subscribe.deliveryOnSuccess")}
                </p>
              ) : (
                <p className="rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-amber-900">
                  {t(locale, "subscribe.deliveryOff")}
                </p>
              )
            ) : null}
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
        <div>
          <label htmlFor="subscribe-email" className="block font-heading text-xs font-bold text-copticNavy">
            {t(locale, "subscribe.emailLabel")} <span className="text-red-500">*</span>
          </label>
          <input
            id="subscribe-email"
            type="email"
            dir="ltr"
            autoComplete="email"
            placeholder="name@example.com"
            aria-invalid={errors.email ? "true" : undefined}
            aria-describedby={errors.email ? "subscribe-email-error" : "subscribe-email-hint"}
            {...register("email")}
            className={`mt-1 ${INPUT} text-left`}
          />
          {errors.email ? (
            <span id="subscribe-email-error" className="mt-1 block text-[11px] font-bold text-red-700">
              {errors.email.message}
            </span>
          ) : (
            <span id="subscribe-email-hint" className="mt-1 block text-[11px] leading-relaxed text-slate-500">
              {t(locale, "subscribe.emailHint")}
            </span>
          )}
        </div>

        <div>
          <label htmlFor="subscribe-name" className="block font-heading text-xs font-bold text-copticNavy">
            {t(locale, "subscribe.nameLabel")}
          </label>
          <input
            id="subscribe-name"
            type="text"
            autoComplete="name"
            {...register("name")}
            className={`mt-1 ${INPUT}`}
          />
          {errors.name ? (
            <span className="mt-1 block text-[11px] font-bold text-red-700">{errors.name.message}</span>
          ) : null}
        </div>

        {groups.length > 0 ? (
          <fieldset className="rounded-2xl border border-copticGold-200 bg-copticGold-50/40 p-4">
            <legend className="px-1 font-heading text-xs font-bold text-copticNavy">
              {t(locale, "subscribe.topicsLegend")}
            </legend>
            <p className="mb-3 text-[11px] leading-relaxed text-slate-600">{t(locale, "subscribe.topicsHint")}</p>

            <div className="space-y-4">
              {groups.map((group) => (
                <div key={group.dimension}>
                  <p className="mb-1.5 font-heading text-[11px] font-bold text-copticGold-900">
                    {t(locale, `taxonomy.${group.dimension}` as MessageKey)}
                  </p>
                  <ul className="flex flex-wrap gap-x-4 gap-y-2">
                    {group.terms.map((term) => (
                      <li key={term.id}>
                        <label className="flex items-center gap-2 text-xs text-copticNavy">
                          <input
                            type="checkbox"
                            value={term.slug}
                            {...register("topics")}
                            className={`h-4 w-4 rounded border-copticGold-400 text-copticNavy ${FOCUS_RING}`}
                          />
                          <span>{localized({ ar: term.nameAr, en: term.nameEn }, locale, { markMissing: false })}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </fieldset>
        ) : null}

        <TurnstileWidget onVerify={(token) => setValue("turnstileToken", token)} resetSignal={turnstileResetSignal} />

        <p className="text-[11px] leading-relaxed text-slate-500">{t(locale, "subscribe.privacyNote")}</p>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`inline-flex items-center justify-center gap-2 rounded-xl bg-copticNavy px-6 py-2.5 font-heading text-xs font-bold text-white transition hover:bg-copticNavy-700 disabled:opacity-50 sm:text-sm ${FOCUS_RING}`}
        >
          {isSubmitting ? (
            <>
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              <span>{t(locale, "subscribe.submitting")}</span>
            </>
          ) : (
            <>
              <BellRing aria-hidden="true" className="h-4 w-4" />
              <span>{t(locale, "subscribe.submit")}</span>
            </>
          )}
        </button>
      </form>
    </section>
  );
}
