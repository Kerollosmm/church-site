// src/lib/store/seed.ts
// The seeded baseline of the file-backed store — built from the parish's OWN content.
//
// WHY THIS FILE EXISTS: with no Supabase environment the portal must still serve the parish's real
// schedules. The rows of `src/lib/data/seed-data.ts` are therefore CONVERTED into the events model on
// first use:
//
//   SEED_MASS_SCHEDULES   → one weekly `event_series` per liturgy (venue = its altar, type = liturgy)
//   SEED_CHURCH_MEETINGS  → one weekly `event_series` per meeting (ministry = the meeting itself)
//   SEED_STREAM_EVENTS    → two `events` (a scheduled broadcast and an archived recording)
//   SEED_ALTARS           → `venue` taxonomy terms (the parish's three real altars)
//   SEED_ACTIVITIES       → one `ministry` term per activity CATEGORY (the parish's own wording)
//
// NOTHING IS INVENTED HERE. Every Arabic name is read out of `seed-data.ts` at build time
// (`name_ar`, `category`, `title_ar`), and the only authored strings are the generic classification
// labels of the vocabulary itself ("قداس إلهي", "اجتماع كنسي", …) and their English names — i.e.
// metadata about the classification, not parish content. Two consequences of that rule, both
// intentional:
//
//   * `media` starts EMPTY. Seed rows carry `image_url` values like "/assets/altar-main.jpg", but no
//     such file exists in this repository (there is no `public/` directory) — seeding media rows
//     would advertise files that cannot be served.
//   * Activities and schools do NOT become events. Their schedules are free text
//     ("يومياً من 5:00 م حتى 9:00 م"), and parsing that into instants would be inventing times.
//     Their identities survive as `ministry` taxonomy terms.

import {
  SEED_ACTIVITIES,
  SEED_ALTARS,
  SEED_CHURCH_MEETINGS,
  SEED_MASS_SCHEDULES,
  SEED_STREAM_EVENTS,
} from "../data/seed-data";
import { DAY_OF_WEEK_INDEX } from "../utils/mass-schedule";
import {
  DEFAULT_EVENT_TIME_ZONE,
  type ContentEntry,
  type ContentField,
  type ContentType,
  type EventDocument as EventAttachment,
  type EventRecord,
  type EventSeriesRecord,
  type EventTermLink,
  type RecurrenceRule,
  type TaxonomyDimension,
  type TaxonomyTermRecord,
} from "@church-site/domain";
import { STORE_SCHEMA_VERSION, type StoreDocument } from "./document";
import { SEED_PARISH_FACILITIES } from "../facilities/seed-facilities";
import { SEED_NAVIGATION_ITEMS } from "../navigation/seed-nav";

/** All seeded rows carry the parish's baseline timestamp (see `seed-data.ts`). */
const SEEDED_AT = "2026-01-01T00:00:00.000Z";

/** Baseline calendar date of the seeded recurring rows — i.e. `SEEDED_AT` in parish time. */
const SEED_BASELINE_DATE_KEY = "2026-01-01";

/** Deterministic, UUID-shaped ids so a re-seed (or a test) yields byte-identical ids. */
const seedId = (prefix: string, index: number): string =>
  `${prefix}-0000-4000-8000-${String(index).padStart(12, "0")}`;

const TERM_ID_PREFIX = "7a000000";
const SERIES_ID_PREFIX = "5e000000";
const EVENT_ID_PREFIX = "3e000000";

// ============================================================================
// 1. Parish-derived vocabulary
// ============================================================================

/** The parish's altar → the `venue` term slug that represents it. */
const ALTAR_VENUE_SLUGS: Record<string, string> = {
  "a0000000-0000-0000-0000-000000000001": "main-altar",
  "a0000000-0000-0000-0000-000000000002": "northern-altar",
  "a0000000-0000-0000-0000-000000000003": "southern-altar",
};

