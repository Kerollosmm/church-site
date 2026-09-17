// src/lib/events/admin-form.ts
// The PURE half of the admin editors: form state ⇄ action payload, and the field-level validation
// the forms render inline.
//
// WHY IT IS PURE (no store, no React, no `next/*`): the same decisions are needed on the server (to
// build an editor's initial state from a row) and in the browser (to validate before submitting and
// to map the answer back). One implementation, imported by both, is the only way "valid in the form"
// and "valid at the action boundary" cannot drift apart — the actions re-parse with the SAME zod
// schemas this module uses.
//
// TIMES ARE CAIRO TIMES. A `<input type="datetime-local">` carries a wall clock with no zone, which
// is exactly what a parish author means ("الجمعة 07:00"), so the wall clock is read and written in
// `Africa/Cairo` — never in the visitor's or the build machine's zone (rule 10 of the memory bank).

import { isValidDateKey } from "@church-site/domain";
import {
  DEFAULT_EVENT_TIME_ZONE,
  EVENT_STATUSES,
  type EventExceptionRecord,
  type EventSeriesRecord,
  type EventStatus,
  type EventWithTerms,
  type RecurrenceFreq,
} from "@church-site/domain";
import { cairoWallClockToInstant, getCairoWallClock } from "../utils/cairo-time";
import {
  EventCreateSchema,
  EventSeriesCreateSchema,
  MAX_MEDIA_SIZE_BYTES,
  MediaSchema,
} from "../validations/event-schemas";
import type { z } from "zod";

// ============================================================================
// 1. Cairo wall clock ⇄ the value of a `datetime-local` input
// ============================================================================

const WALL_INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** The value a `datetime-local` input expects for a Cairo wall clock, e.g. `2026-10-04T07:00`. */
export function wallClockInputValue(year: number, month: number, day: number, hour: number, minute: number): string {
  return `${String(year).padStart(4, "0")}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
}

/** An ISO instant → the Cairo wall clock a `datetime-local` input shows. "" when unusable. */
export function instantToWallInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const wall = getCairoWallClock(date);
  return wallClockInputValue(wall.year, wall.month, wall.day, wall.hour, wall.minute);
}

/**
 * The absolute instant a `datetime-local` value denotes in `Africa/Cairo`, or null when the value is
 * empty/malformed. Nullability is deliberate: the caller decides which message to show instead of
 * receiving an `Invalid Date` that would travel on as "Invalid Date".
 */
export function wallInputToInstant(value: string): string | null {
  const match = WALL_INPUT_PATTERN.exec(value.trim());
  if (!match) return null;

  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!isValidDateKey(`${yearText}-${monthText}-${dayText}`)) return null;
  if (hour > 23 || minute > 59) return null;

  return cairoWallClockToInstant({ year, month, day, hour, minute }).toISOString();
}

/** The instant `minutes` ahead, rendered as the wall-clock input value (used for new drafts). */
export function defaultStartWallInput(now: Date = new Date(), minutesAhead = 60): string {
  const wall = getCairoWallClock(new Date(now.getTime() + minutesAhead * 60_000));
  // Rounded to the half hour: an author nearly always means :00 or :30, and it is still editable.
  const minute = wall.minute < 30 ? 30 : 0;
  const hour = minute === 0 ? (wall.hour + 1) % 24 : wall.hour;
  return wallClockInputValue(wall.year, wall.month, wall.day, hour, minute);
}

// ============================================================================
// 2. zod issues → inline field errors
// ============================================================================

/**
 * A zod error flattened into `field path → first Arabic message`.
 *
 * The FULL path is joined ("documents.0.filename", "rule.startDate") so a form can attach the message
 * to the exact control that caused it instead of to the whole group. Only the first message per path
 * is kept: a field shows one sentence, not a list.
 */
export function fieldErrorsFromZod(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.map(String).join(".") : "_form";
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

/** Merges `extra` over `base` — the explicit Arabic messages win over a schema's generic one. */
function mergeErrors(base: Record<string, string>, extra: Record<string, string>): Record<string, string> {
  return { ...base, ...extra };
}

// ============================================================================
// 3. Event form
// ============================================================================

export interface EventDocumentDraft {
  filename: string;
  url: string;
  mimeType: string;
  /** Megabytes as typed; converted to bytes on submit. Empty = unknown. */
  sizeMb: string;
}

export interface EventFormState {
  slug: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  descriptionAr: string;
  descriptionEn: string;
  /** `datetime-local` values in Cairo. */
  startWall: string;
  endWall: string;
  allDay: boolean;
  /** "" = no primary venue. */
  venueId: string;
  termIds: string[];
  imageUrl: string;
  documents: EventDocumentDraft[];
  status: EventStatus;
}

export function emptyEventDocumentDraft(): EventDocumentDraft {
  return { filename: "", url: "", mimeType: "", sizeMb: "" };
}

export function emptyEventFormState(now: Date = new Date()): EventFormState {
  return {
    slug: "",
    titleAr: "",
    titleEn: "",
    summaryAr: "",
    summaryEn: "",
    descriptionAr: "",
    descriptionEn: "",
    startWall: defaultStartWallInput(now),
    endWall: "",
    allDay: false,
    venueId: "",
    termIds: [],
    imageUrl: "",
    documents: [],
    status: "draft",
  };
}

/** An existing row as editable state. Every nullable column becomes "" (an empty control). */
export function eventToFormState(event: EventWithTerms): EventFormState {
  return {
    slug: event.slug,
    titleAr: event.titleAr,
    titleEn: event.titleEn ?? "",
    summaryAr: event.summaryAr ?? "",
    summaryEn: event.summaryEn ?? "",
    descriptionAr: event.descriptionAr ?? "",
    descriptionEn: event.descriptionEn ?? "",
    startWall: instantToWallInput(event.startsAt),
    endWall: instantToWallInput(event.endsAt),
    allDay: event.allDay,
    venueId: event.venueId ?? "",
    termIds: [...event.termIds],
    imageUrl: event.imageUrl ?? "",
    documents: event.documents.map((document) => ({
      filename: document.filename,
      url: document.url,
      mimeType: document.mimeType ?? "",
      sizeMb: document.sizeBytes === null ? "" : String(roundTo(document.sizeBytes / (1024 * 1024), 3)),
    })),
    status: event.status,
  };
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** A trimmed string, or null when it carries no text (the domain's "not translated yet"). */
function nullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

/** "2.5" → 2621440. Returns null for empty OR unparsable input. */
export function megabytesToBytes(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  const parsed = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 1024 * 1024);
}

/** Bytes as a short human string: "3.5 ميجابايت" / "512 كيلوبايت" / "غير معروف". */
export function formatBytes(bytes: number | null | undefined, unknownLabel = "غير معروف"): string {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes) || bytes < 0) return unknownLabel;
  if (bytes === 0) return "0 بايت";
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${roundTo(bytes / 1024, 1)} كيلوبايت`;
  return `${roundTo(bytes / (1024 * 1024), 2)} ميجابايت`;
}

