"use client";

import React, { useState, useMemo } from "react";
import { PageHero } from "@/components/layout/PageHero";
import { BookOpen, Search, Bookmark, ChevronRight, ChevronLeft, Volume2, Sparkles } from "lucide-react";
import type { Tables } from "@/types/database.types";

/** The book the reader opens on when the page loads. */
const DEFAULT_BOOK_SLUG = "matthew";

export interface BibleReaderClientProps {
  /**
   * The canon, from `getBibleBooks()` (database when configured, `SEED_BIBLE_BOOKS` otherwise).
   * The reader derives every count it displays from this array — it never states a book count of
   * its own — so the list and the numbers shown can never disagree.
   */
  books: Tables<"bible_books">[];
}

export function BibleReaderClient({ books }: BibleReaderClientProps) {
  const [testament, setTestament] = useState<"all" | "old" | "new">("all");
  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState(() => {
    return books.find((b) => b.slug === DEFAULT_BOOK_SLUG) ?? books[0];
  });
  const [selectedChapter, setSelectedChapter] = useState(1);

  const { totalCount, oldTestamentCount, newTestamentCount } = useMemo(
    () => ({
      totalCount: books.length,
      oldTestamentCount: books.filter((b) => b.testament === "old").length,
      newTestamentCount: books.filter((b) => b.testament === "new").length,
    }),
    [books]
  );

  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const matchTestament = testament === "all" || b.testament === testament;
      const matchSearch = !search.trim() || b.name_ar.includes(search.trim());
      return matchTestament && matchSearch;
    });
  }, [books, testament, search]);

  return (
    <div className="min-h-screen bg-alabasterBg pb-16">
      <PageHero
        title="قارئ الكتاب المقدس القبطي الأرثوذكسي"
        englishTitle={`Orthodox Holy Bible Reader (${totalCount} Books)`}
        description={`تصفح وقراءة الأسفار المقدسة الـ ${totalCount} بعهديه القديم (بما فيه الأسفار القانونية الثانية) والعهد الجديد باللغة العربية والتشكيل الأصيل.`}
        breadcrumbs={[{ label: "الكتاب المقدس" }]}
        icon={<BookOpen className="w-8 h-8 text-copticGold-300" />}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Books Directory Sidebar */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-5 border-2 border-copticGold-300 shadow-xs space-y-4">
            {/* Search and Filter */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-copticGold-700 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ابحث عن سفر..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-copticGold-50 border border-copticGold-300 rounded-xl pr-10 pl-4 py-2 text-xs text-copticNavy focus:outline-hidden focus:ring-2 focus:ring-copticNavy"
                />
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-xs font-heading font-bold">
                <button
                  onClick={() => setTestament("all")}
                  className={`py-1.5 rounded-xl transition ${
                    testament === "all"
                      ? "bg-copticNavy text-white"
                      : "bg-copticGold-50 text-slateText-secondary hover:bg-copticGold-100"
                  }`}
                >
                  الكل ({totalCount})
                </button>
                <button
                  onClick={() => setTestament("old")}
                  className={`py-1.5 rounded-xl transition ${
                    testament === "old"
                      ? "bg-copticNavy text-white"
                      : "bg-copticGold-50 text-slateText-secondary hover:bg-copticGold-100"
                  }`}
                >
                  العهد القديم ({oldTestamentCount})
                </button>
                <button
                  onClick={() => setTestament("new")}
                  className={`py-1.5 rounded-xl transition ${
                    testament === "new"
                      ? "bg-copticNavy text-white"
                      : "bg-copticGold-50 text-slateText-secondary hover:bg-copticGold-100"
                  }`}
                >
                  العهد الجديد ({newTestamentCount})
                </button>
              </div>
            </div>

            {/* Books List Container */}
            <div className="max-h-[550px] overflow-y-auto space-y-1.5 pr-1">
              {filteredBooks.map((b) => {
                const isSelected = selectedBook.slug === b.slug;
                return (
                  <button
                    key={b.slug}
                    onClick={() => {
                      setSelectedBook(b);
                      setSelectedChapter(1);
                    }}
                    className={`w-full text-right px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                      isSelected
                        ? "bg-copticNavy text-white font-bold shadow-xs"
                        : "text-slateText-primary hover:bg-copticGold-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{b.name_ar}</span>
                      {b.is_deuterocanonical && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full border ${isSelected ? "border-copticGold-400 text-copticGold-200" : "border-amber-300 text-amber-800 bg-amber-50"}`}>
                          قانوني ثان
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-english ${isSelected ? "text-copticGold-200" : "text-slateText-muted"}`}>
                      {b.chapters_count} أصحاح
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reader Window */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border-2 border-copticGold-300 shadow-xs flex flex-col justify-between">
            <div>
              {/* Active Book & Chapter Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-copticGold-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-copticGold-800 bg-copticGold-100 px-2.5 py-0.5 rounded-full">
                      {selectedBook.testament === "old" ? "العهد القديم" : "العهد الجديد"}
                    </span>
                    {selectedBook.is_deuterocanonical && (
                      <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full">
                        الأسفار القانونية الثانية
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-heading font-bold text-copticNavy">
                    {selectedBook.name_ar} — الأصحاح {selectedChapter}
                  </h2>
                </div>

                {/* Chapter selector pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none">
                  {Array.from({ length: selectedBook.chapters_count }, (_, i) => i + 1).map((ch) => (
                    <button
                      key={ch}
                      onClick={() => setSelectedChapter(ch)}
                      className={`w-8 h-8 rounded-lg text-xs font-english font-bold transition shrink-0 ${
                        selectedChapter === ch
                          ? "bg-copticGold-500 text-copticNavy-950 font-extrabold shadow-xs"
                          : "bg-copticGold-50 text-copticNavy hover:bg-copticGold-100"
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chapter Scripture Display */}
              <div className="bg-alabasterBg p-6 sm:p-8 rounded-2xl border border-copticGold-200 font-scripture text-lg sm:text-xl text-slateText-primary leading-loose space-y-4">
                <p>
                  <span className="text-copticGold-800 font-bold ml-2">١</span>
                  فِي الْبَدْءِ كَانَ الْكَلِمَةُ، وَالْكَلِمَةُ كَانَ عِنْدَ اللهِ، وَكَانَ الْكَلِمَةُ اللهَ.
                </p>
                <p>
                  <span className="text-copticGold-800 font-bold ml-2">٢</span>
                  هذَا كَانَ فِي الْبَدْءِ عِنْدَ اللهِ.
                </p>
                <p>
                  <span className="text-copticGold-800 font-bold ml-2">٣</span>
                  كُلُّ شَيْءٍ بِهِ كَانَ، وَبِغَيْرِهِ لَمْ يَكُنْ شَيْءٌ مِمَّا كَانَ.
                </p>
                <p>
                  <span className="text-copticGold-800 font-bold ml-2">٤</span>
                  فِيهِ كَانَتِ الْحَيَاةُ، وَالْحَيَاةُ كَانَتْ نُورَ النَّاسِ،
                </p>
                <p>
                  <span className="text-copticGold-800 font-bold ml-2">٥</span>
                  وَالنُّورُ يُضِيءُ فِي الظُّلْمَةِ، وَالظُّلْمَةُ لَمْ تُدْرِكْهُ.
                </p>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="mt-8 pt-4 border-t border-copticGold-200 flex items-center justify-between">
              <button
                disabled={selectedChapter <= 1}
                onClick={() => setSelectedChapter((prev) => Math.max(1, prev - 1))}
                className="inline-flex items-center gap-1 text-xs font-bold bg-copticNavy text-white px-3.5 py-2 rounded-xl disabled:opacity-30 transition"
              >
                <ChevronRight className="w-4 h-4" />
                <span>الأصحاح السابق</span>
              </button>

              <span className="text-xs font-bold text-copticGold-800">
                أصحاح {selectedChapter} من {selectedBook.chapters_count}
              </span>

              <button
                disabled={selectedChapter >= selectedBook.chapters_count}
                onClick={() => setSelectedChapter((prev) => Math.min(selectedBook.chapters_count, prev + 1))}
                className="inline-flex items-center gap-1 text-xs font-bold bg-copticNavy text-white px-3.5 py-2 rounded-xl disabled:opacity-30 transition"
              >
                <span>الأصحاح التالي</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
