// src/app/gallery/page.tsx
// `/gallery` — the parish's picture archive.
//
// WHAT IT SHOWS, HONESTLY: every media row staff registered with `isPublic: true`, read through
// `getPublicGalleryMedia()` (the public reader in `src/lib/events/feed.ts`, which filters internal
// rows in the query). With no registered media it renders ONE clearly-marked placeholder state that
// says the photographs will be added — it does not invent a single one.
//
// MEDIA PRESENTATION (Phase 2):
//  1. Real uploaded media files are rendered using public object URLs from Supabase storage / mock storage.
//  2. Image items render responsive, unoptimized Next.js image previews with accessible captions as alt text.
//  3. Video items render HTML5 video players with metadata preloading.
//  4. Documents and other MIME types render a clean document card with icon, filename, and MIME type.
//  5. Content Security Policy and remotePatterns allow safe loading from configured storage domains.
//
// NO GROUPING BY ALBUM: `MediaRecord` has no album/tag column, and inventing one here would mean
// classifying the parish's files by guesswork, so the grid stays flat.
//
// DYNAMIC, like the other store-backed surfaces: the language comes from a cookie and the archive is
// read live, so a file registered in the admin appears without a rebuild.

import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Images, Image as ImageIcon, ExternalLink, FileText, Video } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { getPublicGalleryMedia, type PublicMediaView } from "@/lib/events/feed";
import { DEFAULT_LOCALE, LOCALE_DIRECTION, type Locale } from "@/lib/i18n/locales";
import { localized } from "@/lib/i18n/localized";
import { t } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/server";
import { getSafeRenderableImageUrl } from "@church-site/data-access/client";

export const dynamic = "force-dynamic";


export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const title = t(locale, "gallery.title");
  const description = t(locale, "gallery.intro");

  return {
    title,
    description,
    openGraph: { title, description, type: "website", locale: locale === "ar" ? "ar_EG" : "en_GB" },
  };
}

