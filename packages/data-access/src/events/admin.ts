// src/lib/events/admin.ts
// The ADMIN reader: the repository turned into the view models the management screens render.
//
// SERVER-ONLY, and deliberately separate from `feed.ts`:
//   * the public feed answers "what is happening next" and shows only PUBLISHED rows. The admin has
//     to answer "what exists, in what state, and what does its audit trail say" — every status,
//     including drafts, cancelled and archived rows, and rows of any date (past included).
//   * it therefore never reuses `getEventFeed()`: a draft is invisible there by design, and an admin
//     list that silently hides drafts would be worse than useless.
//
// WHAT IT DOES NOT DO: no writing, no driver selection (that is `src/lib/store/index.ts`), and no
// caching. Every admin route is already `force-dynamic` (see the protected layout), so a read here
// always reflects the store — which is what an editor who just saved something expects.
//
// THE NEXT OCCURRENCE IS DERIVED, NEVER STORED: a standalone event's next occurrence is its own
// `startsAt` (when it is still ahead), and a series' is the first occurrence the recurrence engine
// produces inside the admin window. A series whose rule the engine rejects is reported with a null
// occurrence and a logged reason instead of taking the screen down.

import { expandSeries, type Occurrence } from "@church-site/domain";
import type {
  AuditLogEntry,
  EventExceptionKind,
  EventExceptionRecord,
  EventSeriesRecord,
  EventStatus,
  EventWithTerms,
  MediaRecord,
  SubscriberRecord,
  TaxonomyDimension,
  TaxonomyTermRecord,
} from "@church-site/domain";
import { TAXONOMY_DIMENSIONS } from "@church-site/domain";
import { resolveSubscriberTopics } from "@church-site/domain";
import type { EventFeedTermView } from "./feed";
import { getZoneDateKey } from "./format";
import { MS_PER_DAY } from "@church-site/domain";
import {
  getEventRepository,
  type AuditListFilter,
  type RepositoryStatus,
  type SubscriberListFilter,
} from "../store";

/** How far ahead the admin looks for a series' next occurrence (well inside the engine's maximum). */
export const ADMIN_OCCURRENCE_WINDOW_DAYS = 180;

/** How many occurrences the series screen lists. */
export const ADMIN_OCCURRENCE_LIMIT = 24;

/** Occurrence states as the admin shows them (`moved` = the vacated original slot of a relocation). */
export type AdminOccurrenceState = "scheduled" | "cancelled" | "moved";

export const OCCURRENCE_STATE_LABELS_AR: Record<AdminOccurrenceState, string> = {
  scheduled: "مجدول",
  cancelled: "ملغى",
  moved: "منقول من موعده",
};

/** A taxonomy term as the admin renders it: the public view PLUS the retirement flag. */
export interface AdminTermView extends EventFeedTermView {
  isActive: boolean;
}

export interface AdminTaxonomyGroup {
  dimension: TaxonomyDimension;
  terms: AdminTermView[];
}

/** One date an admin screen can act on. `state` and `movedToDate` carry the deviation itself. */
export interface AdminOccurrence {
  occurrenceDate: string;
  startsAt: string;
  endsAt: string;
  state: AdminOccurrenceState;
  movedToDate: string | null;
  reasonAr: string | null;
  reasonEn: string | null;
}

/** A row of the events list — always a real `events` row, never a derived occurrence. */
export interface AdminEventRow {
  event: EventWithTerms;
  termIds: string[];
  /** The terms, resolved and sorted (venue last-dimension ordering comes from the feed's sort). */
  terms: AdminTermView[];
  venue: AdminTermView | null;
  /** True for an occurrence-override row (`seriesId !== null`): it belongs to a series. */
  isOverride: boolean;
  /** The event's own next date, or null when it has none ahead (a past or an override row). */
  nextOccurrenceDateKey: string | null;
}

/** A row of the series list. */
export interface AdminSeriesRow {
  series: EventSeriesRecord;
  terms: AdminTermView[];
  venue: AdminTermView | null;
  /** First occurrence the rule produces inside the window, or null when there is none. */
  nextOccurrence: AdminOccurrence | null;
  exceptionCount: number;
  /** Arabic problem description when the stored rule cannot be expanded (null when it is usable). */
  ruleProblemAr: string | null;
}

/** The series screen: the series, its next dates (deviations included) and its exceptions. */
export interface AdminSeriesDetail {
  series: EventSeriesRecord;
  terms: AdminTermView[];
  venue: AdminTermView | null;
  occurrences: AdminOccurrence[];
  exceptions: EventExceptionRecord[];
  ruleProblemAr: string | null;
}

/** A row of the subscribers screen: the stored subscription plus its RESOLVED topics. */
export interface AdminSubscriberRow {
  subscriber: SubscriberRecord;
  /** The terms the visitor asked about, resolved from the stored slugs. Empty = every topic. */
  topics: AdminTermView[];
  /** Stored slugs that are no longer in the vocabulary — reported, never rendered as a chip. */
  unknownTopics: string[];
}

// ============================================================================
// Term plumbing
// ============================================================================

