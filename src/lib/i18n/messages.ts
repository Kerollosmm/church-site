// src/lib/i18n/messages.ts
// `t()`-style message dictionary — UI chrome only.
//
// SCOPE, STATED ONCE: this dictionary is for INTERFACE strings (buttons, headings, states). Parish
// CONTENT is never translated here — it lives on the row (`titleAr`/`titleEn`, …) and goes through
// `localized()` in `localized.ts`, which falls back to Arabic and marks the gap. Administrative
// server actions keep returning Arabic messages on purpose: the staff area is Arabic-only (see
// `src/actions/event-actions.ts`).

import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";

/** Arabic is the source dictionary: its keys define `MessageKey`. */
const AR_MESSAGES = {
  "common.loading": "جارٍ التحميل…",
  "common.retry": "إعادة المحاولة",
  "common.readMore": "اقرأ المزيد",
  "common.close": "إغلاق",
  "common.today": "اليوم",
  "common.tomorrow": "غداً",
  "events.title": "الفعاليات",
  "events.upcoming": "الفعاليات القادمة",
  "events.past": "فعاليات سابقة",
  "events.empty": "لا توجد فعاليات معلنة حالياً",
  "events.allDay": "طوال اليوم",
  "events.cancelled": "ملغاة",
  "events.moved": "نُقل موعدها",
  "events.movedTo": "نُقلت إلى {date}",
  "events.weekly": "أسبوعياً",
  "events.monthly": "شهرياً",
  "events.venue": "المكان",
  "events.recurringNote": "موعد متكرر — تظهر المواعيد القادمة فقط",
  "locale.switcherLabel": "تغيير لغة الموقع",
  "a11y.translationMissing": "هذا النص غير مترجم بعد ويعرض بالعربية",
} as const;

export type MessageKey = keyof typeof AR_MESSAGES;

/** The English dictionary must cover every key — a missing one is a type error, not a runtime gap. */
const EN_MESSAGES: Record<MessageKey, string> = {
  "common.loading": "Loading…",
  "common.retry": "Try again",
  "common.readMore": "Read more",
  "common.close": "Close",
  "common.today": "Today",
  "common.tomorrow": "Tomorrow",
  "events.title": "Events",
  "events.upcoming": "Upcoming events",
  "events.past": "Past events",
  "events.empty": "No events are published at the moment",
  "events.allDay": "All day",
  "events.cancelled": "Cancelled",
  "events.moved": "Rescheduled",
  "events.movedTo": "Moved to {date}",
  "events.weekly": "Weekly",
  "events.monthly": "Monthly",
  "events.venue": "Venue",
  "events.recurringNote": "Recurring schedule — upcoming dates only",
  "locale.switcherLabel": "Change site language",
  "a11y.translationMissing": "This text is not translated yet and is shown in Arabic",
};

export const MESSAGES: Record<Locale, Record<MessageKey, string>> = {
  ar: AR_MESSAGES,
  en: EN_MESSAGES,
};

/**
 * Looks a message up, interpolating `{placeholders}`.
 *
 * Fallback order: the requested locale → Arabic → the key itself. A missing key therefore shows up
 * as an obvious identifier in the UI rather than an empty string.
 */
export function t(locale: Locale, key: MessageKey, vars?: Record<string, string | number>): string {
  const template = MESSAGES[locale]?.[key] ?? MESSAGES[DEFAULT_LOCALE][key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match
  );
}
