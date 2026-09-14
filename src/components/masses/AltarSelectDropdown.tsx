"use client";

import React from "react";
import { ChevronDown, Church } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AltarOption {
  id: string;
  name: string;
}

export interface AltarSelectDropdownProps {
  altars: AltarOption[];
  selectedAltarId: string;
  onSelect: (altarId: string) => void;
  className?: string;
}

export function AltarSelectDropdown({
  altars,
  selectedAltarId,
  onSelect,
  className,
}: AltarSelectDropdownProps) {
  return (
    <div className={cn("relative inline-block text-right", className)}>
      <label htmlFor="altar-select" className="sr-only">
        اختيار المذبح
      </label>
      <div className="relative">
        <Church className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-copticGold-700 pointer-events-none" />
        <select
          id="altar-select"
          value={selectedAltarId}
          onChange={(e) => onSelect(e.target.value)}
          className="appearance-none w-full bg-white border-2 border-copticGold-300 hover:border-copticGold-400 focus:border-copticGold-500 text-copticNavy text-xs sm:text-sm font-heading font-bold rounded-2xl pr-9 pl-8 py-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-copticGold-500/30 cursor-pointer transition-colors"
        >
          <option value="all">{`كافة مذابح الكنيسة (${altars.length} مذابح)`}</option>
          {altars.map((altar) => (
            <option key={altar.id} value={altar.id}>
              {altar.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-copticGold-700 pointer-events-none" />
      </div>
    </div>
  );
}
