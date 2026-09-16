// src/components/events/EventsToolbar.tsx
// The view switch (list / month) and — in month view — the month navigator.
//
// EVERY CONTROL IS A LINK: the view and the visible month live in the query string (see
// `filters.ts`, "THE URL IS THE STATE"), so this toolbar only renders URLs. That keeps the page
// shareable and server-rendered, and it means the toolbar has no JavaScript at all.
//
// The active view is a real state, not just a colour: `aria-current="page"` tells a screen reader
// which mode the page is in, and `data-view-mode` lets the styling (and any test) select it.

import React from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, List } from "lucide-react";
import type { EventFilterSelection, EventViewMode } from "@/lib/events/filters";
import { buildEventsHref } from "@/lib/events/filters";
import { currentMonthKey, formatEventMonthLabel, shiftMonthKey } from "@/lib/events/format";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

/** The project-wide visible focus ring — one string, so every events control focuses identically. */
const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copticNavy-500";

const VIEW_LINK_BASE =
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-heading text-xs font-bold transition-colors";
const VIEW_LINK_ACTIVE = "bg-copticNavy-600 text-white";
const VIEW_LINK_INACTIVE = "text-copticNavy hover:bg-copticGold-50";

const MONTH_STEP_LINK =
  "inline-flex items-center justify-center rounded-full border border-copticGold-200 bg-white p-1.5 text-copticNavy hover:bg-copticGold-50";

export interface EventsToolbarProps {
  view: EventViewMode;
  monthKey: string;
  selection: EventFilterSelection;
  locale: Locale;
  className?: string;
}

export function EventsToolbar({
  view,
  monthKey,
  selection,
  locale,
  className,
}: EventsToolbarProps): React.ReactElement {
  const listHref = buildEventsHref({ view: "list", selection });
  const monthHref = buildEventsHref({ view: "month", month: monthKey, selection });

  // RTL convention (the same one the other pages use): "forward" points LEFT, so the previous month
  // sits to the right of the label and the next one to its left. The labels are on the links, the
  // chevrons are decorative.
  const previousHref = buildEventsHref({ view: "month", month: shiftMonthKey(monthKey, -1), selection });
  const nextHref = buildEventsHref({ view: "month", month: shiftMonthKey(monthKey, 1), selection });
  const thisMonthHref = buildEventsHref({ view: "month", month: currentMonthKey(), selection });

  return (
    <nav
      aria-label={t(locale, "events.viewLabel")}
      className={cn("flex flex-wrap items-center justify-between gap-2", className)}
    >
      <div className="inline-flex items-center gap-1 rounded-full border border-copticGold-200 bg-white p-1">
        <Link
          href={listHref}
          data-view-mode="list"
          aria-current={view === "list" ? "page" : undefined}
          className={cn(VIEW_LINK_BASE, view === "list" ? VIEW_LINK_ACTIVE : VIEW_LINK_INACTIVE, FOCUS_RING)}
        >
          <List aria-hidden="true" className="w-3.5 h-3.5" />
          <span>{t(locale, "events.viewList")}</span>
        </Link>
        <Link
          href={monthHref}
          data-view-mode="month"
          aria-current={view === "month" ? "page" : undefined}
          className={cn(VIEW_LINK_BASE, view === "month" ? VIEW_LINK_ACTIVE : VIEW_LINK_INACTIVE, FOCUS_RING)}
        >
          <CalendarDays aria-hidden="true" className="w-3.5 h-3.5" />
          <span>{t(locale, "events.viewMonth")}</span>
        </Link>
      </div>

      {view === "month" ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <Link href={previousHref} aria-label={t(locale, "events.prevMonth")} className={cn(MONTH_STEP_LINK, FOCUS_RING)}>
            <ChevronRight aria-hidden="true" className="w-4 h-4" />
          </Link>

          <span aria-live="polite" className="font-heading text-sm font-bold text-copticNavy">
            {formatEventMonthLabel(monthKey, locale)}
          </span>

          <Link href={nextHref} aria-label={t(locale, "events.nextMonth")} className={cn(MONTH_STEP_LINK, FOCUS_RING)}>
            <ChevronLeft aria-hidden="true" className="w-4 h-4" />
          </Link>

          <Link
            href={thisMonthHref}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border border-copticGold-200 bg-white px-3 py-1.5 font-heading text-xs font-bold text-copticNavy hover:bg-copticGold-50",
              FOCUS_RING
            )}
          >
            <CalendarDays aria-hidden="true" className="w-3.5 h-3.5" />
            <span>{t(locale, "events.thisMonth")}</span>
          </Link>
        </div>
      ) : null}
    </nav>
  );
}
