"use client";

import React, { useState } from "react";
import { BookOpen, Copy, Check } from "lucide-react";

interface BibleVerseDailyProps {
  verse?: {
    verse_text: string;
    book_name?: string;
    chapter_number: number;
    verse_number: number;
    theme_tags?: string[];
  } | null;
}

export function BibleVerseDaily({ verse }: BibleVerseDailyProps) {
  const [copied, setCopied] = useState(false);

  // Honest state: if no verse was provided from the query layer, render nothing.
  if (!verse || !verse.verse_text) {
    return null;
  }

  const fullCitation = `${verse.verse_text} (${verse.book_name ?? ""} ${verse.chapter_number}:${verse.verse_number})`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullCitation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Failed to copy bible verse to clipboard:", err);
    }
  };

  return (
    <div
      data-home-state="daily-verse"
      className="my-8 bg-gradient-to-r from-copticNavy-800 via-copticNavy-900 to-copticNavy-800 text-white rounded-2xl p-6 sm:p-8 border border-copticGold-400 shadow-xs hover:shadow-md transition-all duration-200 motion-reduce:transition-none relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-copticGold-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between gap-4 mb-4 border-b border-copticGold-500/20 pb-3">
        <div className="inline-flex items-center gap-1.5 bg-copticGold-100 text-copticGold-900 border border-copticGold-300 font-bold text-xs px-3 py-1 rounded-full">
          <BookOpen className="w-3.5 h-3.5 text-copticGold-700" />
          <span>آية اليوم الروحية</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-xs px-2.5 py-1 rounded-lg text-copticGold-200 transition motion-reduce:transition-none cursor-pointer"
            title="نسخ الآية"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "تم النسخ" : "نسخ الآية"}</span>
          </button>
        </div>
      </div>

      <div className="text-center py-4 px-2 sm:px-6">
        <p className="font-scripture text-lg sm:text-xl md:text-2xl leading-relaxed text-amber-50">
          {verse.verse_text}
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-xs sm:text-sm font-heading font-bold text-copticGold-300">
            {verse.book_name} {verse.chapter_number}:{verse.verse_number}
          </span>
        </div>
      </div>
    </div>
  );
}
