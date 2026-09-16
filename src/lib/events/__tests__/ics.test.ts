// src/lib/events/__tests__/ics.test.ts
// The iCalendar writer — the file a visitor downloads to their phone.
//
// Two failures matter here and both are silent in a calendar app: a wrong instant (an event that
// shows up an hour early) and a line folded through the middle of a multi-byte character (Arabic
// rendered as mojibake). Both are asserted explicitly, plus the RFC 5545 structural requirements and
// a generic "no physical line exceeds 75 octets" sweep over the whole document.

import { describe, expect, it } from "vitest";

import { buildIcsCalendar, icsUtcStamp } from "@/lib/events/ics";

const CRLF = "\r\n";

/** Splits the document into PHYSICAL lines (what the 75-octet limit applies to). */
function physicalLines(ics: string): string[] {
  return ics.split(CRLF);
}

/** Undoes RFC 5545 folding: a CRLF followed by a single space re-joins two physical lines. */
function unfold(ics: string): string {
  return ics.replace(/\r\n[ ]/g, "");
}

/** The value of an unfolded `NAME:value` line, or null when the property is absent. */
function property(ics: string, name: string): string | null {
  const line = unfold(ics)
    .split(CRLF)
    .find((candidate) => candidate.startsWith(`${name}:`));
  return line ? line.slice(name.length + 1) : null;
}

const event = {
  uid: "event-m0000000-1",
  title: "قداس الجمعة الرئيسي الشامل",
  description: "قداس الجمعة الرئيسي الشامل بالمذبح القبلي.",
  location: "المذبح القبلي",
  url: "https://parish.test/events/friday-liturgy",
  startsAt: "2026-10-04T04:00:00.000Z",
  endsAt: "2026-10-04T05:30:00.000Z",
};

describe("icsUtcStamp", () => {
  it("converts an ISO instant to the RFC 5545 UTC form", () => {
    expect(icsUtcStamp("2026-10-04T04:00:00.000Z")).toBe("20261004T040000Z");
    expect(icsUtcStamp(new Date("2026-10-04T04:00:00.000Z"))).toBe("20261004T040000Z");
  });

  it("normalises a non-UTC offset to UTC rather than keeping the wall clock", () => {
    // 07:00 in Cairo (UTC+03:00) IS 04:00Z — the stamp must say so.
    expect(icsUtcStamp("2026-10-04T07:00:00+03:00")).toBe("20261004T040000Z");
  });

  it("returns an empty string for an unparsable value", () => {
    expect(icsUtcStamp("not-a-date")).toBe("");
    expect(icsUtcStamp("")).toBe("");
  });
});

describe("buildIcsCalendar — the document a calendar app must accept", () => {
  const ics = buildIcsCalendar([event], { calendarName: "كنيسة القديسين مكسيموس ودوماديوس" });

  it("opens and closes a VCALENDAR with the required properties", () => {
    const lines = unfold(ics).split(CRLF);

    expect(lines[0]).toBe("BEGIN:VCALENDAR");
    expect(lines).toContain("VERSION:2.0");
    expect(lines).toContain("CALSCALE:GREGORIAN");
    expect(lines).toContain("METHOD:PUBLISH");
    expect(ics).toContain("PRODID:-//Church of Saints Maximus & Domadius//Parish Portal//AR");
    expect(lines[lines.length - 2]).toBe("END:VCALENDAR");
  });

  it("carries the calendar name and timezone hints", () => {
    expect(property(ics, "X-WR-CALNAME")).toBe("كنيسة القديسين مكسيموس ودوماديوس");
    expect(property(ics, "X-WR-TIMEZONE")).toBe("Africa/Cairo");
  });

  it("wraps exactly one VEVENT with the fields a calendar needs", () => {
    const lines = unfold(ics).split(CRLF);

    expect(lines.filter((line) => line === "BEGIN:VEVENT")).toHaveLength(1);
    expect(lines.filter((line) => line === "END:VEVENT")).toHaveLength(1);

    expect(property(ics, "UID")).toBe("event-m0000000-1@parish-portal");
    expect(property(ics, "SUMMARY")).toBe(event.title);
    expect(property(ics, "DESCRIPTION")).toBe(event.description);
    expect(property(ics, "LOCATION")).toBe(event.location);
    expect(property(ics, "URL")).toBe(event.url);
    expect(property(ics, "DTSTAMP")).toMatch(/^\d{8}T\d{6}Z$/);
  });

  it("writes absolute UTC timestamps — no TZID, no VTIMEZONE, no local wall clock", () => {
    expect(property(ics, "DTSTART")).toBe("20261004T040000Z");
    expect(property(ics, "DTEND")).toBe("20261004T053000Z");
    expect(ics).not.toContain("TZID");
    expect(ics).not.toContain("VTIMEZONE");
    expect(ics).not.toContain("20261004T070000");
  });

  it("uses CRLF line endings throughout and ends with one", () => {
    expect(ics.endsWith(CRLF)).toBe(true);
    // A lone LF (or a lone CR) is not allowed anywhere in the file.
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
  });

  it("keeps every physical line within the 75-octet limit", () => {
    for (const line of physicalLines(ics)) {
      expect(Buffer.byteLength(line, "utf8"), `line over 75 octets: ${line}`).toBeLessThanOrEqual(75);
    }
  });
});

