// src/lib/events/feed.ts
// The public "occurrence feed": the repository turned into the flat, sorted list of things that
// actually happen, which every public events surface renders (the list, the month grid, the event
// detail page and the ministry pages).
//
// SERVER-ONLY. It is the only events module that imports the repository, and it is never imported by
// a client component: the store may reach for the filesystem or Supabase, and the browser must not.
//
// WHY A FEED AND NOT A TABLE READ:
//
//  * A recurring series is stored ONCE (`event_series`) and its dates are expanded on read by
//    `expandSeries()`. The public feed is therefore "the occurrences inside a window", not "the rows
//    in a table" — a weekly liturgy must not be materialised hundreds of times to be listed.
//  * The per-occurrence deviations staff author (cancel this Friday, move that meeting) live in
//    `event_exceptions`, which the engine folds in. The feed exposes the effect AND, when asked, the
//    deviation itself (`state: "moved"` = the vacated slot).
//
// OVERRIDE ROWS ARE NOT RENDERED BY THE FEED (deliberate, documented once): an `events` row carrying
// a `seriesId` is an occurrence override, and the admin editor that would author such rows does not
// exist yet. The effective occurrence set is the series rule plus `event_exceptions` — which is
// exactly what the admin's per-occurrence cancel/move actions write — so an override row would show
// up twice if the feed rendered it. Today only `seriesId === null` rows (standalone events) join the
// occurrences.

import { expandSeries, type Occurrence } from "@church-site/domain";
import type {
  EventExceptionRecord,
  EventSeriesRecord,
  EventStatus,
  EventWithTerms,
  RecurrenceRule,
  TaxonomyDimension,
  TaxonomyTermRecord,
} from "@church-site/domain";
import { MS_PER_DAY } from "@church-site/domain";
import {
  FILTER_DIMENSIONS,
  hasFilterSelection,
  matchesFilterSelection,
  termKey,
  type EventFilterSelection,
} from "./filters";
import { getZoneDateKey } from "./format";
import { getEventRepository } from "../store";
import { unstable_cache } from "next/cache";
import { REVALIDATION_TAGS } from "../tags";

// ============================================================================
// 1. View models
// ============================================================================

/** A taxonomy term as the public UI needs it (no audit columns, no `isActive`). */
export interface EventFeedTermView {
  id: string;
  dimension: TaxonomyDimension;
  slug: string;
  nameAr: string;
  nameEn: string | null;
  icon: string | null;
  color: string | null;
  sortOrder: number;
}

/**
 * `scheduled` = the occurrence happens as ruled; `cancelled` = it was called off; `moved` = the
 * VACATED original slot of a relocated occurrence (included only when explicitly requested).
 */
export type EventFeedItemState = "scheduled" | "cancelled" | "moved";

/** One thing a visitor can put in their diary: a single occurrence of a series, or a one-off event. */
export interface EventFeedItem {
  /**
   * Stable identity of this entry, and the base of its calendar UID:
   * `occurrence:<seriesId>:<occurrenceDate>` / `event:<eventId>`.
   * The vacated slot of a relocated occurrence carries the `@origin` suffix, mirroring the engine's
   * own identity, so a moved pair can never produce two entries with the same key.
   */
  key: string;
  kind: "occurrence" | "event";
  /** `/events/<detailSlug>`: the series slug for occurrences, the event slug for one-off events. */
  detailSlug: string;
  titleAr: string;
  titleEn: string | null;
  summaryAr: string | null;
  summaryEn: string | null;
  /** Absolute instant, ISO 8601 (UTC). For a relocated occurrence this is the NEW date/time. */
  startsAt: string;
  endsAt: string | null;
  timezone: string;
  allDay: boolean;
  state: EventFeedItemState;
  /**
   * Series-local `YYYY-MM-DD` of the occurrence AS RULED (the original date when it was relocated);
   * for a standalone event, the Cairo date of `startsAt`.
   */
  occurrenceDate: string;
  /**
   * Series-local `YYYY-MM-DD` a relocated occurrence moved TO — set on BOTH the new entry and the
   * vacated `moved` entry, so the UI can render "نُقل من {date}" on either side.
   */
  movedToDate: string | null;
  reasonAr: string | null;
  reasonEn: string | null;
  venue: EventFeedTermView | null;
  /** Every term of the item INCLUDING the venue term, sorted by dimension order then sortOrder. */
  terms: EventFeedTermView[];
}

