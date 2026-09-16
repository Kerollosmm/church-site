// src/lib/store/repository.ts
// The repository CONTRACT: one interface, two drivers (see `json-driver.ts` / `supabase-driver.ts`).
//
// WHY THIS EXISTS: the portal must behave identically with and without a live Supabase. Public
// pages, administrative screens and server actions therefore never talk to a storage API directly —
// they go through this interface, and `src/lib/store/index.ts` picks the driver from the
// environment. Swapping drivers changes WHERE the bytes live, never how the app behaves.
//
// CONTRACT RULES (the drivers implement them, callers may rely on them):
//  1. Every mutation takes an `Actor` and appends exactly one `audit_log` entry carrying the row
//     BEFORE and AFTER the change. There is no mutation path that skips the audit. A PUBLIC mutation
//     (`subscribe()`) passes the visitor as the actor — `{ id: null, name: … }` — because the audit
//     line of a public write must name who caused it as precisely as its writer knows.
//  2. Failures are reported as `StoreError` with a closed-set `code`, so the caller can produce an
//     Arabic message without pattern-matching driver-specific errors (PostgREST codes, ENOENT, …).
//  3. Reads return domain records only — never a driver row. A caller must not be able to tell the
//     drivers apart.

import type {
  Actor,
  AuditAction,
  AuditEntityType,
  AuditLogEntry,
  EventCreateInput,
  EventExceptionInput,
  EventExceptionRecord,
  EventRecord,
  EventSeriesCreateInput,
  EventSeriesRecord,
  EventSeriesUpdateInput,
  EventStatus,
  EventUpdateInput,
  EventWithTerms,
  MediaCreateInput,
  MediaRecord,
  MediaUpdateInput,
  SubscriberCreateInput,
  SubscriberRecord,
  SubscriberSubscribeResult,
  TaxonomyDimension,
  TaxonomyTermCreateInput,
  TaxonomyTermRecord,
  TaxonomyTermUpdateInput,
} from "@/lib/domain/types";

export type RepositoryDriverName = "json" | "supabase";

/**
 * Failure vocabulary. Every driver maps its own error surface onto these four:
 *  - `not_found`   — the row asked for does not exist (or a guarded update matched nothing).
 *  - `conflict`    — a uniqueness/consistency rule was violated (a taken slug, a duplicate occurrence).
 *  - `invalid`     — the request contradicts another row (a missing reference, a bad rule).
 *  - `unavailable` — the store itself could not be reached (no environment, unreadable file, …).
 */
export type StoreErrorCode = "not_found" | "conflict" | "invalid" | "unavailable";

export class StoreError extends Error {
  readonly code: StoreErrorCode;
  /** Stable, greppable operation name, e.g. "events.create". */
  readonly operation: string;
  readonly detail: Record<string, unknown>;

  constructor(code: StoreErrorCode, operation: string, message: string, detail: Record<string, unknown> = {}) {
    super(message);
    this.name = "StoreError";
    this.code = code;
    this.operation = operation;
    this.detail = detail;
  }
}

/** True when a caught value is a `StoreError` (used by the actions' error mapping). */
export function isStoreError(error: unknown): error is StoreError {
  return error instanceof StoreError;
}

// ============================================================================
// Filters
// ============================================================================

export interface EventListFilter {
  status?: EventStatus | readonly EventStatus[];
  /** `null` selects standalone events only; omit for "any". */
  seriesId?: string | null;
  /** Inclusive lower bound on `startsAt` (ISO instant). */
  from?: string;
  /** Inclusive upper bound on `startsAt` (ISO instant). */
  to?: string;
  /** Events carrying ANY of these taxonomy terms. */
  termIds?: readonly string[];
  limit?: number;
}

export interface SeriesListFilter {
  status?: EventStatus | readonly EventStatus[];
  limit?: number;
}

