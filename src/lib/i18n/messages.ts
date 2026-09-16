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
  "nav.home": "الرئيسية",
  "nav.events": "الفعاليات",
  "nav.ministries": "القطاعات الرعوية",
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
  "events.intro": "مواعيد القداسات والاجتماعات والأنشطة القادمة في مكان واحد، بتوقيت الكنيسة الرسمي.",
  "events.viewList": "قائمة",
  "events.viewMonth": "تقويم",
  "events.viewLabel": "طريقة العرض",
  "events.filtersLabel": "التصفية حسب التصنيف",
  "events.activeFilters": "{count} مرشّح مطبَّق",
  "events.clearFilters": "إزالة كل المرشّحات",
  "events.noMatchTitle": "لا توجد فعاليات مطابقة لهذه المرشّحات",
  "events.noMatchHint": "جرّب إزالة بعض المرشّحات لعرض نتائج أكثر.",
  "events.emptyMonthTitle": "لا توجد فعاليات في هذا الشهر",
  "events.emptyMonthHint": "انتقل إلى شهر آخر أو تصفّح القائمة القادمة.",
  "events.browseAll": "تصفّح كل الفعاليات",
  "events.prevMonth": "الشهر السابق",
  "events.nextMonth": "الشهر التالي",
  "events.thisMonth": "هذا الشهر",
  "events.moreItems": "و{count} مواعيد أخرى",
  "events.detailsLink": "التفاصيل والمواعيد",
  "events.occurrencesTitle": "المواعيد القادمة",
  "events.upcomingEmpty": "لا توجد مواعيد قادمة معلنة",
  "events.cancelledNote": "هذا الموعد ملغى",
  "events.cancelledReason": "السبب: {reason}",
  "events.movedFrom": "نُقل من {date}",
  "events.everyTwoWeeks": "كل أسبوعين",
  "events.everyNWeeks": "كل {count} أسابيع",
  "events.everyTwoMonths": "كل شهرين",
  "events.everyNMonths": "كل {count} أشهر",
  "events.onWeekday": "يوم {day}",
  "events.onWeekdays": "أيام {days}",
  "events.onMonthDay": "يوم {day} من الشهر",
  "events.directions": "الاتجاهات على الخريطة",
  "events.addToCalendar": "أضف إلى التقويم (.ics)",
  "events.calendarHint": "ملف تقويم قياسي يفتح في تطبيقات التقويم.",
  "events.recurrenceTitle": "قاعدة التكرار",
  "events.aboutTitle": "عن الفعالية",
  "events.venueTitle": "المكان والاتجاهات",
  "events.loadFailedTitle": "تعذّر تحميل الفعاليات الآن",
  "events.loadFailedHint": "قد يكون هناك ضغط مؤقت على الخدمة. أعد تحميل الصفحة للمحاولة مرة أخرى.",
  "events.reload": "إعادة تحميل الصفحة",
  "events.backToEvents": "العودة إلى كل الفعاليات",
  "events.notFoundTitle": "هذه الصفحة غير متاحة",
  "events.notFoundHint": "قد تكون الفعالية غير منشورة أو أُزيلت. تصفّح الفعاليات القادمة.",
  "taxonomy.event_type": "نوع الفعالية",
  "taxonomy.ministry": "القطاع والخدمة",
  "taxonomy.audience": "الفئة المستهدفة",
  "taxonomy.language": "اللغة",
  "taxonomy.venue": "المكان",
  "taxonomy.tag": "وسوم",
  "ministries.title": "القطاعات والخدمات الرعوية",
  "ministries.intro": "قطاعات الخدمة في الكنيسة ومواعيدها القادمة.",
  "ministries.upcomingCount": "المواعيد القادمة: {count}",
  "ministries.noUpcoming": "لا توجد مواعيد قادمة معلنة لهذا القطاع",
  "ministries.viewEvents": "عرض فعاليات هذا القطاع",
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
  "nav.home": "Home",
  "nav.events": "Events",
  "nav.ministries": "Ministries",
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
  "events.intro": "Upcoming liturgies, meetings and activities in one place, in the parish's official time.",
  "events.viewList": "List",
  "events.viewMonth": "Calendar",
  "events.viewLabel": "View",
  "events.filtersLabel": "Filter by category",
  "events.activeFilters": "{count} filters applied",
  "events.clearFilters": "Clear all filters",
  "events.noMatchTitle": "No events match these filters",
  "events.noMatchHint": "Try removing some filters to see more results.",
  "events.emptyMonthTitle": "No events this month",
  "events.emptyMonthHint": "Move to another month, or browse the upcoming list.",
  "events.browseAll": "Browse all events",
  "events.prevMonth": "Previous month",
  "events.nextMonth": "Next month",
  "events.thisMonth": "This month",
  "events.moreItems": "and {count} more",
  "events.detailsLink": "Details and dates",
  "events.occurrencesTitle": "Upcoming dates",
  "events.upcomingEmpty": "No upcoming dates are published",
  "events.cancelledNote": "This date is cancelled",
  "events.cancelledReason": "Reason: {reason}",
  "events.movedFrom": "Moved from {date}",
  "events.everyTwoWeeks": "Every 2 weeks",
  "events.everyNWeeks": "Every {count} weeks",
  "events.everyTwoMonths": "Every 2 months",
  "events.everyNMonths": "Every {count} months",
  "events.onWeekday": "on {day}",
  "events.onWeekdays": "on {days}",
  "events.onMonthDay": "on day {day} of the month",
  "events.directions": "Directions",
  "events.addToCalendar": "Add to calendar (.ics)",
  "events.calendarHint": "A standard calendar file that opens in calendar apps.",
  "events.recurrenceTitle": "Recurrence",
  "events.aboutTitle": "About this event",
  "events.venueTitle": "Venue and directions",
  "events.loadFailedTitle": "Events could not be loaded right now",
  "events.loadFailedHint": "The service may be temporarily busy. Reload the page to try again.",
  "events.reload": "Reload the page",
  "events.backToEvents": "Back to all events",
  "events.notFoundTitle": "This page is not available",
  "events.notFoundHint": "The event may be unpublished or removed. Browse the upcoming events instead.",
  "taxonomy.event_type": "Event type",
  "taxonomy.ministry": "Ministry",
  "taxonomy.audience": "Audience",
  "taxonomy.language": "Language",
  "taxonomy.venue": "Venue",
  "taxonomy.tag": "Tags",
  "ministries.title": "Parish ministries",
  "ministries.intro": "The parish's ministries and their upcoming dates.",
  "ministries.upcomingCount": "Upcoming dates: {count}",
  "ministries.noUpcoming": "No upcoming dates are published for this ministry",
  "ministries.viewEvents": "View this ministry's events",
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
