// src/lib/events/filters.ts
// The public events page's filter + URL vocabulary — PURE: no I/O, no framework imports. Server and
// client components share it, so the URL a chip navigates to and the selection the page reads back
// can never drift apart.
//
// THE URL IS THE STATE. A visitor's filters live in the query string (`?view=month&type=liturgy&…`),
// which makes every view linkable, shareable and server-renderable — there is no client-side filter
// store. That is why `buildEventsHref()` here is the SINGLE writer of those links (chips, view
// toggle, month navigation, "clear all") and `parseEventFilterSelection()` the single reader.
//
// SELECTION SEMANTICS (one rule, applied in one place — `matchesFilterSelection`):
//   * within one dimension the selected terms are OR-ed  (liturgy OR meeting),
//   * across dimensions they are AND-ed                  (liturgy AND main-altar AND youth).
// An empty selection matches everything: the page shows the unfiltered feed.

import { TAXONOMY_DIMENSIONS, type TaxonomyDimension } from "@church-site/domain";
import { isValidMonthKey } from "./format";

/** How the events page renders its data. Both modes read the same occurrence feed. */
export type EventViewMode = "list" | "month";

/**
 * The visitor's active filters: dimension → the taxonomy TERM SLUGS selected in it.
 *
 * Slugs (not term ids) on purpose: they are what the URL carries, they survive a re-seed of the
 * store, and they are readable in a shared link.
 */
export type EventFilterSelection = Partial<Record<TaxonomyDimension, string[]>>;

/** The shape Next.js hands to a page's `searchParams` (a key may repeat). */
export type EventSearchParams = Record<string, string | string[] | undefined>;

/**
 * The dimensions a visitor can filter by, in the order the filter panel renders them.
 * Derived from the domain vocabulary so the order can only be changed in one place.
 */
export const FILTER_DIMENSIONS: readonly TaxonomyDimension[] = TAXONOMY_DIMENSIONS;

/**
 * Query-string parameter per dimension. `event_type` is shortened to `type` (it reads better and
 * `type` is not ambiguous on this page); every other dimension uses its own name.
 */
export const FILTER_PARAM_BY_DIMENSION: Record<TaxonomyDimension, string> = {
  event_type: "type",
  ministry: "ministry",
  audience: "audience",
  language: "language",
  venue: "venue",
  tag: "tag",
};

/** The dimension a query parameter belongs to, or null when the parameter is not a filter. */
export function dimensionFromFilterParam(param: string): TaxonomyDimension | null {
  const wanted = param.trim().toLowerCase();
  for (const dimension of FILTER_DIMENSIONS) {
    if (FILTER_PARAM_BY_DIMENSION[dimension] === wanted) return dimension;
  }
  return null;
}

/**
 * Reads the filter selection out of a page's search params.
 *
 * Accepts repeated parameters (`?type=liturgy&type=meeting`) AND comma-separated values
 * (`?type=liturgy,meeting`) — Next.js gives us whichever form the link happened to use, and a hand
 * edited URL must not behave differently. Values are trimmed, lowercased, de-duplicated and stripped
 * of empties; unknown parameters (including `view` and `month`) are ignored.
 */
export function parseEventFilterSelection(params: EventSearchParams): EventFilterSelection {
  const selection: EventFilterSelection = {};

  for (const dimension of FILTER_DIMENSIONS) {
    const raw = params[FILTER_PARAM_BY_DIMENSION[dimension]];
    if (raw === undefined) continue;

    const values = Array.isArray(raw) ? raw : [raw];
    const seen = new Set<string>();
    const slugs: string[] = [];

    for (const value of values) {
      if (typeof value !== "string") continue;
      for (const part of value.split(",")) {
        const slug = part.trim().toLowerCase();
        if (slug.length === 0 || seen.has(slug)) continue;
        seen.add(slug);
        slugs.push(slug);
      }
    }

    if (slugs.length > 0) selection[dimension] = slugs;
  }

  return selection;
}

/** True when at least one term is selected (i.e. the feed is filtered). */
export function hasFilterSelection(selection: EventFilterSelection): boolean {
  return countSelectedTerms(selection) > 0;
}

/** How many terms are selected in total — the number shown in "‎{count} مرشّح مطبَّق". */
export function countSelectedTerms(selection: EventFilterSelection): number {
  let count = 0;
  for (const dimension of FILTER_DIMENSIONS) {
    count += selection[dimension]?.length ?? 0;
  }
  return count;
}

/**
 * Adds or removes one term, returning a NEW selection (never mutating the argument — it may be a
 * value the caller is still rendering from). A dimension left with no terms is dropped from the
 * object entirely, so "is anything selected?" stays a simple emptiness check.
 */
export function toggleFilterValue(
  selection: EventFilterSelection,
  dimension: TaxonomyDimension,
  slug: string
): EventFilterSelection {
  const normalized = slug.trim().toLowerCase();
  const next: EventFilterSelection = { ...selection };
  if (normalized.length === 0) return next;

  const current = next[dimension] ?? [];
  const remaining = current.filter((value) => value !== normalized);

  if (remaining.length === current.length) {
    next[dimension] = [...remaining, normalized].sort();
  } else if (remaining.length === 0) {
    delete next[dimension];
  } else {
    next[dimension] = remaining;
  }

  return next;
}

/**
 * Builds the href for the events page: the SINGLE URL builder used by the filter chips, the list /
 * month toggle, the month navigation and "clear all filters".
 *
 * `?view=` is always present (the page has no implicit mode), `month=` only in month view and only
 * for a valid key, then one `param=slug` pair per selected term — grouped in `FILTER_DIMENSIONS`
 * order and sorted alphabetically inside a dimension. The result is deterministic, so a link can be
 * compared with another (page → chip → page) and never emits an empty or `undefined` parameter.
 */
export function buildEventsHref(options: {
  view: EventViewMode;
  month?: string | null;
  selection: EventFilterSelection;
}): string {
  const view: EventViewMode = options.view === "month" ? "month" : "list";
  const params = new URLSearchParams();
  params.set("view", view);

  const month = options.month?.trim();
  if (view === "month" && isValidMonthKey(month)) {
    params.set("month", month ?? "");
  }

  for (const dimension of FILTER_DIMENSIONS) {
    const slugs = options.selection[dimension];
    if (!slugs || slugs.length === 0) continue;

    const normalized = [...new Set(slugs.map((slug) => slug.trim().toLowerCase()))]
      .filter((slug) => slug.length > 0)
      .sort();
    for (const slug of normalized) {
      params.append(FILTER_PARAM_BY_DIMENSION[dimension], slug);
    }
  }

  return `/events?${params.toString()}`;
}

/** The canonical `"<dimension>:<slug>"` form of a taxonomy term — the feed's filter key. */
export function termKey(dimension: TaxonomyDimension, slug: string): string {
  return `${dimension}:${slug}`;
}

/**
 * Does an item carrying `termKeys` survive the selection?
 *
 * OR within a dimension, AND across dimensions; an empty selection matches everything. Term keys that
 * belong to dimensions the visitor did not filter on are simply not asked about — an item is never
 * excluded for having MORE terms than were requested.
 */
export function matchesFilterSelection(termKeys: readonly string[], selection: EventFilterSelection): boolean {
  const available = new Set(termKeys);

  for (const dimension of FILTER_DIMENSIONS) {
    const slugs = selection[dimension];
    if (!slugs || slugs.length === 0) continue;

    const matched = slugs.some((slug) => available.has(termKey(dimension, slug.trim().toLowerCase())));
    if (!matched) return false;
  }

  return true;
}
