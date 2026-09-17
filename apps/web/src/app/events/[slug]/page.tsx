// src/app/events/[slug]/page.tsx
// One event, in full: what it is, where it is, when it happens next, and the download that puts it in
// the visitor's own calendar.
//
// TWO KINDS OF SLUG LAND HERE, and the page reads which one it got from the slug itself:
//   * `series-<uuid>` — the public slug of a recurring series (`seriesSlug()`), resolved by
//     `getSeriesDetailBySlug()`, which expands the rule with its `event_exceptions` and returns the
//     next occurrences INCLUDING cancelled dates and the slots relocated ones left behind. Showing
//     those deviations is the whole point of this page: the list and the calendar show the effective
//     set, here the visitor learns that this Friday was moved to the next one, and why.
//   * anything else — a standalone event row (`getPublishedEventBySlug()`), whose single date IS the row.
//
// A STORE FAILURE IS NOT A 404: an unpublished/unknown slug renders the segment's `not-found.tsx`
// (`notFound()`), while an unreadable store renders the failure state in the visitor's language —
// turning a temporary hiccup into "this event does not exist" would be a lie, and `notFound()` is
// thrown OUTSIDE the try/catch below so it can never be swallowed by it.
//
// DYNAMIC ON PURPOSE: the locale comes from the visitor's cookie (`getLocale()`) and a mutation made
// in the admin has to be visible on the next request, without a rebuild. This path is declared in
// `EVENT_SURFACE_PATHS` (`src/lib/store/revalidate.ts`) so an admin action clears it.
//
// `readEventDetail` is wrapped in React's `cache()`: `generateMetadata()` and the page need the same
// rows in the same request, and they must agree — one read, one answer.

import React, { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  Download,
  ExternalLink,
  MapPin,
  Navigation,
  Repeat,
} from "lucide-react";
import { EventCard } from "@/components/events/EventCard";
import { FlagGroup } from "@/components/events/FlagGroup";
import { PageHero } from "@/components/layout/PageHero";
import { PARISH_ADDRESS_AR, PARISH_NAME_AR, googleMapsDirectionsUrl } from "@/lib/constants";
import { isValidDateKey } from "@/lib/domain/recurrence";
import type { RecurrenceRule } from "@/lib/domain/types";
import {
  getPublishedEventBySlug,
  getSeriesDetailBySlug,
  parseSeriesSlug,
  type EventFeedItem,
  type EventFeedTermView,
  type SeriesDetail,
} from "@/lib/events/feed";
import { describeRecurrence, formatCairoOffsetIso } from "@/lib/events/format";
import { getSiteUrl } from "@/lib/env";
import { DEFAULT_LOCALE, LOCALE_DIRECTION, type Locale } from "@/lib/i18n/locales";
import { localized } from "@/lib/i18n/localized";
import { t } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/server";
import { wallClockToInstant } from "@/lib/utils/zone-time";

export const dynamic = "force-dynamic";

/** The project-wide visible focus ring — one string, so every events control focuses identically. */
const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copticNavy-500";

/** Every panel of this page is drawn in the same shell. */
const PANEL = "rounded-3xl border-2 border-copticGold-200 bg-white p-5 shadow-xs sm:p-6";

/** A panel heading: the icon is decorative, the text carries the section. */
const PANEL_HEADING = "flex items-center gap-2 font-heading text-base font-bold text-copticNavy";

const PRIMARY_LINK = `inline-flex items-center gap-2 rounded-xl bg-copticNavy px-4 py-2.5 font-heading text-sm font-bold text-white transition hover:bg-copticNavy-700 motion-reduce:transition-none ${FOCUS_RING}`;

/** schema.org weekday names for the JSON-LD `Schedule.byDay`, in JS day order (0 = Sunday). */
const SCHEMA_WEEKDAY_URLS: readonly string[] = [
  "https://schema.org/Sunday",
  "https://schema.org/Monday",
  "https://schema.org/Tuesday",
  "https://schema.org/Wednesday",
  "https://schema.org/Thursday",
  "https://schema.org/Friday",
  "https://schema.org/Saturday",
];

// ============================================================================
// 1. Reading the page
// ============================================================================

