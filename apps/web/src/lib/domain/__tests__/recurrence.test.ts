// src/lib/domain/__tests__/recurrence.test.ts
// The recurrence engine's contract, as EVIDENCE rather than as prose.
//
// Everything here is pure: no store, no filesystem, no network. The only external dependency is the
// runtime's own IANA timezone data, and the timezone assertions compare against `Intl` directly
// (never against a helper from the module under test) so a wall-clock round trip is genuinely
// independent.

import { describe, expect, it } from "vitest";

import {
  MAX_EXPANSION_WINDOW_DAYS,
  expandSeries,
  validateRecurrenceRule,
  type ExpandableSeries,
  type Occurrence,
  type OccurrenceException,
} from "@/lib/domain/recurrence";
import type { RecurrenceRule } from "@/lib/domain/types";

const CAIRO = "Africa/Cairo";
const MS_PER_DAY = 86_400_000;

/** A Monday-anchored window is never used here: every window is an absolute instant range. */
const OCT_2026 = { from: new Date("2026-10-01T00:00:00.000Z"), to: new Date("2026-10-31T23:59:59.000Z") };

function rule(overrides: Partial<RecurrenceRule> = {}): RecurrenceRule {
  return {
    freq: "weekly",
    interval: 1,
    byWeekday: [0], // Sunday
    byMonthDay: null,
    startDate: "2026-10-01",
    endDate: null,
    timezone: CAIRO,
    ...overrides,
  };
}

function series(overrides: Partial<ExpandableSeries> = {}): ExpandableSeries {
  return {
    id: "series-1",
    titleAr: "قداس الجمعة الرئيسي",
    titleEn: null,
    rule: rule(),
    startTime: "07:00",
    durationMinutes: 90,
    ...overrides,
  };
}

function cancelled(occurrenceDate: string, reasonAr: string | null = null): OccurrenceException {
  return { seriesId: "series-1", occurrenceDate, kind: "cancelled", movedToDate: null, reasonAr };
}

function moved(occurrenceDate: string, movedToDate: string): OccurrenceException {
  return { seriesId: "series-1", occurrenceDate, kind: "moved", movedToDate, reasonAr: "تعارض مع مناسبة" };
}

/** The Cairo wall clock a UTC instant shows — computed with `Intl`, independently of the engine. */
function cairoWallClock(instant: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: CAIRO,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(instant));
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")} ${value("hour")}:${value("minute")}`;
}

const dates = (occurrences: readonly Occurrence[]) => occurrences.map((occurrence) => occurrence.occurrenceDate);

describe("expandSeries — weekly expansion across a month", () => {
  it("produces the four Sundays of October 2026 in Cairo, at the series' own wall clock", () => {
    const occurrences = expandSeries(series(), [], OCT_2026);

    expect(occurrences).toHaveLength(4);
    expect(dates(occurrences)).toEqual(["2026-10-04", "2026-10-11", "2026-10-18", "2026-10-25"]);

    // 07:00 Cairo in October is UTC+03:00, so every occurrence starts at 04:00Z.
    expect(occurrences.map((occurrence) => occurrence.startsAt)).toEqual([
      "2026-10-04T04:00:00.000Z",
      "2026-10-11T04:00:00.000Z",
      "2026-10-18T04:00:00.000Z",
      "2026-10-25T04:00:00.000Z",
    ]);
    expect(occurrences.map((occurrence) => occurrence.endsAt)).toEqual([
      "2026-10-04T05:30:00.000Z",
      "2026-10-11T05:30:00.000Z",
      "2026-10-18T05:30:00.000Z",
      "2026-10-25T05:30:00.000Z",
    ]);
    for (const occurrence of occurrences) {
      expect(occurrence.state).toBe("scheduled");
      expect(occurrence.timezone).toBe(CAIRO);
      expect(occurrence.seriesId).toBe("series-1");
      expect(occurrence.movedToDate).toBeNull();
      expect(occurrence.titleAr).toBe("قداس الجمعة الرئيسي");
    }
  });

  it("carries the series venue and default terms onto every occurrence", () => {
    const occurrences = expandSeries(series({ defaultVenueId: "venue-1", defaultTermIds: ["t1", "t2"] }), [], OCT_2026);

    expect(occurrences).toHaveLength(4);
    for (const occurrence of occurrences) {
      expect(occurrence.venueId).toBe("venue-1");
      expect(occurrence.termIds).toEqual(["t1", "t2"]);
    }
  });

  it("honours the interval by counting weeks from the week containing startDate", () => {
    // startDate is itself a Sunday, so occurrences land on weeks 0, 2, 4 …
    const everyOtherWeek = series({
      rule: rule({ interval: 2, startDate: "2026-10-04" }),
    });
    const occurrences = expandSeries(everyOtherWeek, [], {
      from: new Date("2026-10-01T00:00:00.000Z"),
      to: new Date("2026-11-15T23:59:59.000Z"),
    });

    expect(dates(occurrences)).toEqual(["2026-10-04", "2026-10-18", "2026-11-01", "2026-11-15"]);
  });

  it("never emits an occurrence before the series' start date", () => {
    const occurrences = expandSeries(series({ rule: rule({ startDate: "2026-10-18" }) }), [], OCT_2026);

    expect(dates(occurrences)).toEqual(["2026-10-18", "2026-10-25"]);
  });
});

