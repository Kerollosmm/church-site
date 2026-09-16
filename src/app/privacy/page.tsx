// src/app/privacy/page.tsx
// `/privacy` — what the portal stores, why, and what it never stores. Arabic and English.
//
// THE ONE RULE THIS PAGE FOLLOWS: every claim is checkable against the code that writes the data.
// The five record types below are exactly the five public write paths that exist — `contact_messages`
// (contact form), `condolence_bookings` (hall booking), `program_applications` (programme enrolment),
// `job_applications` (employment applications) and `subscribers` (event notifications) — and the audit
// paragraph describes the repository's own `audit_log` contract (one entry per mutation, refusals
// recorded too). The table names are carried in the markup as `data-privacy-table` so a reviewer can
// trace a sentence back to a table without reading the prose.
//
// WHAT IS DELIBERATELY ABSENT: no confession records, no welfare or financial logs, no payment data,
// no analytics or advertising — the schema has no such tables (INV-01: the absence of the structure
// is the guarantee, not a promise). The page says so, because that absence is worth stating.
//
// CONTENT vs CHROME: this is parish policy text, so it is authored here as `{ ar, en }` pairs with
// BOTH languages REQUIRED (a missing translation is then a compile error), and rendered through
// `localized()`. The page title and introduction — interface strings — come from the dictionary.
//
// DYNAMIC: the language is the visitor's cookie, so the page renders per request like the other
// localized surfaces.

import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Phone, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { DEFAULT_LOCALE, LOCALE_DIRECTION, type Locale } from "@/lib/i18n/locales";
import { localized } from "@/lib/i18n/localized";
import { t } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

/** Policy copy in both languages — BOTH fields required, so a missing translation fails the build. */
interface Bilingual {
  ar: string;
  en: string;
}

/** One record type the portal writes, described in plain language. */
interface StoredRecord {
  /** The table the write lands in (mirrored into the markup for traceability). */
  table: string;
  name: Bilingual;
  fields: Bilingual;
  purpose: Bilingual;
}

interface PolicySection {
  id: string;
  heading: Bilingual;
  paragraphs: readonly Bilingual[];
  /** Described record types, when the section is about stored data. */
  records?: readonly StoredRecord[];
  /** Short bullet points, when the section reads as a list. */
  points?: readonly Bilingual[];
}

