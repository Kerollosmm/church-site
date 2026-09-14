import React from "react";
import { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Video, Calendar, Clock, ExternalLink, Radio, Youtube } from "lucide-react";
import { getStreamEvents } from "@/lib/queries";

export const metadata: Metadata = {
  title: "البث المباشر وصلوات القداسات والنهضات",
  description: "خدمة البث المباشر لكنيسة القديسين مكسيموس ودوماديوس والأنبا موسى الأسود بالعصافرة لمتابعة الصلوات والنهضات الروحية لحظة بلحظة.",
};

export const revalidate = 60; // 1 minute ISR for live broadcasts

export default async function LivePage() {
  const events = await getStreamEvents();
  const currentLive = events.find((e) => e.status === "live");
  const upcomingEvents = events.filter((e) => e.status !== "live");

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
            {currentLive ? (
              <iframe
                src={currentLive.stream_url}
                title={currentLive.title_ar}
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
                  البث المباشر غير نشط حالياً
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  يبدأ البث المباشر مع موعد القداس الإلهي القادم أو صلاة العشية والنهضة. يمكنك متابعة البث عبر القناة الرسمية على يوتيوب.
                </p>
                <div>
                  <a
                    href="https://www.youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-md"
                  >
                    <Youtube className="w-4 h-4" />
                    <span>الانتقال لقناة الكنيسة الرسمية على YouTube</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 sm:p-6 bg-copticNavy-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-200">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-bold text-white">
                {currentLive ? currentLive.title_ar : "القناة الرسمية المعتمدة لكنيسة القديسين بالعصافرة"}
              </span>
            </div>
            <a
              href="https://www.youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-copticGold-300 hover:text-white font-bold"
            >
              <span>مشاهدة على تطبيق YouTube</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
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
            {upcomingEvents.map((evt) => (
              <div
                key={evt.id}
                className="bg-copticGold-50/70 p-4 rounded-2xl border border-copticGold-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div>
                  <span className="inline-block text-[10px] font-bold text-copticGold-800 bg-copticGold-200/60 px-2 py-0.5 rounded-md mb-1.5 font-english">
                    {evt.status}
                  </span>
                  <h4 className="font-heading font-bold text-base text-copticNavy">
                    {evt.title_ar}
                  </h4>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-copticNavy bg-white px-3 py-2 rounded-xl border border-copticGold-300 shrink-0">
                  <Clock className="w-4 h-4 text-copticGold-700" />
                  <span dir="ltr" className="font-english">
                    {evt.starts_at?.replace("T", " ").slice(0, 16) || "قريباً"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
