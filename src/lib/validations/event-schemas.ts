// src/lib/validations/event-schemas.ts
// Input schemas for the events system. Validation happens at the SERVER ACTION boundary, before the
// repository is touched, so a malformed payload never reaches a driver.
//
// The recurrence rule is validated by `validateRecurrenceRule()` (the same pure function the engine
// uses), which means "valid at the boundary" and "expandable by the engine" cannot drift apart.

import { z } from "zod";
import {
  DEFAULT_EVENT_TIME_ZONE,
  EVENT_STATUSES,
  TAXONOMY_DIMENSIONS,
  type RecurrenceRule,
} from "@/lib/domain/types";
import { isValidDateKey, isValidTimeOfDay, isValidTimeZone, validateRecurrenceRule } from "@/lib/domain/recurrence";

/** `YYYY-MM-DD`, series-local. */
export const DateKeySchema = z
  .string()
  .trim()
  .refine(isValidDateKey, "التاريخ يجب أن يكون بصيغة YYYY-MM-DD ويوافق يوماً حقيقياً.");

/** `HH:MM` 24-hour wall clock. */
export const TimeOfDaySchema = z
  .string()
  .trim()
  .refine(isValidTimeOfDay, "الوقت يجب أن يكون بصيغة HH:MM (24 ساعة).");

/** Any string `Date.parse` accepts is too loose, but an ISO instant is what the store expects. */
export const InstantSchema = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), "الطابع الزمني غير صالح.");

export const TimeZoneSchema = z
  .string()
  .trim()
  .refine(isValidTimeZone, "المنطقة الزمنية غير معروفة.");

/** Lowercase latin slug with single hyphens — safe in a URL and never Arabic-transliterated here. */
export const SlugSchema = z
  .string()
  .trim()
  .min(3, "السلَج قصير جداً.")
  .max(120, "السلَج أطول من الحد المسموح.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "السلَج يقبل الحروف الإنجليزية الصغيرة والأرقام والشرطات فقط.");

export const UuidSchema = z.string().uuid("المعرّف غير صالح.");

const LocalizedTextSchema = z.string().trim().max(6000, "النص أطول من الحد المسموح.").nullable();

export const EventStatusSchema = z.enum(EVENT_STATUSES);

export const RecurrenceRuleSchema = z
  .object({
    freq: z.enum(["weekly", "monthly"]),
    interval: z.number().int().min(1).max(52),
    byWeekday: z.array(z.number().int().min(0).max(6)).max(7).default([]),
    byMonthDay: z.number().int().min(1).max(31).nullable().default(null),
    startDate: DateKeySchema,
    endDate: DateKeySchema.nullable().default(null),
    timezone: TimeZoneSchema.default(DEFAULT_EVENT_TIME_ZONE),
  })
  .superRefine((rule, ctx) => {
    for (const problem of validateRecurrenceRule(rule as RecurrenceRule)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: problem });
    }
  });

export const EventDocumentSchema = z.object({
  filename: z.string().trim().min(1, "اسم الملف مطلوب.").max(255),
  url: z.string().trim().min(1, "رابط الملف مطلوب.").max(500),
  mimeType: z.string().trim().max(127).nullable().default(null),
  sizeBytes: z.number().int().min(0).nullable().default(null),
});

/** The event fields, before the cross-field check (so `.partial()` stays available for updates). */
const EventFieldsSchema = z.object({
  slug: SlugSchema.optional(),
  titleAr: z.string().trim().min(3, "العنوان العربي مطلوب (3 أحرف على الأقل).").max(255),
  titleEn: z.string().trim().max(255).nullable().optional(),
  summaryAr: LocalizedTextSchema.optional(),
  summaryEn: LocalizedTextSchema.optional(),
  descriptionAr: LocalizedTextSchema.optional(),
  descriptionEn: LocalizedTextSchema.optional(),
  startsAt: InstantSchema,
  endsAt: InstantSchema.nullable().optional(),
  timezone: TimeZoneSchema.optional(),
  allDay: z.boolean().optional(),
  venueId: UuidSchema.nullable().optional(),
  status: EventStatusSchema.optional(),
  seriesId: UuidSchema.nullable().optional(),
  occurrenceDate: DateKeySchema.nullable().optional(),
  isExceptionOf: UuidSchema.nullable().optional(),
  imageUrl: z.string().trim().max(500).nullable().optional(),
  documents: z.array(EventDocumentSchema).max(20, "لا يمكن إرفاق أكثر من 20 ملفاً.").optional(),
  termIds: z.array(UuidSchema).max(40, "لا يمكن ربط أكثر من 40 مصطلحاً.").optional(),
});