/** A document draft with no text at all is ignored; one with half its fields is an error. */
export function isBlankDocumentDraft(draft: EventDocumentDraft): boolean {
  return (
    draft.filename.trim().length === 0 &&
    draft.url.trim().length === 0 &&
    draft.mimeType.trim().length === 0 &&
    draft.sizeMb.trim().length === 0
  );
}

/** The payload `createEventAction` / `updateEventAction` receive. */
export function eventFormToPayload(state: EventFormState): Record<string, unknown> {
  const slug = state.slug.trim();

  return {
    ...(slug.length > 0 ? { slug } : {}),
    titleAr: state.titleAr.trim(),
    titleEn: nullableText(state.titleEn),
    summaryAr: nullableText(state.summaryAr),
    summaryEn: nullableText(state.summaryEn),
    descriptionAr: nullableText(state.descriptionAr),
    descriptionEn: nullableText(state.descriptionEn),
    // "" (never null) for the start: the schema's job is to say so in Arabic, and an empty string is
    // what "malformed" looks like at that boundary.
    startsAt: wallInputToInstant(state.startWall) ?? "",
    endsAt: state.endWall.trim().length === 0 ? null : wallInputToInstant(state.endWall) ?? "",
    timezone: DEFAULT_EVENT_TIME_ZONE,
    allDay: state.allDay,
    venueId: state.venueId.trim().length === 0 ? null : state.venueId.trim(),
    status: state.status,
    imageUrl: nullableText(state.imageUrl),
    documents: state.documents
      .filter((draft) => !isBlankDocumentDraft(draft))
      .map((draft) => ({
        filename: draft.filename.trim(),
        url: draft.url.trim(),
        mimeType: nullableText(draft.mimeType),
        sizeBytes: megabytesToBytes(draft.sizeMb),
      })),
    termIds: state.termIds,
  };
}

/**
 * Field-level Arabic errors, computed from the SAME schema the server action parses with. The
 * explicit checks run first so a half-typed date reads "أدخل تاريخ ووقت البداية كاملين" rather than a
 * generic complaint about a timestamp.
 */