/** The five public write paths, in the order a visitor is most likely to meet them. */
const STORED_RECORDS: readonly StoredRecord[] = [
  {
    table: "contact_messages",
    name: { ar: "رسالة من صفحة «اتصل بنا»", en: "A message from the “Contact us” page" },
    fields: {
      ar: "الاسم، ورقم الهاتف، والبريد الإلكتروني (اختياري)، ودرجة أهمية الرسالة، ونص الرسالة، ووقت الإرسال.",
      en: "Name, phone number, e-mail address (optional), how urgent the message is, the message itself, and the time it was sent.",
    },
    purpose: {
      ar: "ليتمكن الآباء الكهنة أو السكرتارية من التواصل معك والرد على استفسارك.",
      en: "So the priests or the parish office can reach you and answer your enquiry.",
    },
  },
  {
    table: "condolence_bookings",
    name: { ar: "حجز قاعة العزاء", en: "A condolence hall booking" },
    fields: {
      ar: "اسم المتوفى، واسم مقدم الطلب وصلته بالمتوفى، ورقم الهاتف، وتاريخ العزاء والموعد والقاعة، والطلبات الخاصة إن كُتبت، وحالة الطلب ورمزه المرجعي.",
      en: "The deceased's name, the applicant's name and relationship to the deceased, a phone number, the date, slot and hall, any special requests, and the booking's status and reference code.",
    },
    purpose: {
      ar: "لتنظيم مواعيد قاعة العزاء ومنع التعارض، ولمتابعة حالة الحجز عبر الرمز المرجعي العام.",
      en: "To organise the condolence hall's dates without clashes, and to let the booking's status be followed with its public reference code.",
    },
  },
  {
    table: "program_applications",
    name: { ar: "طلب التحاق بمدرسة أو برنامج كنسي", en: "An application to a church school or programme" },
    fields: {
      ar: "البرنامج أو المرحلة المطلوبة، واسم المتقدم وتاريخ ميلاده (اختياري)، والمرحلة الدراسية (اختياري)، واسم ولي الأمر ورقم هاتفه، وأب الاعتراف (اختياري)، وملاحظات (اختياري).",
      en: "The programme or level requested, the applicant's name and date of birth (optional), school stage (optional), the guardian's name and phone number, the confession father (optional) and any notes (optional).",
    },
    purpose: {
      ar: "لتسجيل المتقدم في البرنامج ومتابعة طلبه مع المسؤولين عنه.",
      en: "To register the applicant in the programme and follow the application with those responsible for it.",
    },
  },
  {
    table: "job_applications",
    name: { ar: "طلب توظيف", en: "An employment application" },
    fields: {
      ar: "الاسم، ورقم الهاتف، والبريد الإلكتروني (اختياري)، والمهنة أو التخصص، وسنوات الخبرة (اختياري)، ورابط السيرة الذاتية (اختياري)، وملاحظات (اختياري).",
      en: "Name, phone number, e-mail address (optional), profession or speciality, years of experience (optional), a link to a CV (optional) and notes (optional).",
    },
    purpose: {
      ar: "للنظر في الطلب والتواصل مع المتقدم بشأنه.",
      en: "To review the application and contact the applicant about it.",
    },
  },
  {
    table: "subscribers",
    name: { ar: "الاشتراك في تنبيهات الفعاليات", en: "A subscription to event notifications" },
    fields: {
      ar: "البريد الإلكتروني، والاسم (اختياري)، ولغة الموقع التي كنت تقرأ بها، والتصنيفات التي اخترتها، وتاريخ التسجيل وحالة الاشتراك.",
      en: "E-mail address, name (optional), the site language you were reading in, the topics you chose, the subscription date and its status.",
    },
    purpose: {
      ar: "لإبلاغك بالمواعيد الجديدة. ولا يُرسَل أي بريد إلكتروني من الموقع اليوم: إرسال البريد غير مفعّل، والاشتراك محفوظ في سجل الكنيسة لاستخدامه عند تشغيل الخدمة. ولا تُنشر قائمة المشتركين ولا تظهر لأي زائر.",
      en: "To tell you about new dates. No e-mail is sent from the site today: delivery is not enabled, and the subscription is kept in the parish record for when it is switched on. The subscriber list is never published and is never shown to any visitor.",
    },
  },
];