export interface EventFeedRange {
  from: Date;
  to: Date;
}

/** Options shared by the feed readers. Defaults are the EFFECTIVE set (deviations hidden). */
export interface EventFeedOptions {
  /** Include occurrences that were cancelled. Default false. */
  includeCancelled?: boolean;
  /** Include the vacated original slot of a relocated occurrence. Default false. */
  includeMovedFrom?: boolean;
}

/** The next occurrences a series detail page lists, and how far ahead it looks for them. */
export const SERIES_OCCURRENCE_LIMIT = 12;
export const SERIES_DETAIL_WINDOW_DAYS = 180;

// ============================================================================
// 2. Series slugs
// ============================================================================

const SERIES_SLUG_PREFIX = "series-";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The public slug of a series, derived from its id: `series-<uuid>`. A series has no slug column, so
 * this is the single place that decides what its detail URL looks like.
 */
export function seriesSlug(seriesId: string): string {
  return `${SERIES_SLUG_PREFIX}${seriesId}`;
}

/**
 * The inverse of `seriesSlug()`: the series id carried by a `series-<uuid>` slug, or null when the
 * slug is not one (a standalone event slug, a truncated link, anything a visitor typed). Never throws.
 */
export function parseSeriesSlug(slug: string): string | null {
  const trimmed = slug.trim();
  if (!trimmed.toLowerCase().startsWith(SERIES_SLUG_PREFIX)) return null;
  const candidate = trimmed.slice(SERIES_SLUG_PREFIX.length);
  return UUID_PATTERN.test(candidate) ? candidate.toLowerCase() : null;
}

// ============================================================================
// 3. Term plumbing
// ============================================================================

/** Position of a dimension in the UI's order — the primary sort key of an item's term list. */
function dimensionOrder(dimension: TaxonomyDimension): number {
  return FILTER_DIMENSIONS.indexOf(dimension);
}

function compareTermViews(a: EventFeedTermView, b: EventFeedTermView): number {
  return (
    dimensionOrder(a.dimension) - dimensionOrder(b.dimension) ||
    a.sortOrder - b.sortOrder ||
    a.slug.localeCompare(b.slug)
  );
}

function toTermView(term: TaxonomyTermRecord): EventFeedTermView {
  return {
    id: term.id,
    dimension: term.dimension,
    slug: term.slug,
    nameAr: term.nameAr,
    nameEn: term.nameEn,
    icon: term.icon,
    color: term.color,
    sortOrder: term.sortOrder,
  };
}

/** The active vocabulary, indexed by id. Built ONCE per read and shared by every item. */
function indexTerms(terms: readonly TaxonomyTermRecord[]): Map<string, EventFeedTermView> {
  const index = new Map<string, EventFeedTermView>();
  for (const term of terms) index.set(term.id, toTermView(term));
  return index;
}

/**
 * Resolves the term ids an item carries, plus its venue term, into views.
 *
 * An id that is no longer in the ACTIVE vocabulary simply drops out: a deactivated term produces a
 * shorter badge row, never a broken badge and never a throw.
 */
function resolveItemTerms(
  termIds: readonly string[],
  venueId: string | null,
  termById: Map<string, EventFeedTermView>
): { venue: EventFeedTermView | null; terms: EventFeedTermView[] } {
  const seen = new Set<string>();
  const terms: EventFeedTermView[] = [];

  for (const id of termIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    const term = termById.get(id);
    if (term) terms.push(term);
  }

  const venue = venueId ? termById.get(venueId) ?? null : null;
  if (venue && !seen.has(venue.id)) terms.push(venue);

  terms.sort(compareTermViews);
  return { venue, terms };
}

// ============================================================================
// 4. Item builders
// ============================================================================

/** `startsAt` ascending, then `key` ascending — stable and deterministic on every surface. */
function compareFeedItems(a: EventFeedItem, b: EventFeedItem): number {
  return a.startsAt.localeCompare(b.startsAt) || a.key.localeCompare(b.key);
}

