// src/components/events/EventFilters.tsx
// The filter panel of the public events page: one collapsible group per taxonomy dimension, each
// holding the terms that actually occur in the current window.
//
// NO JAVASCRIPT, ON PURPOSE. Collapsing is the native `<details>`/`<summary>` element and every chip
// is a `<Link>` whose href is `toggleFilterValue()` fed through `buildEventsHref()` — the same URL
// vocabulary the page reads back. A chip click TOGGLES that one term and preserves everything else
// (the other dimensions, the view, the visible month), so filtering is composed by clicking, never by
// hand-editing the address bar.
//
// The "clear filters" action lives in the summary line and is rendered whenever anything is selected:
// the empty states point at it, so it must never be missing.

import React from "react";
import Link from "next/link";
import { FilterX } from "lucide-react";
import { FlagBadge } from "@/components/events/FlagBadge";
import { DIMENSION_ACCENT, DIMENSION_LABEL_KEY } from "@/components/events/flag-styles";
import type { TermCount } from "@/lib/events/feed";
import type { EventFilterSelection, EventViewMode } from "@/lib/events/filters";
import { FILTER_DIMENSIONS, buildEventsHref, countSelectedTerms, toggleFilterValue } from "@/lib/events/filters";
import type { TaxonomyDimension } from "@/lib/domain/types";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

/** The project-wide visible focus ring — one string, so every events control focuses identically. */
const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copticNavy-500";

export interface EventFiltersProps {
  /** Terms to offer, already limited by the caller to the ones present in the window. */
  counts: Partial<Record<TaxonomyDimension, TermCount[]>>;
  selection: EventFilterSelection;
  view: EventViewMode;
  monthKey: string;
  locale: Locale;
  className?: string;
}

export function EventFilters({
  counts,
  selection,
  view,
  monthKey,
  locale,
  className,
}: EventFiltersProps): React.ReactElement | null {
  const dimensions = FILTER_DIMENSIONS.filter((dimension) => (counts[dimension]?.length ?? 0) > 0);
  const selectedCount = countSelectedTerms(selection);

  // Nothing to offer in any dimension: the panel is not rendered at all (an empty filter shell is
  // worse than no filter shell — it looks broken).
  if (dimensions.length === 0) return null;

  return (
    <section
      aria-label={t(locale, "events.filtersLabel")}
      data-active-filters={selectedCount}
      className={cn("rounded-2xl border border-copticGold-200 bg-white p-3 sm:p-4", className)}
    >
      {selectedCount > 0 ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-copticNavy-200 bg-copticNavy-50 px-3 py-2">
          <span className="font-heading text-xs font-bold text-copticNavy-700">
            {t(locale, "events.activeFilters", { count: selectedCount })}
          </span>
          <Link
            href={buildEventsHref({ view, month: monthKey, selection: {} })}
            className={cn(
              "inline-flex items-center gap-1 rounded-full bg-copticNavy-600 px-2.5 py-1 font-heading text-xs font-bold text-white hover:bg-copticNavy-700",
              FOCUS_RING
            )}
          >
            <FilterX aria-hidden="true" className="w-3.5 h-3.5" />
            <span>{t(locale, "events.clearFilters")}</span>
          </Link>
        </div>
      ) : null}

      <div className="space-y-2">
        {dimensions.map((dimension) => {
          const dimensionCounts = counts[dimension] ?? [];

          return (
            <details
              key={dimension}
              open
              data-dimension={dimension}
              className="rounded-xl border border-copticGold-100 bg-copticGold-50/50"
            >
              <summary
                className={cn(
                  "cursor-pointer select-none px-3 py-2 font-heading text-xs font-bold",
                  DIMENSION_ACCENT[dimension],
                  FOCUS_RING
                )}
              >
                <span>{t(locale, DIMENSION_LABEL_KEY[dimension])}</span>
                <span className="ms-2 font-normal text-slateText-muted">({dimensionCounts.length})</span>
              </summary>

              <ul className="flex flex-wrap gap-1.5 px-3 pb-3 pt-1">
                {dimensionCounts.map((entry) => {
                  const active = (selection[dimension] ?? []).includes(entry.term.slug);

                  return (
                    <li key={entry.term.id} className="inline-flex items-center gap-1">
                      <FlagBadge
                        term={entry.term}
                        locale={locale}
                        active={active}
                        href={buildEventsHref({
                          view,
                          month: monthKey,
                          selection: toggleFilterValue(selection, dimension, entry.term.slug),
                        })}
                      />
                      <span className="text-[11px] text-slateText-muted">({entry.count})</span>
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}
      </div>
    </section>
  );
}
