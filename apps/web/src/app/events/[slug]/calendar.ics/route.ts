import { PARISH_ADDRESS_AR } from "@church-site/domain";
import { getSiteUrl } from "@church-site/data-access";
import {
  SERIES_OCCURRENCE_LIMIT,
  getPublishedEventBySlug,
  getSeriesDetailBySlug,
  parseSeriesSlug,
  type EventFeedItem,
} from "@church-site/data-access";
import { buildIcsCalendar, type IcsEventInput } from "@church-site/data-access";
import type { Locale } from "@church-site/ui";
import { localized } from "@church-site/ui";
import { getLocale } from "@church-site/ui/server";

// src/app/events/[slug]/calendar.ics/route.ts
// "أضف إلى التقويم" — the `.ics` download for one event or one recurring series.
//
// DYNAMIC for the same reason as the pages it serves: the file is generated from the live store and
// localized from the visitor's cookie.
//
// WHAT IT MUST NEVER DO:
//   * return a blank or half-built download for an unknown slug — that is a real 404 (`null` body),
//   * leak a driver error, a stack trace or HTML into the body — a store failure is an empty 503,
//   * hand the visitor a cancelled date — cancelled occurrences are filtered out before the calendar
//     is built (the page shows them, the download deliberately does not: nobody wants a cancelled
//     service in their diary).
//
// UID = the feed item's `key`, which is stable per occurrence (`ics.ts` appends its own suffix), so
// re-downloading after a reschedule updates the same entry instead of duplicating it.

export const dynamic = "force-dynamic";

/**
 * The slug reduced to the ASCII subset a `Content-Disposition` filename may carry: a header value is
 * not UTF-8 safe, so the file is named after the slug — never the localized (Arabic) title.
 */
function icsFilename(slug: string): string {
  const safe = slug
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^[-_.]+|[-_.]+$/g, "");
  return `${safe.length > 0 ? safe : "event"}.ics`;
}

/** One feed item as a calendar entry, in the visitor's locale. */
function toIcsEvent(item: EventFeedItem, slug: string, locale: Locale): IcsEventInput {
  const hasSummary = (item.summaryAr ?? "").trim().length > 0 || (item.summaryEn ?? "").trim().length > 0;
  const venueName = item.venue ? localized({ ar: item.venue.nameAr, en: item.venue.nameEn }, locale).trim() : "";

  return {
    uid: item.key,
    // `localized()` keeps its contract here too: a missing translation falls back to Arabic with the
    // visible marker rather than printing an empty SUMMARY in the visitor's calendar.
    title: localized({ ar: item.titleAr, en: item.titleEn }, locale),
    description: hasSummary ? localized({ ar: item.summaryAr ?? "", en: item.summaryEn }, locale) : null,
    location: venueName.length > 0 ? `${venueName} — ${PARISH_ADDRESS_AR}` : PARISH_ADDRESS_AR,
    url: `${getSiteUrl()}/events/${slug}`,
    startsAt: item.startsAt,
    endsAt: item.endsAt,
    allDay: item.allDay,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  const { slug } = await params;

  try {
    const locale = await getLocale();
    let feedItems: EventFeedItem[];

    if (parseSeriesSlug(slug)) {
      const detail = await getSeriesDetailBySlug(slug);
      if (!detail) return new Response(null, { status: 404 });

      feedItems = detail.occurrences
        .filter((occurrence) => occurrence.state !== "cancelled")
        .slice(0, SERIES_OCCURRENCE_LIMIT);
    } else {
      const item = await getPublishedEventBySlug(slug);
      if (!item) return new Response(null, { status: 404 });
      feedItems = [item];
    }

    const calendar = buildIcsCalendar(feedItems.map((item) => toIcsEvent(item, slug, locale)));

    return new Response(calendar, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${icsFilename(slug)}"`,
        // The file is built from live data on every request; a cached copy would go stale silently.
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    // Server-side detail only — the response body stays empty, so no driver text can reach the client.
    console.error("[events] calendar feed failed", {
      slug,
      reason: error instanceof Error ? error.message : String(error),
    });
    return new Response(null, { status: 503 });
  }
}