/** The instants of an occurrence, ready to be turned into a feed item. */
function buildOccurrenceItem(
  series: EventSeriesRecord,
  occurrence: Occurrence,
  termById: Map<string, EventFeedTermView>
): EventFeedItem {
  const { venue, terms } = resolveItemTerms(occurrence.termIds, occurrence.venueId, termById);
  // The vacated slot of a move needs its own key: the relocated entry and the slot it left share the
  // same `occurrenceDate`, so `<date>` alone would collide (the engine identity uses `@origin` too).
  const keyPrefix = occurrence.state === "moved" ? `${occurrence.occurrenceDate}@origin` : occurrence.occurrenceDate;

  return {
    key: `occurrence:${series.id}:${keyPrefix}`,
    kind: "occurrence",
    detailSlug: seriesSlug(series.id),
    titleAr: occurrence.titleAr ?? series.titleAr,
    titleEn: occurrence.titleEn ?? series.titleEn,
    summaryAr: series.summaryAr,
    summaryEn: series.summaryEn,
    startsAt: occurrence.startsAt,
    endsAt: occurrence.endsAt,
    timezone: occurrence.timezone,
    // A series always carries a wall-clock start time and a duration: occurrences are never all-day.
    allDay: false,
    state: occurrence.state,
    occurrenceDate: occurrence.occurrenceDate,
    movedToDate: occurrence.movedToDate,
    reasonAr: occurrence.reasonAr,
    reasonEn: occurrence.reasonEn,
    venue,
    terms,
  };
}

/** A standalone (`seriesId === null`) event row as a feed item: one scheduled occurrence. */
function buildEventItem(event: EventWithTerms, termById: Map<string, EventFeedTermView>): EventFeedItem {
  const { venue, terms } = resolveItemTerms(event.termIds, event.venueId, termById);
  return {
    key: `event:${event.id}`,
    kind: "event",
    detailSlug: event.slug,
    titleAr: event.titleAr,
    titleEn: event.titleEn,
    summaryAr: event.summaryAr,
    summaryEn: event.summaryEn,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    timezone: event.timezone,
    allDay: event.allDay,
    state: "scheduled",
    occurrenceDate: getZoneDateKey(event.startsAt),
    movedToDate: null,
    reasonAr: null,
    reasonEn: null,
    venue,
    terms,
  };
}

/** True when an instant falls inside `[from, to]` (inclusive). An unparsable instant never does. */
function isWithinRange(instant: string, range: EventFeedRange): boolean {
  const ms = Date.parse(instant);
  return Number.isFinite(ms) && ms >= range.from.getTime() && ms <= range.to.getTime();
}

/**
 * Expands one series into feed items.
 *
 * A rule the engine rejects (an impossible date, an unknown timezone, a window it refuses) is logged
 * and SKIPPED: one malformed row must never take the public page down. Repository failures are a
 * different matter and are deliberately NOT caught — a `StoreError` propagates so the page can show
 * its own error state instead of an empty calendar that looks legitimate.
 */
function expandSeriesItems(
  series: EventSeriesRecord,
  exceptions: readonly EventExceptionRecord[],
  range: EventFeedRange,
  termById: Map<string, EventFeedTermView>,
  options: EventFeedOptions
): EventFeedItem[] {
  let occurrences: Occurrence[];
  try {
    occurrences = expandSeries(series, exceptions, range, {
      includeCancelled: options.includeCancelled === true,
      includeMovedFrom: options.includeMovedFrom === true,
    });
  } catch (error) {
    console.warn("[events] series skipped", {
      seriesId: series.id,
      reason: error instanceof Error ? error.message : String(error),
    });
    return [];
  }

  return occurrences.map((occurrence) => buildOccurrenceItem(series, occurrence, termById));
}

// ============================================================================
// 5. The feed
// ============================================================================

/**
 * Every published entry whose start instant falls inside `range`.
 *
 * Composition: published SERIES expanded with the recurrence engine (rule + exceptions), plus
 * published STANDALONE events in the window. Returned sorted by `startsAt` then `key`.
 *
 * Defaults hide the deviation (`includeCancelled: false`, `includeMovedFrom: false`) — that is what
 * the list and the month grid want. The series detail page passes both `true` so it can show a
 * cancelled date and the slot a relocated occurrence left behind.
 */
