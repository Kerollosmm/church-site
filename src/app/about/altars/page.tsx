import React from "react";
import { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Church, Calendar, Sparkles, BookOpen } from "lucide-react";
import { getAltars } from "@/lib/queries";

export const metadata: Metadata = {
  title: "المذابح الثلاثة والمزارات المقدسة",
  description: "المذابح الثلاثة بكنيسة القديسين مكسيموس ودوماديوس والأنبا موسى بالعصافرة وتاريخ تدشينها واستخداماتها الطقسية.",
};

export const revalidate = 86400; // 24h ISR

export default async function AltarsPage() {
  const altars = await getAltars();

  return (
    <div className="min-h-screen bg-alabasterBg pb-16">
      <PageHero
        title="المذابح الثلاثة والمزارات المقدسة"
        englishTitle="The Three Consecrated Altars & Relics"
        description="المذابح المقدسة المدشنة بزيت الميرون الغالي، وتفاصيل استخداماتها الطقسية في القداسات الإلهية والأعياد السيدية."
        breadcrumbs={[
          { label: "عن الكنيسة", href: "/about/history" },
          { label: "المذابح الثلاثة" },
        ]}
        icon={<Church className="w-8 h-8 text-copticGold-300" />}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {altars.map((altar) => (
            <div
              key={altar.id}
              className="bg-white rounded-3xl p-6 border-2 border-copticGold-300 hover:border-copticNavy transition shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-copticNavy text-copticGold-300 flex items-center justify-center">
                    <Church className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold font-english text-copticGold-800 bg-copticGold-100 px-2.5 py-1 rounded-full border border-copticGold-300">
                    {altar.name_en}
                  </span>
                </div>

                <h2 className="font-heading font-bold text-xl text-copticNavy mb-2">
                  {altar.name_ar}
                </h2>

                <div className="bg-copticGold-50 rounded-xl p-3 mb-4 border border-copticGold-200 text-xs">
                  <div className="text-copticGold-800 font-medium mb-1">الشفيع المكرس له:</div>
                  <div className="font-bold text-copticNavy text-sm">{altar.patron_saint}</div>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-slateText-secondary leading-relaxed mb-6">
                  <div>
                    <h3 className="font-heading font-bold text-copticNavy text-xs mb-1">الوصف الطقسي:</h3>
                    <p>{altar.description_ar}</p>
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-copticNavy text-xs mb-1">ملاحظات التدشين:</h3>
                    <p>{altar.historical_notes}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-copticGold-100 flex items-center justify-between text-xs text-slateText-muted">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-copticGold-700" />
                  <span>تاريخ التدشين:</span>
                </span>
                <span className="font-bold text-copticNavy font-english">
                  {altar.consecration_date}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Relic Shrine Notice */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-copticGold-300 shadow-xs flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-copticNavy-700 text-copticGold-300 flex items-center justify-center shrink-0">
            <Sparkles className="w-8 h-8 text-copticGold-300" />
          </div>
          <div className="space-y-1 text-center md:text-right">
            <h3 className="font-heading font-bold text-lg text-copticNavy">
              مزار رفات الشهيد الأنبا موسى الأسود
            </h3>
            <p className="text-xs sm:text-sm text-slateText-secondary leading-relaxed">
              تتبارك الكنيسة بوجود جزء ثمين من رفات الشهيد القوي الأنبا موسى الأسود موضوع داخل مقصورة خشبية قبطية مذهبة بجوار المذبح البحري، مفتوحة لنيل البركة طوال أوقات فتح الكنيسة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