/** A resolved detail page: a recurring series with its next dates, or one standalone event row. */
type EventDetail =
  | { kind: "series"; series: SeriesDetail; occurrences: EventFeedItem[] }
  | { kind: "event"; item: EventFeedItem };

/**
 * The row(s) behind a slug. Returns null — never throws — when no PUBLISHED row answers to it, so the
 * caller turns that into `notFound()`. A repository failure propagates: it is not the same thing as
 * "this event does not exist".
 */
const readEventDetail = cache(async (slug: string): Promise<EventDetail | null> => {
  if (parseSeriesSlug(slug)) {
    const detail = await getSeriesDetailBySlug(slug);
    if (!detail) return null;
    return { kind: "series", series: detail.series, occurrences: detail.occurrences };
  }

  const item = await getPublishedEventBySlug(slug);
  return item ? { kind: "event", item } : null;
});

/** The localized wording of a row's content field, or "" when the row carries no text there. */
function contentText(ar: string | null, en: string | null, locale: Locale, markMissing = true): string {
  const hasText = (ar ?? "").trim().length > 0 || (en ?? "").trim().length > 0;
  if (!hasText) return "";
  return localized({ ar: ar ?? "", en }, locale, { markMissing });
}

/**
 * The row that carries the title, summary and terms — the series, or the standalone event.
 *
 * These two accessors exist (rather than reading `detail.series`/`detail.item` inline) because the
 * page resolves `detail` into a `let` inside a `try`: TypeScript narrows a discriminated union through
 * a directly-checked PARAMETER, not through an alias of a mutable variable.
 */
function detailSource(detail: EventDetail): SeriesDetail | EventFeedItem {
  return detail.kind === "series" ? detail.series : detail.item;
}

/** The dates this page lists: a series' next occurrences (deviations included), or the single row. */
function detailItems(detail: EventDetail): EventFeedItem[] {
  return detail.kind === "series" ? detail.occurrences : [detail.item];
}

// ============================================================================
// 2. JSON-LD
// ============================================================================

/**
 * A recurring rule as a schema.org `Schedule`.
 *
 * `repeatFrequency` is an ISO 8601 duration derived from the rule's own frequency and interval
 * ("P1W", "P2W", "P1M"), and `startDate` is the rule's real first date — nothing is approximated.
 * `startTime`/`endTime` are deliberately NOT emitted: a schema.org `Time` must carry the zone's
 * offset, and the times of a series are wall-clock values whose offset differs across a DST change.
 * Omitting an optional property is honest; guessing it is not. An unusable rule yields null, and the
 * caller then emits no schedule rather than a wrong one.
 */
function recurrenceSchedule(rule: RecurrenceRule): Record<string, unknown> | null {
  if (!isValidDateKey(rule.startDate)) return null;
  const interval = Number.isFinite(rule.interval) ? Math.max(1, Math.trunc(rule.interval)) : 1;

  if (rule.freq === "weekly") {
    const days = rule.byWeekday
      .filter((weekday) => Number.isInteger(weekday) && weekday >= 0 && weekday <= 6)
      .map((weekday) => SCHEMA_WEEKDAY_URLS[weekday]);
    return {
      "@type": "Schedule",
      repeatFrequency: `P${interval}W`,
      startDate: rule.startDate.trim(),
      ...(days.length > 0 ? { byDay: days.length === 1 ? days[0] : days } : {}),
    };
  }

  const monthDay = rule.byMonthDay;
  const hasMonthDay = typeof monthDay === "number" && Number.isInteger(monthDay) && monthDay >= 1 && monthDay <= 31;
  return {
    "@type": "Schedule",
    repeatFrequency: `P${interval}M`,
    startDate: rule.startDate.trim(),
    ...(hasMonthDay ? { byMonthDay: monthDay } : {}),
  };
}

/**
 * The absolute instant of the series' first occurrence as ruled: `rule.startDate` at `startTime`, read
 * in the rule's own zone. Used only when a series has no occurrence left to anchor to (every date in
 * the window cancelled) — the series still starts somewhere, and that date is a fact, not a guess.
 */
function ruleStartInstant(rule: RecurrenceRule, startTime: string): string | null {
  if (!isValidDateKey(rule.startDate)) return null;
  const time = /^(\d{2}):(\d{2})/.exec(startTime.trim());
  if (!time) return null;

  const hour = Number(time[1]);
  const minute = Number(time[2]);
  if (hour > 23 || minute > 59) return null;

  const [year, month, day] = rule.startDate.trim().split("-").map(Number);
  return wallClockToInstant({ year, month, day, hour, minute }, rule.timezone).toISOString();
}

