// src/app/subscribe/page.tsx
// `/subscribe` — the public "subscribe to updates" surface.
//
// WHY A PAGE AND NOT A MODAL: the feature has to work with JavaScript disabled and be linkable from
// anywhere (the events page links here). The page is the server half: it resolves the visitor's
// language, checks whether the feature is switched on, reads the ACTIVE taxonomy through the public
// feed reader, and hands both to the client form.
//
// WHAT IS (AND IS NOT) PROMISED: the parish has **no mail provider**. The form says so in plain words
// on the page and again after a successful submit (`subscribe.deliveryOff`), and the server action
// reports what actually happened. No surface anywhere claims an e-mail was sent.
//
// DYNAMIC ON PURPOSE: the locale comes from the visitor's cookie and the topic vocabulary comes from
// the store, so the page is rendered per request. It renders no events feed, which is why it is not a
// member of `EVENT_SURFACE_PATHS` (that list exists to invalidate CACHED event surfaces).

import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { BellRing, CalendarDays, ChevronLeft } from "lucide-react";
import { SubscribeForm } from "./SubscribeForm";
import { PageHero } from "@/components/layout/PageHero";
import { isEventSubscriptionsEnabled } from "@/lib/env";
import { groupSubscribableTopics, type SubscribableTopicGroup } from "@/lib/events/subscribers";
import { DEFAULT_LOCALE, LOCALE_DIRECTION, type Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/server";
import { getFeedTaxonomy } from "@/lib/events/feed";
import { getMailer } from "@church-site/data-access";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const title = t(locale, "subscribe.title");
  const description = t(locale, "subscribe.intro");

  return {
    title,
    description,
    openGraph: { title, description, type: "website", locale: locale === "ar" ? "ar_EG" : "en_GB" },
  };
}

export default async function SubscribePage(): Promise<React.ReactElement> {
  let locale: Locale = DEFAULT_LOCALE;
  let groups: SubscribableTopicGroup[] = [];
  let vocabularyFailed = false;

  try {
    locale = await getLocale();
    // The same reader the events filters use: ACTIVE terms only, so a form can never offer a term
    // that matches nothing.
    groups = groupSubscribableTopics(await getFeedTaxonomy());
  } catch (error) {
    // Server-side detail only — the markup below carries no driver name, code or stack.
    console.error("[subscribe] vocabulary read failed", {
      reason: error instanceof Error ? error.message : String(error),
    });
    vocabularyFailed = true;
  }

  const enabled = isEventSubscriptionsEnabled();
  const mailer = await getMailer();
  const emailDeliveryEnabled = mailer.deliverEmails;

  return (
    <div dir={LOCALE_DIRECTION[locale]} lang={locale} data-subscribe-locale={locale} className="min-h-screen bg-alabasterBg pb-16">
      <PageHero
        title={t(locale, "subscribe.title")}
        description={t(locale, "subscribe.intro")}
        breadcrumbs={[{ label: t(locale, "subscribe.title") }]}
        icon={<BellRing className="w-8 h-8 text-copticGold-300" />}
      />

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {!enabled ? (
          <section
            role="status"
            data-subscribe-state="disabled"
            className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-center"
          >
            <h2 className="font-heading text-lg font-bold text-amber-900">{t(locale, "subscribe.disabledTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-amber-900/90">{t(locale, "subscribe.disabledHint")}</p>
            <Link
              href="/events"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-copticNavy px-4 py-2 font-heading text-sm font-bold text-white transition hover:bg-copticNavy-700"
            >
              <CalendarDays aria-hidden="true" className="h-4 w-4" />
              <span>{t(locale, "subscribe.backToEvents")}</span>
            </Link>
          </section>
        ) : vocabularyFailed ? (
          // The form itself is still usable without a topic list (an empty selection means "everything"),
          // but the visitor is told the topics could not be loaded instead of seeing an empty section.
          <section role="alert" data-subscribe-state="vocabulary-failed" className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6">
            <h2 className="font-heading text-lg font-bold text-amber-900">{t(locale, "events.loadFailedTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-amber-900/90">{t(locale, "events.loadFailedHint")}</p>
            <Link
              href="/subscribe"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-copticNavy px-4 py-2 font-heading text-sm font-bold text-white transition hover:bg-copticNavy-700"
            >
              <ChevronLeft aria-hidden="true" className="h-4 w-4 rotate-180" />
              <span>{t(locale, "events.reload")}</span>
            </Link>
          </section>
        ) : (
          <SubscribeForm locale={locale} groups={groups} emailDeliveryEnabled={emailDeliveryEnabled} />
        )}

        <p className="text-center text-xs leading-relaxed text-slateText-secondary">
          <Link href="/events" className="font-bold text-copticNavy underline decoration-copticGold-400 underline-offset-4">
            {t(locale, "events.title")}
          </Link>
        </p>
      </div>
    </div>
  );
}
