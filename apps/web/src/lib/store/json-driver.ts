// src/lib/store/json-driver.ts
// The JSON driver: the repository contract implemented over the file-backed document
// (`json-store.ts`). This is the driver the portal runs on with NO environment variables.
//
// Every write goes through `mutateStoreDocument()`, so a mutation and its audit entry are persisted
// by ONE atomic rename and can never be observed separately.

import { StoreError, normalizeStatusFilter, type AuditListFilter, type AuditNoteInput, type EventListFilter, type EventRepository, type MediaListFilter, type RepositoryStatus, type SeriesListFilter, type SubscriberListFilter, type TaxonomyTermListFilter } from "@/lib/store/repository";
import { getStoreDataDir, mutateStoreDocument, readStoreDocument } from "@/lib/store/json-store";
import { buildAuditEntry, newId, nowIso, snapshot } from "@/lib/store/audit";
import type { StoreDocument } from "@/lib/store/document";
import { normalizeSubscriberEmail, normalizeSubscriberTopics, SUBSCRIBER_EMAIL_MAX_LENGTH, SUBSCRIBER_NAME_MAX_LENGTH } from "@/lib/domain/subscribers";
import {
  AUDIT_ENTITY_TYPE_LABELS_AR,
  DEFAULT_EVENT_TIME_ZONE,
  type Actor,
  type AuditAction,
  type AuditLogEntry,
  type EventCreateInput,
  type EventExceptionInput,
  type EventExceptionRecord,
  type EventRecord,
  type EventSeriesCreateInput,
  type EventSeriesRecord,
  type EventSeriesUpdateInput,
  type EventStatus,
  type EventUpdateInput,
  type EventWithTerms,
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

/** Status change → the action recorded in the audit trail. */
const STATUS_AUDIT_ACTION: Record<EventStatus, AuditAction> = {
  draft: "unpublish",
  published: "publish",
  cancelled: "cancel",
  archived: "unpublish",
};

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

/** Copy so a caller can never mutate the document (or, in the in-memory seed case, the seed). */
function cloneEvent(record: EventRecord): EventRecord {
  return { ...record, documents: record.documents.map((document) => ({ ...document })) };
}

function cloneSeries(record: EventSeriesRecord): EventSeriesRecord {
  return { ...record, rule: { ...record.rule, byWeekday: [...record.rule.byWeekday] }, defaultTermIds: [...record.defaultTermIds] };
}

function termIdsForEvent(document: StoreDocument, eventId: string): string[] {
  return document.eventTerms.filter((link) => link.eventId === eventId).map((link) => link.termId);
}

function withTerms(document: StoreDocument, record: EventRecord): EventWithTerms {
  return { ...cloneEvent(record), termIds: termIdsForEvent(document, record.id) };
}

function byStartsAt(a: { startsAt: string }, b: { startsAt: string }): number {
  return a.startsAt.localeCompare(b.startsAt);
}

export class JsonEventRepository implements EventRepository {
  readonly driver = "json" as const;

  // --- infrastructure ------------------------------------------------------

  async status(): Promise<RepositoryStatus> {
    const document = await readStoreDocument();
    return { driver: "json", lastUpdatedAt: document.updatedAt, location: getStoreDataDir() };
  }

  async republish(): Promise<RepositoryStatus> {
    return this.status();
  }

  // --- events --------------------------------------------------------------

  async listEvents(filter: EventListFilter = {}): Promise<EventWithTerms[]> {
    const document = await readStoreDocument();
    const statuses = normalizeStatusFilter(filter.status);

    const matches = document.events.filter((event) => {
      if (statuses && !statuses.includes(event.status)) return false;
      if (filter.seriesId !== undefined) {
        if (filter.seriesId === null ? event.seriesId !== null : event.seriesId !== filter.seriesId) return false;
      }
      // Compared as INSTANTS, never as strings: an ISO value written with a non-UTC offset
      // ("+03:00") does not sort lexicographically against a "Z" timestamp.
      if (filter.from && Date.parse(event.startsAt) < Date.parse(filter.from)) return false;
      if (filter.to && Date.parse(event.startsAt) > Date.parse(filter.to)) return false;
      if (filter.termIds && filter.termIds.length > 0) {
        const eventTerms = termIdsForEvent(document, event.id);
        if (!filter.termIds.some((termId) => eventTerms.includes(termId))) return false;
      }
      return true;
    });

    const ordered = [...matches].sort(byStartsAt).map((event) => withTerms(document, event));
    return typeof filter.limit === "number" ? ordered.slice(0, filter.limit) : ordered;
  }

  async getEvent(id: string): Promise<EventWithTerms | null> {
    const document = await readStoreDocument();
    const event = document.events.find((candidate) => candidate.id === id);
    return event ? withTerms(document, event) : null;
  }

  async getEventBySlug(slug: string): Promise<EventWithTerms | null> {
    const document = await readStoreDocument();
    const event = document.events.find((candidate) => candidate.slug === slug);
    return event ? withTerms(document, event) : null;
  }

  async listTermIdsByEvent(eventIds: readonly string[]): Promise<Record<string, string[]>> {
    const document = await readStoreDocument();
    const wanted = new Set(eventIds);
    const result: Record<string, string[]> = {};
    for (const id of wanted) result[id] = [];
    for (const link of document.eventTerms) {
      if (wanted.has(link.eventId)) result[link.eventId].push(link.termId);
    }
    return result;
  }

  async createEvent(input: EventCreateInput, actor: Actor): Promise<EventWithTerms> {
    const termIds = unique(input.termIds ?? []);

    return mutateStoreDocument("events.create", (document) => {
      const slug = (input.slug ?? "").trim() || `event-${newId().slice(0, 8)}`;
      if (document.events.some((event) => event.slug === slug)) {
        throw new StoreError("conflict", "events.create", `An event already uses the slug "${slug}".`, { slug });
      }
      if (input.seriesId && !document.series.some((series) => series.id === input.seriesId)) {
        throw new StoreError("invalid", "events.create", `Series ${input.seriesId} does not exist.`);
      }
      if (input.venueId && !document.terms.some((term) => term.id === input.venueId)) {
        throw new StoreError("invalid", "events.create", `Venue term ${input.venueId} does not exist.`);
      }
      assertTermsExist(document, termIds);

      const now = nowIso();
      const record: EventRecord = {
        id: newId(),
        slug,
        titleAr: input.titleAr,
        titleEn: input.titleEn ?? null,
        summaryAr: input.summaryAr ?? null,
        summaryEn: input.summaryEn ?? null,
        descriptionAr: input.descriptionAr ?? null,
        descriptionEn: input.descriptionEn ?? null,
        startsAt: new Date(input.startsAt).toISOString(),
        endsAt: input.endsAt ? new Date(input.endsAt).toISOString() : null,
        timezone: input.timezone ?? DEFAULT_EVENT_TIME_ZONE,
        allDay: input.allDay ?? false,
        venueId: input.venueId ?? null,
        status: input.status ?? "draft",
        seriesId: input.seriesId ?? null,
        occurrenceDate: input.occurrenceDate ?? null,
        isExceptionOf: input.isExceptionOf ?? null,
        imageUrl: input.imageUrl ?? null,
        documents: input.documents?.map((document) => ({ ...document })) ?? [],
        createdAt: now,
        updatedAt: now,
        createdBy: actor.id,
        updatedBy: actor.id,
      };

      document.events.push(record);
      for (const termId of termIds) {
        document.eventTerms.push({ eventId: record.id, termId, createdAt: now });
      }
      document.audit.push(
        buildAuditEntry({
          actor,
          action: "create",
          entityType: "event",
          entityId: record.id,
          before: null,
          after: snapshot(record),
        })
      );

      return withTerms(document, record);
    });
  }

  async updateEvent(id: string, patch: EventUpdateInput, actor: Actor): Promise<EventWithTerms> {
    return mutateStoreDocument("events.update", (document) => {
      const record = document.events.find((event) => event.id === id);
      if (!record) {
        throw new StoreError("not_found", "events.update", `Event ${id} does not exist.`, { id });
      }
      const before = snapshot(record);

      if (patch.slug !== undefined) {
        const slug = patch.slug.trim();
        if (slug.length === 0) throw new StoreError("invalid", "events.update", "The slug cannot be empty.");
        if (document.events.some((event) => event.id !== id && event.slug === slug)) {
          throw new StoreError("conflict", "events.update", `An event already uses the slug "${slug}".`, { slug });
        }
        record.slug = slug;
      }
      if (patch.venueId !== undefined && patch.venueId !== null) {
        if (!document.terms.some((term) => term.id === patch.venueId)) {
          throw new StoreError("invalid", "events.update", `Venue term ${patch.venueId} does not exist.`);
        }
      }
      if (patch.seriesId !== undefined && patch.seriesId !== null) {
        if (!document.series.some((series) => series.id === patch.seriesId)) {
          throw new StoreError("invalid", "events.update", `Series ${patch.seriesId} does not exist.`);
        }
      }

      assignDefined(record, {
        titleAr: patch.titleAr,
        titleEn: patch.titleEn,
        summaryAr: patch.summaryAr,
        summaryEn: patch.summaryEn,
        descriptionAr: patch.descriptionAr,
        descriptionEn: patch.descriptionEn,
        timezone: patch.timezone,
        allDay: patch.allDay,
        venueId: patch.venueId,
        status: patch.status,
        seriesId: patch.seriesId,
        occurrenceDate: patch.occurrenceDate,
        isExceptionOf: patch.isExceptionOf,
        imageUrl: patch.imageUrl,
      });

      if (patch.startsAt !== undefined) record.startsAt = new Date(patch.startsAt).toISOString();
      if (patch.endsAt !== undefined) record.endsAt = patch.endsAt ? new Date(patch.endsAt).toISOString() : null;
      if (patch.documents !== undefined) record.documents = patch.documents.map((entry) => ({ ...entry }));

      if (patch.termIds !== undefined) {
        const termIds = unique(patch.termIds);
        assertTermsExist(document, termIds);
        replaceEventTerms(document, record.id, termIds, nowIso());
      }

      record.updatedAt = nowIso();
      record.updatedBy = actor.id;

      document.audit.push(
        buildAuditEntry({
          actor,
          action: "update",
          entityType: "event",
          entityId: record.id,
          before,
          after: snapshot(record),
        })
      );

      return withTerms(document, record);
    });
  }

  async setEventStatus(
    id: string,
    status: EventStatus,
    actor: Actor,
    reason: { ar?: string | null; en?: string | null } = {}
  ): Promise<EventWithTerms> {
    return mutateStoreDocument("events.setStatus", (document) => {
      const record = document.events.find((event) => event.id === id);
      if (!record) {
        throw new StoreError("not_found", "events.setStatus", `Event ${id} does not exist.`, { id });
      }
      const before = snapshot(record);
      record.status = status;
      record.updatedAt = nowIso();
      record.updatedBy = actor.id;

      const reasonText = status === "cancelled" ? reason.ar?.trim() : undefined;
      document.audit.push(
        buildAuditEntry({
          actor,
          action: STATUS_AUDIT_ACTION[status],
          entityType: "event",
          entityId: record.id,
          before,
          after: snapshot(record),
          // An event row has no cancellation-reason column, so the reason lives in the audit trail.
          summary: reasonText
            ? `إلغاء ${AUDIT_ENTITY_TYPE_LABELS_AR.event} «${record.titleAr}» — السبب: ${reasonText}`
            : undefined,
        })
      );

      return withTerms(document, record);
    });
  }

  async duplicateEvent(id: string, actor: Actor, overrides: Partial<EventCreateInput> = {}): Promise<EventWithTerms> {
    return mutateStoreDocument("events.duplicate", (document) => {
      const source = document.events.find((event) => event.id === id);
      if (!source) {
        throw new StoreError("not_found", "events.duplicate", `Event ${id} does not exist.`, { id });
      }

      const now = nowIso();
      const copy: EventRecord = {
        ...cloneEvent(source),
        id: newId(),
        slug: nextAvailableSlug(document, `${source.slug}-copy`),
        titleAr: overrides.titleAr ?? source.titleAr,
        titleEn: overrides.titleEn !== undefined ? overrides.titleEn : source.titleEn,
        summaryAr: overrides.summaryAr !== undefined ? overrides.summaryAr : source.summaryAr,
        summaryEn: overrides.summaryEn !== undefined ? overrides.summaryEn : source.summaryEn,
        descriptionAr: overrides.descriptionAr !== undefined ? overrides.descriptionAr : source.descriptionAr,
        descriptionEn: overrides.descriptionEn !== undefined ? overrides.descriptionEn : source.descriptionEn,
        startsAt: overrides.startsAt ? new Date(overrides.startsAt).toISOString() : source.startsAt,
        endsAt:
          overrides.endsAt !== undefined
            ? overrides.endsAt
              ? new Date(overrides.endsAt).toISOString()
              : null
            : source.endsAt,
        timezone: overrides.timezone ?? source.timezone,
        allDay: overrides.allDay ?? source.allDay,
        venueId: overrides.venueId !== undefined ? overrides.venueId : source.venueId,
        imageUrl: overrides.imageUrl !== undefined ? overrides.imageUrl : source.imageUrl,
        documents: (overrides.documents ?? source.documents).map((entry) => ({ ...entry })),
        // NEVER inherited from the source: a duplicate is a new, unpublished, STANDALONE row. The
        // caller's `status` is ignored on purpose — publishing a copy the moment it is created is
        // exactly the accident this method must not allow.
        status: "draft",
        seriesId: null,
        occurrenceDate: null,
        isExceptionOf: null,
        createdAt: now,
        updatedAt: now,
        createdBy: actor.id,
        updatedBy: actor.id,
      };

      document.events.push(copy);

      const sourceTerms = termIdsForEvent(document, source.id);
      const copyTerms = overrides.termIds !== undefined ? unique(overrides.termIds) : sourceTerms;
      assertTermsExist(document, copyTerms);
      for (const termId of copyTerms) {
        document.eventTerms.push({ eventId: copy.id, termId, createdAt: now });
      }

      document.audit.push(
        buildAuditEntry({
          actor,
          action: "duplicate",
          entityType: "event",
          entityId: copy.id,
          before: snapshot(source),
          after: snapshot(copy),
        })
      );

      return withTerms(document, copy);
    });
  }

  async deleteEvent(id: string, actor: Actor): Promise<void> {
    await mutateStoreDocument("events.delete", (document) => {
      const index = document.events.findIndex((event) => event.id === id);
      if (index < 0) {
        throw new StoreError("not_found", "events.delete", `Event ${id} does not exist.`, { id });
      }
      const [removed] = document.events.splice(index, 1);
      document.eventTerms = document.eventTerms.filter((link) => link.eventId !== id);

      document.audit.push(
        buildAuditEntry({
          actor,
          action: "delete",
          entityType: "event",
          entityId: id,
          before: snapshot(removed),
          after: null,
        })
      );
    });
  }

  async setEventTerms(eventId: string, termIds: readonly string[], actor: Actor): Promise<EventWithTerms> {
    return mutateStoreDocument("events.setTerms", (document) => {
      const record = document.events.find((event) => event.id === eventId);
      if (!record) {
        throw new StoreError("not_found", "events.setTerms", `Event ${eventId} does not exist.`, { id: eventId });
      }
      const before = snapshot({ ...record, termIds: termIdsForEvent(document, eventId) });
      const uniqueTerms = unique(termIds);
      assertTermsExist(document, uniqueTerms);
      replaceEventTerms(document, eventId, uniqueTerms, nowIso());
      record.updatedAt = nowIso();
      record.updatedBy = actor.id;

      const after = snapshot({ ...record, termIds: uniqueTerms });
      document.audit.push(
        buildAuditEntry({
          actor,
          action: "update",
          entityType: "event_terms",
          entityId: eventId,
          before,
          after,
        })
      );

      return withTerms(document, record);
    });
  }

  // --- series --------------------------------------------------------------

  async listSeries(filter: SeriesListFilter = {}): Promise<EventSeriesRecord[]> {
    const document = await readStoreDocument();
    const statuses = normalizeStatusFilter(filter.status);
    const matches = document.series.filter((series) => !statuses || statuses.includes(series.status));
    const ordered = [...matches].sort((a, b) => a.titleAr.localeCompare(b.titleAr, "ar")).map(cloneSeries);
    return typeof filter.limit === "number" ? ordered.slice(0, filter.limit) : ordered;
  }

  async getSeries(id: string): Promise<EventSeriesRecord | null> {
    const document = await readStoreDocument();
    const series = document.series.find((candidate) => candidate.id === id);
    return series ? cloneSeries(series) : null;
  }

  async createSeries(input: EventSeriesCreateInput, actor: Actor): Promise<EventSeriesRecord> {
    const defaultTermIds = unique(input.defaultTermIds ?? []);

    return mutateStoreDocument("series.create", (document) => {
      if (input.defaultVenueId && !document.terms.some((term) => term.id === input.defaultVenueId)) {
        throw new StoreError("invalid", "series.create", `Venue term ${input.defaultVenueId} does not exist.`);
      }
      assertTermsExist(document, defaultTermIds);

      const now = nowIso();
      const record: EventSeriesRecord = {
        id: newId(),
        titleAr: input.titleAr,
        titleEn: input.titleEn ?? null,
        summaryAr: input.summaryAr ?? null,
        summaryEn: input.summaryEn ?? null,
        rule: { ...input.rule, byWeekday: [...input.rule.byWeekday] },
        startTime: input.startTime,
        durationMinutes: input.durationMinutes ?? 60,
        defaultVenueId: input.defaultVenueId ?? null,
        defaultTermIds,
        status: input.status ?? "draft",
        createdAt: now,
        updatedAt: now,
        createdBy: actor.id,
        updatedBy: actor.id,
      };

      document.series.push(record);
      document.audit.push(
        buildAuditEntry({
          actor,
          action: "create",
          entityType: "event_series",
          entityId: record.id,
          before: null,
          after: snapshot(record),
        })
      );

      return cloneSeries(record);
    });
  }

  async updateSeries(id: string, patch: EventSeriesUpdateInput, actor: Actor): Promise<EventSeriesRecord> {
    return mutateStoreDocument("series.update", (document) => {
      const record = document.series.find((series) => series.id === id);
      if (!record) {
        throw new StoreError("not_found", "series.update", `Series ${id} does not exist.`, { id });
      }
      const before = snapshot(record);

      if (patch.rule !== undefined) record.rule = { ...patch.rule, byWeekday: [...patch.rule.byWeekday] };
      if (patch.defaultVenueId !== undefined) {
        if (patch.defaultVenueId !== null && !document.terms.some((term) => term.id === patch.defaultVenueId)) {
          throw new StoreError("invalid", "series.update", `Venue term ${patch.defaultVenueId} does not exist.`);
        }
        record.defaultVenueId = patch.defaultVenueId;
      }
      if (patch.defaultTermIds !== undefined) {
        const defaultTermIds = unique(patch.defaultTermIds);
        assertTermsExist(document, defaultTermIds);
        record.defaultTermIds = defaultTermIds;
      }

      assignDefined(record, {
        titleAr: patch.titleAr,
        titleEn: patch.titleEn,
        summaryAr: patch.summaryAr,
        summaryEn: patch.summaryEn,
        startTime: patch.startTime,
        durationMinutes: patch.durationMinutes,
        status: patch.status,
      });

      record.updatedAt = nowIso();
      record.updatedBy = actor.id;

      document.audit.push(
        buildAuditEntry({
          actor,
          action: "update",
          entityType: "event_series",
          entityId: record.id,
          before,
          after: snapshot(record),
        })
      );

      return cloneSeries(record);
    });
  }

  async cancelSeries(
    id: string,
    actor: Actor,
    reason: { ar?: string | null; en?: string | null } = {}
  ): Promise<EventSeriesRecord> {
    return mutateStoreDocument("series.cancel", (document) => {
      const record = document.series.find((series) => series.id === id);
      if (!record) {
        throw new StoreError("not_found", "series.cancel", `Series ${id} does not exist.`, { id });
      }
      const before = snapshot(record);
      record.status = "cancelled";
      record.updatedAt = nowIso();
      record.updatedBy = actor.id;

      const reasonText = reason.ar?.trim();
      document.audit.push(
        buildAuditEntry({
          actor,
          action: "cancel",
          entityType: "event_series",
          entityId: record.id,
          before,
          after: snapshot(record),
          // A whole-series cancellation has no column of its own (only a single occurrence keeps a
          // reason on `event_exceptions`), so the reason is preserved in the audit trail.
          summary: reasonText
            ? `إلغاء ${AUDIT_ENTITY_TYPE_LABELS_AR.event_series} «${record.titleAr}» — السبب: ${reasonText}`
            : undefined,
        })
      );

      return cloneSeries(record);
    });
  }

  async deleteSeries(id: string, actor: Actor): Promise<void> {
    await mutateStoreDocument("series.delete", (document) => {
      const index = document.series.findIndex((series) => series.id === id);
      if (index < 0) {
        throw new StoreError("not_found", "series.delete", `Series ${id} does not exist.`, { id });
      }
      const [removed] = document.series.splice(index, 1);
      document.exceptions = document.exceptions.filter((exception) => exception.seriesId !== id);

      document.audit.push(
        buildAuditEntry({
          actor,
          action: "delete",
          entityType: "event_series",
          entityId: id,
          before: snapshot(removed),
          after: null,
        })
      );
    });
  }

  // --- occurrence exceptions ----------------------------------------------

  async listExceptions(seriesId?: string): Promise<EventExceptionRecord[]> {
    const document = await readStoreDocument();
    const matches = document.exceptions.filter((exception) => !seriesId || exception.seriesId === seriesId);
    return matches
      .map((exception) => ({ ...exception }))
      .sort((a, b) => a.occurrenceDate.localeCompare(b.occurrenceDate));
  }

  async getException(seriesId: string, occurrenceDate: string): Promise<EventExceptionRecord | null> {
    const document = await readStoreDocument();
    const exception = document.exceptions.find(
      (candidate) => candidate.seriesId === seriesId && candidate.occurrenceDate === occurrenceDate
    );
    return exception ? { ...exception } : null;
  }

  async upsertException(input: EventExceptionInput, actor: Actor): Promise<EventExceptionRecord> {
    return mutateStoreDocument("exceptions.upsert", (document) => {
      if (!document.series.some((series) => series.id === input.seriesId)) {
        throw new StoreError("invalid", "exceptions.upsert", `Series ${input.seriesId} does not exist.`);
      }
      if (input.kind === "moved" && !input.movedToDate) {
        throw new StoreError("invalid", "exceptions.upsert", "A moved occurrence needs its new date.");
      }

      const now = nowIso();
      const existing = document.exceptions.find(
        (candidate) => candidate.seriesId === input.seriesId && candidate.occurrenceDate === input.occurrenceDate
      );
      const action: AuditAction = input.kind === "moved" ? "reschedule" : "cancel";

      if (existing) {
        const before = snapshot(existing);
        existing.kind = input.kind;
        existing.movedToDate = input.kind === "moved" ? (input.movedToDate ?? null) : null;
        existing.reasonAr = input.reasonAr ?? null;
        existing.reasonEn = input.reasonEn ?? null;
        existing.updatedAt = now;
        existing.updatedBy = actor.id;

        document.audit.push(
          buildAuditEntry({
            actor,
            action,
            entityType: "event_exception",
            entityId: existing.id,
            before,
            after: snapshot(existing),
          })
        );
        return { ...existing };
      }

      const record: EventExceptionRecord = {
        id: newId(),
        seriesId: input.seriesId,
        occurrenceDate: input.occurrenceDate,
        kind: input.kind,
        movedToDate: input.kind === "moved" ? (input.movedToDate ?? null) : null,
        reasonAr: input.reasonAr ?? null,
        reasonEn: input.reasonEn ?? null,
        createdAt: now,
        updatedAt: now,
        createdBy: actor.id,
        updatedBy: actor.id,
      };

      document.exceptions.push(record);
      document.audit.push(
        buildAuditEntry({
          actor,
          action,
          entityType: "event_exception",
          entityId: record.id,
          before: null,
          after: snapshot(record),
        })
      );
      return { ...record };
    });
  }

  async deleteException(id: string, actor: Actor): Promise<void> {
    await mutateStoreDocument("exceptions.delete", (document) => {
      const index = document.exceptions.findIndex((exception) => exception.id === id);
      if (index < 0) {
        throw new StoreError("not_found", "exceptions.delete", `Exception ${id} does not exist.`, { id });
      }
      const [removed] = document.exceptions.splice(index, 1);
      document.audit.push(
        buildAuditEntry({
          actor,
          action: "delete",
          entityType: "event_exception",
          entityId: id,
          before: snapshot(removed),
          after: null,
        })
      );
    });
  }

  // --- taxonomy ------------------------------------------------------------

  async listTerms(filter: TaxonomyTermListFilter = {}): Promise<TaxonomyTermRecord[]> {
    const document = await readStoreDocument();
    const matches = document.terms.filter((term) => {
      if (filter.dimension && term.dimension !== filter.dimension) return false;
      if (!filter.includeInactive && !term.isActive) return false;
      return true;
    });
    const ordered = matches
      .map((term) => ({ ...term }))
      .sort((a, b) => a.dimension.localeCompare(b.dimension) || a.sortOrder - b.sortOrder);
    return typeof filter.limit === "number" ? ordered.slice(0, filter.limit) : ordered;
  }

  async getTerm(id: string): Promise<TaxonomyTermRecord | null> {
    const document = await readStoreDocument();
    const term = document.terms.find((candidate) => candidate.id === id);
    return term ? { ...term } : null;
  }

  async getTermBySlug(dimension: TaxonomyTermRecord["dimension"], slug: string): Promise<TaxonomyTermRecord | null> {
    const document = await readStoreDocument();
    const term = document.terms.find((candidate) => candidate.dimension === dimension && candidate.slug === slug);
    return term ? { ...term } : null;
  }

  async createTerm(input: TaxonomyTermCreateInput, actor: Actor): Promise<TaxonomyTermRecord> {
    return mutateStoreDocument("terms.create", (document) => {
      if (document.terms.some((term) => term.dimension === input.dimension && term.slug === input.slug)) {
        throw new StoreError(
          "conflict",
          "terms.create",
          `A ${input.dimension} term already uses the slug "${input.slug}".`,
          { slug: input.slug }
        );
      }

      const now = nowIso();
      const nextSortOrder =
        input.sortOrder ?? document.terms.filter((term) => term.dimension === input.dimension).length + 1;
      const record: TaxonomyTermRecord = {
        id: newId(),
        dimension: input.dimension,
        slug: input.slug,
        nameAr: input.nameAr,
        nameEn: input.nameEn ?? null,
        icon: input.icon ?? null,
        color: input.color ?? null,
        sortOrder: nextSortOrder,
        isActive: input.isActive ?? true,
        createdAt: now,
        updatedAt: now,
        createdBy: actor.id,
        updatedBy: actor.id,
      };

      document.terms.push(record);
      document.audit.push(
        buildAuditEntry({
          actor,
          action: "create",
          entityType: "taxonomy_term",
          entityId: record.id,
          before: null,
          after: snapshot(record),
        })
      );
      return { ...record };
    });
  }

  async updateTerm(id: string, patch: TaxonomyTermUpdateInput, actor: Actor): Promise<TaxonomyTermRecord> {
    return mutateStoreDocument("terms.update", (document) => {
      const record = document.terms.find((term) => term.id === id);
      if (!record) {
        throw new StoreError("not_found", "terms.update", `Term ${id} does not exist.`, { id });
      }
      const before = snapshot(record);

      const nextDimension = patch.dimension ?? record.dimension;
      const nextSlug = patch.slug ?? record.slug;
      if (
        document.terms.some(
          (term) => term.id !== id && term.dimension === nextDimension && term.slug === nextSlug
        )
      ) {
        throw new StoreError("conflict", "terms.update", `A ${nextDimension} term already uses the slug "${nextSlug}".`);
      }

      assignDefined(record, {
        dimension: patch.dimension,
        slug: patch.slug,
        nameAr: patch.nameAr,
        nameEn: patch.nameEn,
        icon: patch.icon,
        color: patch.color,
        sortOrder: patch.sortOrder,
        isActive: patch.isActive,
      });
      record.updatedAt = nowIso();
      record.updatedBy = actor.id;

      document.audit.push(
        buildAuditEntry({
          actor,
          action: "update",
          entityType: "taxonomy_term",
          entityId: record.id,
          before,
          after: snapshot(record),
        })
      );
      return { ...record };
    });
  }

  async deleteTerm(id: string, actor: Actor): Promise<void> {
    await mutateStoreDocument("terms.delete", (document) => {
      const index = document.terms.findIndex((term) => term.id === id);
      if (index < 0) {
        throw new StoreError("not_found", "terms.delete", `Term ${id} does not exist.`, { id });
      }
      // A term in use is never silently unlinked from live content: retire it with `isActive: false`
      // (still selectable in the admin, hidden from the public lists) instead.
      const usedByEvent = document.eventTerms.some((link) => link.termId === id);
      const usedBySeries = document.series.some((series) => series.defaultTermIds.includes(id));
      if (usedByEvent || usedBySeries) {
        throw new StoreError("conflict", "terms.delete", `Term ${id} is still used by content.`, { id });
      }

      const [removed] = document.terms.splice(index, 1);
      document.audit.push(
        buildAuditEntry({
          actor,
          action: "delete",
          entityType: "taxonomy_term",
          entityId: id,
          before: snapshot(removed),
          after: null,
        })
      );
    });
  }

  // --- media ---------------------------------------------------------------

  async listMedia(filter: MediaListFilter = {}): Promise<MediaRecord[]> {
    const document = await readStoreDocument();
    const matches = document.media.filter((media) => (filter.publicOnly ? media.isPublic : true));
    const ordered = matches.map((media) => ({ ...media })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return typeof filter.limit === "number" ? ordered.slice(0, filter.limit) : ordered;
  }

  async createMedia(input: MediaCreateInput, actor: Actor): Promise<MediaRecord> {
    return mutateStoreDocument("media.create", (document) => {
      const record: MediaRecord = {
        id: newId(),
        filename: input.filename,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes ?? 0,
        url: input.url,
        altAr: input.altAr ?? null,
        altEn: input.altEn ?? null,
        uploadedBy: actor.id,
        createdAt: nowIso(),
        isPublic: input.isPublic ?? true,
      };

      document.media.push(record);
      document.audit.push(
        buildAuditEntry({
          actor,
          action: "create",
          entityType: "media",
          entityId: record.id,
          before: null,
          after: snapshot(record),
        })
      );
      return { ...record };
    });
  }

  async updateMedia(id: string, patch: MediaUpdateInput, actor: Actor): Promise<MediaRecord> {
    return mutateStoreDocument("media.update", (document) => {
      const record = document.media.find((media) => media.id === id);
      if (!record) {
        throw new StoreError("not_found", "media.update", `Media ${id} does not exist.`, { id });
      }
      const before = snapshot(record);
      assignDefined(record, {
        filename: patch.filename,
        mimeType: patch.mimeType,
        sizeBytes: patch.sizeBytes,
        url: patch.url,
        altAr: patch.altAr,
        altEn: patch.altEn,
        isPublic: patch.isPublic,
      });

      document.audit.push(
        buildAuditEntry({
          actor,
          action: "update",
          entityType: "media",
          entityId: record.id,
          before,
          after: snapshot(record),
        })
      );
      return { ...record };
    });
  }

  async deleteMedia(id: string, actor: Actor): Promise<void> {
    await mutateStoreDocument("media.delete", (document) => {
      const index = document.media.findIndex((media) => media.id === id);
      if (index < 0) {
        throw new StoreError("not_found", "media.delete", `Media ${id} does not exist.`, { id });
      }
      const [removed] = document.media.splice(index, 1);
      document.audit.push(
        buildAuditEntry({
          actor,
          action: "delete",
          entityType: "media",
          entityId: id,
          before: snapshot(removed),
          after: null,
        })
      );
    });
  }

  // --- subscribers ---------------------------------------------------------

  async listSubscribers(filter: SubscriberListFilter = {}): Promise<SubscriberRecord[]> {
    const document = await readStoreDocument();
    const matches = document.subscribers.filter((subscriber) => filter.includeInactive || subscriber.isActive);
    // Newest first: the admin list answers "who subscribed recently", not "who is alphabetically first".
    const ordered = matches.map((subscriber) => ({ ...subscriber, topics: [...subscriber.topics] }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return typeof filter.limit === "number" ? ordered.slice(0, filter.limit) : ordered;
  }

  /**
   * Idempotent public subscribe (see the repository contract). The row is keyed by the NORMALISED
   * e-mail, and one atomic write covers both the change and its audit line, as everywhere else here.
   */
  async subscribe(input: SubscriberCreateInput, actor: Actor): Promise<SubscriberSubscribeResult> {
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

    return mutateStoreDocument("subscribers.subscribe", (document) => {
      const now = nowIso();
      const existing = document.subscribers.find((candidate) => candidate.email === email);

      if (existing) {
        const before = snapshot(existing);
        const revived = !existing.isActive;
        existing.name = name ?? existing.name;
        existing.locale = input.locale;
        existing.topics = topics;
        existing.isActive = true;
        // A revived subscription keeps its original confirmation instant: the visitor confirmed once,
        // and re-subscribing is not a new confirmation of an address already on file.
        existing.confirmedAt = existing.confirmedAt ?? now;

        document.audit.push(
          buildAuditEntry({
            actor,
            action: "update",
            entityType: "subscriber",
            entityId: existing.id,
            before,
            after: snapshot(existing),
            summary: revived
              ? `تنشيط ${AUDIT_ENTITY_TYPE_LABELS_AR.subscriber} — أعاد صاحب البريد الاشتراك بعد إيقافه.`
              : `تحديث اهتمامات ${AUDIT_ENTITY_TYPE_LABELS_AR.subscriber} من نموذج الموقع العام.`,
          })
        );

        return { subscriber: { ...existing, topics: [...existing.topics] }, created: false };
      }

      const record: SubscriberRecord = {
        id: newId(),
        email,
        name,
        locale: input.locale,
        topics,
        createdAt: now,
        // The in-site confirmation message is the visitor's confirmation (there is no mail provider
        // to send a double-opt-in link through — see the note on `SubscriberRecord`).
        confirmedAt: now,
        isActive: true,
      };

      document.subscribers.push(record);
      document.audit.push(
        buildAuditEntry({
          actor,
          action: "create",
          entityType: "subscriber",
          entityId: record.id,
          before: null,
          after: snapshot(record),
          summary: `اشتراك جديد في تنبيهات الفعاليات من نموذج الموقع العام.`,
        })
      );

      return { subscriber: { ...record, topics: [...record.topics] }, created: true };
    });
  }

  async setSubscriberActive(id: string, isActive: boolean, actor: Actor): Promise<SubscriberRecord> {
    return mutateStoreDocument("subscribers.setActive", (document) => {
      const record = document.subscribers.find((subscriber) => subscriber.id === id);
      if (!record) {
        throw new StoreError("not_found", "subscribers.setActive", `Subscriber ${id} does not exist.`, { id });
      }

      const before = snapshot(record);
      record.isActive = isActive;
      document.audit.push(
        buildAuditEntry({
          actor,
          action: "update",
          entityType: "subscriber",
          entityId: record.id,
          before,
          after: snapshot(record),
          summary: isActive
            ? `تنشيط ${AUDIT_ENTITY_TYPE_LABELS_AR.subscriber}.`
            : `إيقاف ${AUDIT_ENTITY_TYPE_LABELS_AR.subscriber} (لن يصله أي تنبيه؛ البريد محفوظ).`,
        })
      );

      return { ...record, topics: [...record.topics] };
    });
  }

  // --- audit ---------------------------------------------------------------

  async listAudit(filter: AuditListFilter = {}): Promise<AuditLogEntry[]> {
    const document = await readStoreDocument();
    const matches = document.audit.filter((entry) => {
      if (filter.entityType && entry.entityType !== filter.entityType) return false;
      if (filter.entityId && entry.entityId !== filter.entityId) return false;
      if (filter.action && entry.action !== filter.action) return false;
      return true;
    });
    const newestFirst = [...matches].reverse().map((entry) => ({ ...entry }));
    return newestFirst.slice(0, filter.limit ?? 100);
  }

  /**
   * Audit-only append (see `AuditNoteInput`). It rides the same atomic write as every mutation, so
   * the note is durable the moment this resolves — and it touches nothing else in the document.
   */
  async recordAuditNote(note: AuditNoteInput, actor: Actor): Promise<void> {
    await mutateStoreDocument("audit.note", (document) => {
      document.audit.push(
        buildAuditEntry({
          actor,
          action: note.action,
          entityType: note.entityType,
          entityId: note.entityId,
          before: null,
          after: null,
          summary: note.summary,
        })
      );
    });
  }
}

// ============================================================================
// Shared helpers (module-private)
// ============================================================================

/** Copies only the keys the caller actually provided — `undefined` means "leave it alone". */
function assignDefined<T extends object>(target: T, patch: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) {
      (target as Record<string, unknown>)[key] = value;
    }
  }
}

function assertTermsExist(document: StoreDocument, termIds: readonly string[]): void {
  for (const termId of termIds) {
    if (!document.terms.some((term) => term.id === termId)) {
      throw new StoreError("invalid", "terms.lookup", `Taxonomy term ${termId} does not exist.`, { termId });
    }
  }
}

function replaceEventTerms(document: StoreDocument, eventId: string, termIds: readonly string[], createdAt: string): void {
  document.eventTerms = document.eventTerms.filter((link) => link.eventId !== eventId);
  for (const termId of termIds) {
    document.eventTerms.push({ eventId, termId, createdAt });
  }
}

/** `<base>`, `<base>-2`, `<base>-3`, … — used by `duplicateEvent`. */
function nextAvailableSlug(document: StoreDocument, base: string): string {
  if (!document.events.some((event) => event.slug === base)) return base;
  for (let suffix = 2; suffix < 500; suffix += 1) {
    const candidate = `${base}-${suffix}`;
    if (!document.events.some((event) => event.slug === candidate)) return candidate;
  }
  return `${base}-${newId().slice(0, 8)}`;
}
