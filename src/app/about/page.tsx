// src/app/about/page.tsx
// `/about` — the index of the "our parish" section.
//
// WHY THIS PAGE EXISTS: `/about/history`, `/about/clergy` and `/about/altars` were reachable only from
// the header dropdown; `/about` itself did not exist. This page is the introduction the section was
// missing: what the parish is, what it does, and a way into each of the three detail pages.
//
// WHERE THE CONTENT COMES FROM: the paragraphs are the parish's own copy (Arabic source + English),
// and every FIGURE is counted from the parish's own data through the public query layer — the altar
// total is `getAltars().length`, the priest total is `getClergy().length`, and so on. Nothing is
// typed as a number here, so a row added in the admin cannot make this page lie. The address and the
// Arabic name come from `src/lib/constants.ts` (their single source), never retyped.
//
// DYNAMIC, like every other localized surface: the visitor's language is a cookie (`getLocale()`), so
// the page is rendered per request rather than baked at build time. It renders no events feed, which
// is why it is not a member of `EVENT_SURFACE_PATHS`.

import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpenText,
  ChevronLeft,
  Church,
  Images,
  Info,
  MapPin,
  ScrollText,
  Users,
} from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { PARISH_ADDRESS_AR, PARISH_NAME_AR } from "@/lib/constants";
import { getActivities, getAltars, getChurchMeetings, getClergy, getClinicSpecialties, getSchoolsAcademies } from "@/lib/queries";
import { DEFAULT_LOCALE, LOCALE_DIRECTION, type Locale } from "@/lib/i18n/locales";
import { localized } from "@/lib/i18n/localized";
import { t, type MessageKey } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

/** Parish copy in both languages — BOTH fields required, so a missing translation is a build error. */
interface Bilingual {
  ar: string;
  en: string;
}

/** The parish's name in the language being read (Arabic is the constant, not a retyped string). */
const PARISH_NAME: Bilingual = {
  ar: PARISH_NAME_AR,
  en: "Church of Saints Maximus & Domadius and St. Moses the Black",
};

/** The introduction, in the parish's own words. */
const INTRO_PARAGRAPHS: readonly Bilingual[] = [
  {
    ar: `كنيسة القديسين مكسيموس ودوماديوس والشهيد الأنبا موسى الأسود إحدى كنائس إيبارشية شرق الإسكندرية بالكنيسة القبطية الأرثوذكسية، وتخدم شعب منطقة العصافرة بحري وما حولها.`,
    en: `The Church of Saints Maximus & Domadius and St. Moses the Black is one of the parishes of the Diocese of East Alexandria in the Coptic Orthodox Church, serving the people of Asafra Bahary and the surrounding area.`,
  },
  {
    ar: `تجمع الكنيسة بين الحياة الطقسية من قداسات إلهية وعشيات، والخدمة الرعوية من تربية كنسية واجتماعات ومدارس، والخدمة المجتمعية من مستوصف طبي خيري وقاعة عزاء وأنشطة متنوعة لجميع الأعمار.`,
    en: `The parish's life brings together its liturgical life of Divine Liturgies and vespers, its pastoral service of Sunday schools, meetings and church schools, and its community service of a charitable medical clinic, a condolence hall and activities for every age.`,
  },
  {
    ar: `هذه البوابة هي الموقع العام للكنيسة: مواعيد القداسات والخدمات متاحة للجميع دون أي تسجيل دخول، ولا تُنشر فيها أي بيانات اعتراف أو سجلات مالية داخلية.`,
    en: `This portal is the parish's public site: liturgy schedules and services are open to everyone with no sign-in at all, and it never publishes confession records or internal financial logs.`,
  },
];

/** The section's detail pages — each target is a route on disk (see the report's link check). */
const SUB_PAGES: readonly { href: string; titleKey: MessageKey; hintKey: MessageKey; icon: React.ReactNode }[] = [
  { href: "/about/history", titleKey: "about.historyTitle", hintKey: "about.historyHint", icon: <ScrollText className="w-5 h-5" /> },
  { href: "/about/altars", titleKey: "about.altarsTitle", hintKey: "about.altarsHint", icon: <Church className="w-5 h-5" /> },
  { href: "/about/clergy", titleKey: "about.clergyTitle", hintKey: "about.clergyHint", icon: <Users className="w-5 h-5" /> },
];

