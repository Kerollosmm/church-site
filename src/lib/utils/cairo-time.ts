// src/lib/utils/cairo-time.ts
// Timezone-aware primitives for parish times.
//
// Every schedule on this portal is local to Alexandria, Egypt, and the seeded timestamps are
// stored as UTC instants. Rendering them by slicing the raw ISO string (or with the build
// machine's timezone) shows the wrong hour, so all parish-facing times go through these helpers
// with an explicit `Africa/Cairo` zone. They are pure and safe to call on the server or in the
// browser; nothing here runs at import time beyond creating formatters.

/** The parish's civil timezone. */
export const PARISH_TIME_ZONE = "Africa/Cairo";

/**
 * `en-US` weekday abbreviations produced by the formatter below, mapped to the JS/Coptic
 * day index used by `DayOfWeekEnum` (0 = Sunday … 6 = Saturday).
 */
const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export interface CairoWallClock {
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

const cairoPartsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: PARISH_TIME_ZONE,
  hourCycle: "h23",
  weekday: "short",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const cairoDisplayFormatter = new Intl.DateTimeFormat("ar-EG", {
  timeZone: PARISH_TIME_ZONE,
  calendar: "gregory",
  numberingSystem: "latn",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Reads the wall clock (calendar date and time) that `Africa/Cairo` shows at `instant`. */
export function getCairoWallClock(instant: Date = new Date()): CairoWallClock {
  const value = (type: Intl.DateTimeFormatPartTypes): string =>
    cairoPartsFormatter.formatToParts(instant).find((part) => part.type === type)?.value ?? "";

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
 * Offset of `Africa/Cairo` (in milliseconds) at `instantMs`, derived from the formatter so the
 * result follows the zone's real DST rules instead of a hard-coded +02:00/+03:00.
 */
function getCairoOffsetMs(instantMs: number): number {
  const instant = Math.floor(instantMs / 1000) * 1000;
  const wall = getCairoWallClock(new Date(instant));
  const asUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second);
  return asUtc - instant;
}

/**
 * Converts a Cairo wall-clock date/time (as a parish schedule lists it) into the absolute
 * instant it denotes. Two passes settle the offset, so times that fall on a DST transition
 * still resolve to the correct instant.
 */
export function cairoWallClockToInstant(wall: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}): Date {
  const naiveUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, 0, 0);
  const firstGuess = naiveUtc - getCairoOffsetMs(naiveUtc);
  return new Date(naiveUtc - getCairoOffsetMs(firstGuess));
}

/**
 * Formats a UTC instant as an Arabic Cairo date and time, e.g. "الجمعة، 11 سبتمبر 2026، 8:00 ص".
 * Returns null for missing or unparsable input so callers can render their own fallback.
 */
export function formatCairoDateTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return cairoDisplayFormatter.format(date);
}
