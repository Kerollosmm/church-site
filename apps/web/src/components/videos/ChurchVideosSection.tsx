// apps/web/src/components/videos/ChurchVideosSection.tsx
// Public surface for Parish Videos (External URL Embeds).
//
// INVARIANT INV-01:
// Zero direct Supabase calls, zero-auth, zero-env build safe.
// Every public embed MUST pass through `getTrustedEmbedUrl()`.
// Never render raw unverified iframe src.

import React from "react";
import { Video, AlertCircle } from "lucide-react";
import type { PublicParishVideo, VideoProvider } from "@church-site/domain";
import { getTrustedEmbedUrl } from "@/lib/security/trusted-embeds";

export interface ChurchVideosSectionProps {
  videos: PublicParishVideo[];
  locale?: string;
}

const PROVIDER_LABELS: Record<VideoProvider, { ar: string; en: string; bg: string; text: string }> = {
  youtube: {
    ar: "يوتيوب",
    en: "YouTube",
    bg: "bg-red-100 dark:bg-red-950/40",
    text: "text-red-700 dark:text-red-300",
  },
  facebook: {
    ar: "فيسبوك",
    en: "Facebook",
    bg: "bg-blue-100 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
  },
  direct: {
    ar: "رابط مباشر",
    en: "Direct Stream",
    bg: "bg-emerald-100 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
  },
};

export function ChurchVideosSection({
  videos,
  locale = "ar",
}: ChurchVideosSectionProps): React.ReactElement {
  const isAr = locale !== "en";

  return (
    <section
      aria-labelledby="about-videos-heading"
      className="bg-white rounded-3xl p-6 sm:p-8 border border-copticGold-300 shadow-xs"
    >
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-copticGold-200">
        <Video aria-hidden="true" className="w-6 h-6 text-copticNavy" />
        <div>
          <h2 id="about-videos-heading" className="font-heading font-bold text-2xl text-copticNavy">
            {isAr ? "فيديوهات الكنيسة" : "Parish Videos"}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slateText-secondary">
            {isAr
              ? "تسجيلات القداسات، العظات، والمناسبات الكنسية المختلفة."
              : "Recordings of divine liturgies, sermons, and parish events."}
          </p>
        </div>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl bg-alabasterBg border border-dashed border-copticGold-300">
          <Video className="w-12 h-12 mx-auto text-copticGold-400 mb-3" />
          <h3 className="font-heading font-bold text-base text-copticNavy mb-1">
            {isAr ? "لا توجد فيديوهات منشورة بعد" : "No parish videos published yet"}
          </h3>
          <p className="text-xs text-slateText-secondary max-w-md mx-auto">
            {isAr
              ? "سيتم إضافة تسجيلات القداسات والكلمات الروحية قريباً."
              : "Liturgy recordings and spiritual talks will be added soon."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => {
            const trustedUrl = getTrustedEmbedUrl(video.embedUrl);
            const providerInfo = PROVIDER_LABELS[video.provider] || PROVIDER_LABELS.direct;
            const title = isAr ? video.titleAr : (video.titleEn || video.titleAr);
            const description = isAr ? video.descriptionAr : (video.descriptionEn || video.descriptionAr);

            return (
              <article
                key={video.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-copticGold-200 bg-alabasterBg shadow-xs hover:shadow-md transition-shadow"
              >
                {/* 16:9 Embed Player Container */}
                <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                  {trustedUrl ? (
                    video.provider === "direct" ? (
                      <video
                        controls
                        preload="none"
                        src={trustedUrl}
                        className="w-full h-full object-contain"
                        title={title}
                      >
                        {isAr ? "متصفحك لا يدعم تشغيل الفيديو." : "Your browser does not support video playback."}
                      </video>
                    ) : (
                      <iframe
                        src={trustedUrl}
                        title={title}
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center text-amber-300 bg-slate-900">
                      <AlertCircle className="w-8 h-8 mb-2" />
                      <p className="text-xs">
                        {isAr ? "تعذر تحميل مشغل الفيديو" : "Unable to load video player"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="flex flex-col flex-1 p-4 justify-between">
                  <div>
                    {/* Provider Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${providerInfo.bg} ${providerInfo.text}`}
                      >
                        {isAr ? providerInfo.ar : providerInfo.en}
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-base text-copticNavy line-clamp-2 mb-1">
                      {title}
                    </h3>

                    {description && (
                      <p className="text-xs text-slateText-secondary line-clamp-2 leading-relaxed">
                        {description}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