export default async function GalleryPage(): Promise<React.ReactElement> {
  let locale: Locale = DEFAULT_LOCALE;
  let items: PublicMediaView[] | null = null;

  try {
    // The language is read FIRST but inside the same guard as the data, so a store failure still
    // renders its state in the visitor's language (the shape `/ministries` uses).
    locale = await getLocale();
    items = await getPublicGalleryMedia();
  } catch (error) {
    // Server-side detail only — the markup below carries no error text, stack or driver name.
    console.error("[gallery] media read failed", {
      reason: error instanceof Error ? error.message : String(error),
    });
  }

  const state: "load-failed" | "placeholder" | "registered" =
    items === null ? "load-failed" : items.length === 0 ? "placeholder" : "registered";

  // Narrowed once for the markup below: the failure state is the only one that has no list to draw.
  const media: PublicMediaView[] = items ?? [];

  // The marker line under each state heading is printed in the OTHER language too (the brief's
  // "الصور ستُضاف قريبًا / parish photos to be added"): a visitor who does not read the current
  // language still understands what the empty space means.
  const otherLocale: Locale = locale === "ar" ? "en" : "ar";

  return (
    <div
      dir={LOCALE_DIRECTION[locale]}
      lang={locale}
      data-gallery-locale={locale}
      data-gallery-state={state}
      className="min-h-screen bg-alabasterBg pb-16"
    >
      <PageHero
        title={t(locale, "gallery.title")}
        englishTitle="Parish Photo Gallery"
        description={t(locale, "gallery.intro")}
        breadcrumbs={[{ label: t(locale, "gallery.title") }]}
        icon={<Images className="w-8 h-8 text-copticGold-300" />}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {state === "load-failed" ? (
          <div role="alert" data-gallery-state="load-failed" className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-center">
            <h2 className="font-heading text-lg font-bold text-amber-900">{t(locale, "events.loadFailedTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-amber-900/90">{t(locale, "events.loadFailedHint")}</p>
            <Link
              href="/gallery"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-copticNavy px-4 py-2 font-heading text-sm font-bold text-white transition hover:bg-copticNavy-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copticNavy-500"
            >
              <ChevronLeft aria-hidden="true" className="w-4 h-4 rotate-180" />
              <span>{t(locale, "events.reload")}</span>
            </Link>
          </div>
        ) : state === "placeholder" ? (
          // THE REPLACEABLE PLACEHOLDER: shown only while the archive is empty, and replaced by the
          // grid below the moment the parish office registers the first public media row. Dashed
          // border + explicit badge so nobody mistakes it for a design element that failed to load.
          <section
            role="status"
            aria-labelledby="gallery-placeholder-heading"
            data-gallery-placeholder
            className="rounded-3xl border-2 border-dashed border-copticGold-400 bg-white p-8 text-center sm:p-12"
          >
            <span className="inline-block rounded-full border border-copticGold-400 bg-copticGold-50 px-3 py-1 font-heading text-[11px] font-bold text-copticGold-800">
              {t(locale, "gallery.placeholderBadge")}
            </span>

            <h2 id="gallery-placeholder-heading" className="mt-4 font-heading text-xl font-bold text-copticNavy sm:text-2xl">
              {t(locale, "gallery.placeholderTitle")}
            </h2>

            {/* The same sentence in the other language — the marker belongs to both. */}
            <p
              lang={otherLocale}
              dir={LOCALE_DIRECTION[otherLocale]}
              className={`mt-1 text-sm font-medium text-copticGold-800 ${otherLocale === "en" ? "font-english" : ""}`}
            >
              {t(otherLocale, "gallery.placeholderTitle")}
            </p>

            <p className="mx-auto mt-4 max-w-2xl text-xs leading-relaxed text-slateText-secondary sm:text-sm">
              {t(locale, "gallery.placeholderHint")}
            </p>
            <p className="mx-auto mt-2 max-w-2xl text-xs text-slateText-muted">{t(locale, "gallery.placeholderNote")}</p>
            <p className="mx-auto mt-4 max-w-2xl text-[11px] leading-relaxed text-slateText-muted">{t(locale, "gallery.previewNote")}</p>
          </section>
        ) : (
          <section aria-labelledby="gallery-heading">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 id="gallery-heading" className="font-heading text-xl font-bold text-copticNavy">
                {t(locale, "gallery.registeredTitle")}
              </h2>
              <span className="rounded-full border border-copticGold-200 bg-copticGold-50 px-3 py-1 font-heading text-[11px] font-bold text-copticGold-800">
                {t(locale, "gallery.registeredCount", { count: media.length })}
              </span>
            </div>
            <p className="mb-5 text-xs leading-relaxed text-slateText-muted">{t(locale, "gallery.previewNote")}</p>

            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {media.map((item) => {
                const hasAlt = (item.altAr ?? "").trim().length > 0 || (item.altEn ?? "").trim().length > 0;
                // The registered description IS the card's caption: it is the text a picture would
                // have carried in its `alt`, so it is rendered as text rather than hidden in a tooltip.
                const caption = hasAlt
                  ? localized({ ar: item.altAr ?? "", en: item.altEn }, locale)
                  : t(locale, "gallery.noAltText");
                const href = getSafeRenderableImageUrl(item.url);
                const isImage = item.mimeType.startsWith("image/");
                const isVideo = item.mimeType === "video/mp4";

                return (
                  <li key={item.id}>
                    <article
                      data-gallery-media={item.id}
                      className="flex h-full flex-col justify-between rounded-2xl border border-copticGold-200 bg-white p-5 shadow-xs transition-colors hover:border-copticNavy-200"
                    >
                      <div>
                        {isImage && href ? (
                          <div className="mb-4 overflow-hidden rounded-xl bg-slate-100">
                            <Image
                              src={href}
                              alt={caption}
                              width={600}
                              height={400}
                              className="h-48 w-full rounded-xl object-cover"
                              unoptimized
                            />
                          </div>
                        ) : isVideo && href ? (
                          <div className="mb-4 overflow-hidden rounded-xl bg-black">
                            <video
                              src={href}
                              controls
                              preload="metadata"
                              className="h-48 w-full rounded-xl bg-black"
                            />
                          </div>
                        ) : (
                          <div className="mb-4 flex h-48 w-full flex-col items-center justify-center rounded-xl border border-dashed border-copticGold-200 bg-copticGold-50/50 p-4 text-center">
                            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-copticGold-700 shadow-xs">
                              <FileText aria-hidden="true" className="h-6 w-6" />
                            </span>
                            <p dir="ltr" className="mt-2 line-clamp-1 max-w-full font-english text-xs font-semibold text-copticNavy">
                              {item.filename}
                            </p>
                            <span dir="ltr" className="mt-1 font-english text-[10px] font-bold text-copticGold-800">
                              {item.mimeType}
                            </span>
                          </div>
                        )}

                        <div className="mb-3 flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-copticGold-50 text-copticGold-700">
                            {isImage ? (
                              <ImageIcon aria-hidden="true" className="h-4 w-4" />
                            ) : isVideo ? (
                              <Video aria-hidden="true" className="h-4 w-4" />
                            ) : (
                              <FileText aria-hidden="true" className="h-4 w-4" />
                            )}
                          </span>
                          <span dir="ltr" className="font-english text-[11px] font-bold text-copticGold-800">
                            {item.mimeType}
                          </span>
                        </div>

                        <h3
                          className={`font-heading text-base font-bold ${
                            hasAlt ? "text-copticNavy" : "text-amber-800"
                          }`}
                        >
                          {caption}
                        </h3>

                        <p dir="ltr" className="mt-1 break-all font-english text-[11px] text-slateText-muted">
                          {item.filename}
                        </p>
                      </div>

                      <div className="mt-4 border-t border-copticGold-100 pt-3">
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-sm font-heading text-xs font-bold text-copticNavy hover:text-copticGold-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copticNavy-500"
                          >
                            <span>{t(locale, "gallery.openFile")}</span>
                            <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 text-copticGold-700" />
                          </a>
                        ) : (
                          <p className="text-[11px] text-slateText-muted">{t(locale, "gallery.unopenableUrl")}</p>
                        )}
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