/** Icon per serving meeting (a display hint only; the name comes from the meeting row). */
const MEETING_MINISTRY_ICONS: Record<string, string> = {
  malaeika: "Baby",
  "ebtedaey-1-3": "Baby",
  "ebtedaey-4-6": "BookOpen",
  edaady: "Trophy",
  thanaway: "Trophy",
  "arshi-youth": "BookOpen",
  "ni-angelos": "Library",
  "holy-family": "HeartHandshake",
  men: "Shirt",
  "om-elkhalas": "Sparkles",
  "widows-orphans": "HeartHandshake",
};

/** Activity slug → the `ministry` term slug for the activity's own `category` value. */
const ACTIVITY_CATEGORY_SLUGS: Record<string, string> = {
  scouts: "scouting",
  "lending-library": "reading-culture",
  "printing-center": "student-services",
  "creativity-center": "arts-talent",
  "social-club": "sports-fitness",
  "computer-center": "technology",
  "summer-club": "summer-activity",
};

/** Icons for the activity categories (display hints only). */
const ACTIVITY_CATEGORY_ICONS: Record<string, string> = {
  scouting: "Trophy",
  "reading-culture": "Library",
  "student-services": "BookOpen",
  "arts-talent": "Palette",
  "sports-fitness": "Trophy",
  technology: "Laptop",
  "summer-activity": "Sun",
};

interface TermSpec {
  dimension: TaxonomyDimension;
  slug: string;
  nameAr: string;
  nameEn: string | null;
  icon: string | null;
  color: string | null;
}

/** Classification labels authored for the system (not parish content). */
const GENERIC_TERM_SPECS: TermSpec[] = [
  // --- event types ---------------------------------------------------------
  { dimension: "event_type", slug: "liturgy", nameAr: "قداس إلهي", nameEn: "Divine Liturgy", icon: "Church", color: "copticNavy" },
  { dimension: "event_type", slug: "meeting", nameAr: "اجتماع كنسي", nameEn: "Church meeting", icon: "Users", color: "copticGold" },
  { dimension: "event_type", slug: "activity", nameAr: "نشاط خدمي", nameEn: "Parish activity", icon: "Sparkles", color: "presentGreen" },
  { dimension: "event_type", slug: "broadcast", nameAr: "بث مباشر", nameEn: "Live broadcast", icon: "Radio", color: "absentRed" },

  // --- audiences (matched against each row's own target_group_ar / target_age_ar) ---
  { dimension: "audience", slug: "all", nameAr: "عام لجميع الشعب", nameEn: "All parishioners", icon: "Users", color: "copticNavy" },
  { dimension: "audience", slug: "children", nameAr: "الأطفال والنشء", nameEn: "Children", icon: "Baby", color: "copticGold" },
  { dimension: "audience", slug: "youth", nameAr: "الشباب", nameEn: "Youth", icon: "Trophy", color: "presentGreen" },
  { dimension: "audience", slug: "university", nameAr: "طلبة الجامعات", nameEn: "University students", icon: "BookOpen", color: "copticNavy" },
  { dimension: "audience", slug: "graduates", nameAr: "الخريجون", nameEn: "Graduates", icon: "Library", color: "copticGold" },
  { dimension: "audience", slug: "families", nameAr: "الأسر", nameEn: "Families", icon: "HeartHandshake", color: "presentGreen" },
  { dimension: "audience", slug: "men", nameAr: "الرجال", nameEn: "Men", icon: "Shirt", color: "copticNavy" },
  { dimension: "audience", slug: "women", nameAr: "السيدات", nameEn: "Women", icon: "Sparkles", color: "copticGold" },
  { dimension: "audience", slug: "seniors", nameAr: "كبار السن", nameEn: "Seniors", icon: "Users", color: "presentGreen" },
  { dimension: "audience", slug: "employees", nameAr: "الموظفون وأصحاب الأعمال", nameEn: "Employees", icon: "Users", color: "copticNavy" },

  // --- languages -----------------------------------------------------------
  { dimension: "language", slug: "arabic", nameAr: "العربية", nameEn: "Arabic", icon: "Languages", color: "copticNavy" },

  // --- tags ----------------------------------------------------------------
  { dimension: "tag", slug: "weekly", nameAr: "أسبوعي", nameEn: "Weekly", icon: "CalendarDays", color: "copticGold" },
];