describe("expandSeries — monthly rule", () => {
  it("produces one occurrence on byMonthDay at the series' wall clock", () => {
    const monthly = series({
      rule: rule({ freq: "monthly", byWeekday: [], byMonthDay: 15, startDate: "2026-01-15" }),
      startTime: "18:30",
      durationMinutes: 60,
    });

    const occurrences = expandSeries(monthly, [], OCT_2026);

    expect(occurrences).toHaveLength(1);
    expect(occurrences[0].occurrenceDate).toBe("2026-10-15");
    // 18:30 in Cairo in October 2026 is UTC+03:00.
    expect(occurrences[0].startsAt).toBe("2026-10-15T15:30:00.000Z");
    expect(occurrences[0].endsAt).toBe("2026-10-15T16:30:00.000Z");
    expect(cairoWallClock(occurrences[0].startsAt)).toBe("2026-10-15 18:30");
  });

  it("SKIPS a month that has no such day instead of clamping onto another one", () => {
    const lastDayOfMonth = series({
      rule: rule({ freq: "monthly", byWeekday: [], byMonthDay: 31, startDate: "2026-01-31" }),
      startTime: "18:30",
      durationMinutes: 60,
    });

    const february = expandSeries(lastDayOfMonth, [], {
      from: new Date("2027-02-01T00:00:00.000Z"),
      to: new Date("2027-02-28T23:59:59.000Z"),
    });
    expect(february).toEqual([]);

    const march = expandSeries(lastDayOfMonth, [], {
      from: new Date("2027-03-01T00:00:00.000Z"),
      to: new Date("2027-03-31T23:59:59.000Z"),
    });
    expect(dates(march)).toEqual(["2027-03-31"]);
    expect(march[0].startsAt).toBe("2027-03-31T16:30:00.000Z"); // Cairo is UTC+02:00 in March
    expect(cairoWallClock(march[0].startsAt)).toBe("2027-03-31 18:30");
  });
});

