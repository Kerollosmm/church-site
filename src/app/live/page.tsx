import React from "react";
import { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Video, Calendar, Clock, ExternalLink, Radio, Youtube } from "lucide-react";
import { getStreamEvents } from "@/lib/queries";
import { getYoutubeChannelUrl } from "@/lib/env";
import { getTrustedEmbedUrl } from "@/lib/security/trusted-embeds";
import { formatCairoDateTime } from "@/lib/utils/cairo-time";
import type { StreamStatusEnum } from "@/types/database.types";

export const metadata: Metadata = {
  title: "البث المباشر وصلوات القداسات والنهضات",
  description: "خدمة البث المباشر لكنيسة القديسين مكسيموس ودوماديوس والأنبا موسى الأسود بالعصافرة لمتابعة الصلوات والنهضات الروحية لحظة بلحظة.",
};

/** Arabic labels for the `stream_status_enum` values (the enum itself is never displayed). */
const STREAM_STATUS_LABELS_AR: Record<StreamStatusEnum, string> = {
  scheduled: "بث مجدول",
  live: "يُبث الآن",
  completed: "بث منتهٍ",
};

export const revalidate = 60; // 1 minute ISR for live broadcasts

export default async function LivePage() {
  const events = await getStreamEvents();
  const channelUrl = getYoutubeChannelUrl();
  const now = Date.now();

  // Archived recordings are never "live" and never "upcoming". A live row with an empty
  // `stream_url` has no approved embed yet, so it also falls through to the explicit
  // "no broadcast" state rather than rendering an empty or stand-in player.
  const liveEvent =
    events.find(
      (e) => !e.is_archived && e.status === "live" && e.stream_url.trim().length > 0
    ) ?? null;

  // `stream_url` is staff-editable data, so the value that reaches the iframe is the one the
  // allowlist returned — never the raw column. Null means the stored link is not an approved
  // YouTube/Facebook embed (see src/lib/security/trusted-embeds.ts).
  const liveEmbedUrl = liveEvent ? getTrustedEmbedUrl(liveEvent.stream_url) : null;

  // Upcoming = genuinely scheduled (not completed, not archived) and not already over,
  // soonest first.
  const upcomingEvents = events
    .filter(
      (e) =>
        !e.is_archived &&
        e.status === "scheduled" &&
        new Date(e.ends_at ?? e.starts_at).getTime() >= now
    )
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  return (
    <div className="min-h-screen bg-alabasterBg pb-16">
      <PageHero
        title="البث المباشر للصلوات والنهضات"
        englishTitle="Parish Official Live Broadcast & Service Stream"
        description="متابعة صلوات القداسات الإلهية، التسابيح، العشيات، وعظات النهضات الروحية بجودة عالية من كنيسة القديسين بالعصافرة."
        breadcrumbs={[{ label: "البث المباشر" }]}
        icon={<Video className="w-8 h-8 text-copticGold-300" />}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Stream Video Player Container */}
        <div className="bg-copticNavy-950 rounded-3xl overflow-hidden border-2 border-copticGold-400 shadow-xl">
          <div className="aspect-video w-full bg-slate-900 flex flex-col items-center justify-center relative p-6 text-center">
            {liveEmbedUrl ? (
              <iframe
                src={liveEmbedUrl}
                title={liveEvent?.title_ar ?? "البث المباشر للكنيسة"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0 absolute inset-0"
              />
            ) : (
              <div className="space-y-4 max-w-md">
                <div className="w-16 h-16 rounded-full bg-copticNavy-800 border-2 border-copticGold-400 flex items-center justify-center text-copticGold-300 mx-auto">
                  <Radio className="w-8 h-8 animate-pulse text-copticGold-400" />
                </div>
                <h3 className="font-heading font-bold text-lg sm:text-xl text-white">
                  {liveEvent ? "رابط البث الحالي غير معتمد" : "البث المباشر غير نشط حالياً"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {liveEvent
                    ? "الرابط المسجَّل لهذا البث ليس على نطاق معتمد للمشاهدة (YouTube أو Facebook)، لذلك لا يمكن تضمينه في هذه الصفحة."
                    : "يبدأ البث المباشر مع موعد القداس الإلهي القادم أو صلاة العشية والنهضة."}
                </p>
                <div>
                  {/* The parish channel is a deployment setting, never a hard-coded link. */}
                  {channelUrl ? (
                    <a
                      href={channelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-md"
                    >
                      <Youtube className="w-4 h-4" />
                      <span>الانتقال لقناة الكنيسة الرسمية على YouTube</span>
                    </a>
                  ) : (
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      لم تُضبط قناة البث الرسمية على هذا الموقع بعد، وسيظهر الرابط هنا فور اعتماده
                      من إدارة الكنيسة.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 sm:p-6 bg-copticNavy-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-200">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-bold text-white">
                {liveEvent ? liveEvent.title_ar : "بث القداسات الإلهية والنهضات الروحية"}
              </span>
            </div>
            {channelUrl && (
              <a
                href={channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-copticGold-300 hover:text-white font-bold"
              >
                <span>مشاهدة على قناة الكنيسة</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Upcoming Broadcast Calendar */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-copticGold-300 shadow-xs">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-copticGold-200">
            <Calendar className="w-5 h-5 text-copticNavy" />
            <h3 className="font-heading font-bold text-xl text-copticNavy">
              جدول البث والصلوات القادمة
            </h3>
          </div>

          <div className="space-y-4">
            {upcomingEvents.length === 0 && (
              <p className="text-xs sm:text-sm text-slateText-secondary bg-copticGold-50/70 p-4 rounded-2xl border border-copticGold-200">
                لا توجد بثوث مجدولة حالياً، وسيُعلن موعد البث القادم على هذه الصفحة وعبر القناة الرسمية للكنيسة.
              </p>
            )}

            {upcomingEvents.map((evt) => (
              <div
                key={evt.id}
                className="bg-copticGold-50/70 p-4 rounded-2xl border border-copticGold-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div>
                  <span className="inline-block text-[10px] font-bold text-copticGold-800 bg-copticGold-200/60 px-2 py-0.5 rounded-md mb-1.5">
                    {STREAM_STATUS_LABELS_AR[evt.status]}
                  </span>
                  <h4 className="font-heading font-bold text-base text-copticNavy">
                    {evt.title_ar}
                  </h4>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-copticNavy bg-white px-3 py-2 rounded-xl border border-copticGold-300 shrink-0">
                  <Clock className="w-4 h-4 text-copticGold-700" />
                  <span>{formatCairoDateTime(evt.starts_at) ?? "يُعلن قريباً"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
