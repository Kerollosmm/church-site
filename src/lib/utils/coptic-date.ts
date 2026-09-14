// src/lib/utils/coptic-date.ts
// Coptic Orthodox Calendar Engine (Calculations, Formatting & Feasts)

export interface CopticDate {
  day: number;
  month: number;
  monthNameAr: string;
  monthNameEn: string;
  year: number;
}

export const COPTIC_MONTHS = [
  { id: 1, nameAr: "توت", nameEn: "Thout", days: 30 },
  { id: 2, nameAr: "بابه", nameEn: "Paopi", days: 30 },
  { id: 3, nameAr: "هاتور", nameEn: "Hathor", days: 30 },
  { id: 4, nameAr: "كيهك", nameEn: "Kiahk", days: 30 },
  { id: 5, nameAr: "طوبة", nameEn: "Toba", days: 30 },
  { id: 6, nameAr: "أمشير", nameEn: "Meshir", days: 30 },
  { id: 7, nameAr: "برمهات", nameEn: "Paremhat", days: 30 },
  { id: 8, nameAr: "برمودة", nameEn: "Paremoude", days: 30 },
  { id: 9, nameAr: "بشنس", nameEn: "Pashons", days: 30 },
  { id: 10, nameAr: "بؤونة", nameEn: "Paoni", days: 30 },
  { id: 11, nameAr: "أبيب", nameEn: "Epip", days: 30 },
  { id: 12, nameAr: "مسرى", nameEn: "Mesori", days: 30 },
  { id: 13, nameAr: "النسيء", nameEn: "Nasie", days: 5 }, // 6 in leap year
] as const;

/**
 * Converts Gregorian date to Julian Day Number (JDN)
 */
export function gregorianToJdn(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

/**
 * Converts Julian Day Number to Coptic Date
 */
export function jdnToCoptic(jdn: number): CopticDate {
  const copticEpoch = 1824665; // JDN of 1 Thout 1 A.M. (29 Aug 284 AD Julian)
  const d = jdn - copticEpoch;
  const c4 = Math.floor(d / 1461);
  const r4 = d % 1461;
  const c1 = Math.min(Math.floor(r4 / 365), 3);
  const r1 = r4 - c1 * 365;

  const year = 4 * c4 + c1 + 1;
  const month = Math.min(Math.floor(r1 / 30) + 1, 13);
  const day = r1 - (month - 1) * 30 + 1;

  const monthMeta = COPTIC_MONTHS[month - 1] || COPTIC_MONTHS[0];

  return {
    day,
    month,
    monthNameAr: monthMeta.nameAr,
    monthNameEn: monthMeta.nameEn,
    year,
  };
}

/**
 * Converts any JS Date (Gregorian) to CopticDate object
 */
export function gregorianToCoptic(date: Date = new Date()): CopticDate {
  const jdn = gregorianToJdn(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );
  return jdnToCoptic(jdn);
}

/**
 * Returns a localized Arabic string of the Coptic Date
 * e.g. "١٧ طوبة ١٧٤٢ ش" or "17 طوبة 1742 للشهداء"
 */
export function getCopticDateString(date: Date = new Date(), options?: { westernDigits?: boolean }): string {
  const coptic = gregorianToCoptic(date);
  if (options?.westernDigits) {
    return `${coptic.day} ${coptic.monthNameAr} ${coptic.year} ش`;
  }
  const toEasternDigits = (num: number) =>
    num.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d, 10)]);

  return `${toEasternDigits(coptic.day)} ${coptic.monthNameAr} ${toEasternDigits(coptic.year)} للشهداء`;
}

/**
 * Computes Coptic Orthodox Feasts and Season for a given date
 */
export interface CopticFeastInfo {
  isFeastDay: boolean;
  feastTitleAr?: string;
  seasonAr: string;
  fastingLevel: "none" | "fish_allowed" | "strict_abstinence";
}

export function getCopticFeastInfo(date: Date = new Date()): CopticFeastInfo {
  const coptic = gregorianToCoptic(date);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 3 = Wednesday, 5 = Friday

  // Specific Fixed Coptic Feasts (by Coptic month & day)
  if (coptic.month === 1 && coptic.day === 1) {
    return {
      isFeastDay: true,
      feastTitleAr: "عيد النيروز (رأس السنة القبطية المباركة)",
      seasonAr: "تذكار الشهداء الأبرار",
      fastingLevel: "none",
    };
  }
  if (coptic.month === 4 && coptic.day === 29) {
    return {
      isFeastDay: true,
      feastTitleAr: "عيد الميلاد المجيد (٢٩ كيهك)",
      seasonAr: "موسم الميلاد المجيد",
      fastingLevel: "none",
    };
  }
  if (coptic.month === 5 && coptic.day === 11) {
    return {
      isFeastDay: true,
      feastTitleAr: "عيد الغطاس المجيد (عيد الظهور الإلهي)",
      seasonAr: "موسم الغطاس المجيد",
      fastingLevel: "none",
    };
  }
  if (coptic.month === 5 && coptic.day === 13) {
    return {
      isFeastDay: true,
      feastTitleAr: "عرس قانا الجليل",
      seasonAr: "الأعياد السيدية الصغرى",
      fastingLevel: "none",
    };
  }
  if (coptic.month === 5 && coptic.day === 17) {
    return {
      isFeastDay: true,
      feastTitleAr: "عيد القديسين مكسيموس ودوماديوس (شفيعي الكنيسة)",
      seasonAr: "نهضة شفعاء الكنيسة",
      fastingLevel: "none",
    };
  }
  if (coptic.month === 10 && coptic.day === 24) {
    return {
      isFeastDay: true,
      feastTitleAr: "عيد استشهاد القديس القوي الأنبا موسى الأسود",
      seasonAr: "نهضة شفيع الكنيسة",
      fastingLevel: "none",
    };
  }
  if (coptic.month === 12 && coptic.day === 16) {
    return {
      isFeastDay: true,
      feastTitleAr: "عيد إعلان صعود جسد والدة الإله القديسة مريم",
      seasonAr: "أعياد السيدة العذراء",
      fastingLevel: "none",
    };
  }

  // General seasonal fasting
  // Nativity Fast: 16 Hathor to 28 Kiahk
  if (
    (coptic.month === 3 && coptic.day >= 16) ||
    coptic.month === 4
  ) {
    return {
      isFeastDay: false,
      seasonAr: "صوم الميلاد المجيد المبارك",
      fastingLevel: "fish_allowed",
    };
  }

  // Virgin Mary Fast: 1 Mesori to 15 Mesori
  if (coptic.month === 12 && coptic.day <= 15) {
    return {
      isFeastDay: false,
      seasonAr: "صوم السيدة العذراء مريم",
      fastingLevel: "fish_allowed",
    };
  }

  // Weekly Wednesday & Friday fasts
  if (dayOfWeek === 3 || dayOfWeek === 5) {
    return {
      isFeastDay: false,
      seasonAr: "الصوم الأسبوعي (الأربعاء والجمعة)",
      fastingLevel: "strict_abstinence",
    };
  }

  return {
    isFeastDay: false,
    seasonAr: "أيام الخدمة والعبادة السنوية",
    fastingLevel: "none",
  };
}