describe("expandSeries — single-occurrence exceptions", () => {
  it("cancelling one occurrence removes it from the effective set", () => {
    const occurrences = expandSeries(series(), [cancelled("2026-10-11", "جنازة")], OCT_2026);

    expect(dates(occurrences)).toEqual(["2026-10-04", "2026-10-18", "2026-10-25"]);
  });

  it("includeCancelled surfaces the deviation itself, with its reason", () => {
    const occurrences = expandSeries(series(), [cancelled("2026-10-11", "جنازة")], OCT_2026, {
      includeCancelled: true,
    });

    expect(occurrences).toHaveLength(4);
    const deviating = occurrences.find((occurrence) => occurrence.occurrenceDate === "2026-10-11");
    expect(deviating?.state).toBe("cancelled");
    expect(deviating?.reasonAr).toBe("جنازة");
    // The cancelled occurrence keeps its ruled start instant — that is what was called off.
    expect(deviating?.startsAt).toBe("2026-10-11T04:00:00.000Z");
  });

  it("moving one occurrence makes the VACATED slot disappear and the NEW date appear", () => {
    // The 11th is called off and the 18th is moved to the 21st: three effective occurrences, no more.
    const occurrences = expandSeries(series(), [cancelled("2026-10-11"), moved("2026-10-18", "2026-10-21")], OCT_2026);

    expect(occurrences).toHaveLength(3);
    expect(occurrences.map((occurrence) => occurrence.startsAt.slice(0, 10))).toEqual([
      "2026-10-04",
      "2026-10-21",
      "2026-10-25",
    ]);

    // The moved occurrence keeps the identity of the slot it replaces — `occurrenceDate` is still the
    // 18th — while it HAPPENS on the 21st.
    expect(dates(occurrences)).toEqual(["2026-10-04", "2026-10-18", "2026-10-25"]);
    const relocated = occurrences.find((occurrence) => occurrence.occurrenceDate === "2026-10-18");
    expect(relocated?.movedToDate).toBe("2026-10-21");
    expect(relocated?.state).toBe("scheduled");
    expect(relocated?.startsAt).toBe("2026-10-21T04:00:00.000Z");
    expect(cairoWallClock(relocated?.startsAt ?? "")).toBe("2026-10-21 07:00");

    // Nothing at all happens on either vacated date, and no date is visited twice.
    for (const occurrence of occurrences) {
      expect(occurrence.startsAt.startsWith("2026-10-11")).toBe(false);
      expect(occurrence.startsAt.startsWith("2026-10-18")).toBe(false);
    }
    expect(new Set(occurrences.map((occurrence) => occurrence.startsAt)).size).toBe(3);
  });

  it("includeMovedFrom adds the vacated slot back WITHOUT swallowing the relocated occurrence", () => {
    // This is the regression the engine was fixed for: both entries used to share one map key, so the
    // original slot was lost the moment it was asked for. Exactly two entries must carry the 18th.
    const occurrences = expandSeries(series(), [moved("2026-10-18", "2026-10-21")], OCT_2026, {
      includeMovedFrom: true,
    });

    expect(occurrences).toHaveLength(5);
    const onTheEighteenth = occurrences.filter((occurrence) => occurrence.occurrenceDate === "2026-10-18");
    expect(onTheEighteenth).toHaveLength(2);

    const origin = onTheEighteenth.find((occurrence) => occurrence.state === "moved");
    const relocated = onTheEighteenth.find((occurrence) => occurrence.state === "scheduled");
    expect(origin?.startsAt).toBe("2026-10-18T04:00:00.000Z");
    expect(origin?.movedToDate).toBe("2026-10-21");
    expect(relocated?.startsAt).toBe("2026-10-21T04:00:00.000Z");
  });

  it("applies a move whose ORIGINAL date sits outside the window", () => {
    // Pass 2 of the engine: the occurrence was ruled for a date before `from`, then moved into view.
    const occurrences = expandSeries(series(), [moved("2026-10-25", "2026-11-08")], {
      from: new Date("2026-11-01T00:00:00.000Z"),
      to: new Date("2026-11-30T23:59:59.000Z"),
    });

    expect(dates(occurrences)).toContain("2026-10-25");
    const relocated = occurrences.find((occurrence) => occurrence.occurrenceDate === "2026-10-25");
    expect(relocated?.startsAt).toBe("2026-11-08T05:00:00.000Z"); // Cairo is UTC+02:00 in November
  });

  it("ignores exceptions belonging to another series", () => {
    const foreign: OccurrenceException = {
      seriesId: "series-OTHER",
      occurrenceDate: "2026-10-11",
      kind: "cancelled",
      movedToDate: null,
    };

    expect(dates(expandSeries(series(), [foreign], OCT_2026))).toHaveLength(4);
  });
});

describe("expandSeries — whole-series cancellation", () => {
  it("a cancelled series expands to nothing", () => {
    expect(expandSeries(series({ status: "cancelled" }), [], OCT_2026)).toEqual([]);
  });

  it("an archived series expands to nothing", () => {
    expect(expandSeries(series({ status: "archived" }), [], OCT_2026)).toEqual([]);
  });

  it("a published series still expands", () => {
    expect(expandSeries(series({ status: "published" }), [], OCT_2026)).toHaveLength(4);
  });
});