export async function getEventFeed(range: EventFeedRange, options: EventFeedOptions = {}): Promise<EventFeedItem[]> {
  const repository = getEventRepository();

  const [seriesList, events, exceptions, terms] = await Promise.all([
    repository.listSeries({ status: "published" }),
    repository.listEvents({ status: "published" }),
    repository.listExceptions(),
    repository.listTerms(),
  ]);

  const termById = indexTerms(terms);

  // `seriesId === null` is decided HERE rather than by a driver-level null filter: the two drivers
  // express "no series" differently, and the public feed must behave identically on both.
  const standaloneEvents = events.filter((event) => event.seriesId === null && event.status === "published");

  const termIdsByEvent: Record<string, string[]> =
    standaloneEvents.length > 0
      ? await repository.listTermIdsByEvent(standaloneEvents.map((event) => event.id))
      : {};

  const items: EventFeedItem[] = [];

  for (const series of seriesList) {
    items.push(...expandSeriesItems(series, exceptions, range, termById, options));
  }

  for (const event of standaloneEvents) {
    if (!isWithinRange(event.startsAt, range)) continue;
    items.push(buildEventItem({ ...event, termIds: termIdsByEvent[event.id] ?? event.termIds }, termById));
  }

  return items.sort(compareFeedItems);
}

/**
 * The feed narrowed to one filter selection (OR within a dimension, AND across dimensions). The
 * item's terms are reduced to the canonical `"<dimension>:<slug>"` keys the filter module compares.
 */
export function filterFeedItems(items: readonly EventFeedItem[], selection: EventFilterSelection): EventFeedItem[] {
  if (!hasFilterSelection(selection)) return [...items];
  return items.filter((item) =>
    matchesFilterSelection(
      item.terms.map((term) => termKey(term.dimension, term.slug)),
      selection
    )
  );
}

/**
 * The whole ACTIVE taxonomy (every dimension), in the repository's own order — the source for the
 * filter panel. Terms that are inactive are absent, so a filter can never offer a term that matches
 * nothing.
 */
export async function getFeedTaxonomy(): Promise<EventFeedTermView[]> {
  const terms = await getEventRepository().listTerms();
  return terms.map(toTermView);
}

export interface TermCount {
  term: EventFeedTermView;
  count: number;
}

/**
 * How often each term of one dimension appears in a set of items — the number rendered next to a
 * filter chip. Only terms that actually occur are returned (a chip reading "0" is noise), sorted the
 * way the vocabulary is sorted: `sortOrder`, then slug.
 */
export function countTermsByDimension(items: readonly EventFeedItem[], dimension: TaxonomyDimension): TermCount[] {
  const counts = new Map<string, TermCount>();

  for (const item of items) {
    for (const term of item.terms) {
      if (term.dimension !== dimension) continue;
      const existing = counts.get(term.id);
      if (existing) existing.count += 1;
      else counts.set(term.id, { term, count: 1 });
    }
  }

  return [...counts.values()].sort(
    (a, b) => a.term.sortOrder - b.term.sortOrder || a.term.slug.localeCompare(b.term.slug)
  );
}

// ============================================================================
// 6. Detail pages
// ============================================================================

/** Everything the series detail page needs about the series itself. */
export interface SeriesDetail {
  seriesId: string;
  slug: string;
  titleAr: string;
  titleEn: string | null;
  summaryAr: string | null;
  summaryEn: string | null;
  rule: RecurrenceRule;
  /** Series-local `HH:MM` start of every occurrence. */
  startTime: string;
  durationMinutes: number;
  venue: EventFeedTermView | null;
  terms: EventFeedTermView[];
  status: EventStatus;
}

export interface SeriesDetailResult {
  series: SeriesDetail;
  /** The next occurrences — INCLUDING cancelled ones and the vacated slots of relocated ones. */
  occurrences: EventFeedItem[];
}

function toSeriesDetail(series: EventSeriesRecord, termById: Map<string, EventFeedTermView>): SeriesDetail {
  const { venue, terms } = resolveItemTerms(series.defaultTermIds, series.defaultVenueId, termById);
  return {
    seriesId: series.id,
    slug: seriesSlug(series.id),
    titleAr: series.titleAr,
    titleEn: series.titleEn,
    summaryAr: series.summaryAr,
    summaryEn: series.summaryEn,
    rule: series.rule,
    startTime: series.startTime,
    durationMinutes: series.durationMinutes,
    venue,
    terms,
    status: series.status,
  };
}

/**
 * A series by its public slug (`series-<uuid>`) with its next dates.
 *
 * Returns null — never throws — when the slug is not a series slug, the series does not exist, or it
 * is not `published`: the page turns that into its 404 state. The occurrence window starts at the
 * current instant and reaches `SERIES_DETAIL_WINDOW_DAYS` ahead, capped at `SERIES_OCCURRENCE_LIMIT`
 * entries; cancelled occurrences and vacated slots are INCLUDED, because showing the deviation is the
 * whole point of the detail page.
 */