/**
 * The `Event` node this page publishes.
 *
 * `name`/`description` are localized with `markMissing: false`: the visible `⟦ترجمة مفقودة⟧` marker
 * belongs in the page a human reads, not in machine-readable metadata, and the fallback it guards is
 * the Arabic text either way (never an empty field).
 *
 * Returns null when the start instant cannot be resolved — an `Event` without a `startDate` is invalid
 * structured data, and omitting the node is better than publishing one that cannot be trusted.
 */
function buildEventJsonLd(input: {
  name: string;
  description: string;
  url: string;
  startsAt: string | null;
  endsAt: string | null;
  state: EventFeedItem["state"];
  venueName: string | null;
  schedule: Record<string, unknown> | null;
}): Record<string, unknown> | null {
  const startDate = input.startsAt ? formatCairoOffsetIso(input.startsAt) : "";
  if (startDate.length === 0) return null;
  const endDate = input.endsAt ? formatCairoOffsetIso(input.endsAt) : "";

  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: input.name,
    url: input.url,
    startDate,
    ...(endDate.length > 0 ? { endDate } : {}),
    ...(input.description.length > 0 ? { description: input.description } : {}),
    eventStatus:
      input.state === "cancelled" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: input.venueName ?? PARISH_NAME_AR,
      address: {
        "@type": "PostalAddress",
        streetAddress: PARISH_ADDRESS_AR,
        addressCountry: "EG",
      },
    },
    organizer: { "@type": "Organization", name: PARISH_NAME_AR, url: siteUrl },
    ...(input.schedule ? { eventSchedule: input.schedule } : {}),
  };
}

// ============================================================================
// 3. Metadata
// ============================================================================