export interface TaxonomyTermListFilter {
  dimension?: TaxonomyDimension;
  /** Default false: inactive terms are hidden unless explicitly requested. */
  includeInactive?: boolean;
  limit?: number;
}

export interface MediaListFilter {
  publicOnly?: boolean;
  limit?: number;
}

export interface AuditListFilter {
  entityType?: AuditEntityType;
  entityId?: string;
  action?: AuditAction;
  limit?: number;
}

export interface SubscriberListFilter {
  /** Default false: retired (deactivated) subscriptions are hidden unless explicitly requested. */
  includeInactive?: boolean;
  limit?: number;
}

/**
 * An AUDIT-ONLY entry: no row before, no row after, no change to any content.
 *
 * It exists for one reason — a refused attempt (a signed-in member of staff asking for something
 * their role does not allow) must leave a trace. Because it carries no snapshots it can never be
 * used to rewrite the history of a real mutation, and it is deliberately the only write in this
 * contract that does not take a `before`/`after` pair.
 */
export interface AuditNoteInput {
  action: AuditAction;
  entityType: AuditEntityType;
  /** The attempted thing's id, or the acting staff member's id when the attempt names no row. */
  entityId: string;
  /** One-line Arabic description (see `describeRefusal()` in `src/lib/domain/capabilities.ts`). */
  summary: string;
}

/** What the store is, for diagnostics screens and the `republish()` result. */
export interface RepositoryStatus {
  driver: RepositoryDriverName;
  /** Last mutation instant known to the store, or null before any write. */
  lastUpdatedAt: string | null;
  /** Human-readable location of the data (a directory path, or the Supabase project host). No secrets. */
  location: string | null;
}

// ============================================================================
// The repository
// ============================================================================

export interface EventRepository {
  readonly driver: RepositoryDriverName;

  /** Driver, last-mutation instant and data location. */
  status(): Promise<RepositoryStatus>;

  // --- events -------------------------------------------------------------
  listEvents(filter?: EventListFilter): Promise<EventWithTerms[]>;
  getEvent(id: string): Promise<EventWithTerms | null>;
  getEventBySlug(slug: string): Promise<EventWithTerms | null>;
  /** Taxonomy term ids for a set of events, keyed by event id (one round-trip for a list view). */
  listTermIdsByEvent(eventIds: readonly string[]): Promise<Record<string, string[]>>;

  createEvent(input: EventCreateInput, actor: Actor): Promise<EventWithTerms>;
  updateEvent(id: string, patch: EventUpdateInput, actor: Actor): Promise<EventWithTerms>;
  /**
   * Publish / unpublish / archive / cancel. Audits `publish` / `unpublish` / `cancel`.
   * `reason` is optional and, when supplied for a cancellation, is preserved in the audit summary —
   * an event row has no cancellation-reason column of its own.
   */
  setEventStatus(
    id: string,
    status: EventStatus,
    actor: Actor,
    reason?: { ar?: string | null; en?: string | null }
  ): Promise<EventWithTerms>;
  /** Copies an event as a new DRAFT (audit action `duplicate`). */
  duplicateEvent(id: string, actor: Actor, overrides?: Partial<EventCreateInput>): Promise<EventWithTerms>;
  deleteEvent(id: string, actor: Actor): Promise<void>;
  /** Replaces the event's taxonomy links wholesale. */
  setEventTerms(eventId: string, termIds: readonly string[], actor: Actor): Promise<EventWithTerms>;

  // --- series -------------------------------------------------------------
  listSeries(filter?: SeriesListFilter): Promise<EventSeriesRecord[]>;
  getSeries(id: string): Promise<EventSeriesRecord | null>;
  createSeries(input: EventSeriesCreateInput, actor: Actor): Promise<EventSeriesRecord>;
  updateSeries(id: string, patch: EventSeriesUpdateInput, actor: Actor): Promise<EventSeriesRecord>;
  /** Cancels EVERY occurrence: sets the series status to `cancelled` (audit action `cancel`). */
  cancelSeries(id: string, actor: Actor, reason?: { ar?: string | null; en?: string | null }): Promise<EventSeriesRecord>;
  deleteSeries(id: string, actor: Actor): Promise<void>;

