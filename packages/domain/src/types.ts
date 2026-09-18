// src/lib/domain/types.ts
// The CORE domain model for the events / taxonomy / i18n system.
//
// This module is the single vocabulary shared by the store (both drivers), the recurrence engine,
// the server actions and every UI step built on top of them. It is deliberately PURE: types plus
// small closed vocabularies and defaults, no I/O, no framework imports.
//
// NAMING CONTRACT: domain records are camelCase and driver-agnostic. The Supabase driver maps the
// snake_case columns of `supabase/migrations/20260916090700_events_taxonomy_media_audit.sql` into
// these shapes; the JSON driver stores them as they are. A caller can therefore never tell which
// driver answered.
import { PARISH_TIME_ZONE } from "./constants";

export type Locale = "ar" | "en";

// ============================================================================
// 1. Closed vocabularies
// ============================================================================

/** Lifecycle of an event, a series or a single override row. Mirrors `event_status_enum`. */
export type EventStatus = "draft" | "published" | "cancelled" | "archived";

export const EVENT_STATUSES = ["draft", "published", "cancelled", "archived"] as const satisfies readonly EventStatus[];

/** Arabic display labels for the lifecycle values — the enum itself is never shown to a person. */
export const EVENT_STATUS_LABELS_AR: Record<EventStatus, string> = {
  draft: "مسودة",
  published: "منشورة",
  cancelled: "ملغاة",
  archived: "مؤرشفة",
};

/** Recurrence frequencies supported by the engine. Mirrors `recurrence_freq_enum`. */
export type RecurrenceFreq = "weekly" | "monthly";

/** Kind of a per-occurrence deviation. Mirrors `event_exception_kind_enum`. */
export type EventExceptionKind = "cancelled" | "moved";

export const EXCEPTION_KIND_LABELS_AR: Record<EventExceptionKind, string> = {
  cancelled: "إلغاء موعد واحد",
  moved: "نقل موعد واحد",
};

/** Classification dimensions. Mirrors `taxonomy_dimension_enum`. */
export type TaxonomyDimension = "event_type" | "ministry" | "audience" | "language" | "venue" | "tag";

export const TAXONOMY_DIMENSIONS = [
  "event_type",
  "ministry",
  "audience",
  "language",
  "venue",
  "tag",
] as const satisfies readonly TaxonomyDimension[];

/**
 * Every recorded mutation, plus `denied` — the one entry that records NO change: a capability
 * refusal (a signed-in member of staff attempted something their role does not allow). It is in this
 * vocabulary because a refusal must be as auditable as a change, and it must not be disguised as a
 * mutation that never happened. Mirrors `audit_action_enum`.
 */
export type AuditAction =
  | "create"
  | "update"
  | "publish"
  | "unpublish"
  | "cancel"
  | "reschedule"
  | "duplicate"
  | "delete"
  | "denied"
  | "notify";

export const AUDIT_ACTION_LABELS_AR: Record<AuditAction, string> = {
  create: "إنشاء",
  update: "تعديل",
  publish: "نشر",
  unpublish: "إلغاء النشر",
  cancel: "إلغاء",
  reschedule: "إعادة جدولة",
  duplicate: "نسخ",
  delete: "حذف",
  denied: "رفض صلاحية",
  // An INTENTION, not a delivery: the no-op mailer records "this is what would have been sent".
  // No email leaves the site today (see `src/lib/notify/`), and the label says so.
  notify: "إشعار بريدي (لم يُرسل)",
};

/** Records that can appear in the audit log. */
export type AuditEntityType =
  | "event"
  | "event_series"
  | "event_exception"
  | "taxonomy_term"
  | "event_terms"
  | "media"
  | "subscriber"
  | "mass"
  | "content_type"
  | "content_field"
  | "content_entry"
  | "video"
  | "service"
  | "navigation";

export const AUDIT_ENTITY_TYPE_LABELS_AR: Record<AuditEntityType, string> = {
  event: "فعالية",
  event_series: "سلسلة متكررة",
  event_exception: "استثناء موعد",
  taxonomy_term: "مصطلح تصنيف",
  event_terms: "وسوم فعالية",
  media: "ملف وسائط",
  subscriber: "مشترك في التنبيهات",
  mass: "قداس",
  content_type: "نوع محتوى",
  content_field: "حقل محتوى",
  content_entry: "عنصر محتوى",
  video: "فيديو",
  service: "خدمة كنسية",
  navigation: "شريط التنقل",
};

// ============================================================================
// 2. Shared value objects
// ============================================================================

