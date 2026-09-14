"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface DayOption {
  dayIndex: number | "all"; // 0 = Sunday, 1 = Monday, etc., or "all"
  label: string;
}

export const DAYS_OF_WEEK: DayOption[] = [
  { dayIndex: "all", label: "جميع الأيام" },
  { dayIndex: 0, label: "الأحد" },
  { dayIndex: 1, label: "الاثنين" },
  { dayIndex: 2, label: "الثلاثاء" },
  { dayIndex: 3, label: "الأربعاء" },
  { dayIndex: 4, label: "الخميس" },
  { dayIndex: 5, label: "الجمعة" },
  { dayIndex: 6, label: "السبت" },
];

export interface DayTabFilterProps {
  selectedDay: number | "all";
  onSelectDay: (day: number | "all") => void;
  className?: string;
}

export function DayTabFilter({
  selectedDay,
  onSelectDay,
  className,
}: DayTabFilterProps) {
  return (
    <div
      role="tablist"
      aria-label="تصفية القداسات حسب يوم الأسبوع"
      className={cn(
        "flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none",
        className
      )}
    >
      {DAYS_OF_WEEK.map((item) => {
        const isSelected = selectedDay === item.dayIndex;
        return (
          <button
            key={String(item.dayIndex)}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelectDay(item.dayIndex)}
            className={cn(
              "shrink-0 px-3.5 py-2 rounded-xl text-xs font-heading font-bold transition-all select-none border",
              isSelected
                ? "bg-copticNavy text-white border-copticNavy shadow-xs"
                : "bg-copticGold-50 text-slateText-primary hover:bg-copticGold-100 border-copticGold-200"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
