// src/app/sermons/page.tsx
// `/sermons` — the parish's sermons and recordings.
//
// THE HONEST SHAPE OF THIS PAGE, AND WHY: the parish has no sermon archive — no approved recordings,
// no transcribed homilies, no media rows of a preaching kind. Inventing a plausible-looking list
// would be the worst thing this page could do (a visitor would trust a date that never happened), so
// the archive is stated to be empty and what IS available is linked: the pages where the parish
// actually publishes prayers, readings and dates.
//
// THE LINKED RESOURCES ARE REAL ROUTES, not placeholders: `/live` (the broadcast schedule and the
// official channel when one is configured), `/bible` (the full Orthodox canon), `/masses` (the weekly
// liturgy and vespers schedule, where the readings are read) and `/events` (published parish dates).
//
// THE TYPE CHIPS ARE LIVE DATA: the `event_type` vocabulary is read from the store through
// `getFeedTaxonomy()`, and each chip is a link into the events feed filtered by that type
// (`buildEventsHref`), so this section can never offer a type the parish does not classify by.
//
// DYNAMIC, like the other localized surfaces: the language comes from a cookie and the vocabulary is
// read live. It renders no events feed, which is why it is not in `EVENT_SURFACE_PATHS`.

import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, BookOpenText, CalendarDays, ChevronLeft, Church, Mic, Radio } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { FlagBadge } from "@/components/events/FlagBadge";
import { buildEventsHref } from "@/lib/events/filters";
import { getFeedTaxonomy, type EventFeedTermView } from "@/lib/events/feed";
import { DEFAULT_LOCALE, LOCALE_DIRECTION, type Locale } from "@/lib/i18n/locales";
import { t, type MessageKey } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

/** The parish surfaces that genuinely carry the word today — every target is a route on disk. */
const RESOURCES: readonly { href: string; titleKey: MessageKey; hintKey: MessageKey; icon: React.ReactNode }[] = [
  { href: "/live", titleKey: "sermons.liveTitle", hintKey: "sermons.liveHint", icon: <Radio className="w-5 h-5" /> },
  { href: "/bible", titleKey: "sermons.bibleTitle", hintKey: "sermons.bibleHint", icon: <BookOpen className="w-5 h-5" /> },
  { href: "/masses", titleKey: "sermons.massesTitle", hintKey: "sermons.massesHint", icon: <Church className="w-5 h-5" /> },
  { href: "/events", titleKey: "sermons.eventsTitle", hintKey: "sermons.eventsHint", icon: <CalendarDays className="w-5 h-5" /> },
];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const title = t(locale, "sermons.title");
  const description = t(locale, "sermons.intro");

  return {
    title,
    description,
    openGraph: { title, description, type: "website", locale: locale === "ar" ? "ar_EG" : "en_GB" },
  };
}

