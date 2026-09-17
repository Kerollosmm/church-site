// src/app/events/not-found.tsx
// The 404 for the `/events` segment.
//
// WHY IT IS BILINGUAL WITHOUT READING THE COOKIE: a `not-found` boundary may be prerendered, and the
// parish default is Arabic — so Arabic is the PRIMARY copy (looked up with `t(DEFAULT_LOCALE, …)`) and
// English is rendered as a secondary line underneath it. That way a visitor of either language gets
// the real copy, and no cookie read is needed to decide (which is what keeps this boundary out of the
// dynamic-rendering requirement).
//
// NO EMOJI, NO INVENTED COPY: every string below comes from the message dictionary, and the only link
// is the events index — the one place the visitor can actually go from here.

import React from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft } from "lucide-react";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n/messages";

export default function EventsNotFound() {
  const arabicTitle = t(DEFAULT_LOCALE, "events.notFoundTitle");
  const englishTitle = t("en", "events.notFoundTitle");

  return (
    <div className="min-h-screen bg-alabasterBg pb-16">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <section
          aria-labelledby="events-not-found-heading"
          className="space-y-4 rounded-3xl border-2 border-copticGold-200 bg-white p-6 text-center shadow-xs sm:p-10"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-copticNavy-700 text-copticGold-300">
            <CalendarDays aria-hidden="true" className="h-7 w-7" />
          </div>

          <h1 id="events-not-found-heading" className="font-heading text-2xl font-bold text-copticNavy">
            {arabicTitle}
          </h1>
          <p className="text-sm leading-relaxed text-slateText-secondary">
            {t(DEFAULT_LOCALE, "events.notFoundHint")}
          </p>

          <div className="border-t border-copticGold-100 pt-4" lang="en" dir="ltr">
            <p className="font-english text-sm font-bold text-copticNavy-700">{englishTitle}</p>
            <p className="font-english mt-1 text-xs leading-relaxed text-slateText-muted">
              {t("en", "events.notFoundHint")}
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 rounded-xl bg-copticNavy px-4 py-2 font-heading text-sm font-bold text-white transition hover:bg-copticNavy-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copticNavy-500"
            >
              <ChevronLeft aria-hidden="true" className="h-4 w-4 rotate-180" />
              <span>{t(DEFAULT_LOCALE, "events.browseAll")}</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