/** JSON-safe snapshot stored in the audit trail (`before` / `after`). */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/** A file attached to an event (an agenda, a poster, a permit …). Stored as JSONB on the row. */
export interface EventDocument {
  /** Display name of the file, e.g. "أجندة النهضة.pdf". */
  filename: string;
  /** Repository-relative path or URL. Never an external host (see the CSP allow-list). */
  url: string;
  /** Optional media type, e.g. "application/pdf". */
  mimeType: string | null;
  /** Size in bytes when known. */
  sizeBytes: number | null;
}

/** Who performed a mutation. `id` is null only for system/seed-authored rows. */
export interface Actor {
  id: string | null;
  /** Display name recorded on the audit entry (never a raw uuid). */
  name: string;
}

/**
 * The parish's default zone for anything that does not carry its own. A series always does
 * (`RecurrenceRule.timezone`) so occurrences expand in the zone they were authored in.
 */
export const DEFAULT_EVENT_TIME_ZONE = PARISH_TIME_ZONE;

// ============================================================================
// 3. Events
// ============================================================================

/**
 * An event row. Two roles in one table (documented once, relied on everywhere):
 *
 *  1. STANDALONE EVENT — `seriesId === null`: a one-off (a concert, a broadcast, a feast).
 *  2. SERIES OCCURRENCE OVERRIDE — `seriesId !== null` (and `isExceptionOf !== null`): a row that
 *     departs from the series' rule for one date, carrying `occurrenceDate` (the series-local date
 *     it replaces) so the occurrence list stays consistent with the series.
 *
 * Repeated occurrences that follow the rule are NOT materialised: the recurrence engine expands
 * them on read. That is what keeps a weekly liturgy from being stored hundreds of times.
 */
