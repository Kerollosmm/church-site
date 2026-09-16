// src/app/events/page.tsx
// The public events surface: ONE occurrence feed rendered two ways (the day-grouped list and the
// month grid), narrowed by the taxonomy filter chips.
//
// WHERE THE DATA COMES FROM: `getEventFeed()` in `src/lib/events/feed.ts` — the repository's published
// series expanded with the recurrence engine plus the published standalone events, inside a window.
// The page never touches the store, the seed or a driver: the feed is the only reader, and it hands
// back effective occurrences (cancelled and relocated slots fold away by default, which is what a
// visitor's "what is happening?" view wants — the detail page is where a deviation is shown).
//
// WHICH WINDOW: the view decides it, because the two views answer different questions.
//   * list  → `listWindowRange()`: today through `LIST_HORIZON_DAYS` (a bounded "coming up" list).
//   * month → `monthRange(monthKey)`: the Cairo month the visitor navigated to, so the calendar can
//             be walked arbitrarily far ahead — which is why the list can stay bounded.
//
// THE URL IS THE STATE (see `filters.ts`): `?view=`, `?month=` and one parameter per selected term
// are read back here and written by the shared `buildEventsHref()`. Every link on this page — chips,
// the view switch, month steps, "clear all" — is a plain `<Link>`, so the whole surface works with
// JavaScript disabled and the page has no client-side filter store.
//
// DYNAMIC ON PURPOSE: the locale comes from the visitor's cookie (`getLocale()`), and a member of
// staff publishing, cancelling or rescheduling something must be visible on the next request without
// a rebuild. Cache invalidation for this path is declared in `src/lib/store/revalidate.ts`
// (`EVENT_SURFACE_PATHS` carries "/events"), which is what the admin actions clear after a mutation.

