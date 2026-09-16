// src/lib/events/ics.ts
// RFC 5545 (iCalendar) generation for "أضف إلى التقويم" — PURE, zero dependencies, no I/O.
//
// WHY HAND-WRITTEN: the repository has no calendar library and is not going to acquire one. The
// surface the parish needs is small (a download that opens in Google Calendar, Apple Calendar and
// Outlook), and RFC 5545's requirements for it are explicit — so the escaping and the folding below
// are implemented to the letter rather than approximated.
//
// THE TWO REQUIREMENTS THAT ACTUALLY BREAK CALENDARS, both handled here:
//
//  1. EVERY INSTANT IS AN ABSOLUTE UTC STAMP (`DTSTART:20260918T040000Z`). A local-time form
//     (`DTSTART;TZID=…`) is only correct when the file also ships a VTIMEZONE block describing the
//     zone's DST rules, and getting that block wrong makes every occurrence silently shift by an hour
//     after a DST change. An absolute UTC stamp needs no TZID definition and is correct forever, so
//     this module emits no VTIMEZONE at all.
//  2. LINES ARE FOLDED AT 75 OCTETS, NEVER MID-CHARACTER. Arabic is 2 bytes per letter in UTF-8, so
//     folding by `String.length` (UTF-16 units) would cut a letter in half and render "Ù…" garbage in
//     the calendar. The folding below counts BYTES and breaks on character boundaries.
//
// Nothing here depends on the host timezone: every value derives from the ISO instants it is given.

/** RFC 5545 mandates CRLF line endings, on every line and after the last one. */
const CRLF = "\r\n";

/** Maximum length of a physical line, in octets, EXCLUDING the line break. */
const MAX_LINE_OCTETS = 75;

/** Stable suffix on every UID: an occurrence's identity must not change between downloads. */
const UID_SUFFIX = "@parish-portal";

const PRODID = "-//Church of Saints Maximus & Domadius//Parish Portal//AR";
const DEFAULT_CALENDAR_NAME = "Church of Saints Maximus & Domadius";
const DEFAULT_TIME_ZONE = "Africa/Cairo";

/** An event with no end is treated as one hour long — a zero-length entry is invisible in most apps. */
const DEFAULT_DURATION_MS = 60 * 60 * 1000;

/** Counts UTF-8 octets, which is what the 75-octet folding limit is measured in. */
const utf8 = new TextEncoder();

/** One calendar entry. `startsAt`/`endsAt` are absolute ISO instants. */
export interface IcsEventInput {
  /** Stable per occurrence (the feed item's `key`); `@parish-portal` is appended here. */
  uid: string;
  title: string;
  description?: string | null;
  location?: string | null;
  url?: string | null;
  startsAt: string;
  endsAt?: string | null;
}

function parseInstant(value: string | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * An instant as an iCalendar UTC stamp: `"2026-09-18T04:00:00.000Z"` → `"20260918T040000Z"`.
 * Returns "" for an unparsable value so callers can skip the entry instead of writing a broken line.
 */
export function icsUtcStamp(instant: string | Date): string {
  const date = parseInstant(instant);
  if (!date) return "";
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/**
 * TEXT escaping per RFC 5545 §3.3.11. The backslash MUST be escaped first, or it would double-escape
 * the backslashes introduced by the rules that follow it. Real newlines (including CRLF) become the
 * two-character sequence `\n`, which is what a calendar app renders as a line break.
 */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

/**
 * Folds one logical line into physical lines of at most 75 octets, each continuation prefixed with a
 * single space (RFC 5545 §3.1). Iterating the string with `for…of` walks CODE POINTS, so a multi-byte
 * character is never split; the byte counter decides where the break goes.
 */
function foldLine(line: string): string {
  const physical: string[] = [];
  let current = "";
  let octets = 0;
  // A continuation line spends one octet on its leading space, so it holds one byte less.
  let limit = MAX_LINE_OCTETS;

  for (const char of line) {
    const charOctets = utf8.encode(char).length;
    if (octets + charOctets > limit) {
      physical.push(current);
      current = "";
      octets = 0;
      limit = MAX_LINE_OCTETS - 1;
    }
    current += char;
    octets += charOctets;
  }

  physical.push(current);
  return physical.join(`${CRLF} `);
}

/** Appends `NAME:value` when the value carries something, so no empty property is ever written. */
function pushOptional(lines: string[], name: string, value: string | null | undefined): void {
  const trimmed = value?.trim();
  if (!trimmed) return;
  lines.push(`${name}:${escapeText(trimmed)}`);
}

/**
 * Builds a complete VCALENDAR document from a set of events.
 *
 * `X-WR-CALNAME` / `X-WR-TIMEZONE` are the de-facto hints Google/Apple/Outlook use for the calendar's
 * display name and zone (the zone is a display hint only — every stamp in the file is UTC). An entry
 * whose start instant cannot be parsed is SKIPPED rather than approximated: a calendar with a
 * missing date is honest, one with an invented date is not.
 *
 * The returned string uses CRLF line endings throughout and ends with one, as the format requires.
 */
export function buildIcsCalendar(
  events: readonly IcsEventInput[],
  options: { calendarName?: string; timeZone?: string } = {}
): string {
  const calendarName = options.calendarName?.trim() || DEFAULT_CALENDAR_NAME;
  const timeZone = options.timeZone?.trim() || DEFAULT_TIME_ZONE;
  const stamp = icsUtcStamp(new Date());

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    `X-WR-TIMEZONE:${timeZone}`,
  ];

  for (const event of events) {
    const start = parseInstant(event.startsAt);
    if (!start) continue;

    const end = (event.endsAt ? parseInstant(event.endsAt) : null) ?? new Date(start.getTime() + DEFAULT_DURATION_MS);

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${event.uid}${UID_SUFFIX}`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART:${icsUtcStamp(start)}`);
    lines.push(`DTEND:${icsUtcStamp(end)}`);
    lines.push(`SUMMARY:${escapeText(event.title)}`);
    pushOptional(lines, "DESCRIPTION", event.description);
    pushOptional(lines, "LOCATION", event.location);
    // A URI value is not TEXT and is deliberately not escaped: `\,` inside a URL would corrupt it.
    if (event.url?.trim()) lines.push(`URL:${event.url.trim()}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  return `${lines.map(foldLine).join(CRLF)}${CRLF}`;
}