const POLICY_SECTIONS: readonly PolicySection[] = [
  {
    id: "privacy-scope",
    heading: { ar: "نطاق هذه السياسة", en: "Scope of this policy" },
    paragraphs: [
      {
        ar: "هذه البوابة موقع عام لكنيسة القديسين مكسيموس ودوماديوس والشهيد الأنبا موسى الأسود بالعصافرة: كل صفحاته متاحة للزائر دون حساب ودون تسجيل دخول، ولا توجد حسابات للجمهور على الموقع إطلاقاً. الحسابات الوحيدة هي حسابات سكرتارية الكنيسة التي تُدار بها الفعاليات والمحتوى.",
        en: "This portal is the public site of the Church of Saints Maximus & Domadius and St. Moses the Black in Asafra: every page is open to visitors without an account or a sign-in, and the site has no public accounts at all. The only accounts are the parish office's, which it uses to manage events and content.",
      },
      {
        ar: "تشرح هذه الصفحة ما تجمعه البوابة من بيانات عند استخدام الاستمارات المتاحة، وكيف يُستخدم، وما لا تجمعه إطلاقاً. ولا نبيع أي بيانات ولا نشاركها لأغراض تجارية أو إعلانية.",
        en: "This page explains what the portal stores when the available forms are used, how it is used, and what is never stored at all. We never sell any data, and never share it for commercial or advertising purposes.",
      },
    ],
  },
  {
    id: "privacy-records",
    heading: { ar: "ما الذي نجمعه ولماذا", en: "What we store and why" },
    paragraphs: [
      {
        ar: "لا يُحفظ أي شيء إلا عندما ترسل استمارة من الموقع بنفسك. وفيما يلي كل أنواع السجلات التي تُكتب في هذا الموقع وحقولها الفعلية:",
        en: "Nothing is stored unless you send one of the site's forms yourself. Below is every kind of record this site writes, with the fields it actually collects:",
      },
    ],
    records: STORED_RECORDS,
  },
  {
    id: "privacy-audit",
    heading: { ar: "سجل التدقيق الداخلي", en: "The internal audit log" },
    paragraphs: [
      {
        ar: "كل تعديل على محتوى الفعاليات أو السلاسل المتكررة أو مصطلحات التصنيف أو الوسائط أو المشتركين يُسجَّل في سجل تدقيق داخلي، ويحفظ: من أجرى التعديل، ونوع الإجراء، ووقته، والحالة قبل التعديل وبعده.",
        en: "Every change to events, recurring series, taxonomy terms, media or subscribers is written to an internal audit log, which keeps who made the change, what kind of change it was, when it happened, and the state before and after it.",
      },
      {
        ar: "تُسجَّل في السجل أيضاً محاولات الطاقم المرفوضة لأن صلاحيته لا تسمح بها، دون أي تعديل فعلي. والغرض من السجل هو حماية محتوى الكنيسة ومساءلة التعديلات، ولا يُعرض لأي زائر.",
        en: "Refused staff attempts — cases where a role does not allow the action — are recorded too, with no change made. The log exists to protect the parish's content and keep changes accountable, and it is never shown to a visitor.",
      },
      {
        ar: "الكتابة العامة الوحيدة في هذا السجل هي تسجيل الاشتراك في التنبيهات، ويُكتب فيها البريد المُشترك وسطر يوضّح أن الطلب جاء من استمارة الموقع.",
        en: "The only public write in that log is a subscription to notifications, where the subscribed address is recorded along with a line stating that the request came from the site's form.",
      },
    ],
  },
  {
    id: "privacy-never",
    heading: { ar: "ما لا نجمعه إطلاقاً", en: "What we never store" },
    paragraphs: [
      {
        ar: "غياب هذه البيانات عن الموقع مقصود في تصميم البوابة نفسها، وليس وعداً يُنفَّذ يدوياً:",
        en: "These are absent from the site by design, not by a manual promise:",
      },
    ],
    points: [
      {
        ar: "لا بيانات اعترافات ولا أسرار رعوية: لا توجد جدول أو خانة لمثل هذه البيانات على الموقع.",
        en: "No confession records and no pastoral secrets: there is no table or field for such data on this site.",
      },
      {
        ar: "لا سجلات مالية أو اجتماعية داخلية للحالات الإنسانية.",
        en: "No internal financial or social-welfare case logs.",
      },
      {
        ar: "لا بيانات دفع إلكتروني: التبرعات تُعلن كحسابات بنكية رسمية فقط، ولا تجري أي عملية دفع على هذا الموقع.",
        en: "No payment data: donations are published as the parish's official bank accounts only, and no payment is ever made on this site.",
      },
      {
        ar: "لا أدوات تحليل زوار ولا تتبّع إعلاني ولا بكسلات إعلانات، ولا تُشارك بياناتك مع أي جهة لأغراض تسويقية.",
        en: "No visitor analytics, no advertising trackers and no advertising pixels, and your data is never shared with anyone for marketing.",
      },
    ],
  },
  {
    id: "privacy-cookies",
    heading: { ar: "ملفات تعريف الارتباط والفحص الأمني", en: "Cookies and the security check" },
    paragraphs: [
      {
        ar: "يُحفظ في متصفحك ملف واحد فقط: اختيار لغة الموقع (العربية أو الإنجليزية)، مدته سنة واحدة، ويُستخدم لعرض الموقع باللغة التي اخترتها. لا تُستخدم أي ملفات أخرى للتحليل أو التتبّع أو الإعلانات.",
        en: "Only one cookie is stored in your browser: your choice of site language (Arabic or English), valid for one year, used to show the site in the language you picked. No other cookie is used for analytics, tracking or advertising.",
      },
      {
        ar: "الاستمارات العامة على الموقع محمية بفحص أمني من خدمة Cloudflare Turnstile لمنع الرسائل الآلية، وهو فحص يُشغَّل عند إرسال الاستمارة فقط.",
        en: "The site's public forms are protected by a Cloudflare Turnstile security check that blocks automated submissions. It runs only while a form is being submitted.",
      },
    ],
  },
  {
    id: "privacy-minimisation",
    heading: { ar: "تقليل البيانات والاحتفاظ بها", en: "Data minimisation and retention" },
    paragraphs: [],
    points: [
      {
        ar: "لا تطلب الاستمارات إلا الحقول اللازمة لخدمة الطلب؛ والحقول المطلوبة مُعلَّمة في كل استمارة بعلامة (*)، وما عداها اختياري ويمكن تركه فارغاً.",
        en: "The forms ask only for the fields needed to serve the request; required fields are marked with (*) on every form, and every other field may be left empty.",
      },
      {
        ar: "ولا تحتوي الاستمارات على خانات لبيانات لا تخدم الطلب: فاستمارة حجز قاعة العزاء مثلاً لا تطلب الرقم القومي، مع أن سجل الكنيسة يحتمل هذا الحقل.",
        en: "The forms also carry no field for data the request does not need: the condolence hall booking form, for instance, does not ask for a national ID number, although the parish's record allows for that field.",
      },
      {
        ar: "تُحفظ البيانات لغرضها المُعلن فقط (الرد على رسالة، أو تنظيم حجز، أو متابعة طلب، أو إرسال التنبيهات)، وتحتفظ الكنيسة بسجلاتها للمدة التي تحتاجها إدارياً.",
        en: "Data is kept for its stated purpose only (answering a message, organising a booking, following an application, or sending notifications), and the parish keeps its records for as long as it administratively needs them.",
      },
      {
        ar: "المشتركون في التنبيهات لا يُحذفون تلقائياً عند إيقاف الاشتراك: يُوقف الاشتراك ويبقى السجل، حتى يظل القرار قابلاً للتراجع ولإعادة التنشيط عند الطلب.",
        en: "Notification subscribers are not deleted automatically when a subscription is stopped: it is deactivated and the record remains, so the decision stays reversible and reactivation stays possible on request.",
      },
    ],
  },
  {
    id: "privacy-rights",
    heading: { ar: "التواصل بشأن بياناتك", en: "Contacting us about your data" },
    paragraphs: [
      {
        ar: "يمكنك أن تطلب الاطلاع على بياناتك المسجَّلة، أو تصحيحها، أو حذفها، بمخاطبة سكرتارية الكنيسة، وسيتولّى الطاقم تنفيذ الطلب في سجل الكنيسة. ويُرجى ذكر اسمك ورقم الهاتف الذي استخدمته في الطلب حتى يمكن تحديد السجل المراد.",
        en: "You may ask to see the data recorded about you, to correct it, or to have it deleted, by contacting the parish office; the staff will carry the request out in the parish's record. Please mention your name and the phone number you used so the right record can be identified.",
      },
    ],
  },
  {
    id: "privacy-terms",
    heading: { ar: "شروط مختصرة للاستخدام", en: "Short terms of use" },
    paragraphs: [],
    points: [
      {
        ar: "المواعيد والبيانات المنشورة على الموقع لخدمة شعب الكنيسة، وتبقى الأولوية للإعلان الرسمي للكنيسة عند أي اختلاف.",
        en: "The dates and information published on this site serve the parish's people; where anything differs, the parish's official announcement prevails.",
      },
      {
        ar: "لا يجوز استخدام الاستمارات لإرسال بيانات كاذبة أو رسائل مسيئة، ويحق للكنيسة رفض أو إلغاء أي حجز أو طلب مخالف.",
        en: "The forms must not be used to send untrue details or abusive messages; the parish may refuse or cancel any booking or request that breaks this.",
      },
      {
        ar: "الحسابات البنكية المعلنة للتبرع هي الحسابات الرسمية على صفحة التبرعات فقط، ولا يُعتمد على أي حساب يُعلن في مكان آخر.",
        en: "The bank accounts published for donations are the official ones shown on the donations page only; no account announced anywhere else should be relied upon.",
      },
      {
        ar: "الروابط الخارجية مثل قناة البث على YouTube أو صفحة الكنيسة على Facebook تخضع لسياسات تلك المواقع، وليست تحت سيطرة الكنيسة.",
        en: "External links such as the broadcast channel on YouTube or the parish page on Facebook are governed by those sites' own policies and are not under the parish's control.",
      },
      {
        ar: "يعمل الموقع بالعربية والإنجليزية، والأحكام الخاصة بالتسجيل أو الحجز أو التبرع ليست محل اتفاق تجاري ولا جزءاً من معاملة مالية.",
        en: "The site works in Arabic and English; nothing on it forms a commercial agreement or part of a financial transaction.",
      },
    ],
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const title = t(locale, "privacy.title");
  const description = t(locale, "privacy.intro");

  return {
    title,
    description,
    openGraph: { title, description, type: "website", locale: locale === "ar" ? "ar_EG" : "en_GB" },
  };
}

export default async function PrivacyPage(): Promise<React.ReactElement> {
  let locale: Locale = DEFAULT_LOCALE;
  try {
    locale = await getLocale();
  } catch (error) {
    // Server-side detail only: the page is fully readable in the default language.
    console.error("[privacy] locale read failed", {
      reason: error instanceof Error ? error.message : String(error),
    });
  }

  return (
    <div dir={LOCALE_DIRECTION[locale]} lang={locale} data-privacy-locale={locale} className="min-h-screen bg-alabasterBg pb-16">
      <PageHero
        title={t(locale, "privacy.title")}
        englishTitle="Privacy Policy & Terms"
        description={t(locale, "privacy.intro")}
        breadcrumbs={[{ label: t(locale, "privacy.title") }]}
        icon={<ShieldCheck className="w-8 h-8 text-copticGold-300" />}
      />

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        {POLICY_SECTIONS.map((section) => (
          <section
            key={section.id}
            aria-labelledby={section.id}
            className="rounded-3xl border border-copticGold-300 bg-white p-6 shadow-xs sm:p-8"
          >
            <h2 id={section.id} className="border-b border-copticGold-200 pb-3 font-heading text-xl font-bold text-copticNavy">
              {localized(section.heading, locale)}
            </h2>

            {section.paragraphs.map((paragraph) => (
              <p key={paragraph.en} className="mt-3 text-xs leading-relaxed text-slateText-secondary sm:text-sm">
                {localized(paragraph, locale)}
              </p>
            ))}

            {section.points ? (
              <ul className="mt-4 space-y-2">
                {section.points.map((point) => (
                  <li key={point.en} className="flex items-start gap-2 text-xs leading-relaxed text-slateText-secondary sm:text-sm">
                    <span aria-hidden="true" className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-copticGold-600" />
                    <span>{localized(point, locale)}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {section.records ? (
              <dl className="mt-5 space-y-4">
                {section.records.map((record) => (
                  <div
                    key={record.table}
                    // The table each sentence describes, for anyone auditing this page against the code.
                    data-privacy-table={record.table}
                    className="rounded-2xl border border-copticGold-200 bg-alabasterBg p-4"
                  >
                    <dt className="font-heading text-sm font-bold text-copticNavy">{localized(record.name, locale)}</dt>
                    <dd className="mt-2 space-y-1.5 text-xs leading-relaxed text-slateText-secondary sm:text-sm">
                      <p>{localized(record.fields, locale)}</p>
                      <p className="text-slateText-muted">{localized(record.purpose, locale)}</p>
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </section>
        ))}

        <div className="rounded-3xl border border-copticGold-300 bg-copticGold-50/50 p-6 text-center sm:p-8">
          <p className="text-xs leading-relaxed text-slateText-secondary sm:text-sm">
            {t(locale, "privacy.intro")}
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-copticNavy px-4 py-2 font-heading text-sm font-bold text-white transition hover:bg-copticNavy-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copticNavy-500"
          >
            <Phone aria-hidden="true" className="h-4 w-4" />
            <span>{t(locale, "privacy.contactCta")}</span>
            <ChevronLeft aria-hidden="true" className="h-4 w-4 rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
}
