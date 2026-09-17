// src/lib/domain/recurrence.ts
// The recurrence engine — PURE functions, no dependencies, no I/O.
//
// It turns a stored series (`EventSeriesRecord.rule` + `startTime` + `durationMinutes`) plus the
// per-occurrence exceptions into the concrete occurrences that fall inside a requested window.
//
// DESIGN DECISIONS (deliberate, documented once):
//
//  * Only two frequencies exist — `weekly` and `monthly` — because those are the parish's real
//    patterns. This is NOT RFC 5545 and does not try to be.
//  * Occurrences are NOT stored: a weekly liturgy is expanded on read, so a series can run for
//    years without filling the events table.
//  * Everything is computed in the SERIES' zone (`rule.timezone`), never the host's. A series
//    authored at 07:00 Cairo stays at 07:00 Cairo across a DST change.
//  * `expandSeries()` returns the EFFECTIVE set by default: a cancelled occurrence is gone and a
//    moved occurrence appears at its new date. Pass `includeCancelled` / `includeMovedFrom` when a
//    screen has to show the deviation itself (e.g. "نُقل موعد هذا الأسبوع").
//  * A monthly rule whose `byMonthDay` does not exist in a month (the 31st in February) simply has
//    no occurrence that month — it is never clamped onto another day.

import { MS_PER_DAY, wallClockToInstant } from "./zone-time";
import {
  DEFAULT_EVENT_TIME_ZONE,
  type EventExceptionKind,
  type EventStatus,
  type RecurrenceRule,
} from "./types";

/**
 * Upper bound on an expansion window. A caller asking for more than two years of a weekly series
 * gets a RangeError instead of a silently truncated list — the UI lists a month at a time.
 */
export const MAX_EXPANSION_WINDOW_DAYS = 731;

// ============================================================================
// 1. Date keys (`YYYY-MM-DD`) — calendar math in UTC so nothing is host-dependent
// ============================================================================

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_OF_DAY_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** True when `value` is a well-formed `YYYY-MM-DD` AND a real calendar date. */
export function isValidDateKey(value: string): boolean {
  if (!DATE_KEY_PATTERN.test(value)) return false;
  const parsed = dateKeyToUtcDate(value);
  return utcDateToDateKey(parsed) === value;
}

/** True when `value` is a `HH:MM` 24-hour wall clock. */
export function isValidTimeOfDay(value: string): boolean {
  return TIME_OF_DAY_PATTERN.test(value);
}

/** True when the runtime knows this IANA zone (Intl throws a RangeError for unknown zones). */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** `YYYY-MM-DD` → the UTC midnight of that calendar date. */
function dateKeyToUtcDate(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
}

/** A `Date` (read in UTC) → `YYYY-MM-DD`. */
function utcDateToDateKey(date: Date): string {
  return `${String(date.getUTCFullYear()).padStart(4, "0")}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate()
  ).padStart(2, "0")}`;
}

/** Adds (or subtracts) whole days to a `YYYY-MM-DD` key. */
function addDays(dateKey: string, days: number): string {
  return utcDateToDateKey(new Date(dateKeyToUtcDate(dateKey).getTime() + days * MS_PER_DAY));
}

/** The calendar date (`YYYY-MM-DD`) that `timeZone` shows at `instant`. */
function occurrenceDateInZone(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
  return parts;
}

// ============================================================================
// 2. Rule matching
// ============================================================================

/**
 * Does the rule produce an occurrence on this series-local date?
 * `dateKey` must already be inside `[startDate, endDate]` — this only checks the pattern.
 * Internal to the engine; a caller that needs it can ask for a one-day window instead.
 */
function matchesRecurrenceRule(rule: RecurrenceRule, dateKey: string): boolean {
  const interval = Math.max(1, Math.trunc(rule.interval || 1));
  const candidate = dateKeyToUtcDate(dateKey);
  const anchor = dateKeyToUtcDate(rule.startDate);

  if (candidate.getTime() < anchor.getTime()) return false;
  if (rule.endDate && candidate.getTime() > dateKeyToUtcDate(rule.endDate).getTime()) return false;

  if (rule.freq === "weekly") {
    const weekdays = rule.byWeekday.length > 0 ? rule.byWeekday : [anchor.getUTCDay()];
    if (!weekdays.includes(candidate.getUTCDay())) return false;
    // Interval counts weeks from the week containing the anchor date (week starts Sunday).
    const anchorWeekStart = anchor.getTime() - anchor.getUTCDay() * MS_PER_DAY;
    const candidateWeekStart = candidate.getTime() - candidate.getUTCDay() * MS_PER_DAY;
    const weeks = Math.round((candidateWeekStart - anchorWeekStart) / (7 * MS_PER_DAY));
    return weeks % interval === 0;
  }

  const monthDay = rule.byMonthDay ?? anchor.getUTCDate();
  if (candidate.getUTCDate() !== monthDay) return false;
  const months =
    (candidate.getUTCFullYear() - anchor.getUTCFullYear()) * 12 + (candidate.getUTCMonth() - anchor.getUTCMonth());
  return months >= 0 && months % interval === 0;
}

