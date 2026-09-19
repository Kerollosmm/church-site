"use client";

import React, { useState, useMemo } from "react";
import { WeeklyMassTable, MassScheduleItem } from "@/components/masses/WeeklyMassTable";
import { DayTabFilter } from "@/components/masses/DayTabFilter";
import { AltarSelectDropdown } from "@/components/masses/AltarSelectDropdown";
import { PrintScheduleButton } from "@/components/masses/PrintScheduleButton";
import type { WeeklyMassRow } from "@/lib/queries";
import { getMassPeriodFromTime, type MassPeriod } from "@/lib/utils/parish-contact";
import { DAY_OF_WEEK_INDEX, DAY_OF_WEEK_LABELS_AR } from "@/lib/utils/mass-schedule";
import { cn } from "@/lib/utils";

const PERIOD_FILTERS: Array<{ value: "all" | MassPeriod; label: string }> = [
  { value: "all", label: "كافة الفترات" },
  { value: "morning", label: "قداسات صباحية" },
  { value: "evening", label: "قداسات مسائية" },
];

export interface MassesExplorerProps {
  /** Weekly liturgies from `getWeeklyMasses()` (database when configured, seed otherwise). */
  masses: WeeklyMassRow[];
  /** Altars from `getAltars()`, already reduced to what the filter needs. */
  altars: Array<{ id: string; name_ar: string }>;
}

export function MassesExplorer({ masses, altars }: MassesExplorerProps) {
  const [selectedDay, setSelectedDay] = useState<number | "all">("all");
  const [selectedAltar, setSelectedAltar] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<"all" | MassPeriod>("all");

  const altarOptions = useMemo(
    () => altars.map((altar) => ({ id: altar.id, name: altar.name_ar })),
    [altars]
  );

  const filteredMasses = useMemo(() => {
    return masses.filter((mass) => {
      const dayIndex = DAY_OF_WEEK_INDEX[mass.day_of_week];
      const matchDay = selectedDay === "all" || dayIndex === selectedDay;
      const matchAltar = selectedAltar === "all" || mass.altar_id === selectedAltar;
      const matchPeriod =
        selectedPeriod === "all" || getMassPeriodFromTime(mass.start_time) === selectedPeriod;

      return matchDay && matchAltar && matchPeriod;
    });
  }, [masses, selectedDay, selectedAltar, selectedPeriod]);

  const massItems: MassScheduleItem[] = useMemo(() => {
    return filteredMasses.map((mass) => {
      const dayName = DAY_OF_WEEK_LABELS_AR[mass.day_of_week];

      return {
        id: mass.id,
        dayName,
        dayIndex: DAY_OF_WEEK_INDEX[mass.day_of_week],
        title: mass.title_ar,
        altarName: mass.altar?.name_ar || "المذبح الرئيسي",
        altarId: mass.altar_id,
        hours: `${mass.start_time.slice(0, 5)} - ${mass.end_time.slice(0, 5)}`,
        priestName: mass.celebrant?.clerical_name_ar,
        targetAudience: mass.target_group_ar,
        notes: mass.notes_ar || undefined,
        period: getMassPeriodFromTime(mass.start_time),
      };
    });
  }, [filteredMasses]);

  return (
    <div className="space-y-8">
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
            {PERIOD_FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={selectedPeriod === option.value}
                onClick={() => setSelectedPeriod(option.value)}
                className={cn(
                  "px-3 py-1.5 rounded-xl transition-all select-none",
                  selectedPeriod === option.value
                    ? "bg-copticNavy text-white shadow-xs"
                    : "text-slateText-primary hover:bg-copticGold-100"
                )}
              >
                {option.label}
              </button>
            ))}
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
    </div>
  );
}