/** Venue terms, named exactly as the parish's altar rows name them. */
function buildVenueTermSpecs(): TermSpec[] {
  return SEED_ALTARS.filter((altar) => altar.is_active).map((altar) => ({
    dimension: "venue" as const,
    slug: ALTAR_VENUE_SLUGS[altar.id] ?? "venue",
    nameAr: altar.name_ar,
    nameEn: altar.name_en,
    icon: "MapPin",
    color: "copticNavy",
  }));
}

/** Ministry terms: one per serving meeting (its own name) plus one per activity category. */
function buildMinistryTermSpecs(): TermSpec[] {
  const meetingSpecs: TermSpec[] = SEED_CHURCH_MEETINGS.filter((meeting) => meeting.is_active).map((meeting) => ({
    dimension: "ministry" as const,
    slug: meeting.slug,
    nameAr: meeting.name_ar,
    nameEn: null,
    icon: MEETING_MINISTRY_ICONS[meeting.slug] ?? "Users",
    color: "copticNavy",
  }));

  const activitySpecs: TermSpec[] = SEED_ACTIVITIES.filter((activity) => activity.is_active).map((activity, index) => {
    const slug = ACTIVITY_CATEGORY_SLUGS[activity.slug];
    if (!slug) {
      throw new Error(`Seed activity "${activity.slug}" has no ministry term slug in ACTIVITY_CATEGORY_SLUGS.`);
    }
    return {
      dimension: "ministry" as const,
      slug,
      nameAr: activity.category,
      nameEn: null,
      icon: ACTIVITY_CATEGORY_ICONS[slug] ?? "Sparkles",
      color: index % 2 === 0 ? "copticGold" : "presentGreen",
    };
  });

  return [...meetingSpecs, ...activitySpecs];
}

/** The seeded terms with their ids and per-dimension sort order resolved. */
const SEED_TAXONOMY_TERMS: TaxonomyTermRecord[] = (() => {
  const specs = [...GENERIC_TERM_SPECS, ...buildVenueTermSpecs(), ...buildMinistryTermSpecs()];
  const sortCounters = new Map<TaxonomyDimension, number>();

  return specs.map((spec, index) => {
    const next = (sortCounters.get(spec.dimension) ?? 0) + 1;
    sortCounters.set(spec.dimension, next);
    return {
      id: seedId(TERM_ID_PREFIX, index + 1),
      dimension: spec.dimension,
      slug: spec.slug,
      nameAr: spec.nameAr,
      nameEn: spec.nameEn,
      icon: spec.icon,
      color: spec.color,
      sortOrder: next,
      isActive: true,
      createdAt: SEEDED_AT,
      updatedAt: SEEDED_AT,
      createdBy: null,
      updatedBy: null,
    } satisfies TaxonomyTermRecord;
  });
})();

/** Resolves a seeded term id; throws loudly if a builder below references a term that does not exist. */
function termId(dimension: TaxonomyDimension, slug: string): string {
  const term = SEED_TAXONOMY_TERMS.find((candidate) => candidate.dimension === dimension && candidate.slug === slug);
  if (!term) {
    throw new Error(`Seed term ${dimension}/${slug} is missing from the seeded vocabulary.`);
  }
  return term.id;
}

// ============================================================================
// 2. Series built from the parish's own schedule rows
// ============================================================================

