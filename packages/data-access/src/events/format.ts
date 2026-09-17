// src/lib/events/format.ts
// Rendering primitives for the public events surfaces — PURE: no I/O, no framework imports, no work
// at import time beyond building formatters lazily. It is imported by server components AND by
// client components (the calendar grid, the time toggles), so it may never reach for the store.
//
// TWO RULES GOVERN EVERYTHING HERE:
//
//  1. TIMES ARE CAIRO TIMES. Every parish-facing instant is read through `getWallClock(…,
//     PARISH_TIME_ZONE)` from `src/lib/utils/zone-time.ts` — never by slicing an ISO string and
//     never in the host's timezone. A build machine running in UTC and a visitor in Alexandria must
//     render the same hour, and a DST change must not shift it.
//  2. COPY COMES FROM THE DICTIONARY. User-visible strings are looked up with `t()`
//     (`src/lib/i18n/messages.ts`); the only literal text in this module is the time-of-day markers
//     "ص"/"م" (Arabic AM/PM, which the message dictionary has no key for and the spec fixes as
//     "07:00 ص") and Arabic weekday NAMES, which are read out of `DAY_OF_WEEK_LABELS_AR` — the
//     project's single source for them — instead of being retyped here.
//
// Every formatter is deterministic: an explicit `timeZone` is always supplied, so nothing depends on
// the machine that runs the build.

import { isValidDateKey } from "@church-site/domain";
import type { RecurrenceRule } from "@church-site/domain";
import type { Locale } from "../i18n/locales";
import { t } from "../i18n/messages";
import { PARISH_TIME_ZONE } from "../utils/cairo-time";
import { DAY_OF_WEEK_LABELS_AR } from "../utils/mass-schedule";
import { MS_PER_DAY, getWallClock, getZoneOffsetMs, wallClockToInstant } from "@church-site/domain";

// ============================================================================
// 1. Vocabulary
// ============================================================================

/**
 * Long Arabic weekday labels in JS day order: index 0 = Sunday … 6 = Saturday.
 *
 * Derived from `DAY_OF_WEEK_LABELS_AR` (the parish schedule's own vocabulary, keyed by name) so the
 * events surfaces and the mass schedule can never disagree about what Friday is called. The order of
 * the entries below mirrors `DAY_OF_WEEK_INDEX` in the same module.
 */
const WEEKDAY_LABELS_AR_BY_INDEX: readonly string[] = [
  DAY_OF_WEEK_LABELS_AR.Sunday,
  DAY_OF_WEEK_LABELS_AR.Monday,
  DAY_OF_WEEK_LABELS_AR.Tuesday,
  DAY_OF_WEEK_LABELS_AR.Wednesday,
  DAY_OF_WEEK_LABELS_AR.Thursday,
  DAY_OF_WEEK_LABELS_AR.Friday,
  DAY_OF_WEEK_LABELS_AR.Saturday,
];

/** Sunday noon of a fixed reference week: the anchor for locale-aware weekday names. */
const WEEKDAY_REFERENCE_UTC_MS = Date.UTC(2024, 0, 7, 12);

/** How the two languages join a weekday/date pair ("الجمعة، 18 سبتمبر 2026" / "Friday, 18 …"). */
const HEADING_SEPARATOR: Record<Locale, string> = { ar: "، ", en: ", " };

/** Joiner between a recurrence description and its time. Punctuation, not user-visible copy. */
const RECURRENCE_TIME_SEPARATOR = " — ";

/** Weeks a month grid always renders (6 × 7): the longest possible spill (31 days starting Saturday). */
const MONTH_GRID_WEEKS = 6;
const DAYS_PER_WEEK = 7;

/** The list view's bounded "upcoming" horizon, in days (the month view covers anything beyond it). */
export const LIST_HORIZON_DAYS = 35;

// ============================================================================
// 2. Formatter cache
// ============================================================================

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function cachedFormatter(key: string, build: () => Intl.DateTimeFormat): Intl.DateTimeFormat {
  const cached = formatterCache.get(key);
  if (cached) return cached;
  const formatter = build();
  formatterCache.set(key, formatter);
  return formatter;
}

/**
 * Locale tag per locale. `ar-EG` gives the Egyptian month names ("سبتمبر") and `en-GB` the day-month
 * order the parish uses in English; both are asked for the gregorian calendar with latn digits
 * explicitly, so an Arabic locale configured to show Hijri dates or Arabic-Indic numerals on the host
 * cannot change what the portal prints.
 */
