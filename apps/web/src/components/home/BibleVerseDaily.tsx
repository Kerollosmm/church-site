"use client";

import React, { useState } from "react";
import { BookOpen, Copy, Check, Share2 } from "lucide-react";

interface BibleVerseDailyProps {
  verse?: {
    verse_text: string;
    book_name?: string;
    chapter_number: number;
    verse_number: number;
    theme_tags?: string[];
  };
}

export function BibleVerseDaily({ verse }: BibleVerseDailyProps) {
  const [copied, setCopied] = useState(false);

  const defaultVerse = verse || {
    verse_text: "«لأَنَّهُ هكَذَا أَحَبَّ اللهُ الْعَالَمَ حَتَّى بَذَلَ ابْنَهُ الْوَحِيدَ، لِكَيْ لاَ يَهْلِكَ كُلُّ مَنْ يُؤْمِنُ بِهِ، بَلْ تَكُونُ لَهُ الْحَيَاةُ الأَبَدِيَّةُ.»",
    book_name: "إنجيل يوحنا",
    chapter_number: 3,
    verse_number: 16,
    theme_tags: ["المحبة", "الخلاص", "الفداء"],
  };

  const fullCitation = `${defaultVerse.verse_text} (${defaultVerse.book_name} ${defaultVerse.chapter_number}:${defaultVerse.verse_number})`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullCitation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-8 bg-gradient-to-r from-copticNavy-800 via-copticNavy-900 to-copticNavy-800 text-white rounded-2xl p-6 sm:p-8 border border-copticGold-400 shadow-xs hover:shadow-md transition-all duration-200 motion-reduce:transition-none relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-copticGold-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between gap-4 mb-4 border-b border-copticGold-500/20 pb-3">
        <div className="inline-flex items-center gap-1.5 bg-copticGold-100 text-copticGold-900 border border-copticGold-300 font-bold text-xs px-3 py-1 rounded-full">
          <BookOpen className="w-3.5 h-3.5 text-copticGold-700" />
          <span>آية اليوم الروحية</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-xs px-2.5 py-1 rounded-lg text-copticGold-200 transition motion-reduce:transition-none"
            title="نسخ الآية"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "تم النسخ" : "نسخ الآية"}</span>
          </button>
        </div>
      </div>

      <div className="text-center py-4 px-2 sm:px-6">
        <p className="font-scripture text-lg sm:text-xl md:text-2xl leading-relaxed text-amber-50">
          {defaultVerse.verse_text}
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-xs sm:text-sm font-heading font-bold text-copticGold-300">
            {defaultVerse.book_name} {defaultVerse.chapter_number}:{defaultVerse.verse_number}
          </span>
        </div>
      </div>
    </div>
  );
}
