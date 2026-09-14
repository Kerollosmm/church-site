"use client";

import React, { useState, useMemo } from "react";
import { PageHero } from "@/components/layout/PageHero";
import { Calendar, Info } from "lucide-react";
import { WeeklyMassTable, MassScheduleItem } from "@/components/masses/WeeklyMassTable";
import { DayTabFilter } from "@/components/masses/DayTabFilter";
import { AltarSelectDropdown } from "@/components/masses/AltarSelectDropdown";
import { PrintScheduleButton } from "@/components/masses/PrintScheduleButton";
import { SEED_MASS_SCHEDULES, SEED_ALTARS } from "@/lib/data/seed-data";
import { cn } from "@/lib/utils";

const DAY_MAP: Record<string, { name: string; index: number }> = {
  Sunday: { name: "الأحد", index: 0 },
  Monday: { name: "الإثنين", index: 1 },
  Tuesday: { name: "الثلاثاء", index: 2 },
  Wednesday: { name: "الأربعاء", index: 3 },
  Thursday: { name: "الخميس", index: 4 },
  Friday: { name: "الجمعة", index: 5 },
  Saturday: { name: "السبت", index: 6 },
};

export default function MassesPage() {
  const [selectedDay, setSelectedDay] = useState<number | "all">("all");
  const [selectedAltar, setSelectedAltar] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<"all" | "morning" | "evening">("all");

  const altarOptions = useMemo(() => {
    return SEED_ALTARS.map((a) => ({
      id: a.id,
      name: a.name_ar,
    }));
  }, []);

  const filteredMasses = useMemo(() => {
    return SEED_MASS_SCHEDULES.filter((mass) => {
      const dayIndex = DAY_MAP[mass.day_of_week]?.index;
      const hour = parseInt(mass.start_time.split(":")[0], 10);
      const period: "morning" | "evening" = hour < 12 ? "morning" : "evening";

      const matchDay = selectedDay === "all" || dayIndex === selectedDay;
      const matchAltar = selectedAltar === "all" || mass.altar_id === selectedAltar;
      const matchPeriod = selectedPeriod === "all" || period === selectedPeriod;

      return matchDay && matchAltar && matchPeriod;
    });
  }, [selectedDay, selectedAltar, selectedPeriod]);

  const massItems: MassScheduleItem[] = useMemo(() => {
    return filteredMasses.map((mass) => {
      const dayInfo = DAY_MAP[mass.day_of_week] || { name: mass.day_of_week, index: 0 };
      const hour = parseInt(mass.start_time.split(":")[0], 10);
      const period: "morning" | "evening" = hour < 12 ? "morning" : "evening";

      return {
        id: mass.id,
        dayName: dayInfo.name,
        dayIndex: dayInfo.index,
        title: mass.title_ar,
        altarName: mass.altar?.name_ar || "المذبح الرئيسي",
        altarId: mass.altar_id,
        hours: `${mass.start_time.slice(0, 5)} - ${mass.end_time.slice(0, 5)}`,
        priestName: mass.celebrant?.clerical_name_ar || "الآباء الكهنة بالتناوب",
        targetAudience: mass.target_group_ar,
        notes: mass.notes_ar || undefined,
        period,
      };
    });
  }, [filteredMasses]);

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

        {/* Controls Toolbar */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-copticGold-300 shadow-xs flex flex-col xl:flex-row items-center justify-between gap-4 print:hidden">
          <DayTabFilter
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            className="w-full xl:w-auto"
          />

          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
            {/* Period Filter (Morning / Evening) */}
            <div
              role="group"
              aria-label="تصفية فترات القداسات"
              className="flex items-center gap-1 bg-copticGold-50 p-1 rounded-2xl border border-copticGold-200 text-xs font-heading font-bold"
            >
              <button
                type="button"
                onClick={() => setSelectedPeriod("all")}
                className={cn(
                  "px-3 py-1.5 rounded-xl transition-all select-none",
                  selectedPeriod === "all"
                    ? "bg-copticNavy text-white shadow-xs"
                    : "text-slateText-primary hover:bg-copticGold-100"
                )}
              >
                كافة الفترات
              </button>
              <button
                type="button"
                onClick={() => setSelectedPeriod("morning")}
                className={cn(
                  "px-3 py-1.5 rounded-xl transition-all select-none",
                  selectedPeriod === "morning"
                    ? "bg-copticNavy text-white shadow-xs"
                    : "text-slateText-primary hover:bg-copticGold-100"
                )}
              >
                قداسات صباحية
              </button>
              <button
                type="button"
                onClick={() => setSelectedPeriod("evening")}
                className={cn(
                  "px-3 py-1.5 rounded-xl transition-all select-none",
                  selectedPeriod === "evening"
                    ? "bg-copticNavy text-white shadow-xs"
                    : "text-slateText-primary hover:bg-copticGold-100"
                )}
              >
                قداسات مسائية
              </button>
            </div>

            <AltarSelectDropdown
              altars={altarOptions}
              selectedAltarId={selectedAltar}
              onSelect={setSelectedAltar}
            />
            <PrintScheduleButton />
          </div>
        </div>

        {/* Mass Schedule View (Responsive Cards on Screen, Accessible Table in Print Mode) */}
        <WeeklyMassTable schedules={massItems} />

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
