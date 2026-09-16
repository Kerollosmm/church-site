// src/app/ministries/page.tsx
// The parish's ministries: one block per ACTIVE `ministry` term, each with the next dates that
// actually belong to it.
//
// WHERE THE DATA COMES FROM: the taxonomy is the vocabulary itself (`getFeedTaxonomy()`), and the
// dates are the SAME window feed the public events page renders (`listWindowRange()`), narrowed per
// term. Nothing is invented: a ministry with no dated events says so explicitly
// (`ministries.noUpcoming`) — the parish's seven activity categories legitimately have free-text
// schedules rather than dated events, and an empty block (or a fabricated date) would be a lie.
//
// DYNAMIC, like every events surface: `getLocale()` reads the cookie (which requires dynamic
// rendering) and the feed is read live so a change published in the admin is visible immediately.

import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronLeft, HeartHandshake } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { TermIcon } from "@/components/events/term-icons";
import { getEventFeed, getFeedTaxonomy, type EventFeedItem, type EventFeedTermView } from "@/lib/events/feed";
import { buildEventsHref } from "@/lib/events/filters";
import { formatEventDayHeading, formatEventTimeRange, listWindowRange } from "@/lib/events/format";
import { DEFAULT_LOCALE, LOCALE_DIRECTION, type Locale } from "@/lib/i18n/locales";
import { localized } from "@/lib/i18n/localized";
import { t } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

/** How many upcoming dates a ministry block lists before it defers to the filtered events page. */
const MINISTRY_PREVIEW_LIMIT = 3;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const title = t(locale, "ministries.title");
  const description = t(locale, "ministries.intro");

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

/** The items that carry one ministry term, in the feed's ascending order. */
function itemsForTerm(items: readonly EventFeedItem[], term: EventFeedTermView): EventFeedItem[] {
  return items.filter((item) =>
    item.terms.some((itemTerm) => itemTerm.dimension === "ministry" && itemTerm.slug === term.slug)
  );
}

export default async function MinistriesPage() {
  let locale: Locale = DEFAULT_LOCALE;
  let payload: { taxonomy: EventFeedTermView[]; items: EventFeedItem[] } | null = null;

  try {
    // The locale is read FIRST but inside the same guard as the data: a store failure must render the
    // friendly state in the visitor's language, and a locale failure must not skip the guard.
    locale = await getLocale();
    const [taxonomy, items] = await Promise.all([getFeedTaxonomy(), getEventFeed(listWindowRange())]);
    payload = { taxonomy, items };
  } catch (error) {
    // Server-side detail only — the markup below carries no error text, no stack and no driver name.
    console.error("[events] ministries feed failed", {
      reason: error instanceof Error ? error.message : String(error),
    });
  }

  const ministries = payload ? payload.taxonomy.filter((term) => term.dimension === "ministry") : [];
  const items = payload?.items ?? [];

  return (
    <div dir={LOCALE_DIRECTION[locale]} lang={locale} data-ministries-locale={locale} className="min-h-screen bg-alabasterBg pb-16">
      <PageHero
        title={t(locale, "ministries.title")}
        description={t(locale, "ministries.intro")}
        breadcrumbs={[{ label: t(locale, "ministries.title") }]}
        icon={<HeartHandshake className="w-8 h-8 text-copticGold-300" />}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {payload === null ? (
          // The page shell stays; only the results are replaced by the failure state.
          <div
            role="alert"
            data-events-state="load-failed"
            className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-center"
          >
            <h2 className="font-heading text-lg font-bold text-amber-900">{t(locale, "events.loadFailedTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-amber-900/90">{t(locale, "events.loadFailedHint")}</p>
            <Link
              href="/ministries"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-copticNavy px-4 py-2 font-heading text-sm font-bold text-white transition hover:bg-copticNavy-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copticNavy-500"
            >
              <ChevronLeft aria-hidden="true" className="w-4 h-4 rotate-180" />
              <span>{t(locale, "events.reload")}</span>
            </Link>
          </div>
        ) : ministries.length === 0 ? (
          <div className="rounded-2xl border border-copticGold-200 bg-white p-6 text-center">
            <p className="font-heading text-sm font-bold text-copticNavy">{t(locale, "events.empty")}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {ministries.map((term) => {
              const termItems = itemsForTerm(items, term);
              const preview = termItems.slice(0, MINISTRY_PREVIEW_LIMIT);
              const headingId = `ministry-${term.slug}`;

              return (
                <section
                  key={term.id}
                  data-ministry-slug={term.slug}
                  aria-labelledby={headingId}
                  className="rounded-3xl border-2 border-copticGold-200 bg-white p-5 shadow-xs sm:p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 id={headingId} className="flex items-center gap-2 font-heading text-lg font-bold text-copticNavy">
                      <TermIcon name={term.icon} className="w-5 h-5 shrink-0 text-copticGold-700" />
                      {/* `localized()` shows the Arabic name plus the visible marker when English is missing. */}
                      <span>{localized({ ar: term.nameAr, en: term.nameEn }, locale)}</span>
                    </h2>
                    <span className="rounded-full border border-copticGold-200 bg-copticGold-50 px-3 py-1 font-heading text-[11px] font-bold text-copticGold-800">
                      {t(locale, "ministries.upcomingCount", { count: termItems.length })}
                    </span>
                  </div>

                  {preview.length === 0 ? (
                    <p className="mt-3 text-sm text-slateText-secondary">{t(locale, "ministries.noUpcoming")}</p>
                  ) : (
                    <ul className="mt-4 space-y-2">
                      {preview.map((item) => (
                        <li key={item.key}>
                          <Link
                            href={`/events/${item.detailSlug}`}
                            className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-copticGold-100 bg-alabasterBg px-3 py-2 transition-colors hover:border-copticNavy-200 hover:bg-copticGold-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copticNavy-500"
                          >
                            <CalendarDays aria-hidden="true" className="w-4 h-4 shrink-0 text-copticGold-700" />
                            <span className="font-heading text-xs font-bold text-copticNavy">
                              {formatEventDayHeading(item.startsAt, locale)}
                            </span>
                            <span className="text-xs text-slateText-secondary">
                              {formatEventTimeRange(item.startsAt, item.endsAt, locale)}
                            </span>
                            <span className="min-w-0 flex-1 text-xs font-medium text-slateText-primary">
                              {localized({ ar: item.titleAr, en: item.titleEn }, locale)}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-4 border-t border-copticGold-100 pt-3">
                    <Link
                      href={buildEventsHref({ view: "list", selection: { ministry: [term.slug] } })}
                      className="inline-flex items-center gap-1 rounded-sm font-heading text-xs font-bold text-copticNavy hover:text-copticGold-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copticNavy-500"
                    >
                      <span>{t(locale, "ministries.viewEvents")}</span>
                      <ChevronLeft aria-hidden="true" className="w-4 h-4 text-copticGold-700" />
                    </Link>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
