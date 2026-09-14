"use client";

import React, { useState, useMemo } from "react";
import { BookOpen, Search, ChevronRight, ChevronLeft, Bookmark, Share2, Check } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export interface BibleBook {
  id: string;
  name: string;
  testament: "OT" | "NT";
  chaptersCount: number;
  isDeuterocanonical?: boolean;
}

export const BIBLE_BOOKS: BibleBook[] = [
  // العهد القديم (46 سفراً تشمل الأسفار القانونية الثانية)
  { id: "gen", name: "التكوين", testament: "OT", chaptersCount: 50 },
  { id: "exo", name: "الخروج", testament: "OT", chaptersCount: 40 },
  { id: "lev", name: "اللاويين", testament: "OT", chaptersCount: 27 },
  { id: "num", name: "العدد", testament: "OT", chaptersCount: 36 },
  { id: "deu", name: "التثنية", testament: "OT", chaptersCount: 34 },
  { id: "jos", name: "يشوع", testament: "OT", chaptersCount: 24 },
  { id: "jdg", name: "القضاة", testament: "OT", chaptersCount: 21 },
  { id: "rut", name: "راعوث", testament: "OT", chaptersCount: 4 },
  { id: "1sa", name: "صموئيل الأول", testament: "OT", chaptersCount: 31 },
  { id: "2sa", name: "صموئيل الثاني", testament: "OT", chaptersCount: 24 },
  { id: "1ki", name: "الملوك الأول", testament: "OT", chaptersCount: 22 },
  { id: "2ki", name: "الملوك الثاني", testament: "OT", chaptersCount: 25 },
  { id: "1ch", name: "أخبار الأيام الأول", testament: "OT", chaptersCount: 29 },
  { id: "2ch", name: "أخبار الأيام الثاني", testament: "OT", chaptersCount: 36 },
  { id: "ezr", name: "عزرا", testament: "OT", chaptersCount: 10 },
  { id: "neh", name: "نحميا", testament: "OT", chaptersCount: 13 },
  { id: "tob", name: "طوبيا", testament: "OT", chaptersCount: 14, isDeuterocanonical: true },
  { id: "jdt", name: "يهوديت", testament: "OT", chaptersCount: 16, isDeuterocanonical: true },
  { id: "est", name: "أستير وتتمته", testament: "OT", chaptersCount: 16, isDeuterocanonical: true },
  { id: "job", name: "أيوب", testament: "OT", chaptersCount: 42 },
  { id: "psa", name: "المزامير", testament: "OT", chaptersCount: 151, isDeuterocanonical: true },
  { id: "pro", name: "الأمثال", testament: "OT", chaptersCount: 31 },
  { id: "ecc", name: "الجامعة", testament: "OT", chaptersCount: 12 },
  { id: "sol", name: "نشيد الأنشاد", testament: "OT", chaptersCount: 8 },
  { id: "wis", name: "حكمة سليمان", testament: "OT", chaptersCount: 19, isDeuterocanonical: true },
  { id: "sir", name: "يشوع بن سيراخ", testament: "OT", chaptersCount: 51, isDeuterocanonical: true },
  { id: "isa", name: "إشعياء", testament: "OT", chaptersCount: 66 },
  { id: "jer", name: "إرميا", testament: "OT", chaptersCount: 52 },
  { id: "lam", name: "مراثي إرميا", testament: "OT", chaptersCount: 5 },
  { id: "bar", name: "باروخ وتتمته", testament: "OT", chaptersCount: 6, isDeuterocanonical: true },
  { id: "ezk", name: "حزقيال", testament: "OT", chaptersCount: 48 },
  { id: "dan", name: "دانيال وتتمته", testament: "OT", chaptersCount: 14, isDeuterocanonical: true },
  { id: "hos", name: "هوشع", testament: "OT", chaptersCount: 14 },
  { id: "joe", name: "يوئيل", testament: "OT", chaptersCount: 3 },
  { id: "amo", name: "عاموس", testament: "OT", chaptersCount: 9 },
  { id: "oba", name: "عوبديا", testament: "OT", chaptersCount: 1 },
  { id: "jon", name: "يونان", testament: "OT", chaptersCount: 4 },
  { id: "mic", name: "ميخا", testament: "OT", chaptersCount: 7 },
  { id: "nah", name: "ناحوم", testament: "OT", chaptersCount: 3 },
  { id: "hab", name: "حبقوق", testament: "OT", chaptersCount: 3 },
  { id: "zep", name: "صفنيا", testament: "OT", chaptersCount: 3 },
  { id: "hag", name: "حجي", testament: "OT", chaptersCount: 2 },
  { id: "zec", name: "زكريا", testament: "OT", chaptersCount: 14 },
  { id: "mal", name: "ملاخي", testament: "OT", chaptersCount: 4 },
  { id: "1ma", name: "المكابيين الأول", testament: "OT", chaptersCount: 16, isDeuterocanonical: true },
  { id: "2ma", name: "المكابيين الثاني", testament: "OT", chaptersCount: 15, isDeuterocanonical: true },

  // العهد الجديد (27 سفراً)
  { id: "mat", name: "إنجيل متى", testament: "NT", chaptersCount: 28 },
  { id: "mar", name: "إنجيل مرقس", testament: "NT", chaptersCount: 16 },
  { id: "luk", name: "إنجيل لوقا", testament: "NT", chaptersCount: 24 },
  { id: "joh", name: "إنجيل يوحنا", testament: "NT", chaptersCount: 21 },
  { id: "act", name: "أعمال الرسل", testament: "NT", chaptersCount: 28 },
  { id: "rom", name: "رسالة رومية", testament: "NT", chaptersCount: 16 },
  { id: "1co", name: "كورنثوس الأولى", testament: "NT", chaptersCount: 16 },
  { id: "2co", name: "كورنثوس الثانية", testament: "NT", chaptersCount: 13 },
  { id: "gal", name: "غلاطية", testament: "NT", chaptersCount: 6 },
  { id: "eph", name: "أفسس", testament: "NT", chaptersCount: 6 },
  { id: "phi", name: "فيلبي", testament: "NT", chaptersCount: 4 },
  { id: "col", name: "كولوسي", testament: "NT", chaptersCount: 4 },
  { id: "1th", name: "تسالونيكي الأولى", testament: "NT", chaptersCount: 5 },
  { id: "2th", name: "تسالونيكي الثانية", testament: "NT", chaptersCount: 3 },
  { id: "1ti", name: "تيموثاوس الأولى", testament: "NT", chaptersCount: 6 },
  { id: "2ti", name: "تيموثاوس الثانية", testament: "NT", chaptersCount: 4 },
  { id: "tit", name: "تيطس", testament: "NT", chaptersCount: 3 },
  { id: "phm", name: "فليمون", testament: "NT", chaptersCount: 1 },
  { id: "heb", name: "العبرانيين", testament: "NT", chaptersCount: 13 },
  { id: "jam", name: "يعقوب", testament: "NT", chaptersCount: 5 },
  { id: "1pe", name: "بطرس الأولى", testament: "NT", chaptersCount: 5 },
  { id: "2pe", name: "بطرس الثانية", testament: "NT", chaptersCount: 3 },
  { id: "1jo", name: "يوحنا الأولى", testament: "NT", chaptersCount: 5 },
  { id: "2jo", name: "يوحنا الثانية", testament: "NT", chaptersCount: 1 },
  { id: "3jo", name: "يوحنا الثالثة", testament: "NT", chaptersCount: 1 },
  { id: "jud", name: "يهوذا", testament: "NT", chaptersCount: 1 },
  { id: "rev", name: "رؤيا يوحنا اللاهوتي", testament: "NT", chaptersCount: 22 },
];

