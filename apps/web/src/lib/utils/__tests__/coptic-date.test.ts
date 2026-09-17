// src/lib/utils/__tests__/coptic-date.test.ts
// Regression anchors for the Coptic calendar.
//
// WHY ANCHORS AND NOT A DERIVATION: the epoch was wrong by one whole Coptic year until P1.6
// (`copticEpoch` 1824665 → 1825030), which shifted EVERY computed year by +1 and would have printed
// the wrong Coptic date on every page of the portal. These four independently-known Gregorian dates
// are the guard against that class of error returning.
//
// The dates are built with the LOCAL-time `Date` constructor on purpose: `gregorianToCoptic()` reads
// `getFullYear()/getMonth()/getDate()`, so a UTC-parsed string would shift by a day in a negative-UTC
// CI runner and the anchor would fail for the wrong reason.

import { describe, expect, it } from "vitest";

import { COPTIC_MONTHS, getCopticDateString, getCopticFeastInfo, gregorianToCoptic } from "@/lib/utils/coptic-date";

/** Gregorian (year, month 1-12, day) → the Coptic reading the parish publishes. */
function copticOf(year: number, month: number, day: number) {
  return gregorianToCoptic(new Date(year, month - 1, day));
}

describe("gregorianToCoptic — the four known anchors", () => {
  it("2026-09-11 is 1 Thout 1743", () => {
    expect(copticOf(2026, 9, 11)).toMatchObject({ day: 1, month: 1, monthNameAr: "توت", year: 1743 });
  });

  it("2026-01-07 is 29 Kiahk 1742 (Christmas)", () => {
    expect(copticOf(2026, 1, 7)).toMatchObject({ day: 29, month: 4, monthNameAr: "كيهك", year: 1742 });
  });

  it("2025-09-11 is 1 Thout 1742 (the previous Nayrouz)", () => {
    expect(copticOf(2025, 9, 11)).toMatchObject({ day: 1, month: 1, monthNameAr: "توت", year: 1742 });
  });

  it("2026-01-19 is 11 Toba 1742 (Epiphany)", () => {
    expect(copticOf(2026, 1, 19)).toMatchObject({ day: 11, month: 5, monthNameAr: "طوبة", year: 1742 });
  });

  it("one Gregorian year apart is one Coptic year apart — the exact error the old epoch caused", () => {
    expect(copticOf(2026, 9, 11).year - copticOf(2025, 9, 11).year).toBe(1);
  });
});

describe("gregorianToCoptic — calendar shape", () => {
  it("names every month from the single month table", () => {
    const thout = copticOf(2026, 9, 11);
    expect(thout.monthNameEn).toBe("Thout");
    expect(COPTIC_MONTHS[thout.month - 1].nameAr).toBe(thout.monthNameAr);
    expect(COPTIC_MONTHS).toHaveLength(13);
    expect(COPTIC_MONTHS[12].days).toBe(5); // Nasie; 6 in a leap year
  });

  it("advances one Coptic day per Gregorian day across a month boundary", () => {
    const firstOfThout = copticOf(2026, 9, 11); // 1 Thout
    const thirtiethOfThout = copticOf(2026, 10, 10); // +29 days

    expect(firstOfThout.day).toBe(1);
    expect(thirtiethOfThout).toMatchObject({ day: 30, month: 1, year: 1743 });
  });

  it("rolls into the next Coptic month after day 30", () => {
    expect(copticOf(2026, 10, 11)).toMatchObject({ day: 1, month: 2, monthNameAr: "بابه", year: 1743 });
  });
});

describe("getCopticDateString", () => {
  it("writes the date with western digits when asked", () => {
    expect(getCopticDateString(new Date(2026, 0, 7), { westernDigits: true })).toBe("29 كيهك 1742 ش");
  });

  it("writes the date with Eastern Arabic digits by default", () => {
    expect(getCopticDateString(new Date(2026, 0, 7))).toBe("٢٩ كيهك ١٧٤٢ للشهداء");
  });
});

describe("getCopticFeastInfo — fixed feasts follow the same calendar", () => {
  it("agrees with the anchors on Christmas and Epiphany", () => {
    expect(getCopticFeastInfo(new Date(2026, 0, 7)).feastTitleAr).toContain("عيد الميلاد المجيد");
    expect(getCopticFeastInfo(new Date(2026, 0, 19)).feastTitleAr).toContain("عيد الغطاس المجيد");
  });

  it("recognises Nayrouz on 1 Thout", () => {
    expect(getCopticFeastInfo(new Date(2026, 8, 11)).isFeastDay).toBe(true);
    expect(getCopticFeastInfo(new Date(2026, 8, 11)).feastTitleAr).toContain("النيروز");
  });

  it("always answers with a season string", () => {
    expect(getCopticFeastInfo(new Date(2026, 4, 6)).seasonAr.length).toBeGreaterThan(0);
  });
});
