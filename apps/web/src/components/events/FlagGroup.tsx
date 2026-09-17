// src/components/events/FlagGroup.tsx
// An event's taxonomy terms as ONE GROUP PER DIMENSION, in the canonical dimension order — the badge
// row an event card renders.
//
// WHY GROUPS AND NOT A FLAT ROW OF CHIPS: the chips of one dimension share a meaning ("نوع الفعالية"
// vs "القطاع والخدمة"), and a screen reader hears that meaning thanks to the `<ul aria-label>` per
// group. Visually the dimension is carried by the chip treatment (see `flag-styles.ts`), so no
// visible heading is needed and the row stays compact.
//
// SERVER component: with `linkable` each chip is a `Link` built by `buildEventsHref()` — the single
// URL writer — so a browse link and the page's own filter state can never disagree.

import React from "react";
import { FlagBadge } from "@/components/events/FlagBadge";
import { DIMENSION_LABEL_KEY } from "@/components/events/flag-styles";
import type { EventFeedTermView } from "@/lib/events/feed";
import type { EventFilterSelection } from "@/lib/events/filters";
import { FILTER_DIMENSIONS, buildEventsHref } from "@/lib/events/filters";
import type { TaxonomyDimension } from "@/lib/domain/types";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

/** A selection holding exactly one term — the browse link a single chip navigates to. */
function singleTermSelection(dimension: TaxonomyDimension, slug: string): EventFilterSelection {
  const selection: EventFilterSelection = {};
  selection[dimension] = [slug];
  return selection;
}

export interface FlagGroupProps {
  terms: readonly EventFeedTermView[];
  locale: Locale;
  /** Each chip links to `/events?<dimension>=<slug>` when true. Default false. */
  linkable?: boolean;
  /** Cap the chips per dimension (0 = all). Default 0. */
  maxPerDimension?: number;
  size?: "sm" | "md";
  className?: string;
}

export function FlagGroup({
  terms,
  locale,
  linkable = false,
  maxPerDimension = 0,
  size = "sm",
  className,
}: FlagGroupProps): React.ReactElement | null {
  // An event with no terms renders nothing at all — never an empty shell with stray margins.
  if (terms.length === 0) return null;

  return (
    <div className={cn("space-y-1.5", className)}>
      {FILTER_DIMENSIONS.map((dimension) => {
        const dimensionTerms = terms.filter((term) => term.dimension === dimension);
        if (dimensionTerms.length === 0) return null;

        const cap = Number.isFinite(maxPerDimension) ? Math.max(0, Math.trunc(maxPerDimension)) : 0;
        const visibleTerms = cap > 0 ? dimensionTerms.slice(0, cap) : dimensionTerms;
        const hiddenCount = dimensionTerms.length - visibleTerms.length;

        return (
          <ul
            key={dimension}
            data-dimension={dimension}
            aria-label={t(locale, DIMENSION_LABEL_KEY[dimension])}
            className="flex flex-wrap items-center gap-1"
          >
            {visibleTerms.map((term) => (
              <li key={term.id} className="flex">
                <FlagBadge
                  term={term}
                  locale={locale}
                  size={size}
                  href={
                    linkable
                      ? buildEventsHref({ view: "list", selection: singleTermSelection(dimension, term.slug) })
                      : undefined
                  }
                />
              </li>
            ))}
            {hiddenCount > 0 ? (
              <li className="text-[11px] text-slateText-muted">
                {t(locale, "events.moreItems", { count: hiddenCount })}
              </li>
            ) : null}
          </ul>
        );
      })}
    </div>
  );
}