function localeTag(locale: Locale): string {
  return locale === "ar" ? "ar-EG" : "en-GB";
}

/** Day + long month + year, e.g. "18 سبتمبر 2026" / "18 September 2026". */
function longDateFormatter(locale: Locale): Intl.DateTimeFormat {
  return cachedFormatter(`long:${locale}`, () =>
    new Intl.DateTimeFormat(localeTag(locale), {
      timeZone: "UTC",
      calendar: "gregory",
      numberingSystem: "latn",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  );
}

/** Long month + year, e.g. "أكتوبر 2026" / "October 2026". */
function monthFormatter(locale: Locale): Intl.DateTimeFormat {
  return cachedFormatter(`month:${locale}`, () =>
    new Intl.DateTimeFormat(localeTag(locale), {
      timeZone: "UTC",
      calendar: "gregory",
      numberingSystem: "latn",
      month: "long",
      year: "numeric",
    })
  );
}

/** Long weekday name, e.g. "Friday"; used for English (Arabic uses `DAY_OF_WEEK_LABELS_AR`). */
function weekdayFormatter(locale: Locale): Intl.DateTimeFormat {
  return cachedFormatter(`weekday:${locale}`, () =>
    new Intl.DateTimeFormat(localeTag(locale), { timeZone: "UTC", weekday: "long" })
  );
}

// ============================================================================
// 3. Date-key helpers (calendar math in UTC so nothing is host-dependent)
// ============================================================================

/** `YYYY-MM-DD` from calendar fields. */
function toDateKey(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** UTC midnight of a date key, or null when the key is not a real calendar date. */
function dateKeyToUtcMs(dateKey: string): number | null {
  if (!isValidDateKey(dateKey)) return null;
  const [year, month, day] = dateKey.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

/** Shifts a date key by whole days; returns "" when the input is not a date key. */
function shiftDateKeyByDays(dateKey: string, days: number): string {
  const ms = dateKeyToUtcMs(dateKey);
  if (ms === null) return "";
  const shifted = new Date(ms + days * MS_PER_DAY);
  return toDateKey(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate());
}

/** The UTC noon of a calendar date — the anchor used to format "a date" with an Intl formatter. */
function utcNoonOf(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 12));
}

/** Parses a value accepted as an instant. Returns null instead of throwing on garbage. */
function parseInstant(value: string | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

interface CairoDateParts {
  /** Cairo calendar date, `YYYY-MM-DD`. */
  dateKey: string;
  year: number;
  month: number;
  day: number;
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number;
}

/**
 * Resolves a "date key or instant" argument to the Cairo calendar date it denotes.
 *
 * A bare `YYYY-MM-DD` is ALREADY a Cairo date key and is taken as is (re-parsing it as an instant
 * would risk shifting the day); anything else is parsed and read in `Africa/Cairo`. Returns null when
 * the value is neither a date key nor a parsable instant, so every caller can render "" or a fallback
 * rather than a wrong date.
 */
function resolveCairoDate(value: string): CairoDateParts | null {
  const trimmed = value.trim();
  const utcMs = dateKeyToUtcMs(trimmed);
  if (utcMs !== null) {
    const parts = new Date(utcMs);
    return {
      dateKey: trimmed,
      year: parts.getUTCFullYear(),
      month: parts.getUTCMonth() + 1,
      day: parts.getUTCDate(),
      weekday: parts.getUTCDay(),
    };
  }

  const instant = parseInstant(trimmed);
  if (!instant) return null;
  const wall = getWallClock(instant, PARISH_TIME_ZONE);
  return {
    dateKey: toDateKey(wall.year, wall.month, wall.day),
    year: wall.year,
    month: wall.month,
    day: wall.day,
    weekday: wall.weekday,
  };
}

/** Normalises any weekday number onto 0-6 (0 = Sunday); non-finite input reads as Sunday. */
function normalizeWeekday(weekday: number): number {
  if (!Number.isFinite(weekday)) return 0;
  return ((Math.trunc(weekday) % DAYS_PER_WEEK) + DAYS_PER_WEEK) % DAYS_PER_WEEK;
}

/** A month key that is guaranteed usable: the given one when valid, Cairo's current month otherwise. */
function normalizeMonthKey(monthKey: string): string {
  const trimmed = monthKey.trim();
  return isValidMonthKey(trimmed) ? trimmed : currentMonthKey();
}

// ============================================================================
// 4. Calendar dates
// ============================================================================

/**
 * The calendar date (`YYYY-MM-DD`) `timeZone` shows at `instant` — the zone-aware replacement for
 * slicing an ISO string. Returns "" when the instant cannot be parsed; an unknown timezone falls back
 * to the parish zone instead of throwing (a bad series zone must not break a page).
 */
export function getZoneDateKey(instant: string | Date, timeZone: string = PARISH_TIME_ZONE): string {
  const date = parseInstant(instant);
  if (!date) return "";

  try {
    const wall = getWallClock(date, timeZone);
    return toDateKey(wall.year, wall.month, wall.day);
  } catch {
    if (timeZone === PARISH_TIME_ZONE) return "";
    return getZoneDateKey(date, PARISH_TIME_ZONE);
  }
}

/** Cairo's today as `YYYY-MM-DD` — the key every "is this today?" decision compares against. */
export function todayDateKey(now: Date = new Date()): string {
  return getZoneDateKey(now);
}

/** True when `value` is `YYYY-MM` with a real month and a real (non-zero) year. */
export function isValidMonthKey(value: string | null | undefined): boolean {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(trimmed)) return false;
  return Number(trimmed.slice(0, 4)) >= 1;
}

/** `2026-10-04` → `2026-10`. Returns "" when the input is not a real calendar date. */
export function monthKeyOf(dateKey: string): string {
  const trimmed = dateKey.trim();
  return isValidDateKey(trimmed) ? trimmed.slice(0, 7) : "";
}

/** Cairo's current month, e.g. `2026-09`. */
export function currentMonthKey(now: Date = new Date()): string {
  return monthKeyOf(todayDateKey(now));
}

/** Shifts a month key by whole months: `2026-12` + 1 → `2027-01`. Returns "" for a bad key. */
export function shiftMonthKey(monthKey: string, delta: number): string {
  if (!isValidMonthKey(monthKey)) return "";
  const trimmed = monthKey.trim();
  const year = Number(trimmed.slice(0, 4));
  const month = Number(trimmed.slice(5, 7));
  const shifted = new Date(Date.UTC(year, month - 1 + (Number.isFinite(delta) ? Math.trunc(delta) : 0), 1));
  return toDateKey(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, 1).slice(0, 7);
}

/**
 * The absolute instants bounding a month in parish time: the first day at 00:00 Cairo through the
 * last day at 23:59:59.999 Cairo. Built with `wallClockToInstant`, so the bounds follow Cairo's real
 * DST rules rather than a fixed offset.
 *
 * An invalid key falls back to the current Cairo month: a hand-edited `?month=` must show a real
 * month, never an empty or crashing page.
 */
export function monthRange(monthKey: string): { from: Date; to: Date } {
  const normalized = normalizeMonthKey(monthKey);
  const year = Number(normalized.slice(0, 4));
  const month = Number(normalized.slice(5, 7));

  const from = wallClockToInstant({ year, month, day: 1, hour: 0, minute: 0 }, PARISH_TIME_ZONE);
  // Day 0 of the NEXT month is the last day of this one (February included, leap years included).
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const lastMinute = wallClockToInstant({ year, month, day: lastDay, hour: 23, minute: 59 }, PARISH_TIME_ZONE);
  return { from, to: new Date(lastMinute.getTime() + 59_999) };
}

/**
 * The list view's window: today at 00:00 Cairo through `LIST_HORIZON_DAYS` later at 23:59:59.999
 * Cairo. Bounded on purpose — the list is a "what is coming up" surface, and the month view is what
 * lets a visitor walk arbitrarily far ahead.
 */
export function listWindowRange(now: Date = new Date()): { from: Date; to: Date } {
  const today = todayDateKey(now);
  const horizonEnd = shiftDateKeyByDays(today, LIST_HORIZON_DAYS);
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  const day = Number(today.slice(8, 10));

  const from = wallClockToInstant({ year, month, day, hour: 0, minute: 0 }, PARISH_TIME_ZONE);
  const endYear = Number(horizonEnd.slice(0, 4));
  const endMonth = Number(horizonEnd.slice(5, 7));
  const endDay = Number(horizonEnd.slice(8, 10));
  const lastMinute = wallClockToInstant({ year: endYear, month: endMonth, day: endDay, hour: 23, minute: 59 }, PARISH_TIME_ZONE);

  return { from, to: new Date(lastMinute.getTime() + 59_999) };
}

// ============================================================================
// 5. Weekday + date labels
// ============================================================================

/**
 * Long weekday name for a JS day index (0 = Sunday … 6 = Saturday), in the requested locale.
 * Arabic comes from `DAY_OF_WEEK_LABELS_AR`; English from a formatter anchored on a fixed reference
 * week, so the answer never depends on today's date or the host timezone.
 */
export function weekdayLabel(weekday: number, locale: Locale): string {
  const index = normalizeWeekday(weekday);
  if (locale === "ar") return WEEKDAY_LABELS_AR_BY_INDEX[index];
  return weekdayFormatter(locale).format(new Date(WEEKDAY_REFERENCE_UTC_MS + index * MS_PER_DAY));
}

/**
 * The full day heading of an event card or a calendar day panel:
 *   ar: "الجمعة، 18 سبتمبر 2026"   en: "Friday, 18 September 2026"
 * Accepts either a Cairo date key or an ISO instant (read in Cairo). Returns "" when unusable.
 */
export function formatEventDayHeading(dateKeyOrInstant: string, locale: Locale): string {
  const resolved = resolveCairoDate(dateKeyOrInstant);
  if (!resolved) return "";
  const dateLabel = longDateFormatter(locale).format(utcNoonOf(resolved.year, resolved.month, resolved.day));
  return `${weekdayLabel(resolved.weekday, locale)}${HEADING_SEPARATOR[locale]}${dateLabel}`;
}

/**
 * The date without its weekday: ar "18 سبتمبر 2026" | en "18 September 2026".
 * Accepts a Cairo date key or an ISO instant. Returns "" when unusable.
 */
export function formatEventDateLong(dateKeyOrInstant: string, locale: Locale): string {
  const resolved = resolveCairoDate(dateKeyOrInstant);
  if (!resolved) return "";
  return longDateFormatter(locale).format(utcNoonOf(resolved.year, resolved.month, resolved.day));
}

/**
 * A month heading: `2026-10` → ar "أكتوبر 2026" | en "October 2026".
 * An unusable key is returned unchanged (callers gate on `isValidMonthKey`) so a broken heading is
 * still greppable instead of silently empty.
 */
export function formatEventMonthLabel(monthKey: string, locale: Locale): string {
  const trimmed = monthKey.trim();
  if (!isValidMonthKey(trimmed)) return trimmed;
  const year = Number(trimmed.slice(0, 4));
  const month = Number(trimmed.slice(5, 7));
  return monthFormatter(locale).format(utcNoonOf(year, month, 1));
}

/**
 * The seven column headers a month grid renders, Sunday-first and locale-aware (long form, from
 * `weekdayLabel`). `monthKey` is part of the signature for symmetry with `monthGrid`; the headers
 * repeat every week, so nothing about them depends on the month.
 */
export function weekStartDateKeys(monthKey: string, locale: Locale): string[] {
  const labels: string[] = [];
  for (let weekday = 0; weekday < DAYS_PER_WEEK; weekday += 1) {
    labels.push(weekdayLabel(weekday, locale));
  }
  return labels;
}

/** One cell of a month grid. `dateKey` is the Cairo calendar date the cell stands for. */
export interface MonthGridCell {
  dateKey: string;
  /** Day of month with latn digits, e.g. "4". */
  dayLabel: string;
  /** False for the leading/trailing spill days that belong to the neighbouring months. */
  inMonth: boolean;
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number;
  isToday: boolean;
}

/**
 * A calendar month as 6 weeks × 7 days (always exactly 42 cells), starting on Sunday. The leading and
 * trailing cells are real dates from the neighbouring months, flagged with `inMonth: false`, so the
 * UI can grey them out without inventing placeholders.
 *
 * `locale` is accepted for signature symmetry with the other formatters; the cell values themselves
 * are locale-independent (latn digits, ISO date keys).
 */
export function monthGrid(monthKey: string, locale: Locale, now: Date = new Date()): MonthGridCell[] {
  const normalized = normalizeMonthKey(monthKey);
  const todayKey = todayDateKey(now);
  const firstDayKey = `${normalized}-01`;
  const firstWeekday = resolveCairoDate(firstDayKey)?.weekday ?? 0;
  const gridStartKey = shiftDateKeyByDays(firstDayKey, -firstWeekday);

  const cells: MonthGridCell[] = [];
  for (let index = 0; index < MONTH_GRID_WEEKS * DAYS_PER_WEEK; index += 1) {
    const dateKey = shiftDateKeyByDays(gridStartKey, index);
    cells.push({
      dateKey,
      dayLabel: String(Number(dateKey.slice(8, 10))),
      inMonth: dateKey.slice(0, 7) === normalized,
      weekday: index % DAYS_PER_WEEK,
      isToday: dateKey === todayKey,
    });
  }
  return cells;
}

// ============================================================================
// 6. Times
// ============================================================================

/** 24-hour wall clock from a wall-clock pair: ar "07:00 ص" | en "07:00". */
function formatWallClock(hour: number, minute: number, locale: Locale): string {
  const paddedMinute = String(minute).padStart(2, "0");
  if (locale !== "ar") return `${String(hour).padStart(2, "0")}:${paddedMinute}`;
  // "ص"/"م" are time-of-day markers, not translatable UI copy; the dictionary has no key for them.
  const marker = hour < 12 ? "ص" : "م";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${String(hour12).padStart(2, "0")}:${paddedMinute} ${marker}`;
}

/** A series-local `HH:MM` wall clock in the requested locale; "" when the value is malformed. */
function formatSeriesTime(startTime: string, locale: Locale): string {
  const match = /^(\d{2}):(\d{2})/.exec(startTime.trim());
  if (!match) return "";
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return "";
  return formatWallClock(hour, minute, locale);
}

/**
 * The start time of an event in parish time: ar "07:00 ص" | en "07:00".
 * The instant is read in `Africa/Cairo` (never sliced, never host-local). "" when unparsable.
 */
export function formatEventTime(startsAt: string, locale: Locale): string {
  const instant = parseInstant(startsAt);
  if (!instant) return "";
  const wall = getWallClock(instant, PARISH_TIME_ZONE);
  return formatWallClock(wall.hour, wall.minute, locale);
}

/**
 * A start–end range, e.g. "07:00 ص — 09:30 ص". Falls back to the bare start time when there is no end
 * (an open-ended event) and to whichever single time is available when one side is unusable.
 */
export function formatEventTimeRange(startsAt: string, endsAt: string | null, locale: Locale): string {
  const start = formatEventTime(startsAt, locale);
  if (!endsAt) return start;
  const end = formatEventTime(endsAt, locale);
  if (!start) return end;
  if (!end) return start;
  return `${start} — ${end}`;
}

/**
 * An ISO instant as a Cairo wall clock carrying its REAL numeric offset:
 * `"2026-09-18T04:00:00.000Z"` → `"2026-09-18T07:00:00+03:00"`.
 *
 * Why not just emit the UTC instant: JSON-LD `startDate`/`endDate` are read by search engines and
 * calendar crawlers that display the value to a human, and the offset makes the local time explicit
 * while staying unambiguous. The offset is derived from the zone at that instant, so it follows DST.
 * Returns "" when the input is unparsable (the caller keeps its own fallback).
 */
export function formatCairoOffsetIso(instantIso: string): string {
  const instant = parseInstant(instantIso);
  if (!instant) return "";

  const wall = getWallClock(instant, PARISH_TIME_ZONE);
  const offsetMs = getZoneOffsetMs(instant.getTime(), PARISH_TIME_ZONE);
  const offsetMinutes = Math.round(offsetMs / 60_000);
  const sign = offsetMinutes < 0 ? "-" : "+";
  const absolute = Math.abs(offsetMinutes);
  const offset = `${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`;

  const time = `${String(wall.hour).padStart(2, "0")}:${String(wall.minute).padStart(2, "0")}:${String(
    wall.second
  ).padStart(2, "0")}`;
  return `${toDateKey(wall.year, wall.month, wall.day)}T${time}${offset}`;
}

/**
 * "اليوم" / "غداً" when the date key is today or tomorrow in Cairo, otherwise null (the caller then
 * renders the normal date heading). A relative label is only ever computed against CAIRO's today —
 * a visitor in another timezone still sees the parish's calendar.
 */
export function relativeDayLabel(dateKey: string, locale: Locale, now: Date = new Date()): string | null {
  if (!isValidDateKey(dateKey.trim())) return null;
  const trimmed = dateKey.trim();
  const today = todayDateKey(now);
  if (trimmed === today) return t(locale, "common.today");
  if (trimmed === shiftDateKeyByDays(today, 1)) return t(locale, "common.tomorrow");
  return null;
}

// ============================================================================
// 7. Recurrence description
// ============================================================================

/** Whole interval of a rule, clamped into the range the engine actually supports. */
function normalizedInterval(interval: number): number {
  return Number.isFinite(interval) ? Math.max(1, Math.trunc(interval)) : 1;
}

/** The frequency word alone: "أسبوعياً" / "كل أسبوعين" / "كل 3 أسابيع" / "شهرياً" / … */
function recurrenceFrequencyLabel(rule: RecurrenceRule, locale: Locale): string {
  const interval = normalizedInterval(rule.interval);

  if (rule.freq === "monthly") {
    if (interval === 1) return t(locale, "events.monthly");
    if (interval === 2) return t(locale, "events.everyTwoMonths");
    return t(locale, "events.everyNMonths", { count: interval });
  }

  if (interval === 1) return t(locale, "events.weekly");
  if (interval === 2) return t(locale, "events.everyTwoWeeks");
  return t(locale, "events.everyNWeeks", { count: interval });
}

/**
 * The weekdays a weekly rule names, deduplicated but kept in the rule's own order (so the Arabic list
 * reads the way the parish authored it). An empty list means "the weekday of `startDate`" — the same
 * default the engine applies.
 */
function ruleWeekdays(rule: RecurrenceRule): number[] {
  const seen = new Set<number>();
  for (const weekday of rule.byWeekday) {
    if (Number.isInteger(weekday) && weekday >= 0 && weekday <= 6) seen.add(weekday);
  }
  if (seen.size > 0) return [...seen];

  const startWeekday = resolveCairoDate(rule.startDate)?.weekday;
  return typeof startWeekday === "number" ? [startWeekday] : [];
}

/** The day of month a monthly rule lands on, or null when it cannot be determined. */
function ruleMonthDay(rule: RecurrenceRule): number | null {
  if (typeof rule.byMonthDay === "number" && Number.isInteger(rule.byMonthDay) && rule.byMonthDay >= 1 && rule.byMonthDay <= 31) {
    return rule.byMonthDay;
  }
  const startDay = resolveCairoDate(rule.startDate)?.day;
  return typeof startDay === "number" ? startDay : null;
}

/** Joins a list the way each language does it: "الجمعة والأحد" / "Friday and Sunday". */
function joinList(items: readonly string[], locale: Locale): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  const head = items.slice(0, -1).join(locale === "ar" ? "، " : ", ");
  return `${head}${locale === "ar" ? " و" : " and "}${items[items.length - 1]}`;
}

function weeklyDetail(rule: RecurrenceRule, locale: Locale): string | null {
  const weekdays = ruleWeekdays(rule);
  if (weekdays.length === 0) return null;
  const labels = weekdays.map((weekday) => weekdayLabel(weekday, locale));
  if (labels.length === 1) return t(locale, "events.onWeekday", { day: labels[0] });
  return t(locale, "events.onWeekdays", { days: joinList(labels, locale) });
}

function monthlyDetail(rule: RecurrenceRule, locale: Locale): string | null {
  const day = ruleMonthDay(rule);
  return day === null ? null : t(locale, "events.onMonthDay", { day });
}

/**
 * A one-line, human description of a recurrence rule, ready for the event detail page's "قاعدة
 * التكرار" panel:
 *
 *   weekly, interval 1, Friday        → "أسبوعياً يوم الجمعة — 07:00 ص"
 *   weekly, interval 1, Fri + Sun     → "أسبوعياً أيام الجمعة والأحد — 07:00 ص"
 *   weekly, interval 2, Friday        → "كل أسبوعين يوم الجمعة — 07:00 ص"
 *   monthly, interval 1, day 15       → "شهرياً يوم 15 من الشهر — 06:30 م"
 *
 * Everything except the time marker and the " — " joiner comes from the message dictionary. A rule the
 * engine would reject never throws here: the weekday/month-day clause is dropped and the frequency
 * word is returned (with the time, which is independent of the rule and still useful) — a malformed
 * row must not take a public page down.
 */
export function describeRecurrence(rule: RecurrenceRule, startTime: string, locale: Locale): string {
  const frequency = recurrenceFrequencyLabel(rule, locale);

  let detail: string | null = null;
  if (rule.freq === "weekly") {
    detail = weeklyDetail(rule, locale);
  } else if (rule.freq === "monthly") {
    detail = monthlyDetail(rule, locale);
  }

  const head = detail ? `${frequency} ${detail}` : frequency;
  const time = formatSeriesTime(startTime, locale);
  return time ? `${head}${RECURRENCE_TIME_SEPARATOR}${time}` : head;
}