import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronLeft, FilterX } from "lucide-react";
import { EventFilters } from "@/components/events/EventFilters";
import { EventList } from "@/components/events/EventList";
import { EventsToolbar } from "@/components/events/EventsToolbar";
import { MonthCalendar } from "@/components/events/MonthCalendar";
import { PageHero } from "@/components/layout/PageHero";
import type { TaxonomyDimension } from "@/lib/domain/types";
import {
  countTermsByDimension,
  filterFeedItems,
  getEventFeed,
  type EventFeedItem,
  type TermCount,
} from "@/lib/events/feed";
import {
  FILTER_DIMENSIONS,
  buildEventsHref,
  hasFilterSelection,
  parseEventFilterSelection,
  type EventFilterSelection,
  type EventSearchParams,
  type EventViewMode,
} from "@/lib/events/filters";
import {
  currentMonthKey,
  formatEventMonthLabel,
  isValidMonthKey,
  listWindowRange,
  monthRange,
} from "@/lib/events/format";
import { DEFAULT_LOCALE, LOCALE_DIRECTION, type Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

/** The project-wide visible focus ring — one string, so every events control focuses identically. */
const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copticNavy-500";

/** The shell every state on this page is drawn in (filters, empty states, failure). */
const PANEL = "rounded-2xl border border-copticGold-200 bg-white p-6";

const PRIMARY_LINK = `inline-flex items-center gap-1.5 rounded-xl bg-copticNavy px-4 py-2 font-heading text-sm font-bold text-white transition hover:bg-copticNavy-700 motion-reduce:transition-none ${FOCUS_RING}`;

/**
 * The first value of a query parameter that may legitimately repeat (`?type=a&type=b`). Next hands
 * back a `string[]` for those, so every non-filter read goes through here instead of assuming a
 * string.
 */
function firstParam(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === "string" ? raw.trim() : "";
}

/**
 * `?view=` is the one parameter that is not a filter (the filter module ignores it). Anything that is
 * not exactly `month` reads as the LIST: the list is the default and the mobile-primary view (see
 * `MonthCalendar`), so a hand-edited or truncated `?view=…` still lands somewhere sensible.
 */
function parseViewMode(value: string): EventViewMode {
  return value.toLowerCase() === "month" ? "month" : "list";
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const title = t(locale, "events.title");
  const description = t(locale, "events.intro");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: locale === "ar" ? "ar_EG" : "en_GB",
    },
  };
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<EventSearchParams>;
}): Promise<React.ReactElement> {
  const params = await searchParams;

  // Everything the URL carries, resolved once. The filter reader accepts both repeated and
  // comma-separated forms and ignores `view`/`month`, so a hand-edited link behaves like a built one.
  const selection: EventFilterSelection = parseEventFilterSelection(params);
  const view: EventViewMode = parseViewMode(firstParam(params.view));
  // An unusable `?month=` falls back to Cairo's current month rather than an empty calendar.
  const requestedMonth = firstParam(params.month);
  const monthKey = isValidMonthKey(requestedMonth) ? requestedMonth : currentMonthKey();

  let locale: Locale = DEFAULT_LOCALE;
  let payload: { items: EventFeedItem[]; counts: Partial<Record<TaxonomyDimension, TermCount[]>> } | null = null;

  try {
    // The locale is read FIRST but inside the same guard as the data, so a store failure still
    // renders in the visitor's language (the same shape `/ministries` uses).
    locale = await getLocale();
    const items = await getEventFeed(view === "month" ? monthRange(monthKey) : listWindowRange());

    // The chips are counted over the WINDOW (not over the filtered result): a count then says "this
    // many dates carry this term here", and toggling one chip cannot make the others read zero.
    const counts: Partial<Record<TaxonomyDimension, TermCount[]>> = {};
    for (const dimension of FILTER_DIMENSIONS) {
      counts[dimension] = countTermsByDimension(items, dimension);
    }

    payload = { items, counts };
  } catch (error) {
    // Server-side detail only — the markup below carries no error text, no stack and no driver name.
    console.error("[events] feed failed", {
      view,
      month: monthKey,
      reason: error instanceof Error ? error.message : String(error),
    });
  }

  const filtered = hasFilterSelection(selection);
  const visibleItems = payload ? filterFeedItems(payload.items, selection) : [];
  const clearHref = buildEventsHref({ view, month: monthKey, selection: {} });
  const listHref = buildEventsHref({ view: "list", selection: {} });

  /** Which state the results area is in — also the hook the styling and any test select on. */
  const state: "load-failed" | "no-match" | "empty-month" | "empty" | "results" =
    payload === null
      ? "load-failed"
      : visibleItems.length > 0
        ? "results"
        : filtered
          ? "no-match"
          : view === "month"
            ? "empty-month"
            : "empty";

  return (
    <div
      dir={LOCALE_DIRECTION[locale]}
      lang={locale}
      data-events-locale={locale}
      data-events-view={view}
      data-events-state={state}
      className="min-h-screen bg-alabasterBg pb-16"
    >
      <PageHero
        title={t(locale, "events.title")}
        description={t(locale, "events.intro")}
        breadcrumbs={[{ label: t(locale, "events.title") }]}
        icon={<CalendarDays className="w-8 h-8 text-copticGold-300" />}
      />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <EventsToolbar view={view} monthKey={monthKey} selection={selection} locale={locale} />

        {payload === null ? (
          // The page shell, the toolbar and the filters stay; only the results are replaced.
          <div
            role="alert"
            data-events-state="load-failed"
            className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-center"
          >
            <h2 className="font-heading text-lg font-bold text-amber-900">
              {t(locale, "events.loadFailedTitle")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-amber-900/90">{t(locale, "events.loadFailedHint")}</p>
            <Link href="/events" className={`mt-4 ${PRIMARY_LINK}`}>
              <ChevronLeft aria-hidden="true" className="h-4 w-4 rotate-180" />
              <span>{t(locale, "events.reload")}</span>
            </Link>
          </div>
        ) : (
          <>
            {/* The panel is rendered whenever the window offers any term; it also carries the
                "clear all filters" control, which is why it stays above every empty state. */}
            <EventFilters
              counts={payload.counts}
              selection={selection}
              view={view}
              monthKey={monthKey}
              locale={locale}
            />

            {state === "no-match" ? (
              <div data-events-state="no-match" className={PANEL + " text-center"}>
                <h2 className="font-heading text-lg font-bold text-copticNavy">
                  {t(locale, "events.noMatchTitle")}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slateText-secondary">
                  {t(locale, "events.noMatchHint")}
                </p>
                <Link href={clearHref} className={`mt-4 ${PRIMARY_LINK}`}>
                  <FilterX aria-hidden="true" className="h-4 w-4" />
                  <span>{t(locale, "events.clearFilters")}</span>
                </Link>
              </div>
            ) : state === "empty-month" ? (
              <div data-events-state="empty-month" className={PANEL + " text-center"}>
                <h2 className="font-heading text-lg font-bold text-copticNavy">
                  {t(locale, "events.emptyMonthTitle")}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slateText-secondary">
                  {t(locale, "events.emptyMonthHint")}
                </p>
                <Link href={listHref} className={`mt-4 ${PRIMARY_LINK}`}>
                  <CalendarDays aria-hidden="true" className="h-4 w-4" />
                  <span>{t(locale, "events.browseAll")}</span>
                </Link>
              </div>
            ) : state === "empty" ? (
              <div data-events-state="empty" className={PANEL + " text-center"}>
                <p className="font-heading text-sm font-bold text-copticNavy">{t(locale, "events.empty")}</p>
              </div>
            ) : view === "month" ? (
              // The month grid is a table: its caption carries the month name for a screen reader,
              // and the region repeats it as its accessible name (there is no heading to read).
              <section aria-label={formatEventMonthLabel(monthKey, locale)} data-events-region="month">
                <MonthCalendar monthKey={monthKey} locale={locale} items={visibleItems} />
              </section>
            ) : (
              // Day headings inside the list are the page's `<h2>`s, so the region is labelled by
              // `aria-label` instead of a heading that would compete with them.
              <section aria-label={t(locale, "events.upcoming")} data-events-region="list">
                <EventList items={visibleItems} locale={locale} />
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
