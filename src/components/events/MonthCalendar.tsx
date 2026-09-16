// src/components/events/MonthCalendar.tsx
// The month view of the public feed: a REAL `<table>` — a calendar is a two-dimensional grid of rows
// (weeks) and columns (weekdays), which is exactly what a table models and what makes the month
// navigable with a screen reader ("row 3, column 5, Friday").
//
// THE GRID comes from `monthGrid()` (6 weeks × 7 days, Sunday-first, Cairo dates) and every cell is
// either inside the month or a real date from the neighbouring one. Spill cells render muted and
// WITHOUT items on purpose: an item belongs to its own month's grid (and to the list view), so the
// same occurrence is never shown twice on one page.
//
// SERVER component: no state, no effects — day cells are plain `<Link>`s, so the calendar works with
// JavaScript disabled.

import React from "react";
import Link from "next/link";
import type { EventFeedItem } from "@/lib/events/feed";
import {
  formatEventMonthLabel,
  formatEventTime,
  getZoneDateKey,
  monthGrid,
  weekStartDateKeys,
  type MonthGridCell,
} from "@/lib/events/format";
import type { Locale } from "@/lib/i18n/locales";
import { localized } from "@/lib/i18n/localized";
import { t } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

/** The project-wide visible focus ring — one string, so every events control focuses identically. */
const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copticNavy-500";

const DAYS_PER_WEEK = 7;

/** Items a cell lists before it collapses the rest into "و{n} مواعيد أخرى". */
const MAX_ITEMS_PER_CELL = 2;

export interface MonthCalendarProps {
  monthKey: string;
  locale: Locale;
  items: readonly EventFeedItem[];
  now?: Date;
  className?: string;
}

export function MonthCalendar({
  monthKey,
  locale,
  items,
  now,
  className,
}: MonthCalendarProps): React.ReactElement {
  const cells = monthGrid(monthKey, locale, now);
  const weekdayLabels = weekStartDateKeys(monthKey, locale);

  // One index for the whole grid: Cairo date key -> that day's items, in the feed's ascending order.
  const itemsByDateKey = new Map<string, EventFeedItem[]>();
  for (const item of items) {
    const dateKey = getZoneDateKey(item.startsAt);
    if (dateKey.length === 0) continue;
    const bucket = itemsByDateKey.get(dateKey);
    if (bucket) bucket.push(item);
    else itemsByDateKey.set(dateKey, [item]);
  }

  const weeks: MonthGridCell[][] = [];
  for (let index = 0; index < cells.length; index += DAYS_PER_WEEK) {
    weeks.push(cells.slice(index, index + DAYS_PER_WEEK));
  }

  return (
    // WHY THE HORIZONTAL SCROLL: seven day columns cannot be readable at 320px without either
    // truncating every title into nothing or shrinking the text below a legible size, so on a narrow
    // screen the table keeps its `min-w-[44rem]` and scrolls sideways inside this wrapper. The LIST
    // view — not this grid — is the mobile default (the toolbar says so), so a sideways scroll here
    // is a deliberate, contained trade-off rather than the primary way to read the calendar.
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[44rem] border-collapse border border-copticGold-200">
        <caption className="sr-only">{formatEventMonthLabel(monthKey, locale)}</caption>
        <thead>
          <tr>
            {weekdayLabels.map((label, index) => (
              <th
                key={`${label}-${index}`}
                scope="col"
                className="border border-copticGold-200 bg-copticGold-50 px-2 py-1.5 font-heading text-xs font-bold text-copticNavy"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week[0]?.dateKey ?? ""}>
              {week.map((cell) => {
                // Items are rendered ONLY inside the month: a spill cell shows the neighbouring
                // month's date (muted) but never its items — they belong to that month's own grid.
                const dayItems = cell.inMonth ? (itemsByDateKey.get(cell.dateKey) ?? []) : [];
                const visibleItems = dayItems.slice(0, MAX_ITEMS_PER_CELL);
                const extraItems = dayItems.slice(MAX_ITEMS_PER_CELL);

                return (
                  <td
                    key={cell.dateKey}
                    className={cn(
                      "border border-copticGold-200 p-1 align-top",
                      cell.inMonth ? "bg-white" : "bg-copticGold-50/60"
                    )}
                  >
                    <div
                      aria-current={cell.isToday ? "date" : undefined}
                      className={cn(
                        "mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full font-heading text-[11px] font-bold",
                        cell.inMonth ? "text-copticNavy" : "text-slateText-muted",
                        cell.isToday ? "bg-copticNavy-600 text-white" : null
                      )}
                    >
                      {cell.dayLabel}
                    </div>

                    {visibleItems.length > 0 ? (
                      <ul className="space-y-0.5">
                        {visibleItems.map((item) => (
                          <li key={item.key}>
                            <Link
                              href={`/events/${item.detailSlug}`}
                              data-calendar-item
                              data-event-key={item.key}
                              className={cn(
                                "flex items-center gap-1 rounded px-1 py-0.5 text-[11px] leading-snug hover:bg-copticNavy-50",
                                item.state === "cancelled"
                                  ? "text-slateText-muted line-through"
                                  : "text-copticNavy",
                                FOCUS_RING
                              )}
                            >
                              <span className="shrink-0 font-english text-[10px] font-bold">
                                {formatEventTime(item.startsAt, locale)}
                              </span>
                              <span className="min-w-0 truncate">
                                {localized({ ar: item.titleAr, en: item.titleEn }, locale)}
                              </span>
                            </Link>
                          </li>
                        ))}
                        {extraItems.length > 0 ? (
                          <li>
                            <Link
                              href={`/events/${extraItems[0].detailSlug}`}
                              className={cn(
                                "block rounded px-1 py-0.5 text-[11px] text-slateText-muted hover:bg-copticGold-50 hover:text-copticNavy-700",
                                FOCUS_RING
                              )}
                            >
                              {t(locale, "events.moreItems", { count: extraItems.length })}
                            </Link>
                          </li>
                        ) : null}
                      </ul>
                    ) : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