/** The physical lines one property occupies: its first line plus every continuation line. */
function physicalLinesOf(ics: string, name: string): string[] {
  const lines = physicalLines(ics);
  const start = lines.findIndex((line) => line.startsWith(`${name}:`));
  if (start < 0) return [];
  let end = start + 1;
  while (end < lines.length && lines[end].startsWith(" ")) end += 1;
  return lines.slice(start, end);
}

describe("buildIcsCalendar — folding never splits a multi-byte character", () => {
  // ~76 Arabic letters/spaces ⇒ ~140 octets, so this line MUST be folded and MUST survive the fold.
  const longTitle =
    "قداس عيد النيروز ورأس السنة القبطية المباركة بحضور الآباء الكهنة والشمامسة والخورس";
  const ics = buildIcsCalendar([{ uid: "long-1", title: longTitle, startsAt: "2026-09-11T04:00:00.000Z" }]);

  it("writes a title longer than one physical line", () => {
    const summaryLines = physicalLinesOf(ics, "SUMMARY");

    expect(summaryLines.length).toBeGreaterThan(1);
    for (const line of summaryLines) {
      expect(Buffer.byteLength(line, "utf8")).toBeLessThanOrEqual(75);
    }
  });

  it("unfolds back to the exact original title — every letter intact", () => {
    expect(unfold(ics)).toContain(`SUMMARY:${longTitle}`);
    expect(property(ics, "SUMMARY")).toBe(longTitle);
  });

  it("has no replacement character or truncated byte sequence", () => {
    expect(ics).not.toContain("\uFFFD");
    // Re-encoding the unfolded document must round-trip byte for byte.
    expect(Buffer.from(ics, "utf8").toString("utf8")).toBe(ics);
  });
});

describe("buildIcsCalendar — escaping and edge cases", () => {
  it("escapes the TEXT characters RFC 5545 reserves", () => {
    const ics = buildIcsCalendar([
      {
        uid: "escape-1",
        title: "قداس, نهضة; شفاء",
        description: "سطر أول\nسطر ثانٍ مع \\ شرطة مائلة",
        startsAt: "2026-10-04T04:00:00.000Z",
      },
    ]);

    expect(property(ics, "SUMMARY")).toBe("قداس\\, نهضة\\; شفاء");
    expect(property(ics, "DESCRIPTION")).toBe("سطر أول\\nسطر ثانٍ مع \\\\ شرطة مائلة");
  });

  it("leaves Arabic punctuation alone — only the ASCII reserved characters are escaped", () => {
    const ics = buildIcsCalendar([
      { uid: "arabic-punctuation", title: "قداس، نهضة؛ شفاء", startsAt: "2026-10-04T04:00:00.000Z" },
    ]);

    expect(property(ics, "SUMMARY")).toBe("قداس، نهضة؛ شفاء");
  });

  it("leaves a URL unescaped — it is a URI value, not TEXT", () => {
    const ics = buildIcsCalendar([
      { uid: "url-1", title: "x", url: "https://parish.test/a,b?c=1", startsAt: "2026-10-04T04:00:00.000Z" },
    ]);

    expect(property(ics, "URL")).toBe("https://parish.test/a,b?c=1");
  });

  it("omits an optional property instead of writing it empty", () => {
    const ics = buildIcsCalendar([{ uid: "minimal-1", title: "قداس", startsAt: "2026-10-04T04:00:00.000Z" }]);

    expect(ics).not.toContain("DESCRIPTION");
    expect(ics).not.toContain("LOCATION");
    expect(ics).not.toContain("URL");
    expect(ics).toContain("SUMMARY:قداس");
  });

  it("SKIPS an entry whose start instant cannot be parsed rather than inventing a date", () => {
    const ics = buildIcsCalendar([
      { uid: "broken-1", title: "بلا تاريخ", startsAt: "not-a-date" },
      event,
    ]);

    expect(ics).not.toContain("broken-1");
    expect(ics).not.toContain("بلا تاريخ");
    expect(unfold(ics)).toContain("UID:event-m0000000-1@parish-portal");
    expect(unfold(ics).split(CRLF).filter((line) => line === "BEGIN:VEVENT")).toHaveLength(1);
  });

  it("gives an open-ended event a one-hour duration", () => {
    const ics = buildIcsCalendar([{ uid: "open-1", title: "قداس", startsAt: "2026-10-04T04:00:00.000Z" }]);

    expect(property(ics, "DTSTART")).toBe("20261004T040000Z");
    expect(property(ics, "DTEND")).toBe("20261004T050000Z");
  });

  it("still produces a valid, empty calendar for no events at all", () => {
    const ics = buildIcsCalendar([]);

    expect(ics.startsWith(`BEGIN:VCALENDAR${CRLF}`)).toBe(true);
    expect(ics).not.toContain("BEGIN:VEVENT");
    expect(ics).toContain(`END:VCALENDAR${CRLF}`);
  });
});