export function eventFormFieldErrors(state: EventFormState): Record<string, string> {
  const explicit: Record<string, string> = {};

  if (wallInputToInstant(state.startWall) === null) {
    explicit.startsAt = "أدخل تاريخ ووقت البداية كاملين (بتوقيت القاهرة).";
  }
  if (state.endWall.trim().length > 0 && wallInputToInstant(state.endWall) === null) {
    explicit.endsAt = "صيغة وقت الانتهاء غير مكتملة (بتوقيت القاهرة).";
  }
  if (state.startWall.trim().length > 0 && state.endWall.trim().length > 0) {
    const start = wallInputToInstant(state.startWall);
    const end = wallInputToInstant(state.endWall);
    if (start && end && Date.parse(end) <= Date.parse(start)) {
      explicit.endsAt = "وقت الانتهاء يجب أن يكون بعد وقت البدء.";
    }
  }

  state.documents.forEach((draft, index) => {
    if (isBlankDocumentDraft(draft)) return;
    if (draft.filename.trim().length === 0) explicit[`documents.${index}.filename`] = "اسم الملف مطلوب.";
    if (draft.url.trim().length === 0) explicit[`documents.${index}.url`] = "رابط الملف مطلوب.";
    if (draft.sizeMb.trim().length > 0 && megabytesToBytes(draft.sizeMb) === null) {
      explicit[`documents.${index}.sizeMb`] = "الحجم يجب أن يكون رقماً بالميجابايت (مثال: 1.5).";
    }
  });

  const parsed = EventCreateSchema.safeParse(eventFormToPayload(state));
  const fromSchema = parsed.success ? {} : fieldErrorsFromZod(parsed.error);
  return mergeErrors(fromSchema, explicit);
}

// ============================================================================
// 4. Series form
// ============================================================================

export interface SeriesFormState {
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  freq: RecurrenceFreq;
  /** Text input; empty or "0" is an error the schema wording explains. */
  interval: string;
  /** Weekday numbers, 0 = Sunday … 6 = Saturday (weekly rules). */
  byWeekday: number[];
  /** "" = the start date's day of month (monthly rules). */
  byMonthDay: string;
  startDate: string;
  endDate: string;
  startTime: string;
  durationMinutes: string;
  defaultVenueId: string;
  defaultTermIds: string[];
  status: EventStatus;
}

export function emptySeriesFormState(now: Date = new Date()): SeriesFormState {
  const wall = getCairoWallClock(now);
  const startDate = `${String(wall.year).padStart(4, "0")}-${pad(wall.month)}-${pad(wall.day)}`;
  return {
    titleAr: "",
    titleEn: "",
    summaryAr: "",
    summaryEn: "",
    freq: "weekly",
    interval: "1",
    byWeekday: [wall.weekday],
    byMonthDay: "",
    startDate,
    endDate: "",
    startTime: "07:00",
    durationMinutes: "60",
    defaultVenueId: "",
    defaultTermIds: [],
    status: "draft",
  };
}

export function seriesToFormState(series: EventSeriesRecord): SeriesFormState {
  return {
    titleAr: series.titleAr,
    titleEn: series.titleEn ?? "",
    summaryAr: series.summaryAr ?? "",
    summaryEn: series.summaryEn ?? "",
    freq: series.rule.freq,
    interval: String(series.rule.interval),
    byWeekday: [...series.rule.byWeekday],
    byMonthDay: series.rule.byMonthDay === null ? "" : String(series.rule.byMonthDay),
    startDate: series.rule.startDate,
    endDate: series.rule.endDate ?? "",
    startTime: series.startTime,
    durationMinutes: String(series.durationMinutes),
    defaultVenueId: series.defaultVenueId ?? "",
    defaultTermIds: [...series.defaultTermIds],
    status: series.status,
  };
}