export async function getSeriesDetailBySlug(slug: string): Promise<SeriesDetailResult | null> {
  const seriesId = parseSeriesSlug(slug);
  if (!seriesId) return null;

  const repository = getEventRepository();
  const [series, exceptions, terms] = await Promise.all([
    repository.getSeries(seriesId),
    repository.listExceptions(seriesId),
    repository.listTerms(),
  ]);

  if (!series || series.status !== "published") return null;

  const now = new Date();
  const range: EventFeedRange = {
    from: now,
    to: new Date(now.getTime() + SERIES_DETAIL_WINDOW_DAYS * MS_PER_DAY),
  };
  const termById = indexTerms(terms);

  const occurrences = expandSeriesItems(series, exceptions, range, termById, {
    includeCancelled: true,
    includeMovedFrom: true,
  })
    .sort(compareFeedItems)
    .slice(0, SERIES_OCCURRENCE_LIMIT);

  return { series: toSeriesDetail(series, termById), occurrences };
}

/**
 * One published EVENT row by its slug — a standalone event, or an override row (see the module
 * header: the feed does not render override rows, but a direct link to one stays resolvable).
 *
 * The row IS its single occurrence: `startsAt`/`endsAt` as stored, `state: "scheduled"`. Returns null
 * unless the row exists and its status is `published`.
 *
 * `options` mirrors `getEventFeed()` so a caller can pass one options object to both readers; a row's
 * own occurrence carries no deviation to include or hide, so it currently has no effect here.
 */
export async function getPublishedEventBySlug(
  slug: string,
  options: EventFeedOptions = {}
): Promise<EventFeedItem | null> {
  const trimmed = slug.trim();
  if (trimmed.length === 0) return null;

  const repository = getEventRepository();
  const [event, terms] = await Promise.all([repository.getEventBySlug(trimmed), repository.listTerms()]);
  if (!event || event.status !== "published") return null;

  // `options` is intentionally unread for a single row: there is exactly one occurrence and it is the
  // row itself. The parameter keeps the two readers interchangeable at the call site.
  void options;

  return buildEventItem(event, indexTerms(terms));
}

// ============================================================================
// 7. The public media library (the gallery surface)
// ============================================================================

/**
 * One archived file as a PUBLIC surface may show it.
 *
 * The driver's `MediaRecord` also carries `uploadedBy`, `sizeBytes` and the `isPublic` flag; none of
 * those leaves the server. A gallery card needs a caption, a name and a link — nothing else — so the
 * public view is deliberately narrower than the record. Dropping `uploadedBy` here is what keeps a
 * staff account id out of a visitor's markup even if a page rendered every field it received.
 */
export interface PublicMediaView {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  altAr: string | null;
  altEn: string | null;
}

/**
 * The parish's PUBLIC media: every row staff marked `isPublic`.
 *
 * WHY IT LIVES IN THIS MODULE: `feed.ts` is the events module that reads the repository for public
 * surfaces (see the header), so a second public reader belongs beside the feed rather than opening a
 * second door to the store.
 *
 * `publicOnly: true` is not a display preference: the repository filters it in the QUERY, so a file
 * marked internal cannot reach a visitor even if a page forgot to filter.
 *
 * WHAT IT IS NOT: these are METADATA rows. The project stores no file bytes and hosts no image files
 * (see `src/lib/store/seed.ts`, which seeds no media on purpose), so a caller must never assume that
 * `url` resolves to a servable file — the gallery renders a link, not a picture.
 */
async function fetchPublicGalleryMedia(): Promise<PublicMediaView[]> {
  const media = await getEventRepository().listMedia({ publicOnly: true });

  return media.map((item) => ({
    id: item.id,
    filename: item.filename,
    url: item.url,
    mimeType: item.mimeType,
    altAr: item.altAr,
    altEn: item.altEn,
  }));
}

const cachedPublicGalleryMedia = typeof unstable_cache === "function"
  ? unstable_cache(fetchPublicGalleryMedia, ["public-gallery-media"], {
      tags: [REVALIDATION_TAGS.eventMedia],
      revalidate: 3600,
    })
  : fetchPublicGalleryMedia;

export async function getPublicGalleryMedia(): Promise<PublicMediaView[]> {
  try {
    return await cachedPublicGalleryMedia();
  } catch (err: any) {
    if (
      err?.message?.includes("incrementalCache missing") ||
      err?.message?.includes("Dynamic server usage")
    ) {
      return await fetchPublicGalleryMedia();
    }
    throw err;
  }
}