/** "06:30:00" → "06:30" (the domain's `HH:MM` wall clock). */
function toTimeOfDay(value: string): string {
  const [hour = "0", minute = "0"] = value.split(":");
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

/** Minutes between two "HH:MM:SS" wall clocks of the same day. */
function minutesBetween(start: string, end: string): number {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  return minutes > 0 ? minutes : 60;
}

function weeklyRule(weekday: number): RecurrenceRule {
  return {
    freq: "weekly",
    interval: 1,
    byWeekday: [weekday],
    byMonthDay: null,
    startDate: SEED_BASELINE_DATE_KEY,
    endDate: null,
    timezone: DEFAULT_EVENT_TIME_ZONE,
  };
}

/**
 * Audience terms per liturgy, read off each row's own `target_group_ar`
 * (e.g. "طلبة الجامعات والأسر" → university + families).
 */
const MASS_AUDIENCE_SLUGS: Record<string, string[]> = {
  "m0000000-0000-0000-0000-000000000001": ["all"], // "عام لجميع الشعب"
  "m0000000-0000-0000-0000-000000000002": ["university", "families"], // "طلبة الجامعات والأسر"
  "m0000000-0000-0000-0000-000000000003": ["employees"], // "الموظفين وأصحاب الأعمال والطلبة"
  "m0000000-0000-0000-0000-000000000004": ["all", "families"], // "شعب الكنيسة وأسر التربية الكنسية"
  "m0000000-0000-0000-0000-000000000005": ["all", "seniors"], // "عام لجميع الشعب والمسنين"
};

/**
 * Audience terms per meeting, read off each row's own `target_age_ar`
 * (e.g. "الصفوف الأول والثاني والثالث الابتدائي" → children).
 */
const MEETING_AUDIENCE_SLUGS: Record<string, string[]> = {
  malaeika: ["children"],
  "ebtedaey-1-3": ["children"],
  "ebtedaey-4-6": ["children"],
  edaady: ["youth"],
  thanaway: ["youth"],
  "arshi-youth": ["university"],
  "ni-angelos": ["graduates"],
  "holy-family": ["families"],
  men: ["men"],
  "om-elkhalas": ["women"],
  "widows-orphans": ["seniors"],
};

/** The weekly liturgies, one series each. */
function buildMassSeries(): EventSeriesRecord[] {
  return SEED_MASS_SCHEDULES.filter((mass) => mass.is_active).map((mass, index) => ({
    id: seedId(SERIES_ID_PREFIX, index + 1),
    titleAr: mass.title_ar,
    titleEn: null,
    summaryAr: mass.notes_ar ?? null,
    summaryEn: null,
    rule: weeklyRule(DAY_OF_WEEK_INDEX[mass.day_of_week]),
    startTime: toTimeOfDay(mass.start_time),
    durationMinutes: minutesBetween(mass.start_time, mass.end_time),
    defaultVenueId: termId("venue", ALTAR_VENUE_SLUGS[mass.altar_id] ?? "main-altar"),
    defaultTermIds: [
      termId("event_type", "liturgy"),
      termId("language", "arabic"),
      termId("tag", "weekly"),
      ...(MASS_AUDIENCE_SLUGS[mass.id] ?? ["all"]).map((slug) => termId("audience", slug)),
    ],
    status: "published" as const,
    createdAt: SEEDED_AT,
    updatedAt: SEEDED_AT,
    createdBy: null,
    updatedBy: null,
  }));
}

/** The weekly meetings, one series each (ministry = the meeting itself). */
function buildMeetingSeries(offset: number): EventSeriesRecord[] {
  return SEED_CHURCH_MEETINGS.filter((meeting) => meeting.is_active).map((meeting, index) => ({
    id: seedId(SERIES_ID_PREFIX, offset + index + 1),
    titleAr: meeting.name_ar,
    titleEn: null,
    summaryAr: meeting.description_ar,
    summaryEn: null,
    rule: weeklyRule(DAY_OF_WEEK_INDEX[meeting.day_of_week]),
    startTime: toTimeOfDay(meeting.start_time),
    durationMinutes: minutesBetween(meeting.start_time, meeting.end_time),
    // The seed stores the hall as free text (`location_hall_ar`); no venue term is invented for it.
    defaultVenueId: null,
    defaultTermIds: [
      termId("event_type", "meeting"),
      termId("ministry", meeting.slug),
      termId("language", "arabic"),
      termId("tag", "weekly"),
      ...(MEETING_AUDIENCE_SLUGS[meeting.slug] ?? []).map((slug) => termId("audience", slug)),
    ],
    status: "published" as const,
    createdAt: SEEDED_AT,
    updatedAt: SEEDED_AT,
    createdBy: null,
    updatedBy: null,
  }));
}

// ============================================================================
// 3. Dated events
// ============================================================================

/**
 * The dated rows of `SEED_STREAM_EVENTS` become real events. Their slugs are authored here because
 * the source rows have none; the titles, instants and statuses are the parish's own.
 */
const STREAM_EVENT_SLUGS: Record<string, string> = {
  "str00000-0000-0000-0000-000000000001": "broadcast-sunday-morning-liturgy",
  "str00000-0000-0000-0000-000000000002": "recording-feast-saints-maximus-domadius",
};

function buildStreamEvents(): EventRecord[] {
  return SEED_STREAM_EVENTS.map((stream, index) => ({
    id: seedId(EVENT_ID_PREFIX, index + 1),
    slug: STREAM_EVENT_SLUGS[stream.id] ?? `stream-${index + 1}`,
    titleAr: stream.title_ar,
    titleEn: null,
    summaryAr: null,
    summaryEn: null,
    descriptionAr: null,
    descriptionEn: null,
    startsAt: new Date(stream.starts_at).toISOString(),
    endsAt: stream.ends_at ? new Date(stream.ends_at).toISOString() : null,
    timezone: DEFAULT_EVENT_TIME_ZONE,
    allDay: false,
    venueId: null,
    status: stream.is_archived ? ("archived" as const) : ("published" as const),
    seriesId: null,
    occurrenceDate: null,
    isExceptionOf: null,
    imageUrl: null,
    documents: [] as EventAttachment[],
    createdAt: SEEDED_AT,
    updatedAt: SEEDED_AT,
    createdBy: null,
    updatedBy: null,
  }));
}

/** Taxonomy links for the seeded events (series carry theirs inside `defaultTermIds`). */
function buildEventTermLinks(events: readonly EventRecord[]): EventTermLink[] {
  const broadcastTerms = [
    termId("event_type", "broadcast"),
    termId("audience", "all"),
    termId("language", "arabic"),
  ];
  return events.flatMap((event) =>
    broadcastTerms.map((termIdValue) => ({ eventId: event.id, termId: termIdValue, createdAt: SEEDED_AT }))
  );
}

// ============================================================================
// 4. Content Types Engine Seeds (Built-in Types)
// ============================================================================

export const SEED_CONTENT_TYPES: ContentType[] = [
  {
    id: "c1000000-0000-4000-8000-000000000001",
    slug: "article",
    nameAr: "مقالات وأخبار",
    nameEn: "Articles & News",
    icon: "FileText",
    template: "article",
    isActive: true,
    createdAt: SEEDED_AT,
  },
  {
    id: "c1000000-0000-4000-8000-000000000002",
    slug: "announcement",
    nameAr: "إعلانات وتنويهات",
    nameEn: "Announcements",
    icon: "Bell",
    template: "default",
    isActive: true,
    createdAt: SEEDED_AT,
  },
  {
    id: "c1000000-0000-4000-8000-000000000003",
    slug: "sermon",
    nameAr: "عظات وكلمات روحية",
    nameEn: "Sermons",
    icon: "Mic",
    template: "default",
    isActive: true,
    createdAt: SEEDED_AT,
  },
];

export const SEED_CONTENT_FIELDS: ContentField[] = [
  // Article fields
  {
    id: "f1000000-0000-4000-8000-000000000001",
    contentTypeId: "c1000000-0000-4000-8000-000000000001",
    slug: "title",
    labelAr: "العنوان",
    labelEn: "Title",
    fieldType: "text",
    isRequired: true,
    isTranslatable: true,
    validationRules: { min: 3, max: 200 },
    options: null,
    sortOrder: 1,
  },
  {
    id: "f1000000-0000-4000-8000-000000000002",
    contentTypeId: "c1000000-0000-4000-8000-000000000001",
    slug: "summary",
    labelAr: "الملخص",
    labelEn: "Summary",
    fieldType: "text",
    isRequired: false,
    isTranslatable: true,
    validationRules: { max: 500 },
    options: null,
    sortOrder: 2,
  },
  {
    id: "f1000000-0000-4000-8000-000000000003",
    contentTypeId: "c1000000-0000-4000-8000-000000000001",
    slug: "body",
    labelAr: "نص المقال",
    labelEn: "Body",
    fieldType: "richtext",
    isRequired: true,
    isTranslatable: true,
    validationRules: null,
    options: null,
    sortOrder: 3,
  },
  {
    id: "f1000000-0000-4000-8000-000000000004",
    contentTypeId: "c1000000-0000-4000-8000-000000000001",
    slug: "cover_image",
    labelAr: "صورة الغلاف",
    labelEn: "Cover Image",
    fieldType: "media",
    isRequired: false,
    isTranslatable: false,
    validationRules: null,
    options: null,
    sortOrder: 4,
  },
  {
    id: "f1000000-0000-4000-8000-000000000005",
    contentTypeId: "c1000000-0000-4000-8000-000000000001",
    slug: "published_date",
    labelAr: "تاريخ النشر",
    labelEn: "Publication Date",
    fieldType: "date",
    isRequired: false,
    isTranslatable: false,
    validationRules: null,
    options: null,
    sortOrder: 5,
  },
  {
    id: "f1000000-0000-4000-8000-000000000006",
    contentTypeId: "c1000000-0000-4000-8000-000000000001",
    slug: "author",
    labelAr: "الكاتب",
    labelEn: "Author",
    fieldType: "text",
    isRequired: false,
    isTranslatable: true,
    validationRules: { max: 100 },
    options: null,
    sortOrder: 6,
  },

  // Announcement fields
  {
    id: "f1000000-0000-4000-8000-000000000007",
    contentTypeId: "c1000000-0000-4000-8000-000000000002",
    slug: "title",
    labelAr: "عنوان الإعلان",
    labelEn: "Title",
    fieldType: "text",
    isRequired: true,
    isTranslatable: true,
    validationRules: { min: 3, max: 200 },
    options: null,
    sortOrder: 1,
  },
  {
    id: "f1000000-0000-4000-8000-000000000008",
    contentTypeId: "c1000000-0000-4000-8000-000000000002",
    slug: "body",
    labelAr: "نص الإعلان",
    labelEn: "Content",
    fieldType: "richtext",
    isRequired: true,
    isTranslatable: true,
    validationRules: null,
    options: null,
    sortOrder: 2,
  },
  {
    id: "f1000000-0000-4000-8000-000000000009",
    contentTypeId: "c1000000-0000-4000-8000-000000000002",
    slug: "urgency",
    labelAr: "درجة الأهمية",
    labelEn: "Urgency",
    fieldType: "select",
    isRequired: false,
    isTranslatable: false,
    validationRules: null,
    options: [
      { labelAr: "عادي", value: "normal" },
      { labelAr: "هام وعاجل", value: "urgent" },
    ],
    sortOrder: 3,
  },
  {
    id: "f1000000-0000-4000-8000-000000000010",
    contentTypeId: "c1000000-0000-4000-8000-000000000002",
    slug: "attachment",
    labelAr: "مرفق / ملف",
    labelEn: "Attachment",
    fieldType: "media",
    isRequired: false,
    isTranslatable: false,
    validationRules: null,
    options: null,
    sortOrder: 4,
  },

  // Sermon fields
  {
    id: "f1000000-0000-4000-8000-000000000011",
    contentTypeId: "c1000000-0000-4000-8000-000000000003",
    slug: "title",
    labelAr: "عنوان العظة",
    labelEn: "Title",
    fieldType: "text",
    isRequired: true,
    isTranslatable: true,
    validationRules: { min: 3, max: 200 },
    options: null,
    sortOrder: 1,
  },
  {
    id: "f1000000-0000-4000-8000-000000000012",
    contentTypeId: "c1000000-0000-4000-8000-000000000003",
    slug: "speaker",
    labelAr: "المتكلم / الواعظ",
    labelEn: "Speaker",
    fieldType: "text",
    isRequired: true,
    isTranslatable: true,
    validationRules: { min: 2, max: 100 },
    options: null,
    sortOrder: 2,
  },
  {
    id: "f1000000-0000-4000-8000-000000000013",
    contentTypeId: "c1000000-0000-4000-8000-000000000003",
    slug: "scripture",
    labelAr: "الشاهد الكتابي",
    labelEn: "Scripture Reference",
    fieldType: "text",
    isRequired: false,
    isTranslatable: true,
    validationRules: { max: 200 },
    options: null,
    sortOrder: 3,
  },
  {
    id: "f1000000-0000-4000-8000-000000000014",
    contentTypeId: "c1000000-0000-4000-8000-000000000003",
    slug: "date",
    labelAr: "تاريخ إلقاء العظة",
    labelEn: "Date",
    fieldType: "date",
    isRequired: true,
    isTranslatable: false,
    validationRules: null,
    options: null,
    sortOrder: 4,
  },
  {
    id: "f1000000-0000-4000-8000-000000000015",
    contentTypeId: "c1000000-0000-4000-8000-000000000003",
    slug: "audio_file",
    labelAr: "التسجيل الصوتي",
    labelEn: "Audio Recording",
    fieldType: "media",
    isRequired: false,
    isTranslatable: false,
    validationRules: null,
    options: null,
    sortOrder: 5,
  },
  {
    id: "f1000000-0000-4000-8000-000000000016",
    contentTypeId: "c1000000-0000-4000-8000-000000000003",
    slug: "notes",
    labelAr: "ملاحظات ونقاط العظة",
    labelEn: "Notes",
    fieldType: "richtext",
    isRequired: false,
    isTranslatable: true,
    validationRules: null,
    options: null,
    sortOrder: 6,
  },
];

// ============================================================================
// 5. The document
// ============================================================================

/** Builds the complete seeded document. Pure and deterministic. */
export function buildSeedDocument(): StoreDocument {
  const series = [...buildMassSeries(), ...buildMeetingSeries(SEED_MASS_SCHEDULES.length)];
  const events = buildStreamEvents();

  return {
    schemaVersion: STORE_SCHEMA_VERSION,
    createdAt: SEEDED_AT,
    updatedAt: SEEDED_AT,
    events,
    series,
    exceptions: [],
    terms: SEED_TAXONOMY_TERMS.map((term) => ({ ...term })),
    eventTerms: buildEventTermLinks(events),
    media: [],
    // Subscribers are PEOPLE, not content: a seeded row would be an invented address. Empty.
    subscribers: [],
    contentTypes: SEED_CONTENT_TYPES.map((type) => ({ ...type })),
    contentFields: SEED_CONTENT_FIELDS.map((field) => ({ ...field })),
    contentEntries: [],
    // Parish videos start empty until staff add real URLs (no invented video data).
    parishVideos: [],
    facilities: SEED_PARISH_FACILITIES.map((f) => ({ ...f })),
    navItems: SEED_NAVIGATION_ITEMS.map((item) => ({ ...item })),
    audit: [],
  };
}

/** Baseline size, logged once when the JSON store seeds itself. */
export function describeSeed(): { series: number; events: number; terms: number } {
  const document = buildSeedDocument();
  return { series: document.series.length, events: document.events.length, terms: document.terms.length };
}