/** The two other parish-content pages that are not part of the `/about` family. */
const MORE_PAGES: readonly { href: string; titleKey: MessageKey; hintKey: MessageKey; icon: React.ReactNode }[] = [
  { href: "/gallery", titleKey: "nav.gallery", hintKey: "about.galleryHint", icon: <Images className="w-5 h-5" /> },
  { href: "/sermons", titleKey: "nav.sermons", hintKey: "about.sermonsHint", icon: <BookOpenText className="w-5 h-5" /> },
];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const title = t(locale, "about.title");
  const description = t(locale, "about.intro");

  return {
    title,
    description,
    openGraph: { title, description, type: "website", locale: locale === "ar" ? "ar_EG" : "en_GB" },
  };
}

export default async function AboutPage(): Promise<React.ReactElement> {
  let locale: Locale = DEFAULT_LOCALE;
  // Every figure on this page is COUNTED from parish data, never typed. The reads go through the
  // public query layer, whose seeded fallback keeps the page complete with no environment at all.
  let stats: { key: MessageKey; value: number }[] = [];

  try {
    locale = await getLocale();
    const [altars, clergy, specialties, meetings, activities, schools] = await Promise.all([
      getAltars(),
      getClergy(),
      getClinicSpecialties(),
      getChurchMeetings(),
      getActivities(),
      getSchoolsAcademies(),
    ]);

    const allStats: { key: MessageKey; value: number }[] = [
      { key: "about.statAltars", value: altars.length },
      { key: "about.statClergy", value: clergy.length },
      { key: "about.statClinicSpecialties", value: specialties.length },
      { key: "about.statMeetings", value: meetings.length },
      { key: "about.statActivities", value: activities.length },
      { key: "about.statSchools", value: schools.length },
    ];
    // A table that is genuinely empty must not be announced as "0" — the tile is dropped instead.
    stats = allStats.filter((stat) => stat.value > 0);
  } catch (error) {
    // Server-side detail only: the page still renders its copy, and simply omits the figures row.
    console.error("[about] parish figures failed", {
      reason: error instanceof Error ? error.message : String(error),
    });
  }

  return (
    <div dir={LOCALE_DIRECTION[locale]} lang={locale} data-about-locale={locale} className="min-h-screen bg-alabasterBg pb-16">
      <PageHero
        title={localized(PARISH_NAME, locale)}
        englishTitle={PARISH_NAME.en}
        badgeText={t(locale, "about.title")}
        description={t(locale, "about.intro")}
        breadcrumbs={[{ label: t(locale, "about.title") }]}
        icon={<Church className="w-8 h-8 text-copticGold-300" />}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Introduction + the parish facts block */}
        <section
          aria-labelledby="about-welcome-heading"
          className="bg-white rounded-3xl p-6 sm:p-10 border border-copticGold-300 shadow-xs"
        >
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-copticGold-200">
            <Info aria-hidden="true" className="w-6 h-6 text-copticNavy" />
            <h2 id="about-welcome-heading" className="font-heading font-bold text-2xl text-copticNavy">
              {t(locale, "about.welcomeTitle")}
            </h2>
          </div>

          <div className="space-y-4 text-sm sm:text-base text-slateText-secondary leading-relaxed">
            {INTRO_PARAGRAPHS.map((paragraph) => (
              <p key={paragraph.en}>{localized(paragraph, locale)}</p>
            ))}
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-copticGold-100 pt-6 sm:grid-cols-2">
            <div className="rounded-2xl bg-alabasterBg p-4 border border-copticGold-200">
              <dt className="font-heading text-xs font-bold text-copticGold-800">{t(locale, "about.addressLabel")}</dt>
              <dd className="mt-1 text-xs sm:text-sm text-slateText-primary">
                <span className="inline-flex items-start gap-1.5">
                  <MapPin aria-hidden="true" className="w-4 h-4 shrink-0 mt-0.5 text-copticGold-700" />
                  {/* The address is a single-source constant; it stays in Arabic script in both locales. */}
                  <span dir="rtl" lang="ar">
                    {PARISH_ADDRESS_AR}
                  </span>
                </span>
              </dd>
            </div>
            <div className="rounded-2xl bg-alabasterBg p-4 border border-copticGold-200">
              <dt className="font-heading text-xs font-bold text-copticGold-800">{t(locale, "about.jurisdictionLabel")}</dt>
              <dd className="mt-1 text-xs sm:text-sm text-slateText-secondary">{t(locale, "about.jurisdictionValue")}</dd>
            </div>
          </dl>
        </section>

        {/* Figures counted from the parish's own data */}
        {stats.length > 0 ? (
          <section
            aria-labelledby="about-numbers-heading"
            className="bg-white rounded-3xl p-6 sm:p-8 border border-copticGold-300 shadow-xs"
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-copticGold-200">
              <Users aria-hidden="true" className="w-6 h-6 text-copticNavy" />
              <h2 id="about-numbers-heading" className="font-heading font-bold text-2xl text-copticNavy">
                {t(locale, "about.numbersTitle")}
              </h2>
            </div>

            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.key} className="flex flex-col-reverse rounded-2xl bg-copticGold-50/70 p-4 border border-copticGold-200 text-center">
                  <dt className="font-heading text-[11px] font-bold text-copticGold-800">{t(locale, stat.key)}</dt>
                  <dd className="font-english text-2xl font-bold text-copticNavy">{stat.value}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-4 text-xs text-slateText-muted">{t(locale, "about.numbersHint")}</p>
          </section>
        ) : null}

        {/* The three detail pages of this section */}
        <section aria-labelledby="about-subpages-heading">
          <div className="mb-4">
            <h2 id="about-subpages-heading" className="font-heading font-bold text-xl text-copticNavy">
              {t(locale, "about.subpagesTitle")}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slateText-secondary">{t(locale, "about.subpagesHint")}</p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {SUB_PAGES.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                data-about-subpage={page.href}
                className="group flex flex-col justify-between rounded-3xl border-2 border-copticGold-200 bg-white p-5 shadow-xs transition hover:border-copticNavy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copticNavy-500"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-copticNavy text-copticGold-300 flex items-center justify-center mb-3">
                    {page.icon}
                  </div>
                  <h3 className="font-heading font-bold text-base text-copticNavy group-hover:text-copticGold-800">
                    {t(locale, page.titleKey)}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slateText-secondary">{t(locale, page.hintKey)}</p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 font-heading text-xs font-bold text-copticNavy">
                  <span>{t(locale, "common.openPage")}</span>
                  <ChevronLeft aria-hidden="true" className="w-4 h-4 text-copticGold-700" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Other parish-content pages, so nothing in this family is a dead end */}
        <section aria-labelledby="about-more-heading" className="bg-white rounded-3xl p-6 sm:p-8 border border-copticGold-300 shadow-xs">
          <h2 id="about-more-heading" className="font-heading font-bold text-lg text-copticNavy">
            {t(locale, "about.moreTitle")}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slateText-secondary">{t(locale, "about.moreHint")}</p>

          <ul className="mt-4 space-y-3">
            {MORE_PAGES.map((page) => (
              <li key={page.href}>
                <Link
                  href={page.href}
                  data-about-more={page.href}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-copticGold-100 bg-alabasterBg px-4 py-3 transition-colors hover:border-copticNavy-200 hover:bg-copticGold-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copticNavy-500"
                >
                  <span className="w-8 h-8 rounded-lg bg-copticNavy text-copticGold-300 flex items-center justify-center shrink-0">
                    {page.icon}
                  </span>
                  <span className="font-heading text-sm font-bold text-copticNavy">{t(locale, page.titleKey)}</span>
                  <span className="min-w-0 flex-1 text-xs text-slateText-secondary">{t(locale, page.hintKey)}</span>
                  <ChevronLeft aria-hidden="true" className="w-4 h-4 shrink-0 text-copticGold-700" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
