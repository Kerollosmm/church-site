// src/lib/store/supabase-driver.ts
// The Supabase driver: the SAME repository contract, backed by the tables added in
// `supabase/migrations/20260916090700_events_taxonomy_media_audit.sql`.
//
// WHICH CLIENT: the session-aware client is preferred, so the `is_staff()` RLS policies are the
// second, database-enforced gate behind `requireStaff()` — the same defence-in-depth rule the rest
// of the admin area follows (see `src/actions/admin-booking-actions.ts`). The service-role client is
// used only when the session client cannot be built at all (a cached callback or a plain script,
// where `cookies()` is unavailable); that fallback is logged every single time, never silent.
//
// AUDIT UNDER POSTGREST: a mutation and its audit row are two separate HTTP calls, so — unlike the
// JSON driver, where one atomic rename covers both — the audit append is BEST EFFORT. A failure to
// append is logged loudly with the entity it belonged to and does not roll back a change the
// database already accepted. A single Postgres function per mutation would fix this; that is a
// deliberate follow-up, not a silent gap.

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseUrl } from "@/lib/env";
import type { Database, Json, Tables, TablesInsert } from "@/types/database.types";
import { buildAuditEntry, newId, nowIso, snapshot } from "@/lib/store/audit";
import {
  normalizeSubscriberEmail,
  normalizeSubscriberTopics,
  SUBSCRIBER_EMAIL_MAX_LENGTH,
  SUBSCRIBER_NAME_MAX_LENGTH,
} from "@/lib/domain/subscribers";
import {
  normalizeStatusFilter,
  StoreError,
  type AuditListFilter,
  type AuditNoteInput,
  type EventListFilter,
  type EventRepository,
  type MediaListFilter,
  type RepositoryStatus,
  type SeriesListFilter,
  type SubscriberListFilter,
  type TaxonomyTermListFilter,
} from "@/lib/store/repository";
import {
  AUDIT_ENTITY_TYPE_LABELS_AR,
  DEFAULT_EVENT_TIME_ZONE,
  type Actor,
  type AuditAction,
  type AuditEntityType,
  type AuditLogEntry,
  type EventCreateInput,
  type EventDocument,
  type EventExceptionInput,
  type EventExceptionRecord,
  type EventRecord,
  type EventSeriesCreateInput,
  type EventSeriesRecord,
  type EventSeriesUpdateInput,
  type EventStatus,
  type EventUpdateInput,
  type EventWithTerms,
  type JsonValue,
  type MediaCreateInput,
  type MediaRecord,
  type MediaUpdateInput,
  type SubscriberCreateInput,
  type SubscriberRecord,
  type SubscriberSubscribeResult,
  type TaxonomyTermCreateInput,
  type TaxonomyTermRecord,
  type TaxonomyTermUpdateInput,
} from "@/lib/domain/types";

type StoreClient = SupabaseClient<Database>;
type EventRow = Tables<"events">;
type SeriesRow = Tables<"event_series">;
type ExceptionRow = Tables<"event_exceptions">;
type TermRow = Tables<"taxonomy_terms">;
type MediaRow = Tables<"media">;
type SubscriberRow = Tables<"subscribers">;
type AuditRow = Tables<"audit_log">;

/** PostgREST error codes → the repository's closed failure vocabulary. */
const ERROR_CODE_MAP: Record<string, "not_found" | "conflict" | "invalid"> = {
  PGRST116: "not_found", // no row returned by .single()
  "23505": "conflict", // unique violation
  "23503": "invalid", // foreign key violation
  "23514": "invalid", // check constraint violation
  "22P02": "invalid", // invalid text representation (bad uuid/enum)
};

interface PostgrestErrorLike {
  code?: string | null;
  message: string;
  details?: string | null;
}

function toStoreError(error: PostgrestErrorLike, operation: string, detail: Record<string, unknown> = {}): StoreError {
  const mapped = ERROR_CODE_MAP[error.code ?? ""] ?? "unavailable";
  return new StoreError(mapped, operation, error.message, { ...detail, code: error.code ?? null });
}

/** Status change → the action recorded in the audit trail (same table as the JSON driver). */
const STATUS_AUDIT_ACTION: Record<EventStatus, AuditAction> = {
  draft: "unpublish",
  published: "publish",
  cancelled: "cancel",
  archived: "unpublish",
};

// --- value conversion -------------------------------------------------------