/** `Number("")` is 0 and `Number("x")` is NaN — neither belongs in a payload, so both fall back. */
function integerOr(value: string, fallback: number): number {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function seriesFormToPayload(state: SeriesFormState): Record<string, unknown> {
  const monthly = state.freq === "monthly";
  const monthDay = Number.parseInt(state.byMonthDay.trim(), 10);

  return {
    titleAr: state.titleAr.trim(),
    titleEn: nullableText(state.titleEn),
    summaryAr: nullableText(state.summaryAr),
    summaryEn: nullableText(state.summaryEn),
    rule: {
      freq: state.freq,
      interval: integerOr(state.interval, 1),
      // The monthly rule must not carry weekdays (the engine rejects that combination), and the
      // weekly rule must not carry a month day: the payload is narrowed to what the chosen
      // frequency actually uses, so switching frequency in the form cannot leave a stale field.
      byWeekday: monthly ? [] : [...new Set(state.byWeekday)].sort((a, b) => a - b),
      byMonthDay: monthly ? (Number.isFinite(monthDay) ? monthDay : null) : null,
      startDate: state.startDate.trim(),
      endDate: state.endDate.trim().length === 0 ? null : state.endDate.trim(),
      timezone: DEFAULT_EVENT_TIME_ZONE,
    },
    startTime: state.startTime.trim(),
    durationMinutes: integerOr(state.durationMinutes, 60),
    defaultVenueId: state.defaultVenueId.trim().length === 0 ? null : state.defaultVenueId.trim(),
    defaultTermIds: state.defaultTermIds,
    status: state.status,
  };
}

export function seriesFormFieldErrors(state: SeriesFormState): Record<string, string> {
  const explicit: Record<string, string> = {};

  if (state.freq === "weekly" && state.byWeekday.length === 0) {
    explicit["rule.byWeekday"] = "اختر يوماً واحداً على الأقل من أيام الأسبوع.";
  }
  if (state.freq === "monthly" && state.byMonthDay.trim().length > 0) {
    const day = Number.parseInt(state.byMonthDay, 10);
    if (!Number.isFinite(day) || day < 1 || day > 31) {
      explicit["rule.byMonthDay"] = "يوم الشهر يجب أن يكون رقماً بين 1 و31.";
    }
  }
  if (state.interval.trim().length > 0) {
    const interval = Number.parseInt(state.interval, 10);
    if (!Number.isFinite(interval) || interval < 1 || interval > 52) {
      explicit["rule.interval"] = "الفاصل الزمني يجب أن يكون عدداً صحيحاً بين 1 و52.";
    }
  }
  if (state.durationMinutes.trim().length > 0) {
    const duration = Number.parseInt(state.durationMinutes, 10);
    if (!Number.isFinite(duration) || duration < 5 || duration > 1440) {
      explicit.durationMinutes = "المدة بالدقائق يجب أن تكون بين 5 و1440.";
    }
  }

  const parsed = EventSeriesCreateSchema.safeParse(seriesFormToPayload(state));
  const fromSchema = parsed.success ? {} : fieldErrorsFromZod(parsed.error);
  return mergeErrors(fromSchema, explicit);
}

// ============================================================================
// 5. Media form
// ============================================================================

export interface MediaFormState {
  filename: string;
  mimeType: string;
  /** Megabytes as typed (optional: a URL registered before its size is known is still useful). */
  sizeMb: string;
  url: string;
  altAr: string;
  altEn: string;
  isPublic: boolean;
}

export function emptyMediaFormState(): MediaFormState {
  return { filename: "", mimeType: "", sizeMb: "", url: "", altAr: "", altEn: "", isPublic: true };
}

export function mediaFormToPayload(state: MediaFormState): Record<string, unknown> {
  const sizeBytes = megabytesToBytes(state.sizeMb);
  return {
    filename: state.filename.trim(),
    mimeType: state.mimeType.trim(),
    ...(sizeBytes === null ? {} : { sizeBytes }),
    url: state.url.trim(),
    altAr: nullableText(state.altAr),
    altEn: nullableText(state.altEn),
    isPublic: state.isPublic,
  };
}

/**
 * The service cap on a registered file, as a human string — derived from the schema's own constant so
 * the message and the enforcement cannot disagree.
 */
export const MAX_MEDIA_SIZE_LABEL = formatBytes(MAX_MEDIA_SIZE_BYTES, "غير محدود");

export function mediaFormFieldErrors(state: MediaFormState): Record<string, string> {
  const explicit: Record<string, string> = {};
  const sizeBytes = megabytesToBytes(state.sizeMb);

  if (state.sizeMb.trim().length > 0 && sizeBytes === null) {
    explicit.sizeBytes = "الحجم يجب أن يكون رقماً بالميجابايت (مثال: 2.5).";
  } else if (sizeBytes !== null && sizeBytes > MAX_MEDIA_SIZE_BYTES) {
    // The clear, bounded refusal the media screen promises — with both numbers in it.
    explicit.sizeBytes = `الحجم المُدخل (${formatBytes(sizeBytes)}) يتجاوز الحد الأقصى المسموح (${MAX_MEDIA_SIZE_LABEL}).`;
  }

  const parsed = MediaSchema.safeParse(mediaFormToPayload(state));
  const fromSchema = parsed.success ? {} : fieldErrorsFromZod(parsed.error);
  return mergeErrors(fromSchema, explicit);
}

// ============================================================================
// 6. Shared small readers for the admin screens (pure)
// ============================================================================

/** The status an editor most likely wants next, used for the "الحالة" select's option order. */
export const EVENT_STATUS_OPTIONS: readonly EventStatus[] = EVENT_STATUSES;

/** An exception's display key: `<seriesId>:<occurrenceDate>` — unique by the store's own rule. */
export function exceptionKey(exception: Pick<EventExceptionRecord, "seriesId" | "occurrenceDate">): string {
  return `${exception.seriesId}:${exception.occurrenceDate}`;
}
