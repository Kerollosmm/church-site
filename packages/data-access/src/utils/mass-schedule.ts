// src/lib/utils/mass-schedule.ts
// Derivation of the next liturgy from the real weekly schedule.
//
// The home page used to show a decorative countdown with a hard-coded "next mass" time, which
// could contradict the published schedule. Everything displayed about the next liturgy is
// derived here from `mass_schedules` rows (database or seeded fallback) and resolved in
// `Africa/Cairo`, the parish's timezone: no invented times, no invented days.

import type { DayOfWeekEnum } from "@church-site/domain";
import { cairoWallClockToInstant, getCairoWallClock } from "./cairo-time";

/** JS day index (0 = Sunday) for each weekday of the schedule. */
export const DAY_OF_WEEK_INDEX: Record<DayOfWeekEnum, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

/** Arabic name of each weekday of the schedule (single source for the /masses views too). */
export const DAY_OF_WEEK_LABELS_AR: Record<DayOfWeekEnum, string> = {
  Sunday: "الأحد",
  Monday: "الإثنين",
  Tuesday: "الثلاثاء",
  Wednesday: "الأربعاء",
  Thursday: "الخميس",
  Friday: "الجمعة",
  Saturday: "السبت",
};

/**
 * The fields of a `mass_schedules` row this module needs. Structural on purpose: it accepts
 * both the seeded rows and the database rows returned by `getWeeklyMasses()`.
 */
export interface ScheduledMassLike {
  day_of_week: DayOfWeekEnum;
  /** "HH:MM:SS", local Cairo time. */
  start_time: string;
  title_ar: string;
  altar?: { name_ar: string } | null;
  altar_name_ar?: string | null;
}

export interface NextMass {
  /** Absolute instant of the start, as an ISO string (safe to pass to client components). */
  startsAtIso: string;
  titleAr: string;
  altarNameAr: string | null;
  /** "اليوم" (today), "غداً" (tomorrow) or the Arabic weekday name. */
  dayLabelAr: string;
  /** Cairo time of the start, e.g. "06:00 ص". */
  timeLabelAr: string;
}

/** Parses "HH:MM:SS" into hours and minutes. */
function parseTimeOfDay(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(":");
  return { hour: Number(hour) || 0, minute: Number(minute) || 0 };
}

/** Formats a 24-hour wall clock as an Arabic 12-hour label, e.g. "06:00 ص". */
function formatTimeLabelAr(hour: number, minute: number): string {
  const period = hour < 12 ? "ص" : "م";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${period}`;
}

/**
 * Finds the next upcoming liturgy at or after `now`, or null when the schedule is empty
 * (or every entry is inactive, in which case the caller renders nothing rather than a guess).
 * Weekly recurring liturgies repeat every seven days, so the search never needs to look further.
 */
export function getNextMass(
  masses: readonly ScheduledMassLike[],
  now: Date = new Date()
): NextMass | null {
  if (masses.length === 0) return null;

  const today = getCairoWallClock(now);
  const startOfTodayUtc = Date.UTC(today.year, today.month - 1, today.day);

  for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
    const weekday = (today.weekday + dayOffset) % 7;
    const dayMasses = masses
      .map((mass) => ({ mass, time: parseTimeOfDay(mass.start_time) }))
      .filter(({ mass }) => DAY_OF_WEEK_INDEX[mass.day_of_week] === weekday);
    if (dayMasses.length === 0) continue;

    // Calendar date of the candidate day, read off the Cairo date we started from.
    const candidateDate = new Date(startOfTodayUtc + dayOffset * 86_400_000);
    const dateParts = {
      year: candidateDate.getUTCFullYear(),
      month: candidateDate.getUTCMonth() + 1,
      day: candidateDate.getUTCDate(),
    };

    const upcoming = dayMasses
      .map(({ mass, time }) => ({
        mass,
        time,
        startsAt: cairoWallClockToInstant({ ...dateParts, hour: time.hour, minute: time.minute }),
      }))
      .filter(({ startsAt }) => startsAt.getTime() > now.getTime())
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

    const next = upcoming[0];
    if (!next) continue;

    const dayLabelAr =
      dayOffset === 0
        ? "اليوم"
        : dayOffset === 1
          ? "غداً"
          : DAY_OF_WEEK_LABELS_AR[next.mass.day_of_week];

    return {
      startsAtIso: next.startsAt.toISOString(),
      titleAr: next.mass.title_ar,
      altarNameAr: next.mass.altar?.name_ar ?? next.mass.altar_name_ar ?? null,
      dayLabelAr,
      timeLabelAr: formatTimeLabelAr(next.time.hour, next.time.minute),
    };
  }

  return null;
}