function toAdminTermView(term: TaxonomyTermRecord): AdminTermView {
  return {
    id: term.id,
    dimension: term.dimension,
    slug: term.slug,
    nameAr: term.nameAr,
    nameEn: term.nameEn,
    icon: term.icon,
    color: term.color,
    sortOrder: term.sortOrder,
    isActive: term.isActive,
  };
}

/** The active vocabulary, plus the retired terms, indexed by id — the admin shows both. */
function indexTerms(terms: readonly TaxonomyTermRecord[]): Map<string, AdminTermView> {
  const index = new Map<string, AdminTermView>();
  for (const term of terms) index.set(term.id, toAdminTermView(term));
  return index;
}

/** Order of the dimensions as the screens render them (one source: the domain vocabulary). */
function dimensionOrder(dimension: TaxonomyDimension): number {
  return TAXONOMY_DIMENSIONS.indexOf(dimension);
}

function compareTermViews(a: AdminTermView, b: AdminTermView): number {
  return (
    dimensionOrder(a.dimension) - dimensionOrder(b.dimension) ||
    a.sortOrder - b.sortOrder ||
    a.slug.localeCompare(b.slug)
  );
}

function resolveTerms(
  termIds: readonly string[],
  venueId: string | null,
  termById: Map<string, AdminTermView>
): { venue: AdminTermView | null; terms: AdminTermView[] } {
  const seen = new Set<string>();
  const terms: AdminTermView[] = [];

  for (const id of termIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    const term = termById.get(id);
    // A link to a term that no longer exists is dropped rather than rendered as a broken chip.
    if (term) terms.push(term);
  }

  const venue = venueId ? termById.get(venueId) ?? null : null;
  if (venue && !seen.has(venue.id)) terms.push(venue);

  terms.sort(compareTermViews);
  return { venue, terms };
}

// ============================================================================
// Occurrences
// ============================================================================

function toAdminOccurrence(occurrence: Occurrence): AdminOccurrence {
  return {
    occurrenceDate: occurrence.occurrenceDate,
    startsAt: occurrence.startsAt,
    endsAt: occurrence.endsAt,
    state: occurrence.state,
    movedToDate: occurrence.movedToDate,
    reasonAr: occurrence.reasonAr,
    reasonEn: occurrence.reasonEn,
  };
}

function windowRange(now: Date, days: number): { from: Date; to: Date } {
  return { from: now, to: new Date(now.getTime() + days * MS_PER_DAY) };
}

/**
 * Expands one series for the admin, returning the occurrences AND the Arabic reason it could not be
 * expanded (an unusable stored rule). Never throws: one malformed row must not blank a screen that
 * also has to show every other row.
 */
function expandForAdmin(
  series: EventSeriesRecord,
  exceptions: readonly EventExceptionRecord[],
  now: Date,
  options: { includeCancelled: boolean; includeMovedFrom: boolean }
): { occurrences: AdminOccurrence[]; problemAr: string | null } {
  try {
    const occurrences = expandSeries(series, exceptions, windowRange(now, ADMIN_OCCURRENCE_WINDOW_DAYS), options);
    return { occurrences: occurrences.map(toAdminOccurrence), problemAr: null };
  } catch (error) {
    console.warn("[admin] series could not be expanded", {
      seriesId: series.id,
      reason: error instanceof Error ? error.message : String(error),
    });
    return {
      occurrences: [],
      problemAr: "قاعدة التكرار المخزّنة لهذه السلسلة غير صالحة، فلا يمكن حساب مواعيدها. عدّل القاعدة ثم احفظ.",
    };
  }
}

// ============================================================================
// Readers
// ============================================================================

/** Every event row (all statuses, past and future) with its resolved terms. */
export async function listAdminEvents(): Promise<AdminEventRow[]> {
  const repository = getEventRepository();
  const [events, terms] = await Promise.all([
    repository.listEvents(),
    repository.listTerms({ includeInactive: true }),
  ]);

  const termIdsByEvent =
    events.length > 0 ? await repository.listTermIdsByEvent(events.map((event) => event.id)) : {};

  const termById = indexTerms(terms);
  const nowMs = Date.now();

  return events.map((event) => {
    const termIds = termIdsByEvent[event.id] ?? event.termIds;
    const { venue, terms: resolved } = resolveTerms(termIds, event.venueId, termById);
    const startsMs = Date.parse(event.startsAt);
    const isOverride = event.seriesId !== null;

    return {
      event,
      termIds,
      terms: resolved,
      venue,
      isOverride,
      nextOccurrenceDateKey:
        !isOverride && Number.isFinite(startsMs) && startsMs >= nowMs ? getZoneDateKey(event.startsAt) : null,
    };
  });
}