/**
 * Validates a rule and returns the Arabic problems found (empty array = valid).
 * Used by the input schemas so a malformed rule is rejected at the boundary, not at expansion time.
 */
export function validateRecurrenceRule(rule: RecurrenceRule): string[] {
  const problems: string[] = [];

  if (rule.freq !== "weekly" && rule.freq !== "monthly") {
    problems.push("نوع التكرار غير مدعوم (أسبوعي أو شهري فقط).");
  }

  const interval = Number(rule.interval);
  if (!Number.isInteger(interval) || interval < 1 || interval > 52) {
    problems.push("الفاصل الزمني للتكرار يجب أن يكون عدداً صحيحاً بين 1 و52.");
  }

  if (!isValidDateKey(rule.startDate)) {
    problems.push("تاريخ بداية السلسلة غير صالح.");
  }
  if (rule.endDate !== null) {
    if (!isValidDateKey(rule.endDate)) {
      problems.push("تاريخ نهاية السلسلة غير صالح.");
    } else if (isValidDateKey(rule.startDate) && rule.endDate < rule.startDate) {
      problems.push("تاريخ نهاية السلسلة يسبق تاريخ بدايتها.");
    }
  }

  if (!isValidTimeZone(rule.timezone)) {
    problems.push("المنطقة الزمنية للسلسلة غير معروفة.");
  }

  for (const weekday of rule.byWeekday) {
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
      problems.push("أيام الأسبوع في التكرار يجب أن تكون أرقاماً من 0 (الأحد) إلى 6 (السبت).");
      break;
    }
  }

  if (rule.byMonthDay !== null && (!Number.isInteger(rule.byMonthDay) || rule.byMonthDay < 1 || rule.byMonthDay > 31)) {
    problems.push("يوم الشهر في التكرار الشهري يجب أن يكون بين 1 و31.");
  }

  if (rule.freq === "monthly" && rule.byWeekday.length > 0) {
    problems.push("التكرار الشهري لا يستخدم أيام الأسبوع.");
  }

  return problems;
}

// ============================================================================
// 3. Expansion
// ============================================================================

/** The structural slice of a series the engine needs (accepts `EventSeriesRecord` as-is). */
export interface ExpandableSeries {
  id: string;
  titleAr?: string;
  titleEn?: string | null;
  rule: RecurrenceRule;
  /** Series-local `HH:MM`. */
  startTime: string;
  durationMinutes: number;
  defaultVenueId?: string | null;
  defaultTermIds?: readonly string[];
  status?: EventStatus;
}

/** The structural slice of an exception the engine needs (accepts `EventExceptionRecord`). */
export interface OccurrenceException {
  seriesId: string;
  occurrenceDate: string;
  kind: EventExceptionKind;
  movedToDate: string | null;
  reasonAr?: string | null;
  reasonEn?: string | null;
}

/** One concrete occurrence of a series. */
export interface Occurrence {
  seriesId: string;
  /** Series-local `YYYY-MM-DD` of the occurrence AS RULED (the original date when moved). */
  occurrenceDate: string;
  /** ISO instant. For a moved occurrence this is the NEW date/time. */
  startsAt: string;
  endsAt: string;
  timezone: string;
  venueId: string | null;
  termIds: string[];
  /** `scheduled` = as ruled, `cancelled` = called off, `moved` = the ORIGINAL slot of a move. */
  state: "scheduled" | "cancelled" | "moved";
  /** Series-local `YYYY-MM-DD` an occurrence was moved TO, when this is a moved occurrence. */
  movedToDate: string | null;
  reasonAr: string | null;
  reasonEn: string | null;
  titleAr: string | null;
  titleEn: string | null;
}

export interface ExpandOptions {
  /** Include occurrences that were cancelled (default false: they are omitted). */
  includeCancelled?: boolean;
  /** Include the vacated original slot of a moved occurrence (default false). */
  includeMovedFrom?: boolean;
}

function parseTimeOfDay(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(":");
  return { hour: Number(hour) || 0, minute: Number(minute) || 0 };
}

/**
 * Expands `series` between two instants, applying `exceptions`.
 *
 * @param range `from`/`to` are absolute instants; an occurrence is included when its start instant
 *              falls inside them (inclusive).
 * @throws RangeError when the window exceeds `MAX_EXPANSION_WINDOW_DAYS`, or when the series rule
 *         carries values the engine cannot use (invalid dates/time/timezone).
 */
