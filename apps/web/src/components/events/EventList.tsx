// src/components/events/EventList.tsx
// The list view of the public feed: the flat, ascending occurrence list GROUPED BY DAY, each day a
// labelled `<section>` of cards.
//
// WHY GROUP BY THE CAIRO DATE and not by the raw instant: the feed is sorted by `startsAt`, but a
// visitor reads "Friday, 18 September" as one block, and an item at 00:30 Cairo belongs to that
// Cairo day even though its UTC instant sits on the previous one. `getZoneDateKey()` is the project's
// single answer to "which day is this?" — grouping by anything else would disagree with the calendar.
//
// SERVER component: a plain render, no state, no effects.

import React from "react";
import { EventCard } from "@/components/events/EventCard";
import type { EventFeedItem } from "@/lib/events/feed";
import { formatEventDayHeading, getZoneDateKey, relativeDayLabel } from "@/lib/events/format";
import type { Locale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

export interface EventListProps {
  items: readonly EventFeedItem[];
  locale: Locale;
  now?: Date;
  className?: string;
}

export function EventList({ items, locale, now, className }: EventListProps): React.ReactElement {
  // The feed is already ascending, so a single pass groups it without re-sorting (a re-sort would
  // silently drop the `key` tie-breaker the feed applies).
  const groups: { dateKey: string; items: EventFeedItem[] }[] = [];
  for (const item of items) {
    const dateKey = getZoneDateKey(item.startsAt);
    const last = groups[groups.length - 1];
    if (last && last.dateKey === dateKey) last.items.push(item);
    else groups.push({ dateKey, items: [item] });
  }

  return (
    <div className={cn("space-y-8", className)}>
      {groups.map((group) => {
        // A heading id must be unique on the page and stable across renders; the Cairo date key is
        // both. An unparsable instant (never produced by the feed) still yields a usable id.
        const headingId = `events-day-${group.dateKey || "unknown"}`;
        const relative = relativeDayLabel(group.dateKey, locale, now);

        return (
          <section key={headingId} aria-labelledby={headingId} className="space-y-3">
            <h2 id={headingId} className="flex flex-wrap items-center gap-2 font-heading text-lg font-bold text-copticNavy">
              <span>{formatEventDayHeading(group.dateKey, locale)}</span>
              {relative ? (
                <span className="rounded-full border border-copticGold-200 bg-copticGold-100 px-2.5 py-0.5 text-[11px] font-bold text-copticGold-800">
                  {relative}
                </span>
              ) : null}
            </h2>

            <div className="space-y-3">
              {group.items.map((item) => (
                <EventCard key={item.key} item={item} locale={locale} now={now} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
