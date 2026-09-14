"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface SpecialtyItem {
  id: string;
  name: string;
  count?: number;
}

export interface SpecialtyFilterProps {
  specialties: SpecialtyItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export function SpecialtyFilter({
  specialties,
  selectedId,
  onSelect,
  className,
}: SpecialtyFilterProps) {
  return (
    <div
      role="tablist"
      aria-label="تصفية حسب التخصص الطبي"
      className={cn(
        "flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none scroll-smooth",
        className
      )}
    >
      <button
        type="button"
        role="tab"
        aria-selected={selectedId === "all"}
        onClick={() => onSelect("all")}
        className={cn(
          "shrink-0 px-4 py-2 rounded-2xl text-xs sm:text-sm font-heading font-medium transition-all select-none",
          selectedId === "all"
            ? "bg-copticNavy-700 text-white shadow-sm font-bold"
            : "bg-surfaceCard text-slateText-secondary hover:text-copticNavy-700 hover:bg-copticGold-50 border border-copticGold-200"
        )}
      >
        <span>كافة التخصصات</span>
      </button>

      {specialties.map((spec) => {
        const isSelected = selectedId === spec.id;
        return (
          <button
            key={spec.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(spec.id)}
            className={cn(
              "shrink-0 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-heading font-medium transition-all select-none flex items-center gap-1.5",
              isSelected
                ? "bg-copticNavy-700 text-white shadow-sm font-bold"
                : "bg-surfaceCard text-slateText-secondary hover:text-copticNavy-700 hover:bg-copticGold-50 border border-copticGold-200"
            )}
          >
            <span>{spec.name}</span>
            {spec.count !== undefined && (
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full",
                  isSelected
                    ? "bg-copticGold-500 text-white"
                    : "bg-copticGold-100 text-copticGold-800"
                )}
              >
                {spec.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
