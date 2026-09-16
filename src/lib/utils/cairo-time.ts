// src/lib/utils/cairo-time.ts
// Timezone-aware primitives for parish times.
//
// Every schedule on this portal is local to Alexandria, Egypt, and the seeded timestamps are
// stored as UTC instants. Rendering them by slicing the raw ISO string (or with the build
// machine's timezone) shows the wrong hour, so all parish-facing times go through these helpers
// with an explicit `Africa/Cairo` zone. They are pure and safe to call on the server or in the
// browser; nothing here runs at import time beyond creating formatters.
//
// The zone math itself lives in `src/lib/utils/zone-time.ts` (it must also serve event series
// authored in other zones); the functions below are the `Africa/Cairo` bindings of it, so there is
// exactly one implementation of the wall-clock ⇄ instant conversion in the project.

import { getWallClock, wallClockToInstant, type WallClock } from "@/lib/utils/zone-time";

/** The parish's civil timezone. */
export const PARISH_TIME_ZONE = "Africa/Cairo";

export type CairoWallClock = WallClock;

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
  return getWallClock(instant, PARISH_TIME_ZONE);
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
  return wallClockToInstant(wall, PARISH_TIME_ZONE);
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