export function expandSeries(
  series: ExpandableSeries,
  exceptions: readonly OccurrenceException[],
  range: { from: Date; to: Date },
  options: ExpandOptions = {}
): Occurrence[] {
  const { includeCancelled = false, includeMovedFrom = false } = options;
  const timezone = series.rule.timezone || DEFAULT_EVENT_TIME_ZONE;

  // A cancelled or archived series produces nothing at all.
  if (series.status === "cancelled" || series.status === "archived") return [];

  const problems = validateRecurrenceRule(series.rule);
  if (problems.length > 0) {
    throw new RangeError(`Cannot expand series ${series.id}: ${problems.join(" ")}`);
  }
  if (!isValidTimeOfDay(series.startTime)) {
    throw new RangeError(`Cannot expand series ${series.id}: invalid start time "${series.startTime}".`);
  }

  const fromMs = range.from.getTime();
  const toMs = range.to.getTime();
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs < fromMs) return [];
  if ((toMs - fromMs) / MS_PER_DAY > MAX_EXPANSION_WINDOW_DAYS) {
    throw new RangeError(
      `Expansion window of ${Math.round((toMs - fromMs) / MS_PER_DAY)} days exceeds the ${MAX_EXPANSION_WINDOW_DAYS}-day maximum.`
    );
  }

  const { hour, minute } = parseTimeOfDay(series.startTime);
  const durationMinutes = Math.max(1, Math.trunc(series.durationMinutes || 0));
  const termIds = [...(series.defaultTermIds ?? [])];

  /** Series-local date key → the absolute instants of an occurrence on that date. */
  const instantsFor = (dateKey: string): { startsAt: Date; endsAt: Date } => {
    const date = dateKeyToUtcDate(dateKey);
    const startsAt = wallClockToInstant(
      { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate(), hour, minute },
      timezone
    );
    return { startsAt, endsAt: new Date(startsAt.getTime() + durationMinutes * 60_000) };
  };

  const inRange = (instant: Date): boolean => {
    const ms = instant.getTime();
    return ms >= fromMs && ms <= toMs;
  };

  const build = (
    occurrenceDate: string,
    startsAt: Date,
    endsAt: Date,
    state: Occurrence["state"],
    movedToDate: string | null,
    reasonAr: string | null,
    reasonEn: string | null
  ): Occurrence => ({
    seriesId: series.id,
    occurrenceDate,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    timezone,
    venueId: series.defaultVenueId ?? null,
    termIds,
    state,
    movedToDate,
    reasonAr,
    reasonEn,
    titleAr: series.titleAr ?? null,
    titleEn: series.titleEn ?? null,
  });

  const myExceptions = exceptions.filter((exception) => exception.seriesId === series.id);
  const exceptionByDate = new Map<string, OccurrenceException>();
  for (const exception of myExceptions) {
    exceptionByDate.set(exception.occurrenceDate, exception);
  }

  /**
   * Occurrences, keyed by identity so a move can never be listed twice:
   *   `<date>`        — the occurrence as it will actually happen (or was cancelled)
   *   `<date>@origin` — the VACATED slot of a moved occurrence, only with `includeMovedFrom`
   *                     (otherwise the relocated entry, keyed by the same date, would replace it).
   */
  const byKey = new Map<string, Occurrence>();

  // --- Pass 1: the dates the rule itself produces inside the window ---
  const windowStartKey = occurrenceDateInZone(range.from, timezone);
  const windowEndKey = occurrenceDateInZone(range.to, timezone);
  const firstKey = windowStartKey > series.rule.startDate ? windowStartKey : series.rule.startDate;
  const lastKey = series.rule.endDate && series.rule.endDate < windowEndKey ? series.rule.endDate : windowEndKey;

  for (let key = firstKey; key <= lastKey; key = addDays(key, 1)) {
    if (!matchesRecurrenceRule(series.rule, key)) continue;

    const { startsAt, endsAt } = instantsFor(key);
    const exception = exceptionByDate.get(key);

    if (exception?.kind === "cancelled") {
      if (includeCancelled && inRange(startsAt)) {
        byKey.set(
          key,
          build(key, startsAt, endsAt, "cancelled", null, exception.reasonAr ?? null, exception.reasonEn ?? null)
        );
      }
      continue;
    }

    if (exception?.kind === "moved") {
      if (includeMovedFrom && inRange(startsAt)) {
        byKey.set(
          `${key}@origin`,
          build(key, startsAt, endsAt, "moved", exception.movedToDate, exception.reasonAr ?? null, exception.reasonEn ?? null)
        );
      }
      continue;
    }

    if (inRange(startsAt)) {
      byKey.set(key, build(key, startsAt, endsAt, "scheduled", null, null, null));
    }
  }

  // --- Pass 2: occurrences moved INTO the window from a date outside it ---
  // Pass 1 only walks the window, so a move whose ORIGINAL date lies before `range.from` (or after
  // `range.to`) would otherwise be lost. Each moved exception is therefore applied on its own.
  for (const exception of myExceptions) {
    if (exception.kind !== "moved" || !exception.movedToDate) continue;
    if (!isValidDateKey(exception.movedToDate)) continue;
    if (!matchesRecurrenceRule(series.rule, exception.occurrenceDate)) continue;

    const { startsAt, endsAt } = instantsFor(exception.movedToDate);
    if (!inRange(startsAt)) continue;

    byKey.set(
      exception.occurrenceDate,
      build(
        exception.occurrenceDate,
        startsAt,
        endsAt,
        "scheduled",
        exception.movedToDate,
        exception.reasonAr ?? null,
        exception.reasonEn ?? null
      )
    );
  }

  return [...byKey.values()].sort(
    (a, b) => a.startsAt.localeCompare(b.startsAt) || a.occurrenceDate.localeCompare(b.occurrenceDate)
  );
}
