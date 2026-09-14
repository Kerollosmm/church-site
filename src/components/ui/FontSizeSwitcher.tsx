"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type FontSizeLevel = "normal" | "large" | "xlarge";

const STORAGE_KEY = "church_portal_font_size";

export function FontSizeSwitcher({ className }: { className?: string }) {
  const [currentSize, setCurrentSize] = useState<FontSizeLevel>("normal");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as FontSizeLevel | null;
      if (saved && ["normal", "large", "xlarge"].includes(saved)) {
        setCurrentSize(saved);
        document.documentElement.setAttribute("data-font-size", saved);
      }
    } catch {
      // Ignore localStorage availability issues
    }
  }, []);

  const setSize = (size: FontSizeLevel) => {
    setCurrentSize(size);
    document.documentElement.setAttribute("data-font-size", size);
    try {
      localStorage.setItem(STORAGE_KEY, size);
    } catch {
      // Ignore
    }
  };

  const options: { label: string; value: FontSizeLevel; title: string }[] = [
    { label: "أ", value: "normal", title: "حجم الخط العادي" },
    { label: "أ+", value: "large", title: "حجم الخط كبير" },
    { label: "أ++", value: "xlarge", title: "حجم الخط كبير جداً" },
  ];

  return (
    <div
      role="group"
      aria-label="تغيير حجم خط الموقع"
      className={cn(
        "inline-flex items-center rounded-xl bg-copticGold-50 p-1 border border-copticGold-200/80 shadow-xs",
        className
      )}
    >
      {options.map((opt) => {
        const isActive = currentSize === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            title={opt.title}
            aria-pressed={isActive}
            onClick={() => setSize(opt.value)}
            className={cn(
              "px-2 py-0.5 text-xs font-heading font-semibold transition-all rounded-lg select-none",
              isActive
                ? "bg-copticNavy-500 text-white shadow-xs"
                : "text-copticGold-800 hover:text-copticNavy-700 hover:bg-copticGold-100"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