/** Every series with its next occurrence and its deviation count. */
export async function listAdminSeries(): Promise<AdminSeriesRow[]> {
  const repository = getEventRepository();
  const [seriesList, exceptions, terms] = await Promise.all([
    repository.listSeries(),
    repository.listExceptions(),
    repository.listTerms({ includeInactive: true }),
  ]);

  const termById = indexTerms(terms);
  const now = new Date();

  return seriesList.map((series) => {
    const mine = exceptions.filter((exception) => exception.seriesId === series.id);
    const { occurrences, problemAr } = expandForAdmin(series, mine, now, {
      includeCancelled: false,
      includeMovedFrom: false,
    });
    const { venue, terms: resolved } = resolveTerms(series.defaultTermIds, series.defaultVenueId, termById);

    return {
      series,
      terms: resolved,
      venue,
      nextOccurrence: occurrences[0] ?? null,
      exceptionCount: mine.length,
      ruleProblemAr: problemAr,
    };
  });
}

/** One event row for the editor, with the full taxonomy (inactive terms included). */
export async function getAdminEvent(
  id: string
): Promise<{ row: AdminEventRow; taxonomy: AdminTaxonomyGroup[] } | null> {
  const repository = getEventRepository();
  const [event, terms] = await Promise.all([
    repository.getEvent(id),
    repository.listTerms({ includeInactive: true }),
  ]);
  if (!event) return null;

  const termById = indexTerms(terms);
  const { venue, terms: resolved } = resolveTerms(event.termIds, event.venueId, termById);
  const startsMs = Date.parse(event.startsAt);
  const isOverride = event.seriesId !== null;

  return {
    row: {
      event,
      termIds: event.termIds,
      terms: resolved,
      venue,
      isOverride,
      nextOccurrenceDateKey:
        !isOverride && Number.isFinite(startsMs) && startsMs >= Date.now() ? getZoneDateKey(event.startsAt) : null,
    },
    taxonomy: groupTaxonomy(terms),
  };
}

/** One series with its upcoming dates (cancelled ones and vacated slots included) and exceptions. */
export async function getAdminSeriesDetail(id: string): Promise<
  { detail: AdminSeriesDetail; taxonomy: AdminTaxonomyGroup[] } | null
> {
  const repository = getEventRepository();
  const [series, exceptions, terms] = await Promise.all([
    repository.getSeries(id),
    repository.listExceptions(id),
    repository.listTerms({ includeInactive: true }),
  ]);
  if (!series) return null;

  const { occurrences, problemAr } = expandForAdmin(series, exceptions, new Date(), {
    includeCancelled: true,
    includeMovedFrom: true,
  });
  const termById = indexTerms(terms);
  const { venue, terms: resolved } = resolveTerms(series.defaultTermIds, series.defaultVenueId, termById);

  return {
    detail: {
      series,
      terms: resolved,
      venue,
      occurrences: occurrences.slice(0, ADMIN_OCCURRENCE_LIMIT),
      exceptions,
      ruleProblemAr: problemAr,
    },
    taxonomy: groupTaxonomy(terms),
  };
}

/** The whole vocabulary — every dimension, retired terms included — in the domain's own order. */
export function groupTaxonomy(terms: readonly TaxonomyTermRecord[]): AdminTaxonomyGroup[] {
  return TAXONOMY_DIMENSIONS.map((dimension) => ({
    dimension,
    terms: terms
      .filter((term) => term.dimension === dimension)
      .map(toAdminTermView)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.slug.localeCompare(b.slug)),
  }));
}

/** The taxonomy alone (the editors' option lists). */
export async function getAdminTaxonomy(): Promise<AdminTaxonomyGroup[]> {
  return groupTaxonomy(await getEventRepository().listTerms({ includeInactive: true }));
}

/** Registered media metadata (no bytes: the store holds a filename, a URL and a description). */
export async function listAdminMedia(): Promise<MediaRecord[]> {
  return getEventRepository().listMedia();
}

/**
 * Event-notification subscriptions, newest first, with their topics resolved against the live
 * vocabulary.
 *
 * `includeInactive` is passed through on purpose: this screen is the office's record of who asked to
 * be contacted, so a retired subscription must remain visible (badged as stopped) instead of vanishing.
 * The vocabulary read includes retired terms as well, so a term that was renamed or retired still
 * resolves to the name the office knows it by.
 */
export async function listAdminSubscribers(filter: SubscriberListFilter = {}): Promise<AdminSubscriberRow[]> {
  const repository = getEventRepository();
  const [subscribers, terms] = await Promise.all([
    repository.listSubscribers(filter),
    repository.listTerms({ includeInactive: true }),
  ]);

  const termById = indexTerms(terms);

  return subscribers.map((subscriber) => {
    const { matched, unknown } = resolveSubscriberTopics(subscriber.topics, terms);
    return {
      subscriber,
      topics: matched
        .map((term) => termById.get(term.id))
        .filter((term): term is AdminTermView => Boolean(term))
        .sort(compareTermViews),
      unknownTopics: unknown,
    };
  });
}

/** Audit entries, newest first. */export async function listAdminAudit(filter: AuditListFilter = {}): Promise<AuditLogEntry[]> {
  return getEventRepository().listAudit(filter);
}

/** Driver, data location and the last mutation instant (the "آخر تحديث" indicator). */
export async function getAdminStoreStatus(): Promise<RepositoryStatus> {
  return getEventRepository().status();
}