export function BibleReader() {
  const [testament, setTestament] = useState<"OT" | "NT">("NT");
  const [selectedBook, setSelectedBook] = useState<BibleBook>(
    BIBLE_BOOKS.find((b) => b.id === "mat") || BIBLE_BOOKS[46]
  );
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  // Filter books by testament and search query
  const filteredBooks = useMemo(() => {
    return BIBLE_BOOKS.filter((b) => {
      const matchTestament = b.testament === testament;
      const matchQuery =
        !searchQuery.trim() ||
        b.name.includes(searchQuery.trim()) ||
        b.id.includes(searchQuery.toLowerCase().trim());
      return matchTestament && matchQuery;
    });
  }, [testament, searchQuery]);

  const handleSelectBook = (book: BibleBook) => {
    setSelectedBook(book);
    setSelectedChapter(1);
  };

  const handleCopyChapter = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(
        `${selectedBook.name} - الإصحاح ${selectedChapter}\nالكتاب المقدس - كنيسة القديسين بالعصافرة`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* 1. Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-copticGold-200">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-black text-copticNavy-800 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-copticGold-600" />
            <span>الكتاب المقدس وقراءات الكنيسة</span>
          </h1>
          <p className="text-xs text-slateText-muted font-body mt-1">
            الترجمة العربية البيروتية المعتمدة لدى الكنيسة القبطية الأرثوذكسية (٧٣ سفراً قانونياً)
          </p>
        </div>

        {/* Testament Switcher */}
        <div className="flex items-center gap-2 bg-copticNavy-50 p-1 rounded-2xl border border-copticNavy-200 self-start md:self-auto">
          <button
            type="button"
            onClick={() => {
              setTestament("OT");
              const firstOt = BIBLE_BOOKS.find((b) => b.testament === "OT");
              if (firstOt) handleSelectBook(firstOt);
            }}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-heading font-bold transition-all select-none",
              testament === "OT"
                ? "bg-copticNavy-700 text-white shadow-xs"
                : "text-copticNavy-700 hover:bg-copticGold-100"
            )}
          >
            العهد القديم (٤٦ سفراً)
          </button>
          <button
            type="button"
            onClick={() => {
              setTestament("NT");
              const firstNt = BIBLE_BOOKS.find((b) => b.testament === "NT");
              if (firstNt) handleSelectBook(firstNt);
            }}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-heading font-bold transition-all select-none",
              testament === "NT"
                ? "bg-copticNavy-700 text-white shadow-xs"
                : "text-copticNavy-700 hover:bg-copticGold-100"
            )}
          >
            العهد الجديد (٢٧ سفراً)
          </button>
        </div>
      </div>

      {/* 2. Main Reader Grid: Sidebar (Books) + Reading Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Books List & Search (Col 1) */}
        <div className="lg:col-span-1 space-y-3">
          {/* Instant Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slateText-muted absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن سفر أو إصحاح..."
              className="w-full bg-surfaceCard border border-copticGold-300 rounded-xl pr-9 pl-3 py-2 text-xs font-heading focus:outline-none focus:ring-2 focus:ring-copticGold-500"
            />
          </div>

          {/* Book List Scroll Area */}
          <div className="max-h-[500px] overflow-y-auto space-y-1 p-1 bg-surfaceCard rounded-2xl border border-copticGold-200">
            {filteredBooks.map((book) => {
              const isSelected = selectedBook.id === book.id;
              return (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => handleSelectBook(book)}
                  className={cn(
                    "w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-heading transition-colors text-right select-none",
                    isSelected
                      ? "bg-copticNavy-700 text-white font-bold"
                      : "text-slateText-primary hover:bg-copticGold-50"
                  )}
                >
                  <span className="truncate">{book.name}</span>
                  {book.isDeuterocanonical && (
                    <span
                      className={cn(
                        "text-[9px] px-1.5 py-0.2 rounded-full shrink-0 font-normal",
                        isSelected
                          ? "bg-copticGold-500 text-white"
                          : "bg-copticGold-100 text-copticGold-800"
                      )}
                    >
                      قانوني ثان
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reader Canvas & Chapter Navigator (Cols 2-4) */}
        <div className="lg:col-span-3 space-y-4">
          <Card variant="default" className="bg-surfaceCard border border-copticGold-300 shadow-sm">
            {/* Top Toolbar: Current Book & Chapter Navigator */}
            <CardHeader className="p-4 sm:p-6 border-b border-copticGold-100 bg-copticGold-50/40 flex-row items-center justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading text-lg sm:text-xl font-black text-copticNavy-800">
                    {selectedBook.name}
                  </h2>
                  <Badge variant="gold" size="sm">
                    الإصحاح {selectedChapter} من {selectedBook.chaptersCount}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyChapter}
                  aria-label="نسخ عنوان الإصحاح"
                  className="p-2 rounded-xl text-slateText-muted hover:text-copticNavy-700 hover:bg-copticGold-100 transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </CardHeader>

            {/* Chapters Grid Buttons */}
            <div className="p-4 border-b border-copticGold-100 bg-alabasterBg flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <span className="text-xs font-heading font-bold text-copticGold-800 shrink-0 me-2">
                الإصحاحات:
              </span>
              {Array.from({ length: selectedBook.chaptersCount }, (_, i) => i + 1).map((ch) => {
                const isCurrent = ch === selectedChapter;
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setSelectedChapter(ch)}
                    className={cn(
                      "min-w-[32px] h-8 px-2 rounded-lg text-xs font-heading font-semibold transition-all shrink-0",
                      isCurrent
                        ? "bg-copticNavy-700 text-white shadow-xs"
                        : "bg-surfaceCard text-slateText-primary hover:bg-copticGold-100 border border-copticGold-200"
                    )}
                  >
                    {ch}
                  </button>
                );
              })}
            </div>

            {/* Chapter Text Display in Amiri Serif Font */}
            <CardContent className="p-6 md:p-10">
              <div className="font-scripture text-lg sm:text-xl md:text-2xl text-copticNavy-950 leading-[2.3] text-justify space-y-4">
                <p>
                  <span className="font-heading text-xs font-bold text-copticGold-700 bg-copticGold-50 px-2 py-0.5 rounded-md me-2 select-none border border-copticGold-200">
                    ١
                  </span>
                  فِي الْبَدْءِ خَلَقَ اللهُ السَّمَاوَاتِ وَالأَرْضَ. وَكَانَتِ الأَرْضُ خَرِبَةً وَخَالِيَةً، وَعَلَى وَجْهِ الْغَمْرِ ظُلْمَةٌ، وَرُوحُ اللهِ يَرِفُّ عَلَى وَجْهِ الْمِيَاهِ.
                </p>
                <p>
                  <span className="font-heading text-xs font-bold text-copticGold-700 bg-copticGold-50 px-2 py-0.5 rounded-md me-2 select-none border border-copticGold-200">
                    ٢
                  </span>
                  وَقَالَ اللهُ: «لِيَكُنْ نُورٌ»، فَكَانَ نُورٌ. وَرَأَى اللهُ النُّورَ أَنَّهُ حَسَنٌ. وَفَصَلَ اللهُ بَيْنَ النُّورِ وَالظُّلْمَةِ.
                </p>
                <p>
                  <span className="font-heading text-xs font-bold text-copticGold-700 bg-copticGold-50 px-2 py-0.5 rounded-md me-2 select-none border border-copticGold-200">
                    ٣
                  </span>
                  وَدَعَا اللهُ النُّورَ نَهَاراً، وَالظُّلْمَةُ دَعَاهَا لَيْلاً. وَكَانَ مَسَاءٌ وَكَانَ صَبَاحٌ يَوْماً وَاحِداً.
                </p>
                <p className="text-sm text-slateText-muted italic text-center pt-6 border-t border-copticGold-100 font-body">
                  — يمكن متابعة كامل قراءات القطمارس اليومية وسنكسار اليوم من خلال قسم القراءات الكنسية بالبوابة —
                </p>
              </div>

              {/* Prev / Next Chapter Buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-copticGold-200">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={selectedChapter <= 1}
                  onClick={() => setSelectedChapter((prev) => Math.max(1, prev - 1))}
                  className="gap-1 text-xs"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>الإصحاح السابق</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={selectedChapter >= selectedBook.chaptersCount}
                  onClick={() =>
                    setSelectedChapter((prev) =>
                      Math.min(selectedBook.chaptersCount, prev + 1)
                    )
                  }
                  className="gap-1 text-xs"
                >
                  <span>الإصحاح التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
