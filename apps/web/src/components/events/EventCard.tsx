// src/components/events/EventCard.tsx
// One feed item as a card — the unit the list view, the day groups and the detail page's occurrence
// list all render. SERVER component: no state, no effects, no handlers. Every interaction is a
// `<Link>`, so the whole events experience works with JavaScript disabled.
//
// COPY comes from the dictionary (`t()` for interface strings, `localized()` for parish content, which
// marks a missing English translation visibly instead of showing a blank field). The card states its
// deviations explicitly: a cancelled occurrence is labelled and struck through, a relocated one says
// where it went (or, on the vacated slot, where it came from).

import React from "react";
import Link from "next/link";
import { ChevronLeft, Clock, MapPin } from "lucide-react";
import { FlagGroup } from "@/components/events/FlagGroup";
import type { EventFeedItem } from "@/lib/events/feed";
import {
  formatEventDateLong,
  formatEventDayHeading,
  formatEventTimeRange,
  getZoneDateKey,
  relativeDayLabel,
} from "@/lib/events/format";
import type { Locale } from "@/lib/i18n/locales";
import { localized } from "@/lib/i18n/localized";
import { t } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

/** The project-wide visible focus ring — one string, so every events control focuses identically. */
const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copticNavy-500";

/** State pills: the same shape as the UI `Badge`, with the semantic colours the events feed needs. */
const CANCELLED_PILL =
  "inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-heading font-bold text-red-800";
const MOVED_PILL =
  "inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-heading font-bold text-amber-900";

export interface EventCardProps {
  item: EventFeedItem;
  locale: Locale;
  /** Show the day heading above the card (used by the detail page's occurrence list). Default false. */
  showDay?: boolean;
  /** Make the title a link to the detail page. Default true (false on the detail page itself). */
  linkTitle?: boolean;
  now?: Date;
  className?: string;
}

/**
 * The day heading of one item, with the "اليوم"/"غداً" pill when it applies. Exported because the
 * detail page's occurrence list wants the heading WITHOUT the full card chrome.
 */
export function EventCardDayHeading({
  item,
  locale,
  now,
  className,
}: {
  item: EventFeedItem;
  locale: Locale;
  now?: Date;
  className?: string;
}): React.ReactElement {
  const relative = relativeDayLabel(getZoneDateKey(item.startsAt), locale, now);

  return (
    <p className={cn("flex flex-wrap items-center gap-2 font-heading text-xs font-bold text-slateText-secondary", className)}>
      <span>{formatEventDayHeading(item.startsAt, locale)}</span>
      {relative ? (
        <span className="rounded-full border border-copticNavy-200 bg-copticNavy-50 px-2 py-0.5 text-[11px] font-bold text-copticNavy-700">
          {relative}
        </span>
      ) : null}
    </p>
  );
}

export function EventCard({
  item,
  locale,
  showDay = false,
  linkTitle = true,
  now,
  className,
}: EventCardProps): React.ReactElement {
  const title = localized({ ar: item.titleAr, en: item.titleEn }, locale);
  const isCancelled = item.state === "cancelled";

  // A summary is rendered only when the row actually has text; a missing translation then falls back
  // to Arabic WITH the marker (the `localized()` contract) rather than printing a bare marker.
  const hasSummary =
    (item.summaryAr ?? "").trim().length > 0 || (item.summaryEn ?? "").trim().length > 0;
  const summary = hasSummary
    ? localized({ ar: item.summaryAr ?? "", en: item.summaryEn }, locale)
    : "";

  // The engine always sets `movedToDate` on a `moved` entry; the fallback is the ruled date, so a
  // hand-edited row still renders a real date instead of "نُقلت إلى ".
  const movedToLabel =
    item.state === "moved"
      ? t(locale, "events.movedTo", {
          date: formatEventDateLong(item.movedToDate ?? item.occurrenceDate, locale),
        })
      : null;

  return (
    <article
      data-event-card
      data-event-key={item.key}
      data-event-slug={item.detailSlug}
      data-event-state={item.state}
      className={cn(
        "rounded-2xl border border-copticGold-200 bg-white p-4 shadow-xs transition-colors hover:border-copticNavy-200 motion-reduce:transition-none",
        className
      )}
    >
      {showDay ? <EventCardDayHeading item={item} locale={locale} now={now} className="mb-2" /> : null}

      {item.state === "cancelled" ? (
        <div className="mb-2">
          <span className={CANCELLED_PILL}>{t(locale, "events.cancelled")}</span>
        </div>
      ) : null}

      {item.state === "moved" && movedToLabel ? (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className={MOVED_PILL}>{t(locale, "events.moved")}</span>
          <span className="text-[11px] text-slateText-secondary">{movedToLabel}</span>
        </div>
      ) : null}

      {item.state === "scheduled" && item.movedToDate !== null ? (
        <div className="mb-2">
          <span className={MOVED_PILL}>
            {t(locale, "events.movedFrom", {
              date: formatEventDateLong(item.occurrenceDate, locale),
            })}
          </span>
        </div>
      ) : null}

      <h3
        className={cn(
          "font-heading text-base font-bold text-copticNavy sm:text-lg",
          isCancelled ? "line-through" : null
        )}
      >
        {linkTitle ? (
          <Link
            href={`/events/${item.detailSlug}`}
            className={cn("rounded-sm hover:text-copticGold-800", FOCUS_RING)}
          >
            {title}
          </Link>
        ) : (
          title
        )}
      </h3>

      {summary ? (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slateText-secondary sm:text-sm">
          {summary}
        </p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slateText-secondary">
        <span className="inline-flex items-center gap-1.5">
          <Clock aria-hidden="true" className="w-3.5 h-3.5 shrink-0 text-copticGold-700" />
          <span>
            {item.allDay ? t(locale, "events.allDay") : formatEventTimeRange(item.startsAt, item.endsAt, locale)}
          </span>
        </span>
        {item.venue ? (
          <span className="inline-flex items-center gap-1.5">
            <MapPin aria-hidden="true" className="w-3.5 h-3.5 shrink-0 text-copticGold-700" />
            <span>{localized({ ar: item.venue.nameAr, en: item.venue.nameEn }, locale)}</span>
          </span>
        ) : null}
      </div>

      <FlagGroup terms={item.terms} locale={locale} className="mt-3" />

      {linkTitle ? (
        <div className="mt-3 flex justify-end border-t border-copticGold-100 pt-2">
          <Link
            href={`/events/${item.detailSlug}`}
            className={cn(
              "inline-flex items-center gap-1 rounded-sm text-xs font-heading font-bold text-copticNavy hover:text-copticGold-800",
              FOCUS_RING
            )}
          >
            <span>{t(locale, "events.detailsLink")}</span>
            <ChevronLeft aria-hidden="true" className="w-4 h-4 text-copticGold-700" />
          </Link>
        </div>
      ) : null}
    </article>
  );
}
