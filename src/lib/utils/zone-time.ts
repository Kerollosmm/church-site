// src/lib/utils/zone-time.ts
// Generic IANA-timezone wall-clock primitives — the single low-level source for every
// "wall clock ⇄ instant" conversion in the project.
//
// WHY GENERIC: the parish's own display timezone (`Africa/Cairo`) is only ONE of the zones this
// portal needs. `event_series` rows carry a per-series timezone (BACKEND §9.1 rule: parish times
// are `Africa/Cairo`, but a series may legitimately be authored in another zone), and the
// recurrence engine has to expand occurrences in the SERIES' zone, not the host's. Rather than a
// second implementation drifting next to `cairo-time.ts`, the zone-aware math lives here and the
// Cairo helpers delegate to it (`src/lib/utils/cairo-time.ts`).
//
// No dependencies, no dynamic APIs, no import-time work beyond a lazily filled formatter cache.

/** Milliseconds in a day — calendar arithmetic on date keys is done in UTC on purpose. */
export const MS_PER_DAY = 86_400_000;

/** `en-US` weekday abbreviations produced by the formatters below → JS day index (0 = Sunday). */
const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export interface WallClock {
  year: number;
  /** 1-12 */
  month: number;
  /** 1-31 */
  day: number;
  hour: number;
  minute: number;
  second: number;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
}

/** One formatter per zone, built on first use (Intl construction is expensive in a loop). */
const partsFormatters = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = partsFormatters.get(timeZone);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  partsFormatters.set(timeZone, formatter);
  return formatter;
}

/** Reads the wall clock (calendar date and time) that `timeZone` shows at `instant`. */
export function getWallClock(instant: Date, timeZone: string): WallClock {
  const parts = partsFormatter(timeZone).formatToParts(instant);
  const value = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: Number(value("year")),
    month: Number(value("month")),
    day: Number(value("day")),
    hour: Number(value("hour")),
    minute: Number(value("minute")),
    second: Number(value("second")),
    weekday: WEEKDAY_INDEX[value("weekday")] ?? 0,
  };
}

/**
 * Offset of `timeZone` (in milliseconds) at `instantMs`, derived from the formatter so the result
 * follows the zone's real DST rules instead of a hard-coded offset.
 */
export function getZoneOffsetMs(instantMs: number, timeZone: string): number {
  const instant = Math.floor(instantMs / 1000) * 1000;
  const wall = getWallClock(new Date(instant), timeZone);
  const asUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second);
  return asUtc - instant;
}

/**
 * Converts a wall-clock date/time in `timeZone` into the absolute instant it denotes.
 * Two passes settle the offset, so times on a DST transition resolve correctly.
 *
 * A wall-clock time that does not exist on that date (the spring-forward gap, e.g. 00:00 in Cairo)
 * has no exact instant; the returned instant is the first real one after the gap, which is the
 * conventional resolution.
 */
export function wallClockToInstant(
  wall: { year: number; month: number; day: number; hour: number; minute: number },
  timeZone: string
): Date {
  const naiveUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, 0, 0);
  const firstGuess = naiveUtc - getZoneOffsetMs(naiveUtc, timeZone);
  return new Date(naiveUtc - getZoneOffsetMs(firstGuess, timeZone));
}