export default async function SermonsPage(): Promise<React.ReactElement> {
  let locale: Locale = DEFAULT_LOCALE;
  let typeTerms: EventFeedTermView[] = [];
  let vocabularyFailed = false;

  try {
    locale = await getLocale();
    const taxonomy = await getFeedTaxonomy();
    // Only the event-type dimension is offered here: it is the parish's own classification of its
    // dates, so a chip always leads to dates that exist.
    typeTerms = taxonomy.filter((term) => term.dimension === "event_type");
  } catch (error) {
    // Server-side detail only — the markup carries no error text, stack or driver name.
    console.error("[sermons] vocabulary read failed", {
      reason: error instanceof Error ? error.message : String(error),
    });
    vocabularyFailed = true;
  }

  // The marker line under the empty state is printed in the OTHER language too, so the "no sermons
  // yet" statement is understood whichever language the visitor reads.
  const otherLocale: Locale = locale === "ar" ? "en" : "ar";

  return (
    <div
      dir={LOCALE_DIRECTION[locale]}
      lang={locale}
      data-sermons-locale={locale}
      className="min-h-screen bg-alabasterBg pb-16"
    >
      <PageHero
        title={t(locale, "sermons.title")}
        englishTitle="Sermons & Recordings"
        description={t(locale, "sermons.intro")}
        breadcrumbs={[{ label: t(locale, "sermons.title") }]}
        icon={<Mic className="w-8 h-8 text-copticGold-300" />}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* The archive state. It is stated, not implied: no sermon is listed, and none is invented. */}
        <section
          role="status"
          aria-labelledby="sermons-empty-heading"
          data-sermons-archive="empty"
          className="rounded-3xl border-2 border-dashed border-copticGold-400 bg-white p-8 text-center sm:p-10"
        >
          <span className="inline-block rounded-full border border-copticGold-400 bg-copticGold-50 px-3 py-1 font-heading text-[11px] font-bold text-copticGold-800">
            {t(locale, "sermons.emptyBadge")}
          </span>

          <h2 id="sermons-empty-heading" className="mt-4 font-heading text-xl font-bold text-copticNavy sm:text-2xl">
            {t(locale, "sermons.emptyTitle")}
          </h2>

          <p
            lang={otherLocale}
            dir={LOCALE_DIRECTION[otherLocale]}
            className={`mt-1 text-sm font-medium text-copticGold-800 ${otherLocale === "en" ? "font-english" : ""}`}
          >
            {t(otherLocale, "sermons.emptyTitle")}
          </p>

          <p className="mx-auto mt-4 max-w-2xl text-xs leading-relaxed text-slateText-secondary sm:text-sm">
            {t(locale, "sermons.emptyHint")}
          </p>
        </section>

        {/* What genuinely exists today */}
        <section aria-labelledby="sermons-resources-heading">
          <div className="mb-4">
            <h2 id="sermons-resources-heading" className="font-heading text-xl font-bold text-copticNavy">
              {t(locale, "sermons.resourcesTitle")}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slateText-secondary">{t(locale, "sermons.resourcesHint")}</p>
          </div>

          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {RESOURCES.map((resource) => (
              <li key={resource.href}>
                <Link
                  href={resource.href}
                  data-sermons-resource={resource.href}
                  className="group flex h-full flex-col justify-between rounded-3xl border-2 border-copticGold-200 bg-white p-5 shadow-xs transition hover:border-copticNavy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copticNavy-500"
                >
                  <div>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-copticNavy text-copticGold-300">
                      {resource.icon}
                    </div>
                    <h3 className="font-heading text-base font-bold text-copticNavy group-hover:text-copticGold-800">
                      {t(locale, resource.titleKey)}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-slateText-secondary">{t(locale, resource.hintKey)}</p>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 font-heading text-xs font-bold text-copticNavy">
                    <span>{t(locale, "common.openPage")}</span>
                    <ChevronLeft aria-hidden="true" className="w-4 h-4 text-copticGold-700" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* The parish's own date types, straight from the store's vocabulary */}
        {vocabularyFailed ? (
          <div role="alert" data-sermons-state="vocabulary-failed" className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-center">
            <h2 className="font-heading text-lg font-bold text-amber-900">{t(locale, "events.loadFailedTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-amber-900/90">{t(locale, "events.loadFailedHint")}</p>
            <Link
              href="/sermons"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-copticNavy px-4 py-2 font-heading text-sm font-bold text-white transition hover:bg-copticNavy-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copticNavy-500"
            >
              <ChevronLeft aria-hidden="true" className="w-4 h-4 rotate-180" />
              <span>{t(locale, "events.reload")}</span>
            </Link>
          </div>
        ) : typeTerms.length > 0 ? (
          <section
            aria-labelledby="sermons-browse-heading"
            className="rounded-3xl border border-copticGold-200 bg-white p-6 shadow-xs"
          >
            <h2 id="sermons-browse-heading" className="font-heading text-lg font-bold text-copticNavy">
              {t(locale, "sermons.browseTitle")}
            </h2>
            <p className="mt-1 text-xs text-slateText-secondary">{t(locale, "sermons.browseHint")}</p>

            <ul className="mt-4 flex flex-wrap gap-2">
              {typeTerms.map((term) => (
                <li key={term.id}>
                  <FlagBadge
                    term={term}
                    locale={locale}
                    size="md"
                    href={buildEventsHref({ view: "list", selection: { event_type: [term.slug] } })}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="text-center text-xs leading-relaxed text-slateText-secondary">
          <Link href="/about" className="inline-flex items-center gap-1 rounded-sm font-bold text-copticNavy underline decoration-copticGold-400 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copticNavy-500">
            <BookOpenText aria-hidden="true" className="w-4 h-4 text-copticGold-700" />
            <span>{t(locale, "about.title")}</span>
          </Link>
        </p>
      </div>
    </div>
  );
}