export interface EventRecord {
  id: string;
  slug: string;
  titleAr: string;
  /** Null/empty means "not translated yet" — the i18n layer falls back to Arabic visibly. */
  titleEn: string | null;
  summaryAr: string | null;
  summaryEn: string | null;
  /** Markdown-ish plain text, rendered without a rich-text editor. */
  descriptionAr: string | null;
  descriptionEn: string | null;
  /** Absolute instant, ISO 8601 (UTC). */
  startsAt: string;
  /** Absolute instant, ISO 8601 (UTC), or null for an open-ended event. */
  endsAt: string | null;
  /** IANA zone the event was authored in (defaults to `DEFAULT_EVENT_TIME_ZONE`). */
  timezone: string;
  allDay: boolean;
  /** `taxonomy_terms.id` of a term in the `venue` dimension, or null. */
  venueId: string | null;
  status: EventStatus;
  /** Series this row belongs to, or null for a standalone event. */
  seriesId: string | null;
  /** Series-local `YYYY-MM-DD` this row realises (override rows only). */
  occurrenceDate: string | null;
  /** Series id this row is an exception of (override rows only); null otherwise. */
  isExceptionOf: string | null;
  imageUrl: string | null;
  documents: EventDocument[];
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

/** Fields a caller may set when creating an event. `id`/slugs/timestamps are the store's job. */
export interface EventCreateInput {
  slug?: string;
  titleAr: string;
  titleEn?: string | null;
  summaryAr?: string | null;
  summaryEn?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  startsAt: string;
  endsAt?: string | null;
  timezone?: string;
  allDay?: boolean;
  venueId?: string | null;
  status?: EventStatus;
  seriesId?: string | null;
  occurrenceDate?: string | null;
  isExceptionOf?: string | null;
  imageUrl?: string | null;
  documents?: EventDocument[];
  /** Taxonomy terms to attach; replaces the existing links when provided. */
  termIds?: readonly string[];
}

/**
 * A partial update. Only the keys present are applied — `undefined` leaves a field untouched,
 * `null` clears a nullable field.
 */
export type EventUpdateInput = Partial<Omit<EventCreateInput, "slug">> & { slug?: string };

/** An event together with its taxonomy links (the shape the UI wants). */
export interface EventWithTerms extends EventRecord {
  termIds: string[];
}

// ============================================================================
// 4. Series + occurrence exceptions
// ============================================================================

/**
 * A simple, explicit recurrence rule — deliberately NOT full RFC 5545. Two frequencies cover the
 * parish's real needs (a weekly liturgy, a monthly meeting) and the whole rule is readable in the
 * database by a non-programmer.
 *
 * Weekly: every `interval` weeks on each weekday of `byWeekday` (empty ⇒ the weekday of `startDate`).
 * Monthly: every `interval` months on `byMonthDay` (null ⇒ the day-of-month of `startDate`).
 * A month without that day simply has no occurrence (31st in February is skipped, never clamped).
 */
export interface RecurrenceRule {
  freq: RecurrenceFreq;
  /** ≥ 1. `2` with `freq: "weekly"` means every other week. */
  interval: number;
  /** Weekly rules: days of week, 0 = Sunday … 6 = Saturday. */
  byWeekday: number[];
  /** Monthly rules: day of month 1-31, or null to use `startDate`'s day. */
  byMonthDay: number | null;
  /** `YYYY-MM-DD`, series-local. No occurrence exists before it. */
  startDate: string;
  /** `YYYY-MM-DD` inclusive, or null for an open-ended series. */
  endDate: string | null;
  /** IANA zone the wall-clock times below are expressed in. */
  timezone: string;
}

/** A recurring series (a weekly liturgy, a monthly meeting). */
export interface EventSeriesRecord {
  id: string;
  titleAr: string;
  titleEn: string | null;
  summaryAr: string | null;
  summaryEn: string | null;
  rule: RecurrenceRule;
  /** Series-local `HH:MM` start of every occurrence. */
  startTime: string;
  /** Length of every occurrence, in minutes (≥ 1). */
  durationMinutes: number;
  /** `taxonomy_terms.id` of the usual venue, or null. */
  defaultVenueId: string | null;
  /** Defaults used for the events materialised from an occurrence. */
  defaultTermIds: string[];
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface EventSeriesCreateInput {
  titleAr: string;
  titleEn?: string | null;
  summaryAr?: string | null;
  summaryEn?: string | null;
  rule: RecurrenceRule;
  startTime: string;
  durationMinutes?: number;
  defaultVenueId?: string | null;
  defaultTermIds?: readonly string[];
  status?: EventStatus;
}

export type EventSeriesUpdateInput = Partial<EventSeriesCreateInput>;

/** A per-occurrence deviation from the rule. `(seriesId, occurrenceDate)` is unique. */
export interface EventExceptionRecord {
  id: string;
  seriesId: string;
  /** Series-local `YYYY-MM-DD` of the occurrence being deviated from. */
  occurrenceDate: string;
  kind: EventExceptionKind;
  /** New series-local `YYYY-MM-DD` when `kind === "moved"`; null for a cancellation. */
  movedToDate: string | null;
  reasonAr: string | null;
  reasonEn: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface EventExceptionInput {
  seriesId: string;
  occurrenceDate: string;
  kind: EventExceptionKind;
  movedToDate?: string | null;
  reasonAr?: string | null;
  reasonEn?: string | null;
}

// ============================================================================
// 5. Taxonomy
// ============================================================================

export interface TaxonomyTermRecord {
  id: string;
  dimension: TaxonomyDimension;
  slug: string;
  nameAr: string;
  nameEn: string | null;
  /** lucide-react icon name, e.g. "Church". Rendered by the UI, never resolved here. */
  icon: string | null;
  /** Palette token (e.g. "copticNavy") or a hex value; the UI owns the interpretation. */
  color: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface TaxonomyTermCreateInput {
  dimension: TaxonomyDimension;
  slug: string;
  nameAr: string;
  nameEn?: string | null;
  icon?: string | null;
  color?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export type TaxonomyTermUpdateInput = Partial<Omit<TaxonomyTermCreateInput, "dimension">> & {
  dimension?: TaxonomyDimension;
};

/** Many-to-many link between an event and a taxonomy term. */
export interface EventTermLink {
  eventId: string;
  termId: string;
  createdAt: string;
}

// ============================================================================
// 6. Media
// ============================================================================

/** Metadata for an uploaded file. The bytes live outside the store (path/URL only). */
export interface MediaRecord {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  /** Repository-relative path or URL. */
  url: string;
  storagePath: string | null;
  checksum: string | null;
  altAr: string | null;
  altEn: string | null;
  uploadedBy: string | null;
  createdAt: string;
  isPublic: boolean;
}

export interface MediaCreateInput {
  filename: string;
  mimeType: string;
  sizeBytes?: number;
  url: string;
  storagePath?: string | null;
  checksum?: string | null;
  altAr?: string | null;
  altEn?: string | null;
  isPublic?: boolean;
}

export type MediaUpdateInput = Partial<MediaCreateInput>;

// ============================================================================
// 7. Subscribers (event notifications)
// ============================================================================

/**
 * One email subscription to event updates.
 *
 * THE FLOW TODAY, STATED PLAINLY: the site has **no mail provider**. A visitor subscribes through a
 * public form, the subscription is stored and listed in the admin area, and nothing is ever emailed —
 * the notification side is a documented no-op adapter (`src/lib/notify/`) that only records what it
 * WOULD have sent. `confirmedAt` is therefore stamped at creation, because the in-site confirmation
 * message on the same page IS the only confirmation the visitor gives; a future double opt-in would
 * leave it null until the link in that email was opened.
 */
export interface SubscriberRecord {
  id: string;
  /** Normalised identity of the subscription. See `normalizeSubscriberEmail()`. */
  email: string;
  /** The display name the visitor typed, when they typed one. */
  name: string | null;
  /** The language the visitor was reading the site in when they subscribed. */
  locale: Locale;
  /** Taxonomy term SLUGS the visitor asked to hear about. EMPTY = every topic. */
  topics: string[];
  createdAt: string;
  /** When the subscription was confirmed by the visitor (see the flow note above). */
  confirmedAt: string | null;
  /** An admin can retire a subscription without deleting it; public submits revive it. */
  isActive: boolean;
}

/** What a public subscription submits. The store normalises the email and de-duplicates. */
export interface SubscriberCreateInput {
  email: string;
  name?: string | null;
  locale: Locale;
  topics?: readonly string[];
}

/** Result of a public subscription attempt: the stored row and whether it is new. */
export interface SubscriberSubscribeResult {
  subscriber: SubscriberRecord;
  /** `false` when an existing (possibly retired) subscription was updated instead of duplicated. */
  created: boolean;
}

// ============================================================================
// 8. Audit trail
// ============================================================================

/**
 * One recorded mutation. Every repository mutation appends exactly one entry carrying the row
 * BEFORE and AFTER the change (see `src/lib/store/audit.ts`).
 */
export interface AuditLogEntry {
  id: string;
  /** ISO instant. */
  at: string;
  actorId: string | null;
  actorName: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  before: JsonValue | null;
  after: JsonValue | null;
  /** One-line Arabic description shown in the audit screen. */
  summary: string;
}

// ============================================================================
// 9. Content Types Engine (Customizable CMS)
// ============================================================================

export type FieldType =
  | "text"
  | "richtext"
  | "number"
  | "date"
  | "media"
  | "select"
  | "relation"
  | "boolean";

export const FIELD_TYPES = [
  "text",
  "richtext",
  "number",
  "date",
  "media",
  "select",
  "relation",
  "boolean",
] as const satisfies readonly FieldType[];

export const FIELD_TYPE_LABELS_AR: Record<FieldType, string> = {
  text: "نص قصير",
  richtext: "نص منسق (محرر)",
  number: "رقم",
  date: "تاريخ / وقت",
  media: "وسائط (ملف / صورة)",
  select: "قائمة اختيار",
  relation: "ربط بنوع محتوى",
  boolean: "نعم / لا (منطقي)",
};

export type ContentStatus = "draft" | "published" | "archived";

export const CONTENT_STATUSES = ["draft", "published", "archived"] as const satisfies readonly ContentStatus[];

export const CONTENT_STATUS_LABELS_AR: Record<ContentStatus, string> = {
  draft: "مسودة",
  published: "منشور",
  archived: "مؤرشف",
};

export interface ContentFieldValidationRules {
  min?: number;
  max?: number;
  pattern?: string;
  [key: string]: any;
}

export interface ContentFieldOption {
  labelAr: string;
  labelEn?: string | null;
  value: string;
}

export interface ContentField {
  id: string;
  contentTypeId: string;
  slug: string;
  labelAr: string;
  labelEn: string | null;
  fieldType: FieldType;
  isRequired: boolean;
  isTranslatable: boolean;
  validationRules: ContentFieldValidationRules | null;
  options: ContentFieldOption[] | string[] | null;
  sortOrder: number;
}

export interface ContentType {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string | null;
  icon: string | null;
  template: string | null;
  isActive: boolean;
  createdAt: string;
  fields?: ContentField[];
}

export interface ContentEntry {
  id: string;
  contentTypeId: string;
  slug: string;
  status: ContentStatus;
  data: Record<string, any>;
  publishedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentTypeInput {
  slug: string;
  nameAr: string;
  nameEn?: string | null;
  icon?: string | null;
  template?: string | null;
  isActive?: boolean;
}

export type UpdateContentTypeInput = Partial<CreateContentTypeInput>;

export interface CreateContentFieldInput {
  contentTypeId?: string;
  slug: string;
  labelAr: string;
  labelEn?: string | null;
  fieldType: FieldType;
  isRequired?: boolean;
  isTranslatable?: boolean;
  validationRules?: ContentFieldValidationRules | null;
  options?: ContentFieldOption[] | string[] | null;
  sortOrder?: number;
}

export type UpdateContentFieldInput = Partial<CreateContentFieldInput>;

export interface CreateContentEntryInput {
  contentTypeId: string;
  slug: string;
  status?: ContentStatus;
  data: Record<string, any>;
  publishedAt?: string | null;
}

export interface UpdateContentEntryInput {
  slug?: string;
  status?: ContentStatus;
  data?: Record<string, any>;
  publishedAt?: string | null;
}

// ============================================================================
// 10. Parish Videos (External URL Embeds)
// ============================================================================

export type VideoProvider = "youtube" | "facebook" | "direct";

export const VIDEO_PROVIDERS = ["youtube", "facebook", "direct"] as const satisfies readonly VideoProvider[];

export const VIDEO_PROVIDER_LABELS_AR: Record<VideoProvider, string> = {
  youtube: "يوتيوب",
  facebook: "فيسبوك",
  direct: "مباشر",
};

export interface ParishVideo {
  id: string;
  titleAr: string;
  titleEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  provider: VideoProvider;
  sourceUrl: string;
  embedUrl: string;
  thumbnailUrl: string | null;
  sortOrder: number;
  isPublic: boolean;
  isActive: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateParishVideoInput {
  titleAr: string;
  titleEn?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  provider: VideoProvider;
  sourceUrl: string;
  embedUrl: string;
  thumbnailUrl?: string | null;
  sortOrder?: number;
  isPublic?: boolean;
  isActive?: boolean;
}

export type UpdateParishVideoInput = Partial<CreateParishVideoInput>;

/** Public-safe projection: strips staff tracking fields and only contains public fields */
export interface PublicParishVideo {
  id: string;
  titleAr: string;
  titleEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  provider: VideoProvider;
  embedUrl: string;
  thumbnailUrl: string | null;
  sortOrder: number;
}

// ============================================================================
// 11. Parish Facilities / Services (CMS)
// ============================================================================

export interface ParishFacility {
  id: string;
  nameAr: string;
  nameEn: string | null;
  slug: string;
  serviceType: string;
  descriptionAr: string;
  descriptionEn: string | null;
  workingHoursAr: string;
  locationAr: string;
  contactPhone: string | null;
  contactWhatsapp: string | null;
  guidelinesAr: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
}

/** Public-safe projection: strips staff tracking fields and only contains public fields */
export interface PublicParishFacility {
  id: string;
  nameAr: string;
  nameEn: string | null;
  slug: string;
  serviceType: string;
  descriptionAr: string;
  descriptionEn: string | null;
  workingHoursAr: string;
  locationAr: string;
  contactPhone: string | null;
  contactWhatsapp: string | null;
  guidelinesAr: string | null;
  displayOrder: number;

  // Compatibility aliases for legacy/existing web templates
  name_ar: string;
  name_en: string | null;
  service_type: string;
  description_ar: string;
  description_en: string | null;
  working_hours_ar: string;
  operating_hours_ar: string;
  location_ar: string;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  guidelines_ar: string | null;
  display_order: number;
}

export interface CreateParishFacilityInput {
  nameAr: string;
  nameEn?: string | null;
  slug: string;
  serviceType: string;
  descriptionAr: string;
  descriptionEn?: string | null;
  workingHoursAr: string;
  locationAr: string;
  contactPhone?: string | null;
  contactWhatsapp?: string | null;
  guidelinesAr?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export type UpdateParishFacilityInput = Partial<CreateParishFacilityInput>;

// ============================================================================
// 12. Navigation Menu Items (CMS)
// ============================================================================

export type NavSection = "main" | "secondary";

export const NAV_SECTIONS = ["main", "secondary"] as const satisfies readonly NavSection[];

export interface NavigationMenuItem {
  id: string;
  key: string;
  labelAr: string;
  labelEn: string | null;
  href: string;
  section: NavSection;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

/** Public-safe projection: stripped of staff tracking fields, optional tree children */
export interface PublicNavItem {
  id: string;
  key: string;
  labelAr: string;
  labelEn: string | null;
  href: string;
  section: NavSection;
  parentId: string | null;
  sortOrder: number;
  children?: PublicNavItem[];
}

export interface CreateNavItemInput {
  key: string;
  labelAr: string;
  labelEn?: string | null;
  href: string;
  section: NavSection;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  isPublic?: boolean;
}

export type UpdateNavItemInput = Partial<CreateNavItemInput>;

export interface ReorderNavItemsInput {
  items: Array<{
    id: string;
    sortOrder: number;
    parentId?: string | null;
  }>;
}