  // --- occurrence exceptions ---------------------------------------------
  listExceptions(seriesId?: string): Promise<EventExceptionRecord[]>;
  getException(seriesId: string, occurrenceDate: string): Promise<EventExceptionRecord | null>;
  /** Creates or replaces the deviation of ONE occurrence (cancel it, or move it to another date). */
  upsertException(input: EventExceptionInput, actor: Actor): Promise<EventExceptionRecord>;
  deleteException(id: string, actor: Actor): Promise<void>;

  // --- taxonomy -----------------------------------------------------------
  listTerms(filter?: TaxonomyTermListFilter): Promise<TaxonomyTermRecord[]>;
  getTerm(id: string): Promise<TaxonomyTermRecord | null>;
  getTermBySlug(dimension: TaxonomyDimension, slug: string): Promise<TaxonomyTermRecord | null>;
  createTerm(input: TaxonomyTermCreateInput, actor: Actor): Promise<TaxonomyTermRecord>;
  updateTerm(id: string, patch: TaxonomyTermUpdateInput, actor: Actor): Promise<TaxonomyTermRecord>;
  deleteTerm(id: string, actor: Actor): Promise<void>;

  // --- media --------------------------------------------------------------
  listMedia(filter?: MediaListFilter): Promise<MediaRecord[]>;
  createMedia(input: MediaCreateInput, actor: Actor): Promise<MediaRecord>;
  updateMedia(id: string, patch: MediaUpdateInput, actor: Actor): Promise<MediaRecord>;
  deleteMedia(id: string, actor: Actor): Promise<void>;

  // --- subscribers (event notifications) -----------------------------------
  listSubscribers(filter?: SubscriberListFilter): Promise<SubscriberRecord[]>;
  /**
   * The PUBLIC subscribe operation, and the only mutation in this contract a visitor can trigger.
   *
   * IDEMPOTENT BY CONTRACT: an e-mail that is already subscribed is never duplicated — the existing
   * row is updated in place (refreshed name/locale/topics, and revived when it had been retired) and
   * the caller learns which happened from `created`. The e-mail is normalised here, so two visitors
   * typing the same address in different cases are one subscriber.
   */
  subscribe(input: SubscriberCreateInput, actor: Actor): Promise<SubscriberSubscribeResult>;
  /** Retires or revives a subscription. The row is never deleted, so a decision stays reversible. */
  setSubscriberActive(id: string, isActive: boolean, actor: Actor): Promise<SubscriberRecord>;

  // --- audit --------------------------------------------------------------
  /** Newest first. */
  listAudit(filter?: AuditListFilter): Promise<AuditLogEntry[]>;
  /**
   * Appends ONE audit entry with NO state change (`before`/`after` are always null). Used for
   * refusals, and BEST EFFORT by contract: a caller must treat a failure as non-fatal, because the
   * refusal itself is already the answer and must never turn into an error the user has to handle.
   */
  recordAuditNote(note: AuditNoteInput, actor: Actor): Promise<void>;

  /**
   * Cache-invalidation hook. The repository itself holds no cache, so the drivers return the store's
   * status; the actual `revalidateTag`/`revalidatePath` work lives in `src/lib/store/revalidate.ts`
   * (which must NOT be imported by the drivers: it pulls `next/cache` and would break plain scripts).
   */
  republish(): Promise<RepositoryStatus>;
}

/** Status filter normalisation shared by both drivers. */
export function normalizeStatusFilter(
  status: EventListFilter["status"]
): readonly EventStatus[] | null {
  if (status === undefined) return null;
  return Array.isArray(status) ? status : [status as EventStatus];
}
