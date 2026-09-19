import React from "react";
import { Metadata } from "next";
import { Calendar, Info } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { getAltars, getWeeklyMasses } from "@/lib/queries";
import { MassesExplorer } from "./MassesExplorer";

export const metadata: Metadata = {
  title: "جداول القداسات الإلهية والعشيات",
  description:
    "مواعيد القداسات الإلهية والعشيات الأسبوعية على مذابح كنيسة القديسين مكسيموس ودوماديوس والأنبا موسى الأسود بالعصافرة.",
};

export const revalidate = 300; // 5m ISR

/**
 * `/masses` — the schedule and the altar filter come from the typed data layer
 * (`getWeeklyMasses()`, `getAltars()`), which read the database and fall back to the seeded
 * baseline. Static headers, PageHero, and liturgical notes are rendered on the server.
 * The filters, altar select, and print trigger are handled by `MassesExplorer`.
 */
export default async function MassesPage() {
  const [masses, altars] = await Promise.all([getWeeklyMasses(), getAltars()]);

  return (
    <div className="min-h-screen bg-alabasterBg pb-16">
      <div className="print:hidden">
        <PageHero
          title="جداول القداسات الإلهية والعشيات"
          englishTitle="Weekly Liturgy & Vespers Schedule"
          description="مواعيد الصلوات الأسبوعية على مذابح الكنيسة الثلاثة مع ملاحظات الأعياد والمناسبات الطقسية."
          breadcrumbs={[{ label: "القداسات الإلهية" }]}
          icon={<Calendar className="w-8 h-8 text-copticGold-300" />}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Printable Header for Print Mode Only */}
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-2xl font-bold text-copticNavy">
            كنيسة القديسين مكسيموس ودوماديوس والأنبا موسى الأسود بالعصافرة
          </h1>
          <p className="text-sm text-copticGold-800 font-bold">جدول القداسات الإلهية الأسبوعية</p>
        </div>

        <MassesExplorer
          masses={masses}
          altars={altars.map((altar) => ({ id: altar.id, name_ar: altar.name_ar }))}
        />

        {/* Liturgical Feast Note */}
        <div className="bg-copticGold-100 border-2 border-copticGold-400 rounded-3xl p-6 shadow-xs flex items-start gap-4">
          <Info className="w-6 h-6 text-copticGold-800 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs sm:text-sm text-copticNavy-900 leading-relaxed">
            <h4 className="font-heading font-bold text-base text-copticNavy">
              تنبيهات طقسية هامة ومواعيد الأعياد
            </h4>
            <p>
              • في المناسبات والأعياد السيدية الكبرى وأيام أسبوع الآلام والنهضات الروحية، تُصدر الكنيسة مواعيد قداسات استثنائية يتم نشرها فوراً على البوابة وعبر البث المباشر.
            </p>
            <p>
              • يرجى الالتزام بالحضور المبكر قبل قراءة إنجيل باكر لنيل بركة السر الإلهي كاملة، مع مراعاة الحشمة والوقار اللائق ببيت الله.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