/** PostgREST `time` ("07:00:00") → the domain's `HH:MM`. */
function toTimeOfDay(value: string): string {
  const [hour = "0", minute = "0"] = value.split(":");
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

/** The domain's `HH:MM` → PostgREST `time`. */
function fromTimeOfDay(value: string): string {
  return value.length === 5 ? `${value}:00` : value;
}

function toInstant(value: string): string {
  return new Date(value).toISOString();
}

function toOptionalInstant(value: string | null): string | null {
  return value ? new Date(value).toISOString() : null;
}

/** `JsonValue` (domain) → the generated `Json` column type. */
function toJsonColumn(value: JsonValue | null): Json {
  return value as Json;
}

/**
 * `documents` is a JSONB column, so the value that comes back is only as trustworthy as whatever
 * wrote it. Entries that do not carry a filename and a url are DROPPED rather than rendered.
 */
function toEventDocuments(value: Json | null): EventDocument[] {
  if (!Array.isArray(value)) return [];

  const documents: EventDocument[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const record = entry as Record<string, Json | undefined>;
    const { filename, url, mimeType, sizeBytes } = record;
    if (typeof filename !== "string" || typeof url !== "string") continue;
    documents.push({
      filename,
      url,
      mimeType: typeof mimeType === "string" ? mimeType : null,
      sizeBytes: typeof sizeBytes === "number" ? sizeBytes : null,
    });
  }
  return documents;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

// --- row ↔ domain mapping ---------------------------------------------------

function toEventRecord(row: EventRow): EventRecord {
  return {
    id: row.id,
    slug: row.slug,
    titleAr: row.title_ar,
    titleEn: row.title_en,
    summaryAr: row.summary_ar,
    summaryEn: row.summary_en,
    descriptionAr: row.description_ar,
    descriptionEn: row.description_en,
    startsAt: toInstant(row.starts_at),
    endsAt: toOptionalInstant(row.ends_at),
    timezone: row.timezone,
    allDay: row.all_day,
    venueId: row.venue_id,
    status: row.status,
    seriesId: row.series_id,
    occurrenceDate: row.occurrence_date,
    isExceptionOf: row.is_exception_of,
    imageUrl: row.image_url,
    documents: toEventDocuments(row.documents),
    createdAt: toInstant(row.created_at),
    updatedAt: toInstant(row.updated_at),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

function toSeriesRecord(row: SeriesRow): EventSeriesRecord {
  return {
    id: row.id,
    titleAr: row.title_ar,
    titleEn: row.title_en,
    summaryAr: row.summary_ar,
    summaryEn: row.summary_en,
    rule: {
      freq: row.freq,
      interval: row.recurrence_interval,
      byWeekday: row.by_weekday ?? [],
      byMonthDay: row.by_month_day,
      startDate: row.start_date,
      endDate: row.end_date,
      timezone: row.timezone,
    },
    startTime: toTimeOfDay(row.start_time),
    durationMinutes: row.duration_minutes,
    defaultVenueId: row.default_venue_id,
    defaultTermIds: row.default_term_ids ?? [],
    status: row.status,
    createdAt: toInstant(row.created_at),
    updatedAt: toInstant(row.updated_at),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

function toExceptionRecord(row: ExceptionRow): EventExceptionRecord {
  return {
    id: row.id,
    seriesId: row.series_id,
    occurrenceDate: row.occurrence_date,
    kind: row.kind,
    movedToDate: row.moved_to_date,
    reasonAr: row.reason_ar,
    reasonEn: row.reason_en,
    createdAt: toInstant(row.created_at),
    updatedAt: toInstant(row.updated_at),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

function toTermRecord(row: TermRow): TaxonomyTermRecord {
  return {
    id: row.id,
    dimension: row.dimension,
    slug: row.slug,
    nameAr: row.name_ar,
    nameEn: row.name_en,
    icon: row.icon,
    color: row.color,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: toInstant(row.created_at),
    updatedAt: toInstant(row.updated_at),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

function toMediaRecord(row: MediaRow): MediaRecord {
  return {
    id: row.id,
    filename: row.filename,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    url: row.url,
    altAr: row.alt_ar,
    altEn: row.alt_en,
    uploadedBy: row.uploaded_by,
    createdAt: toInstant(row.created_at),
    isPublic: row.is_public,
  };
}

function toSubscriberRecord(row: SubscriberRow): SubscriberRecord {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    locale: row.locale,
    topics: row.topics ?? [],
    createdAt: toInstant(row.created_at),
    confirmedAt: toOptionalInstant(row.confirmed_at),
    isActive: row.is_active,
  };
}

function toAuditEntry(row: AuditRow): AuditLogEntry {
  return {
    id: row.id,
    at: toInstant(row.at),
    actorId: row.actor_id,
    actorName: row.actor_name,
    action: row.action,
    entityType: row.entity_type as AuditEntityType,
    entityId: row.entity_id,
    before: (row.before ?? null) as JsonValue | null,
    after: (row.after ?? null) as JsonValue | null,
    summary: row.summary,
  };
}

/** Event fields → an insert row. `undefined` is impossible here: an insert needs every column. */
function toEventInsert(input: EventCreateInput, actor: Actor, slug: string, now: string): TablesInsert<"events"> {
  return {
    id: newId(),
    slug,
    title_ar: input.titleAr,
    title_en: input.titleEn ?? null,
    summary_ar: input.summaryAr ?? null,
    summary_en: input.summaryEn ?? null,
    description_ar: input.descriptionAr ?? null,
    description_en: input.descriptionEn ?? null,
    starts_at: new Date(input.startsAt).toISOString(),
    ends_at: input.endsAt ? new Date(input.endsAt).toISOString() : null,
    timezone: input.timezone ?? DEFAULT_EVENT_TIME_ZONE,
    all_day: input.allDay ?? false,
    venue_id: input.venueId ?? null,
    status: input.status ?? "draft",
    series_id: input.seriesId ?? null,
    occurrence_date: input.occurrenceDate ?? null,
    is_exception_of: input.isExceptionOf ?? null,
    image_url: input.imageUrl ?? null,
    documents: toJsonColumn(snapshot(input.documents ?? [])),
    created_at: now,
    updated_at: now,
    created_by: actor.id,
    updated_by: actor.id,
  };
}

/** The `events` UPDATE payload for a patch — only the keys the caller actually provided. */
function toEventPatch(patch: EventUpdateInput, actor: Actor, now: string): TablesInsert<"events"> {
  const columns: Record<string, unknown> = { updated_at: now, updated_by: actor.id };

  if (patch.slug !== undefined) columns.slug = patch.slug.trim();
  if (patch.titleAr !== undefined) columns.title_ar = patch.titleAr;
  if (patch.titleEn !== undefined) columns.title_en = patch.titleEn;
  if (patch.summaryAr !== undefined) columns.summary_ar = patch.summaryAr;
  if (patch.summaryEn !== undefined) columns.summary_en = patch.summaryEn;
  if (patch.descriptionAr !== undefined) columns.description_ar = patch.descriptionAr;
  if (patch.descriptionEn !== undefined) columns.description_en = patch.descriptionEn;
  if (patch.startsAt !== undefined) columns.starts_at = new Date(patch.startsAt).toISOString();
  if (patch.endsAt !== undefined) columns.ends_at = patch.endsAt ? new Date(patch.endsAt).toISOString() : null;
  if (patch.timezone !== undefined) columns.timezone = patch.timezone;
  if (patch.allDay !== undefined) columns.all_day = patch.allDay;
  if (patch.venueId !== undefined) columns.venue_id = patch.venueId;
  if (patch.status !== undefined) columns.status = patch.status;
  if (patch.seriesId !== undefined) columns.series_id = patch.seriesId;
  if (patch.occurrenceDate !== undefined) columns.occurrence_date = patch.occurrenceDate;
  if (patch.isExceptionOf !== undefined) columns.is_exception_of = patch.isExceptionOf;
  if (patch.imageUrl !== undefined) columns.image_url = patch.imageUrl;
  if (patch.documents !== undefined) columns.documents = toJsonColumn(snapshot(patch.documents));

  return columns as unknown as TablesInsert<"events">;
}

function toSeriesColumns(input: EventSeriesCreateInput | EventSeriesUpdateInput): Record<string, unknown> {
  const columns: Record<string, unknown> = {};
  if (input.titleAr !== undefined) columns.title_ar = input.titleAr;
  if (input.titleEn !== undefined) columns.title_en = input.titleEn;
  if (input.summaryAr !== undefined) columns.summary_ar = input.summaryAr;
  if (input.summaryEn !== undefined) columns.summary_en = input.summaryEn;
  if (input.rule !== undefined) {
    columns.freq = input.rule.freq;
    columns.recurrence_interval = input.rule.interval;
    columns.by_weekday = input.rule.byWeekday;
    columns.by_month_day = input.rule.byMonthDay;
    columns.start_date = input.rule.startDate;
    columns.end_date = input.rule.endDate;
    columns.timezone = input.rule.timezone;
  }
  if (input.startTime !== undefined) columns.start_time = fromTimeOfDay(input.startTime);
  if (input.durationMinutes !== undefined) columns.duration_minutes = input.durationMinutes;
  if (input.defaultVenueId !== undefined) columns.default_venue_id = input.defaultVenueId;
  if (input.defaultTermIds !== undefined) columns.default_term_ids = unique(input.defaultTermIds);
  if (input.status !== undefined) columns.status = input.status;
  return columns;
}

export class SupabaseEventRepository implements EventRepository {
  readonly driver = "supabase" as const;

  // --- infrastructure ------------------------------------------------------

  private async client(): Promise<StoreClient> {
    try {
      return await createSupabaseServerClient();
    } catch (error) {
      console.warn("[store] session Supabase client unavailable; falling back to service-role", {
        reason: error instanceof Error ? error.message : String(error),
      });
      return createAdminClient();
    }
  }

  /**
   * The client for the ONE public mutation in this contract (`subscribe()`).
   *
   * WHY NOT THE SESSION CLIENT: the visitor has no session at all, so `is_staff()` can never be the
   * gate for them — and the `subscribers` table has no anonymous INSERT policy (subscriber e-mails are
   * private and must not be readable or writable by the public key directly). The public write is
   * therefore performed by the server with the service role, after the action has verified the
   * request (rate limit → zod → Turnstile), exactly like the other public forms in `src/actions/`.
   */
  private async publicClient(): Promise<StoreClient> {
    return createAdminClient();
  }

  /**
   * Appends one audit entry. Best effort by design (see the file header): the change is already
   * committed, so a failure here is reported loudly and does NOT fail the caller's mutation.
   */
  private async appendAudit(
    client: StoreClient,
    params: {
      actor: Actor;
      action: AuditAction;
      entityType: AuditEntityType;
      entityId: string;
      before: JsonValue | null;
      after: JsonValue | null;
      summary?: string;
    }
  ): Promise<void> {
    const entry = buildAuditEntry(params);
    const { error } = await client.from("audit_log").insert({
      id: entry.id,
      at: entry.at,
      actor_id: entry.actorId,
      actor_name: entry.actorName,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      before: toJsonColumn(entry.before),
      after: toJsonColumn(entry.after),
      summary: entry.summary,
    });

    if (error) {
      console.error("[store] audit append failed", {
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        code: error.code ?? null,
        message: error.message,
      });
    }
  }

  async status(): Promise<RepositoryStatus> {
    const client = await this.client();
    const { data, error } = await client
      .from("audit_log")
      .select("at")
      .order("at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let location: string | null = null;
    try {
      location = new URL(getSupabaseUrl()).host;
    } catch {
      location = null;
    }

    if (error) {
      console.error("[store] status read failed", { code: error.code ?? null, message: error.message });
      return { driver: "supabase", lastUpdatedAt: null, location };
    }

    return { driver: "supabase", lastUpdatedAt: data?.at ? toInstant(data.at) : null, location };
  }

  async republish(): Promise<RepositoryStatus> {
    return this.status();
  }

  // --- events --------------------------------------------------------------

  async listEvents(filter: EventListFilter = {}): Promise<EventWithTerms[]> {
    const client = await this.client();
    let query = client.from("events").select("*").order("starts_at", { ascending: true });

    const statuses = normalizeStatusFilter(filter.status);
    if (statuses) query = query.in("status", [...statuses]);
    if (filter.seriesId !== undefined) {
      query = filter.seriesId === null ? query.is("series_id", null) : query.eq("series_id", filter.seriesId);
    }
    if (filter.from) query = query.gte("starts_at", filter.from);
    if (filter.to) query = query.lte("starts_at", filter.to);
    if (filter.limit) query = query.limit(filter.limit);

    if (filter.termIds && filter.termIds.length > 0) {
      const { data: links, error: linkError } = await client
        .from("event_terms")
        .select("event_id")
        .in("term_id", [...filter.termIds]);
      if (linkError) throw toStoreError(linkError, "events.listTerms");
      const eventIds = unique((links ?? []).map((link) => link.event_id));
      if (eventIds.length === 0) return [];
      query = query.in("id", eventIds);
    }

    const { data, error } = await query;
    if (error) throw toStoreError(error, "events.list");
    const events = (data ?? []).map(toEventRecord);
    const terms = await this.listTermIdsByEvent(events.map((event) => event.id));
    return events.map((event) => ({ ...event, termIds: terms[event.id] ?? [] }));
  }

  async getEvent(id: string): Promise<EventWithTerms | null> {
    const client = await this.client();
    const { data, error } = await client.from("events").select("*").eq("id", id).maybeSingle();
    if (error) throw toStoreError(error, "events.get");
    if (!data) return null;
    const terms = await this.listTermIdsByEvent([data.id]);
    return { ...toEventRecord(data), termIds: terms[data.id] ?? [] };
  }

  async getEventBySlug(slug: string): Promise<EventWithTerms | null> {
    const client = await this.client();
    const { data, error } = await client.from("events").select("*").eq("slug", slug).maybeSingle();
    if (error) throw toStoreError(error, "events.getBySlug");
    if (!data) return null;
    const terms = await this.listTermIdsByEvent([data.id]);
    return { ...toEventRecord(data), termIds: terms[data.id] ?? [] };
  }

  async listTermIdsByEvent(eventIds: readonly string[]): Promise<Record<string, string[]>> {
    const result: Record<string, string[]> = {};
    for (const id of eventIds) result[id] = [];
    if (eventIds.length === 0) return result;

    const client = await this.client();
    const { data, error } = await client.from("event_terms").select("event_id, term_id").in("event_id", [...eventIds]);
    if (error) throw toStoreError(error, "events.listTerms");
    for (const link of data ?? []) {
      result[link.event_id]?.push(link.term_id);
    }
    return result;
  }

  async createEvent(input: EventCreateInput, actor: Actor): Promise<EventWithTerms> {
    const client = await this.client();
    const now = nowIso();
    const row = toEventInsert(input, actor, (input.slug ?? "").trim() || `event-${newId().slice(0, 8)}`, now);

    const { data, error } = await client.from("events").insert(row).select("*").single();
    if (error) throw toStoreError(error, "events.create", { slug: row.slug });

    const termIds = unique(input.termIds ?? []);
    if (termIds.length > 0) {
      const { error: linkError } = await client
        .from("event_terms")
        .insert(termIds.map((termId) => ({ event_id: data.id, term_id: termId, created_at: now })));
      if (linkError) throw toStoreError(linkError, "events.createTerms", { eventId: data.id });
    }

    await this.appendAudit(client, {
      actor,
      action: "create",
      entityType: "event",
      entityId: data.id,
      before: null,
      after: snapshot(toEventRecord(data)),
    });

    return { ...toEventRecord(data), termIds };
  }

  async updateEvent(id: string, patch: EventUpdateInput, actor: Actor): Promise<EventWithTerms> {
    const client = await this.client();
    const before = await this.getEvent(id);
    if (!before) throw new StoreError("not_found", "events.update", `Event ${id} does not exist.`, { id });

    const { data, error } = await client
      .from("events")
      .update(toEventPatch(patch, actor, nowIso()))
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw toStoreError(error, "events.update", { id });

    if (patch.termIds !== undefined) {
      await this.replaceEventTerms(client, id, unique(patch.termIds), nowIso());
    }

    await this.appendAudit(client, {
      actor,
      action: "update",
      entityType: "event",
      entityId: id,
      before: snapshot(before),
      after: snapshot(toEventRecord(data)),
    });

    const terms = await this.listTermIdsByEvent([id]);
    return { ...toEventRecord(data), termIds: terms[id] ?? [] };
  }

  async setEventStatus(
    id: string,
    status: EventStatus,
    actor: Actor,
    reason: { ar?: string | null; en?: string | null } = {}
  ): Promise<EventWithTerms> {
    const client = await this.client();
    const before = await this.getEvent(id);
    if (!before) throw new StoreError("not_found", "events.setStatus", `Event ${id} does not exist.`, { id });

    const { data, error } = await client
      .from("events")
      .update({ status, updated_at: nowIso(), updated_by: actor.id })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw toStoreError(error, "events.setStatus", { id });

    const reasonText = status === "cancelled" ? reason.ar?.trim() : undefined;
    await this.appendAudit(client, {
      actor,
      action: STATUS_AUDIT_ACTION[status],
      entityType: "event",
      entityId: id,
      before: snapshot(before),
      after: snapshot(toEventRecord(data)),
      // An event row has no cancellation-reason column, so the reason lives in the audit trail.
      summary: reasonText
        ? `إلغاء ${AUDIT_ENTITY_TYPE_LABELS_AR.event} «${before.titleAr}» — السبب: ${reasonText}`
        : undefined,
    });

    return { ...toEventRecord(data), termIds: before.termIds };
  }

  async duplicateEvent(id: string, actor: Actor, overrides: Partial<EventCreateInput> = {}): Promise<EventWithTerms> {
    const source = await this.getEvent(id);
    if (!source) throw new StoreError("not_found", "events.duplicate", `Event ${id} does not exist.`, { id });

    const client = await this.client();
    const slug = await this.nextAvailableSlug(`${source.slug}-copy`);

    const copy = await this.createEvent(
      {
        ...source,
        ...overrides,
        slug,
        // A duplicate is ALWAYS a new, unpublished, standalone row — never a series occurrence.
        status: "draft",
        seriesId: null,
        occurrenceDate: null,
        isExceptionOf: null,
        termIds: overrides.termIds ?? source.termIds,
      },
      actor
    );

    // `createEvent` already audited the insert; record the provenance as its own entry.
    await this.appendAudit(client, {
      actor,
      action: "duplicate",
      entityType: "event",
      entityId: copy.id,
      before: snapshot(source),
      after: snapshot(copy),
    });

    return copy;
  }

  async deleteEvent(id: string, actor: Actor): Promise<void> {
    const client = await this.client();
    const before = await this.getEvent(id);
    if (!before) throw new StoreError("not_found", "events.delete", `Event ${id} does not exist.`, { id });

    const { error } = await client.from("events").delete().eq("id", id).select("id").single();
    if (error) throw toStoreError(error, "events.delete", { id });

    await this.appendAudit(client, {
      actor,
      action: "delete",
      entityType: "event",
      entityId: id,
      before: snapshot(before),
      after: null,
    });
  }

  async setEventTerms(eventId: string, termIds: readonly string[], actor: Actor): Promise<EventWithTerms> {
    const client = await this.client();
    const before = await this.getEvent(eventId);
    if (!before) throw new StoreError("not_found", "events.setTerms", `Event ${eventId} does not exist.`, { id: eventId });

    const uniqueTerms = unique(termIds);
    await this.replaceEventTerms(client, eventId, uniqueTerms, nowIso());

    await this.appendAudit(client, {
      actor,
      action: "update",
      entityType: "event_terms",
      entityId: eventId,
      before: snapshot(before.termIds),
      after: snapshot(uniqueTerms),
    });

    return { ...before, termIds: uniqueTerms };
  }

  private async replaceEventTerms(
    client: StoreClient,
    eventId: string,
    termIds: readonly string[],
    now: string
  ): Promise<void> {
    const { error: deleteError } = await client.from("event_terms").delete().eq("event_id", eventId);
    if (deleteError) throw toStoreError(deleteError, "events.replaceTerms", { eventId });
    if (termIds.length === 0) return;

    const { error } = await client
      .from("event_terms")
      .insert(termIds.map((termId) => ({ event_id: eventId, term_id: termId, created_at: now })));
    if (error) throw toStoreError(error, "events.replaceTerms", { eventId });
  }

  private async nextAvailableSlug(base: string): Promise<string> {
    const client = await this.client();
    for (let suffix = 1; suffix < 500; suffix += 1) {
      const candidate = suffix === 1 ? base : `${base}-${suffix}`;
      const { data, error } = await client.from("events").select("id").eq("slug", candidate).maybeSingle();
      if (error) throw toStoreError(error, "events.slugLookup");
      if (!data) return candidate;
    }
    return `${base}-${newId().slice(0, 8)}`;
  }

  // --- series --------------------------------------------------------------

  async listSeries(filter: SeriesListFilter = {}): Promise<EventSeriesRecord[]> {
    const client = await this.client();
    let query = client.from("event_series").select("*").order("title_ar", { ascending: true });
    const statuses = normalizeStatusFilter(filter.status);
    if (statuses) query = query.in("status", [...statuses]);
    if (filter.limit) query = query.limit(filter.limit);

    const { data, error } = await query;
    if (error) throw toStoreError(error, "series.list");
    return (data ?? []).map(toSeriesRecord);
  }

  async getSeries(id: string): Promise<EventSeriesRecord | null> {
    const client = await this.client();
    const { data, error } = await client.from("event_series").select("*").eq("id", id).maybeSingle();
    if (error) throw toStoreError(error, "series.get");
    return data ? toSeriesRecord(data) : null;
  }

  async createSeries(input: EventSeriesCreateInput, actor: Actor): Promise<EventSeriesRecord> {
    const client = await this.client();
    const now = nowIso();
    const columns = toSeriesColumns(input);

    const { data, error } = await client
      .from("event_series")
      .insert({
        title_ar: input.titleAr,
        title_en: input.titleEn ?? null,
        summary_ar: input.summaryAr ?? null,
        summary_en: input.summaryEn ?? null,
        freq: input.rule.freq,
        recurrence_interval: input.rule.interval,
        by_weekday: input.rule.byWeekday,
        by_month_day: input.rule.byMonthDay,
        start_date: input.rule.startDate,
        end_date: input.rule.endDate,
        timezone: input.rule.timezone,
        start_time: fromTimeOfDay(input.startTime),
        duration_minutes: input.durationMinutes ?? 60,
        default_venue_id: input.defaultVenueId ?? null,
        default_term_ids: unique(input.defaultTermIds ?? []),
        status: input.status ?? "draft",
        created_at: now,
        updated_at: now,
        created_by: actor.id,
        updated_by: actor.id,
        ...columns,
      })
      .select("*")
      .single();
    if (error) throw toStoreError(error, "series.create");

    await this.appendAudit(client, {
      actor,
      action: "create",
      entityType: "event_series",
      entityId: data.id,
      before: null,
      after: snapshot(toSeriesRecord(data)),
    });

    return toSeriesRecord(data);
  }

  async updateSeries(id: string, patch: EventSeriesUpdateInput, actor: Actor): Promise<EventSeriesRecord> {
    const client = await this.client();
    const before = await this.getSeries(id);
    if (!before) throw new StoreError("not_found", "series.update", `Series ${id} does not exist.`, { id });

    const columns = { ...toSeriesColumns(patch), updated_at: nowIso(), updated_by: actor.id };
    const { data, error } = await client
      .from("event_series")
      .update(columns as unknown as TablesInsert<"event_series">)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw toStoreError(error, "series.update", { id });

    await this.appendAudit(client, {
      actor,
      action: "update",
      entityType: "event_series",
      entityId: id,
      before: snapshot(before),
      after: snapshot(toSeriesRecord(data)),
    });

    return toSeriesRecord(data);
  }

  async cancelSeries(
    id: string,
    actor: Actor,
    reason: { ar?: string | null; en?: string | null } = {}
  ): Promise<EventSeriesRecord> {
    const client = await this.client();
    const before = await this.getSeries(id);
    if (!before) throw new StoreError("not_found", "series.cancel", `Series ${id} does not exist.`, { id });

    const { data, error } = await client
      .from("event_series")
      .update({ status: "cancelled", updated_at: nowIso(), updated_by: actor.id })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw toStoreError(error, "series.cancel", { id });

    const reasonText = reason.ar?.trim();
    await this.appendAudit(client, {
      actor,
      action: "cancel",
      entityType: "event_series",
      entityId: id,
      before: snapshot(before),
      after: snapshot(toSeriesRecord(data)),
      // A whole-series cancellation has no column of its own (only a single occurrence keeps a
      // reason on `event_exceptions`), so the reason is preserved in the audit trail.
      summary: reasonText
        ? `إلغاء ${AUDIT_ENTITY_TYPE_LABELS_AR.event_series} «${before.titleAr}» — السبب: ${reasonText}`
        : undefined,
    });

    return toSeriesRecord(data);
  }

  async deleteSeries(id: string, actor: Actor): Promise<void> {
    const client = await this.client();
    const before = await this.getSeries(id);
    if (!before) throw new StoreError("not_found", "series.delete", `Series ${id} does not exist.`, { id });

    const { error } = await client.from("event_series").delete().eq("id", id).select("id").single();
    if (error) throw toStoreError(error, "series.delete", { id });

    await this.appendAudit(client, {
      actor,
      action: "delete",
      entityType: "event_series",
      entityId: id,
      before: snapshot(before),
      after: null,
    });
  }

  // --- occurrence exceptions ----------------------------------------------

  async listExceptions(seriesId?: string): Promise<EventExceptionRecord[]> {
    const client = await this.client();
    let query = client.from("event_exceptions").select("*").order("occurrence_date", { ascending: true });
    if (seriesId) query = query.eq("series_id", seriesId);

    const { data, error } = await query;
    if (error) throw toStoreError(error, "exceptions.list");
    return (data ?? []).map(toExceptionRecord);
  }

  async getException(seriesId: string, occurrenceDate: string): Promise<EventExceptionRecord | null> {
    const client = await this.client();
    const { data, error } = await client
      .from("event_exceptions")
      .select("*")
      .eq("series_id", seriesId)
      .eq("occurrence_date", occurrenceDate)
      .maybeSingle();
    if (error) throw toStoreError(error, "exceptions.get");
    return data ? toExceptionRecord(data) : null;
  }

  async upsertException(input: EventExceptionInput, actor: Actor): Promise<EventExceptionRecord> {
    const client = await this.client();
    const now = nowIso();
    const before = await this.getException(input.seriesId, input.occurrenceDate);
    const action: AuditAction = input.kind === "moved" ? "reschedule" : "cancel";

    const { data, error } = await client
      .from("event_exceptions")
      .upsert(
        {
          id: before?.id ?? newId(),
          series_id: input.seriesId,
          occurrence_date: input.occurrenceDate,
          kind: input.kind,
          moved_to_date: input.kind === "moved" ? (input.movedToDate ?? null) : null,
          reason_ar: input.reasonAr ?? null,
          reason_en: input.reasonEn ?? null,
          created_at: before?.createdAt ?? now,
          updated_at: now,
          created_by: before?.createdBy ?? actor.id,
          updated_by: actor.id,
        },
        { onConflict: "series_id,occurrence_date" }
      )
      .select("*")
      .single();
    if (error) throw toStoreError(error, "exceptions.upsert", { seriesId: input.seriesId });

    await this.appendAudit(client, {
      actor,
      action,
      entityType: "event_exception",
      entityId: data.id,
      before: snapshot(before),
      after: snapshot(toExceptionRecord(data)),
    });

    return toExceptionRecord(data);
  }

  async deleteException(id: string, actor: Actor): Promise<void> {
    const client = await this.client();
    const { data: existing, error: readError } = await client
      .from("event_exceptions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (readError) throw toStoreError(readError, "exceptions.delete");
    if (!existing) throw new StoreError("not_found", "exceptions.delete", `Exception ${id} does not exist.`, { id });

    const { error } = await client.from("event_exceptions").delete().eq("id", id).select("id").single();
    if (error) throw toStoreError(error, "exceptions.delete", { id });

    await this.appendAudit(client, {
      actor,
      action: "delete",
      entityType: "event_exception",
      entityId: id,
      before: snapshot(toExceptionRecord(existing)),
      after: null,
    });
  }

  // --- taxonomy ------------------------------------------------------------

  async listTerms(filter: TaxonomyTermListFilter = {}): Promise<TaxonomyTermRecord[]> {
    const client = await this.client();
    let query = client
      .from("taxonomy_terms")
      .select("*")
      .order("dimension", { ascending: true })
      .order("sort_order", { ascending: true });

    if (filter.dimension) query = query.eq("dimension", filter.dimension);
    if (!filter.includeInactive) query = query.eq("is_active", true);
    if (filter.limit) query = query.limit(filter.limit);

    const { data, error } = await query;
    if (error) throw toStoreError(error, "terms.list");
    return (data ?? []).map(toTermRecord);
  }

  async getTerm(id: string): Promise<TaxonomyTermRecord | null> {
    const client = await this.client();
    const { data, error } = await client.from("taxonomy_terms").select("*").eq("id", id).maybeSingle();
    if (error) throw toStoreError(error, "terms.get");
    return data ? toTermRecord(data) : null;
  }

  async getTermBySlug(dimension: TaxonomyTermRecord["dimension"], slug: string): Promise<TaxonomyTermRecord | null> {
    const client = await this.client();
    const { data, error } = await client
      .from("taxonomy_terms")
      .select("*")
      .eq("dimension", dimension)
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw toStoreError(error, "terms.getBySlug");
    return data ? toTermRecord(data) : null;
  }

  async createTerm(input: TaxonomyTermCreateInput, actor: Actor): Promise<TaxonomyTermRecord> {
    const client = await this.client();
    const now = nowIso();

    const { data, error } = await client
      .from("taxonomy_terms")
      .insert({
        dimension: input.dimension,
        slug: input.slug,
        name_ar: input.nameAr,
        name_en: input.nameEn ?? null,
        icon: input.icon ?? null,
        color: input.color ?? null,
        sort_order: input.sortOrder ?? 1,
        is_active: input.isActive ?? true,
        created_at: now,
        updated_at: now,
        created_by: actor.id,
        updated_by: actor.id,
      })
      .select("*")
      .single();
    if (error) throw toStoreError(error, "terms.create", { slug: input.slug });

    await this.appendAudit(client, {
      actor,
      action: "create",
      entityType: "taxonomy_term",
      entityId: data.id,
      before: null,
      after: snapshot(toTermRecord(data)),
    });

    return toTermRecord(data);
  }

  async updateTerm(id: string, patch: TaxonomyTermUpdateInput, actor: Actor): Promise<TaxonomyTermRecord> {
    const client = await this.client();
    const before = await this.getTerm(id);
    if (!before) throw new StoreError("not_found", "terms.update", `Term ${id} does not exist.`, { id });

    const columns: Record<string, unknown> = { updated_at: nowIso(), updated_by: actor.id };
    if (patch.dimension !== undefined) columns.dimension = patch.dimension;
    if (patch.slug !== undefined) columns.slug = patch.slug;
    if (patch.nameAr !== undefined) columns.name_ar = patch.nameAr;
    if (patch.nameEn !== undefined) columns.name_en = patch.nameEn;
    if (patch.icon !== undefined) columns.icon = patch.icon;
    if (patch.color !== undefined) columns.color = patch.color;
    if (patch.sortOrder !== undefined) columns.sort_order = patch.sortOrder;
    if (patch.isActive !== undefined) columns.is_active = patch.isActive;

    const { data, error } = await client
      .from("taxonomy_terms")
      .update(columns as unknown as TablesInsert<"taxonomy_terms">)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw toStoreError(error, "terms.update", { id });

    await this.appendAudit(client, {
      actor,
      action: "update",
      entityType: "taxonomy_term",
      entityId: id,
      before: snapshot(before),
      after: snapshot(toTermRecord(data)),
    });

    return toTermRecord(data);
  }

  async deleteTerm(id: string, actor: Actor): Promise<void> {
    const client = await this.client();
    const before = await this.getTerm(id);
    if (!before) throw new StoreError("not_found", "terms.delete", `Term ${id} does not exist.`, { id });

    // A term in use is never silently unlinked from live content: retire it with `is_active = false`.
    const { count, error: usageError } = await client
      .from("event_terms")
      .select("event_id", { count: "exact", head: true })
      .eq("term_id", id);
    if (usageError) throw toStoreError(usageError, "terms.delete");
    if ((count ?? 0) > 0) {
      throw new StoreError("conflict", "terms.delete", `Term ${id} is still used by ${count} event(s).`, { id });
    }

    const { error } = await client.from("taxonomy_terms").delete().eq("id", id).select("id").single();
    if (error) throw toStoreError(error, "terms.delete", { id });

    await this.appendAudit(client, {
      actor,
      action: "delete",
      entityType: "taxonomy_term",
      entityId: id,
      before: snapshot(before),
      after: null,
    });
  }

  // --- media ---------------------------------------------------------------

  async listMedia(filter: MediaListFilter = {}): Promise<MediaRecord[]> {
    const client = await this.client();
    let query = client.from("media").select("*").order("created_at", { ascending: false });
    if (filter.publicOnly) query = query.eq("is_public", true);
    if (filter.limit) query = query.limit(filter.limit);

    const { data, error } = await query;
    if (error) throw toStoreError(error, "media.list");
    return (data ?? []).map(toMediaRecord);
  }

  async createMedia(input: MediaCreateInput, actor: Actor): Promise<MediaRecord> {
    const client = await this.client();

    const { data, error } = await client
      .from("media")
      .insert({
        filename: input.filename,
        mime_type: input.mimeType,
        size_bytes: input.sizeBytes ?? 0,
        url: input.url,
        alt_ar: input.altAr ?? null,
        alt_en: input.altEn ?? null,
        uploaded_by: actor.id,
        created_at: nowIso(),
        is_public: input.isPublic ?? true,
      })
      .select("*")
      .single();
    if (error) throw toStoreError(error, "media.create");

    await this.appendAudit(client, {
      actor,
      action: "create",
      entityType: "media",
      entityId: data.id,
      before: null,
      after: snapshot(toMediaRecord(data)),
    });

    return toMediaRecord(data);
  }

  async updateMedia(id: string, patch: MediaUpdateInput, actor: Actor): Promise<MediaRecord> {
    const client = await this.client();
    const { data: existing, error: readError } = await client.from("media").select("*").eq("id", id).maybeSingle();
    if (readError) throw toStoreError(readError, "media.update");
    if (!existing) throw new StoreError("not_found", "media.update", `Media ${id} does not exist.`, { id });

    const columns: Record<string, unknown> = {};
    if (patch.filename !== undefined) columns.filename = patch.filename;
    if (patch.mimeType !== undefined) columns.mime_type = patch.mimeType;
    if (patch.sizeBytes !== undefined) columns.size_bytes = patch.sizeBytes;
    if (patch.url !== undefined) columns.url = patch.url;
    if (patch.altAr !== undefined) columns.alt_ar = patch.altAr;
    if (patch.altEn !== undefined) columns.alt_en = patch.altEn;
    if (patch.isPublic !== undefined) columns.is_public = patch.isPublic;

    const { data, error } = await client
      .from("media")
      .update(columns as unknown as TablesInsert<"media">)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw toStoreError(error, "media.update", { id });

    await this.appendAudit(client, {
      actor,
      action: "update",
      entityType: "media",
      entityId: id,
      before: snapshot(toMediaRecord(existing)),
      after: snapshot(toMediaRecord(data)),
    });

    return toMediaRecord(data);
  }

  async deleteMedia(id: string, actor: Actor): Promise<void> {
    const client = await this.client();
    const { data: existing, error: readError } = await client.from("media").select("*").eq("id", id).maybeSingle();
    if (readError) throw toStoreError(readError, "media.delete");
    if (!existing) throw new StoreError("not_found", "media.delete", `Media ${id} does not exist.`, { id });

    const { error } = await client.from("media").delete().eq("id", id).select("id").single();
    if (error) throw toStoreError(error, "media.delete", { id });

    await this.appendAudit(client, {
      actor,
      action: "delete",
      entityType: "media",
      entityId: id,
      before: snapshot(toMediaRecord(existing)),
      after: null,
    });
  }

  // --- subscribers ---------------------------------------------------------

  async listSubscribers(filter: SubscriberListFilter = {}): Promise<SubscriberRecord[]> {
    const client = await this.client();
    let query = client.from("subscribers").select("*").order("created_at", { ascending: false });
    // Retired subscriptions are hidden by default: the list answers "who wants updates".
    if (!filter.includeInactive) query = query.eq("is_active", true);
    if (filter.limit) query = query.limit(filter.limit);

    const { data, error } = await query;
    if (error) throw toStoreError(error, "subscribers.list");
    return (data ?? []).map(toSubscriberRecord);
  }

  /**
   * Idempotent public subscribe (see the repository contract).
   *
   * The e-mail column is UNIQUE, so a lost race between two simultaneous submissions surfaces as a
   * `23505` conflict on INSERT — which is caught HERE and resolved by updating the row that won, so a
   * duplicate can never be created and the visitor still gets a success.
   */
  async subscribe(input: SubscriberCreateInput, actor: Actor): Promise<SubscriberSubscribeResult> {
    const client = await this.publicClient();
    const email = normalizeSubscriberEmail(input.email);
    const topics = normalizeSubscriberTopics(input.topics);
    const name = typeof input.name === "string" && input.name.trim().length > 0
      ? input.name.trim().slice(0, SUBSCRIBER_NAME_MAX_LENGTH)
      : null;

    if (email.length === 0 || email.length > SUBSCRIBER_EMAIL_MAX_LENGTH) {
      throw new StoreError("invalid", "subscribers.subscribe", "The e-mail address is empty or too long.", {
        emailLength: email.length,
      });
    }

    const now = nowIso();
    const existing = await this.readSubscriberByEmail(client, email);
    if (existing) {
      return { subscriber: await this.updateSubscriber(client, existing, { name, locale: input.locale, topics }, actor), created: false };
    }

    const { data, error } = await client
      .from("subscribers")
      .insert({
        id: newId(),
        email,
        name,
        locale: input.locale,
        topics,
        created_at: now,
        // The in-site confirmation message is the visitor's confirmation (see `SubscriberRecord`).
        confirmed_at: now,
        is_active: true,
      })
      .select("*")
      .single();

    if (error && error.code === "23505") {
      // Another submission for the same address landed first: adopt it instead of failing.
      const winner = await this.readSubscriberByEmail(client, email);
      if (winner) {
        return {
          subscriber: await this.updateSubscriber(client, winner, { name, locale: input.locale, topics }, actor),
          created: false,
        };
      }
    }
    if (error) throw toStoreError(error, "subscribers.subscribe");

    await this.appendAudit(client, {
      actor,
      action: "create",
      entityType: "subscriber",
      entityId: data.id,
      before: null,
      after: snapshot(toSubscriberRecord(data)),
      summary: "اشتراك جديد في تنبيهات الفعاليات من نموذج الموقع العام.",
    });

    return { subscriber: toSubscriberRecord(data), created: true };
  }

  async setSubscriberActive(id: string, isActive: boolean, actor: Actor): Promise<SubscriberRecord> {
    const client = await this.client();
    const { data: existing, error: readError } = await client
      .from("subscribers")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (readError) throw toStoreError(readError, "subscribers.setActive");
    if (!existing) throw new StoreError("not_found", "subscribers.setActive", `Subscriber ${id} does not exist.`, { id });

    const { data, error } = await client
      .from("subscribers")
      .update({ is_active: isActive })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw toStoreError(error, "subscribers.setActive", { id });

    await this.appendAudit(client, {
      actor,
      action: "update",
      entityType: "subscriber",
      entityId: id,
      before: snapshot(toSubscriberRecord(existing)),
      after: snapshot(toSubscriberRecord(data)),
      summary: isActive
        ? `تنشيط ${AUDIT_ENTITY_TYPE_LABELS_AR.subscriber}.`
        : `إيقاف ${AUDIT_ENTITY_TYPE_LABELS_AR.subscriber} (لن يصله أي تنبيه؛ البريد محفوظ).`,
    });

    return toSubscriberRecord(data);
  }

  private async readSubscriberByEmail(client: StoreClient, email: string): Promise<SubscriberRow | null> {
    const { data, error } = await client.from("subscribers").select("*").eq("email", email).maybeSingle();
    if (error) throw toStoreError(error, "subscribers.getByEmail");
    return data ?? null;
  }

  /** Applies a repeated subscription to the row that already holds the address. */
  private async updateSubscriber(
    client: StoreClient,
    existing: SubscriberRow,
    patch: { name: string | null; locale: SubscriberCreateInput["locale"]; topics: string[] },
    actor: Actor
  ): Promise<SubscriberRecord> {
    const revived = !existing.is_active;
    const { data, error } = await client
      .from("subscribers")
      .update({
        // An omitted name never erases a stored one: re-subscribing without typing a name is normal.
        name: patch.name ?? existing.name,
        locale: patch.locale,
        topics: patch.topics,
        is_active: true,
        confirmed_at: existing.confirmed_at ?? nowIso(),
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw toStoreError(error, "subscribers.subscribe", { id: existing.id });

    await this.appendAudit(client, {
      actor,
      action: "update",
      entityType: "subscriber",
      entityId: existing.id,
      before: snapshot(toSubscriberRecord(existing)),
      after: snapshot(toSubscriberRecord(data)),
      summary: revived
        ? `تنشيط ${AUDIT_ENTITY_TYPE_LABELS_AR.subscriber} — أعاد صاحب البريد الاشتراك بعد إيقافه.`
        : `تحديث اهتمامات ${AUDIT_ENTITY_TYPE_LABELS_AR.subscriber} من نموذج الموقع العام.`,
    });

    return toSubscriberRecord(data);
  }

  // --- audit ---------------------------------------------------------------

  async listAudit(filter: AuditListFilter = {}): Promise<AuditLogEntry[]> {
    const client = await this.client();
    let query = client
      .from("audit_log")
      .select("*")
      .order("at", { ascending: false })
      .limit(filter.limit ?? 100);

    if (filter.entityType) query = query.eq("entity_type", filter.entityType);
    if (filter.entityId) query = query.eq("entity_id", filter.entityId);
    if (filter.action) query = query.eq("action", filter.action);

    const { data, error } = await query;
    if (error) throw toStoreError(error, "audit.list");
    return (data ?? []).map(toAuditEntry);
  }

  /**
   * Audit-only append (see `AuditNoteInput`). It reuses the same best-effort `appendAudit()` as every
   * mutation, so a refusal is recorded identically on both drivers — and a failure to record it is
   * logged loudly instead of failing the refusal the user is waiting for.
   */
  async recordAuditNote(note: AuditNoteInput, actor: Actor): Promise<void> {
    const client = await this.client();
    await this.appendAudit(client, {
      actor,
      action: note.action,
      entityType: note.entityType,
      entityId: note.entityId,
      before: null,
      after: null,
      summary: note.summary,
    });
  }
}
