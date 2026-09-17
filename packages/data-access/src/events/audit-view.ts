// src/lib/events/audit-view.ts
// The audit trail, readable — PURE: no store, no framework, no I/O.
//
// An audit entry stores the row BEFORE and the row AFTER as JSON snapshots. That is the right thing
// to store (nothing can rewrite history) and the wrong thing to show: a person reading the log wants
// "الحالة: مسودة ← منشورة", not two JSON blobs. This module turns the pair into the few Arabic lines
// the audit screen renders, using the project's own label maps so a value is never printed raw.
//
// IT NEVER HIDES A CHANGE: `changedCount` reports every differing field, and `changes` carries the
// first `limit` of them formatted — the screen renders "و{n} حقلاً آخر" for the rest instead of
// pretending the list was complete.

import {
  AUDIT_ACTION_LABELS_AR,
  AUDIT_ENTITY_TYPE_LABELS_AR,
  EVENT_STATUS_LABELS_AR,
  EXCEPTION_KIND_LABELS_AR,
  type AuditAction,
  type AuditEntityType,
  type JsonValue,
} from "@church-site/domain";
import { t } from "../i18n/messages";
import { formatCairoDateTime } from "../utils/cairo-time";

/** How many field changes are described in full before the count takes over. */
export const AUDIT_CHANGE_LIMIT = 6;

/** How long a single rendered value may be. */
const VALUE_MAX_LENGTH = 90;

export type AuditChangeKind = "created" | "deleted" | "changed" | "unchanged" | "denied";

export interface AuditFieldChange {
  field: string;
  labelAr: string;
  before: string;
  after: string;
}

export interface AuditSummary {
  kind: AuditChangeKind;
  /** The action and entity, in Arabic, ready for a badge. */
  actionLabelAr: string;
  entityLabelAr: string;
  changes: AuditFieldChange[];
  /** Every differing field, including the ones not rendered individually. */
  changedCount: number;
}

/** Arabic names for the record fields a snapshot can carry. An unknown key falls back to the key. */
const FIELD_LABELS_AR: Record<string, string> = {
  id: "المعرّف",
  slug: "السلَج",
  titleAr: "العنوان (عربي)",
  titleEn: "العنوان (إنجليزي)",
  summaryAr: "الملخص (عربي)",
  summaryEn: "الملخص (إنجليزي)",
  descriptionAr: "الوصف (عربي)",
  descriptionEn: "الوصف (إنجليزي)",
  startsAt: "وقت البدء",
  endsAt: "وقت الانتهاء",
  timezone: "المنطقة الزمنية",
  allDay: "طوال اليوم",
  venueId: "المكان الرئيسي",
  status: "الحالة",
  seriesId: "السلسلة",
  occurrenceDate: "تاريخ الموعد",
  isExceptionOf: "استثناء للسلسلة",
  imageUrl: "رابط الصورة",
  documents: "المرفقات",
  termIds: "التصنيفات",
  createdAt: "تاريخ الإنشاء",
  updatedAt: "آخر تعديل",
  createdBy: "أنشأه",
  updatedBy: "عدّله",
  rule: "قاعدة التكرار",
  freq: "نوع التكرار",
  interval: "الفاصل الزمني",
  byWeekday: "أيام الأسبوع",
  byMonthDay: "يوم الشهر",
  startDate: "تاريخ البداية",
  endDate: "تاريخ النهاية",
  startTime: "وقت البدء",
  durationMinutes: "المدة (دقائق)",
  defaultVenueId: "المكان الافتراضي",
  defaultTermIds: "تصنيفات السلسلة",
  kind: "نوع الاستثناء",
  movedToDate: "التاريخ المنقول إليه",
  reasonAr: "السبب (عربي)",
  reasonEn: "السبب (إنجليزي)",
  filename: "اسم الملف",
  mimeType: "نوع الملف",
  sizeBytes: "حجم الملف",
  url: "الرابط",
  altAr: "النص البديل (عربي)",
  altEn: "النص البديل (إنجليزي)",
  isPublic: "متاح للعامة",
  uploadedBy: "سجّله",
  dimension: "البُعد",
  nameAr: "الاسم (عربي)",
  nameEn: "الاسم (إنجليزي)",
  icon: "الأيقونة",
  color: "اللون",
  sortOrder: "الترتيب",
  isActive: "مفعّل",
  eventId: "الفعالية",
  termId: "المصطلح",
  series_id: "السلسلة",
  summary: "الملخص",
};