/** A cross-field check that only fires when BOTH bounds are present (updates may send one). */
function checkEventWindow(
  value: { startsAt?: string; endsAt?: string | null },
  ctx: z.RefinementCtx
): void {
  if (!value.startsAt || !value.endsAt) return;
  if (Date.parse(value.endsAt) <= Date.parse(value.startsAt)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endsAt"],
      message: "وقت الانتهاء يجب أن يكون بعد وقت البدء.",
    });
  }
}

export const EventCreateSchema = EventFieldsSchema.superRefine(checkEventWindow);

export const EventUpdateSchema = EventFieldsSchema.partial().superRefine(checkEventWindow);

export const EventSeriesFieldsSchema = z.object({
  titleAr: z.string().trim().min(3, "عنوان السلسلة مطلوب.").max(255),
  titleEn: z.string().trim().max(255).nullable().optional(),
  summaryAr: LocalizedTextSchema.optional(),
  summaryEn: LocalizedTextSchema.optional(),
  rule: RecurrenceRuleSchema,
  startTime: TimeOfDaySchema,
  durationMinutes: z.number().int().min(5, "أقصر مدة مسموحة 5 دقائق.").max(1440).optional(),
  defaultVenueId: UuidSchema.nullable().optional(),
  defaultTermIds: z.array(UuidSchema).max(40).optional(),
  status: EventStatusSchema.optional(),
});

export const EventSeriesCreateSchema = EventSeriesFieldsSchema;
export const EventSeriesUpdateSchema = EventSeriesFieldsSchema.partial();

export const EventExceptionSchema = z
  .object({
    seriesId: UuidSchema,
    occurrenceDate: DateKeySchema,
    kind: z.enum(["cancelled", "moved"]),
    movedToDate: DateKeySchema.nullable().optional(),
    reasonAr: z.string().trim().max(500).nullable().optional(),
    reasonEn: z.string().trim().max(500).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.kind !== "moved") return;
    if (!value.movedToDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["movedToDate"], message: "تاريخ النقل مطلوب." });
      return;
    }
    if (value.movedToDate === value.occurrenceDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["movedToDate"],
        message: "تاريخ النقل يجب أن يختلف عن الموعد الأصلي.",
      });
    }
  });

export const TaxonomyTermSchema = z.object({
  dimension: z.enum(TAXONOMY_DIMENSIONS),
  slug: SlugSchema,
  nameAr: z.string().trim().min(2, "الاسم العربي مطلوب.").max(255),
  nameEn: z.string().trim().max(255).nullable().optional(),
  /** lucide-react icon name, e.g. "Church". */
  icon: z
    .string()
    .trim()
    .max(64)
    .regex(/^[A-Z][A-Za-z0-9]*$/, "اسم الأيقونة يجب أن يكون اسم أيقونة lucide مثل Church.")
    .nullable()
    .optional(),
  /** Palette token ("copticNavy") or hex value ("#1E2A78"). */
  color: z
    .string()
    .trim()
    .max(32)
    .regex(/^(#[0-9a-fA-F]{3,8}|[a-zA-Z][a-zA-Z0-9.]{2,31})$/, "اللون يجب أن يكون رمزاً من لوحة الألوان أو قيمة HEX.")
    .nullable()
    .optional(),
  sortOrder: z.number().int().min(1).max(9999).optional(),
  isActive: z.boolean().optional(),
});

export const TaxonomyTermUpdateSchema = TaxonomyTermSchema.partial();

export const MediaSchema = z.object({
  filename: z.string().trim().min(1, "اسم الملف مطلوب.").max(255),
  mimeType: z
    .string()
    .trim()
    .min(3)
    .max(127)
    .regex(/^[\w.+-]+\/[\w.+-]+$/, "نوع الملف غير صالح (مثال: image/jpeg)."),
  sizeBytes: z.number().int().min(0).max(50 * 1024 * 1024, "الحجم الأقصى 50 ميجابايت.").optional(),
  url: z.string().trim().min(1, "رابط الملف مطلوب.").max(500),
  altAr: z.string().trim().max(255).nullable().optional(),
  altEn: z.string().trim().max(255).nullable().optional(),
  isPublic: z.boolean().optional(),
});

export const MediaUpdateSchema = MediaSchema.partial();

/** Occurrence identity for the per-occurrence actions. */
export const OccurrenceRefSchema = z.object({
  seriesId: UuidSchema,
  occurrenceDate: DateKeySchema,
});

export const RescheduleOccurrenceSchema = OccurrenceRefSchema.extend({
  movedToDate: DateKeySchema,
  reasonAr: z.string().trim().max(500).nullable().optional(),
  reasonEn: z.string().trim().max(500).nullable().optional(),
}).superRefine((value, ctx) => {
  if (value.movedToDate === value.occurrenceDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["movedToDate"],
      message: "تاريخ النقل يجب أن يختلف عن الموعد الأصلي.",
    });
  }
});

/** First issue message of a failed parse, in Arabic, for the action result. */
export function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "البيانات المرسلة غير صالحة.";
}