describe("expandSeries — timezone correctness (Africa/Cairo)", () => {
  it("keeps 07:00 Cairo across the October DST change, so the UTC stamp moves", () => {
    const occurrences = expandSeries(
      series({ rule: rule({ byWeekday: [3], startDate: "2026-10-01" }) }), // Wednesdays
      [],
      { from: new Date("2026-10-01T00:00:00.000Z"), to: new Date("2026-11-30T23:59:59.000Z") }
    );

    expect(occurrences.length).toBeGreaterThanOrEqual(8);

    // Every single occurrence reads 07:00 on the parish's clock …
    for (const occurrence of occurrences) {
      expect(cairoWallClock(occurrence.startsAt)).toMatch(/ 07:00$/);
    }

    // … and the UTC hour is NOT constant: DST ends in late October, so the offset changes. A
    // fixed-offset implementation would produce one value here, not two.
    const utcHours = new Set(occurrences.map((occurrence) => occurrence.startsAt.slice(11, 16)));
    expect([...utcHours].sort()).toEqual(["04:00", "05:00"]);
  });

  it("expands in the SERIES' zone, not the parish default", () => {
    // 09:00 in London on 2026-10-04 is 08:00Z (BST, UTC+01:00) — nothing to do with Cairo.
    const london = series({
      rule: rule({ timezone: "Europe/London" }),
      startTime: "09:00",
      durationMinutes: 30,
    });

    const occurrences = expandSeries(london, [], OCT_2026);
    expect(occurrences[0].startsAt).toBe("2026-10-04T08:00:00.000Z");
    expect(occurrences[0].timezone).toBe("Europe/London");
  });

  it("REJECTS a rule with no zone rather than silently assuming one", () => {
    // `expandSeries` has a `|| DEFAULT_EVENT_TIME_ZONE` fallback, but `validateRecurrenceRule()` runs
    // first and an empty zone is not a valid IANA zone — so a zone-less rule fails closed. This test
    // pins the behaviour a caller actually observes.
    const noZone = series({ rule: { ...rule(), timezone: "" } });

    expect(validateRecurrenceRule(noZone.rule)).toContain("المنطقة الزمنية للسلسلة غير معروفة.");
    expect(() => expandSeries(noZone, [], OCT_2026)).toThrow(RangeError);
  });
});

describe("expandSeries — guards", () => {
  it("throws a RangeError for a window larger than MAX_EXPANSION_WINDOW_DAYS instead of truncating", () => {
    const from = new Date("2026-01-01T00:00:00.000Z");
    const tooWide = new Date(from.getTime() + (MAX_EXPANSION_WINDOW_DAYS + 1) * MS_PER_DAY);

    expect(() => expandSeries(series(), [], { from, to: tooWide })).toThrow(RangeError);
    expect(() => expandSeries(series(), [], { from, to: tooWide })).toThrow(/exceeds the 731-day maximum/);
  });

  it("allows a window of exactly MAX_EXPANSION_WINDOW_DAYS", () => {
    const from = new Date("2026-01-01T00:00:00.000Z");
    const atLimit = new Date(from.getTime() + MAX_EXPANSION_WINDOW_DAYS * MS_PER_DAY);

    expect(() => expandSeries(series(), [], { from, to: atLimit })).not.toThrow();
  });

  it("returns nothing for a reversed or non-finite window", () => {
    expect(
      expandSeries(series(), [], { from: new Date("2026-10-31T00:00:00.000Z"), to: new Date("2026-10-01T00:00:00.000Z") })
    ).toEqual([]);
    expect(expandSeries(series(), [], { from: new Date(Number.NaN), to: new Date("2026-10-31T00:00:00.000Z") })).toEqual(
      []
    );
  });

  it("refuses to expand an unusable rule rather than guessing", () => {
    const broken = series({ rule: rule({ endDate: "2026-09-01" }) }); // end before start

    expect(() => expandSeries(broken, [], OCT_2026)).toThrow(RangeError);
    expect(validateRecurrenceRule(broken.rule)).toContain("تاريخ نهاية السلسلة يسبق تاريخ بدايتها.");
  });

  it("refuses an unparsable start time", () => {
    expect(() => expandSeries(series({ startTime: "25:99" }), [], OCT_2026)).toThrow(RangeError);
  });
});