/** JSON keys that carry an instant and are shown as a Cairo date/time rather than an ISO string. */
const INSTANT_FIELDS = new Set(["startsAt", "endsAt", "createdAt", "updatedAt", "at", "movedToDate"]);

/** Enum-valued fields whose stored value is translated before display. */
const VALUE_LABELS_AR: Record<string, Record<string, string>> = {
  status: EVENT_STATUS_LABELS_AR,
  kind: EXCEPTION_KIND_LABELS_AR,
  freq: { weekly: "أسبوعي", monthly: "شهري" },
  action: AUDIT_ACTION_LABELS_AR,
  entityType: AUDIT_ENTITY_TYPE_LABELS_AR,
  dimension: {
    event_type: t("ar", "taxonomy.event_type"),
    ministry: t("ar", "taxonomy.ministry"),
    audience: t("ar", "taxonomy.audience"),
    language: t("ar", "taxonomy.language"),
    venue: t("ar", "taxonomy.venue"),
    tag: t("ar", "taxonomy.tag"),
  },
};

function truncate(value: string): string {
  const trimmed = value.trim();
  return trimmed.length <= VALUE_MAX_LENGTH ? trimmed : `${trimmed.slice(0, VALUE_MAX_LENGTH - 1)}…`;
}

/** A snapshot value as a short Arabic string. Never throws, never prints `[object Object]`. */
export function formatAuditValue(value: JsonValue | undefined, field: string | null = null): string {
  if (value === undefined || value === null) return "—";
  if (typeof value === "boolean") return value ? "نعم" : "لا";

  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    const enumLabel = field ? VALUE_LABELS_AR[field]?.[value] : undefined;
    if (enumLabel) return enumLabel;
    if (field && INSTANT_FIELDS.has(field)) {
      const formatted = formatCairoDateTime(value);
      if (formatted) return formatted;
    }
    return truncate(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "لا شيء";
    const scalars = value.filter((item) => typeof item === "string" || typeof item === "number");
    if (scalars.length === value.length) return truncate(scalars.map(String).join("، "));
    return `${value.length} عنصراً`;
  }
  return truncate(JSON.stringify(value));
}

function isPlainObject(value: JsonValue | null): value is Record<string, JsonValue> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function labelOf(field: string): string {
  return FIELD_LABELS_AR[field] ?? field;
}

/**
 * Reads one entry's before/after pair into the lines the audit screen prints.
 *
 * `denied` is its own kind: nothing before, nothing after — the entry exists precisely because no
 * change happened, and rendering it as "unchanged" would misrepresent a refusal as a no-op edit.
 */
export function summarizeAuditEntry(entry: {
  action: AuditAction;
  entityType: AuditEntityType;
  before: JsonValue | null;
  after: JsonValue | null;
}): AuditSummary {
  const actionLabelAr = AUDIT_ACTION_LABELS_AR[entry.action];
  const entityLabelAr = AUDIT_ENTITY_TYPE_LABELS_AR[entry.entityType];

  if (entry.action === "denied") {
    return { kind: "denied", actionLabelAr, entityLabelAr, changes: [], changedCount: 0 };
  }

  if (entry.before === null && entry.after === null) {
    return { kind: "unchanged", actionLabelAr, entityLabelAr, changes: [], changedCount: 0 };
  }

  const before = isPlainObject(entry.before) ? entry.before : null;
  const after = isPlainObject(entry.after) ? entry.after : null;

  if (!before && after) {
    return {
      kind: "created",
      actionLabelAr,
      entityLabelAr,
      changes: [],
      changedCount: Object.keys(after).length,
    };
  }
  if (before && !after) {
    return {
      kind: "deleted",
      actionLabelAr,
      entityLabelAr,
      changes: [],
      changedCount: Object.keys(before).length,
    };
  }
  if (!before || !after) {
    return { kind: "unchanged", actionLabelAr, entityLabelAr, changes: [], changedCount: 0 };
  }

  const fields = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
  const changed: AuditFieldChange[] = [];

  for (const field of fields) {
    const beforeValue = formatAuditValue(before[field], field);
    const afterValue = formatAuditValue(after[field], field);
    if (beforeValue === afterValue) continue;
    changed.push({ field, labelAr: labelOf(field), before: beforeValue, after: afterValue });
  }

  return {
    kind: changed.length === 0 ? "unchanged" : "changed",
    actionLabelAr,
    entityLabelAr,
    changes: changed.slice(0, AUDIT_CHANGE_LIMIT),
    changedCount: changed.length,
  };
}