/** The reason a page must not be indexed as an event listing — used for unknown/unpublished slugs. */
function errorMetadata(locale: Locale, title: string): Metadata {
  return { title, robots: { index: false, follow: true } };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const notFoundTitle = t(locale, "events.notFoundTitle");

  let detail: EventDetail | null = null;
  try {
    detail = await readEventDetail(slug);
  } catch (error) {
    // Metadata must never take the response down: the page itself renders the failure state.
    console.error("[events] detail metadata failed", {
      slug,
      reason: error instanceof Error ? error.message : String(error),
    });
    return errorMetadata(locale, t(locale, "events.loadFailedTitle"));
  }

  if (!detail) return errorMetadata(locale, notFoundTitle);

  const source = detail.kind === "series" ? detail.series : detail.item;
  const title = contentText(source.titleAr, source.titleEn, locale, false);
  const summary = contentText(source.summaryAr, source.summaryEn, locale, false);
  const description = summary.length > 0 ? summary : t(locale, "events.intro");

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

// ============================================================================
// 4. The page
// ============================================================================

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
  const { slug } = await params;

  let locale: Locale = DEFAULT_LOCALE;
  let detail: EventDetail | null = null;
  let readFailed = false;

  try {
    // The locale is read FIRST but inside the same guard as the data: a store failure must render the
    // friendly state in the visitor's language, and a locale failure must not skip the guard.
    locale = await getLocale();
    detail = await readEventDetail(slug);
  } catch (error) {
    // Server-side detail only — the markup below carries no error text, no stack and no driver name.
    console.error("[events] detail read failed", {
      slug,
      reason: error instanceof Error ? error.message : String(error),
    });
    readFailed = true;
  }

  // Thrown OUTSIDE the catch on purpose: `notFound()` works by throwing, and swallowing it here would
  // turn every unpublished slug into the failure state instead of the 404 the visitor should get.
  if (!readFailed && !detail) notFound();

  if (readFailed || !detail) {
    return (
      <div dir={LOCALE_DIRECTION[locale]} lang={locale} className="min-h-screen bg-alabasterBg pb-16">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <div
            role="alert"
            data-events-state="load-failed"
            className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-center"
          >
            <h1 className="font-heading text-lg font-bold text-amber-900">
              {t(locale, "events.loadFailedTitle")}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-amber-900/90">
              {t(locale, "events.loadFailedHint")}
            </p>
            <Link href={`/events/${encodeURIComponent(slug)}`} className={`mt-4 ${PRIMARY_LINK}`}>
              <ChevronLeft aria-hidden="true" className="h-4 w-4 rotate-180" />
              <span>{t(locale, "events.reload")}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const now = new Date();
  const isSeries = detail.kind === "series";
  // A series and a standalone event differ in exactly three places: the next dates, the recurrence
  // rule, and whether the title carries the "recurring" note. Everything else is shared below.
  const source: SeriesDetail | EventFeedItem = detailSource(detail);
  const seriesRule: RecurrenceRule | null = detail.kind === "series" ? detail.series.rule : null;
  const seriesStartTime: string | null = detail.kind === "series" ? detail.series.startTime : null;
  const title = contentText(source.titleAr, source.titleEn, locale);
  const summary = contentText(source.summaryAr, source.summaryEn, locale);
  const venue: EventFeedTermView | null = source.venue;
  const venueName = venue ? localized({ ar: venue.nameAr, en: venue.nameEn }, locale) : PARISH_NAME_AR;
  const occurrenceItems: EventFeedItem[] = detailItems(detail);
  const primaryItem: EventFeedItem | null =
    occurrenceItems.find((item) => item.state === "scheduled") ?? occurrenceItems[0] ?? null;
  const showPastHeading = !isSeries && primaryItem !== null && Date.parse(primaryItem.startsAt) < now.getTime();

  const canonicalUrl = `${getSiteUrl()}/events/${encodeURIComponent(slug)}`;
  const icsHref = `/events/${encodeURIComponent(slug)}/calendar.ics`;
  const directionsHref = googleMapsDirectionsUrl(venue ? venue.nameAr : null);

  const jsonLd = buildEventJsonLd({
    name: contentText(source.titleAr, source.titleEn, locale, false),
    description: contentText(source.summaryAr, source.summaryEn, locale, false),
    url: canonicalUrl,
    startsAt:
      primaryItem?.startsAt ??
      (seriesRule ? ruleStartInstant(seriesRule, seriesStartTime ?? "") : null),
    endsAt: primaryItem?.endsAt ?? null,
    state: primaryItem?.state ?? "scheduled",
    venueName: venue ? venue.nameAr : null,
    schedule: seriesRule ? recurrenceSchedule(seriesRule) : null,
  });

  return (
    <div
      dir={LOCALE_DIRECTION[locale]}
      lang={locale}
      data-events-locale={locale}
      data-event-detail={slug}
      data-event-kind={isSeries ? "series" : "event"}
      className="min-h-screen bg-alabasterBg pb-16"
    >
      <PageHero
        title={title}
        // The English title is a secondary line under the Arabic one — it is shown only when the row
        // genuinely carries it, and only while Arabic is the primary title (never as a fallback).
        englishTitle={locale === "ar" ? source.titleEn?.trim() || undefined : undefined}
        description={summary || undefined}
        breadcrumbs={[{ label: t(locale, "events.title"), href: "/events" }, { label: title }]}
        icon={<CalendarDays className="w-8 h-8 text-copticGold-300" />}
      />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* The dates come first: they are what a visitor opened this page for. */}
          <div className="space-y-6 lg:col-span-2">
            <section aria-labelledby="event-occurrences-heading" className={PANEL}>
              <h2 id="event-occurrences-heading" className={PANEL_HEADING}>
                <CalendarDays aria-hidden="true" className="h-5 w-5 shrink-0 text-copticGold-700" />
                <span>
                  {t(locale, showPastHeading ? "events.past" : "events.occurrencesTitle")}
                </span>
              </h2>

              {isSeries ? (
                <p className="mt-2 text-xs leading-relaxed text-slateText-muted">
                  {t(locale, "events.recurringNote")}
                </p>
              ) : null}

              {occurrenceItems.length === 0 ? (
                <p className="mt-4 text-sm text-slateText-secondary">{t(locale, "events.upcomingEmpty")}</p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {occurrenceItems.map((item) => {
                    // The card states the deviation itself (pill + strike-through + target date); the
                    // reason staff recorded is the one thing it cannot carry, so it is rendered here.
                    // A cancelled date gets the "السبب:" prefix from the dictionary; on a relocated
                    // one the reason is plain content and needs no prefix.
                    const reason = contentText(item.reasonAr, item.reasonEn, locale, false);
                    const reasonLine =
                      reason.length === 0
                        ? null
                        : item.state === "cancelled"
                          ? t(locale, "events.cancelledReason", { reason })
                          : reason;

                    return (
                      <li key={item.key} data-occurrence-state={item.state}>
                        <EventCard
                          item={item}
                          locale={locale}
                          showDay
                          // The title must not link to the page it is already on.
                          linkTitle={false}
                          now={now}
                        />
                        {reasonLine ? (
                          <p className="mt-1.5 ps-1 text-xs leading-relaxed text-slateText-secondary">
                            {reasonLine}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          <div className="space-y-6">
            {summary.length > 0 || source.terms.length > 0 ? (
              <section aria-labelledby="event-about-heading" className={PANEL}>
                <h2 id="event-about-heading" className={PANEL_HEADING}>
                  <span>{t(locale, "events.aboutTitle")}</span>
                </h2>
                {summary.length > 0 ? (
                  <p className="mt-3 text-sm leading-relaxed text-slateText-secondary">{summary}</p>
                ) : null}
                {/* Every term the row carries, grouped by dimension — the same chips the cards and the
                    filter panel use, each linking to the matching filtered view. */}
                <FlagGroup terms={source.terms} locale={locale} linkable size="md" className="mt-4" />
              </section>
            ) : null}

            {seriesRule && seriesStartTime !== null ? (
              <section aria-labelledby="event-recurrence-heading" className={PANEL}>
                <h2 id="event-recurrence-heading" className={PANEL_HEADING}>
                  <Repeat aria-hidden="true" className="h-5 w-5 shrink-0 text-copticGold-700" />
                  <span>{t(locale, "events.recurrenceTitle")}</span>
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slateText-primary" data-recurrence-summary>
                  {describeRecurrence(seriesRule, seriesStartTime, locale)}
                </p>
              </section>
            ) : null}

            <section aria-labelledby="event-venue-heading" className={PANEL}>
              <h2 id="event-venue-heading" className={PANEL_HEADING}>
                <MapPin aria-hidden="true" className="h-5 w-5 shrink-0 text-copticGold-700" />
                <span>{t(locale, "events.venueTitle")}</span>
              </h2>
              <p className="mt-3 text-sm font-bold text-copticNavy" data-event-venue>
                {venueName}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slateText-muted">{PARISH_ADDRESS_AR}</p>
              <a
                href={directionsHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-4 inline-flex items-center gap-2 rounded-xl border border-copticGold-300 bg-copticGold-50 px-4 py-2.5 font-heading text-xs font-bold text-copticNavy transition hover:bg-copticGold-100 motion-reduce:transition-none ${FOCUS_RING}`}
              >
                <Navigation aria-hidden="true" className="h-4 w-4 text-copticGold-700" />
                <span>{t(locale, "events.directions")}</span>
                <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
              </a>
            </section>

            <section aria-label={t(locale, "events.addToCalendar")} className={PANEL}>
              {/* A plain anchor, not a `Link`: the route answers with `Content-Disposition: attachment`,
                  and a client-side navigation would try to render the file as a page. */}
              <a href={icsHref} className={PRIMARY_LINK} data-event-ics>
                <Download aria-hidden="true" className="h-4 w-4" />
                <span>{t(locale, "events.addToCalendar")}</span>
              </a>
              <p className="mt-2 text-xs leading-relaxed text-slateText-muted">
                {t(locale, "events.calendarHint")}
              </p>
            </section>

            <Link
              href="/events"
              className={`inline-flex items-center gap-1 rounded-sm font-heading text-xs font-bold text-copticNavy hover:text-copticGold-800 ${FOCUS_RING}`}
            >
              <ChevronLeft aria-hidden="true" className="h-4 w-4 rotate-180" />
              <span>{t(locale, "events.backToEvents")}</span>
            </Link>
          </div>
        </div>
      </div>

      {jsonLd ? (
        <script
          type="application/ld+json"
          // `JSON.stringify` output is injected verbatim; escaping "<" keeps a title that happens to
          // contain "</script>" from closing this element early.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      ) : null}
    </div>
  );
}
