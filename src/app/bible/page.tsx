"use client";

import React, { useState, useMemo } from "react";
import { PageHero } from "@/components/layout/PageHero";
import { BookOpen, Search, Bookmark, ChevronRight, ChevronLeft, Volume2, Sparkles } from "lucide-react";
import { SEED_BIBLE_BOOKS } from "@/lib/data/seed-data";

// Complete 73 Orthodox Books list
const ALL_ORTHODOX_BOOKS = [
  // Old Testament - Canonical & Deuterocanonical (46 books)
  { slug: "genesis", name_ar: "التكوين", testament: "old", chapters_count: 50, is_deutero: false },
  { slug: "exodus", name_ar: "الخروج", testament: "old", chapters_count: 40, is_deutero: false },
  { slug: "leviticus", name_ar: "اللاويين", testament: "old", chapters_count: 27, is_deutero: false },
  { slug: "numbers", name_ar: "العدد", testament: "old", chapters_count: 36, is_deutero: false },
  { slug: "deuteronomy", name_ar: "التثنية", testament: "old", chapters_count: 34, is_deutero: false },
  { slug: "joshua", name_ar: "يشوع", testament: "old", chapters_count: 24, is_deutero: false },
  { slug: "judges", name_ar: "القضاة", testament: "old", chapters_count: 21, is_deutero: false },
  { slug: "ruth", name_ar: "راعوث", testament: "old", chapters_count: 4, is_deutero: false },
  { slug: "1samuel", name_ar: "صموئيل الأول", testament: "old", chapters_count: 31, is_deutero: false },
  { slug: "2samuel", name_ar: "صموئيل الثاني", testament: "old", chapters_count: 24, is_deutero: false },
  { slug: "1kings", name_ar: "الملوك الأول", testament: "old", chapters_count: 22, is_deutero: false },
  { slug: "2kings", name_ar: "الملوك الثاني", testament: "old", chapters_count: 25, is_deutero: false },
  { slug: "1chronicles", name_ar: "أخبار الأيام الأول", testament: "old", chapters_count: 29, is_deutero: false },
  { slug: "2chronicles", name_ar: "أخبار الأيام الثاني", testament: "old", chapters_count: 36, is_deutero: false },
  { slug: "ezra", name_ar: "عزرا", testament: "old", chapters_count: 10, is_deutero: false },
  { slug: "nehemiah", name_ar: "نحميا", testament: "old", chapters_count: 13, is_deutero: false },
  { slug: "tobit", name_ar: "طوبيا", testament: "old", chapters_count: 14, is_deutero: true },
  { slug: "judith", name_ar: "يهوديت", testament: "old", chapters_count: 16, is_deutero: true },
  { slug: "esther", name_ar: "أستير وتتمتها", testament: "old", chapters_count: 16, is_deutero: false },
  { slug: "job", name_ar: "أيوب", testament: "old", chapters_count: 42, is_deutero: false },
  { slug: "psalms", name_ar: "المزامير (151 مزموراً)", testament: "old", chapters_count: 151, is_deutero: false },
  { slug: "proverbs", name_ar: "الأمثال", testament: "old", chapters_count: 31, is_deutero: false },
  { slug: "ecclesiastes", name_ar: "الجامعة", testament: "old", chapters_count: 12, is_deutero: false },
  { slug: "song-of-songs", name_ar: "نشيد الأنشاد", testament: "old", chapters_count: 8, is_deutero: false },
  { slug: "wisdom", name_ar: "حكمة سليمان", testament: "old", chapters_count: 19, is_deutero: true },
  { slug: "sirach", name_ar: "يشوع بن سيراخ", testament: "old", chapters_count: 51, is_deutero: true },
  { slug: "isaiah", name_ar: "إشعياء", testament: "old", chapters_count: 66, is_deutero: false },
  { slug: "jeremiah", name_ar: "إرميا", testament: "old", chapters_count: 52, is_deutero: false },
  { slug: "lamentations", name_ar: "مراثي إرميا", testament: "old", chapters_count: 5, is_deutero: false },
  { slug: "baruch", name_ar: "باروخ ورسالة إرميا", testament: "old", chapters_count: 6, is_deutero: true },
  { slug: "ezekiel", name_ar: "حزقيال", testament: "old", chapters_count: 48, is_deutero: false },
  { slug: "daniel", name_ar: "دانيال وتتمته", testament: "old", chapters_count: 14, is_deutero: false },
  { slug: "hosea", name_ar: "هوشع", testament: "old", chapters_count: 14, is_deutero: false },
  { slug: "joel", name_ar: "يوئيل", testament: "old", chapters_count: 3, is_deutero: false },
  { slug: "amos", name_ar: "عاموس", testament: "old", chapters_count: 9, is_deutero: false },
  { slug: "obadiah", name_ar: "عوبديا", testament: "old", chapters_count: 1, is_deutero: false },
  { slug: "jonah", name_ar: "يونان", testament: "old", chapters_count: 4, is_deutero: false },
  { slug: "micah", name_ar: "ميخا", testament: "old", chapters_count: 7, is_deutero: false },
  { slug: "nahum", name_ar: "ناحوم", testament: "old", chapters_count: 3, is_deutero: false },
  { slug: "habakkuk", name_ar: "حبقوق", testament: "old", chapters_count: 3, is_deutero: false },
  { slug: "zephaniah", name_ar: "صفنيا", testament: "old", chapters_count: 3, is_deutero: false },
  { slug: "haggai", name_ar: "حجي", testament: "old", chapters_count: 2, is_deutero: false },
  { slug: "zechariah", name_ar: "زكريا", testament: "old", chapters_count: 14, is_deutero: false },
  { slug: "malachi", name_ar: "ملاخي", testament: "old", chapters_count: 4, is_deutero: false },
  { slug: "1maccabees", name_ar: "المكابيين الأول", testament: "old", chapters_count: 16, is_deutero: true },
  { slug: "2maccabees", name_ar: "المكابيين الثاني", testament: "old", chapters_count: 15, is_deutero: true },

  // New Testament (27 books)
  { slug: "matthew", name_ar: "إنجيل متى", testament: "new", chapters_count: 28, is_deutero: false },
  { slug: "mark", name_ar: "إنجيل مرقس", testament: "new", chapters_count: 16, is_deutero: false },
  { slug: "luke", name_ar: "إنجيل لوقا", testament: "new", chapters_count: 24, is_deutero: false },
  { slug: "john", name_ar: "إنجيل يوحنا", testament: "new", chapters_count: 21, is_deutero: false },
  { slug: "acts", name_ar: "سفر أعمال الرسل", testament: "new", chapters_count: 28, is_deutero: false },
  { slug: "romans", name_ar: "رومية", testament: "new", chapters_count: 16, is_deutero: false },
  { slug: "1corinthians", name_ar: "كورنثوس الأولى", testament: "new", chapters_count: 16, is_deutero: false },
  { slug: "2corinthians", name_ar: "كورنثوس الثانية", testament: "new", chapters_count: 13, is_deutero: false },
  { slug: "galatians", name_ar: "غلاطية", testament: "new", chapters_count: 6, is_deutero: false },
  { slug: "ephesians", name_ar: "أفسس", testament: "new", chapters_count: 6, is_deutero: false },
  { slug: "philippians", name_ar: "فيلبي", testament: "new", chapters_count: 4, is_deutero: false },
  { slug: "colossians", name_ar: "كولوسي", testament: "new", chapters_count: 4, is_deutero: false },
  { slug: "1thessalonians", name_ar: "تسالونيكي الأولى", testament: "new", chapters_count: 5, is_deutero: false },
  { slug: "2thessalonians", name_ar: "تسالونيكي الثانية", testament: "new", chapters_count: 3, is_deutero: false },
  { slug: "1timothy", name_ar: "تيموثاوس الأولى", testament: "new", chapters_count: 6, is_deutero: false },
  { slug: "2timothy", name_ar: "تيموثاوس الثانية", testament: "new", chapters_count: 4, is_deutero: false },
  { slug: "titus", name_ar: "تيطس", testament: "new", chapters_count: 3, is_deutero: false },
  { slug: "philemon", name_ar: "فليمون", testament: "new", chapters_count: 1, is_deutero: false },
  { slug: "hebrews", name_ar: "العبرانيين", testament: "new", chapters_count: 13, is_deutero: false },
  { slug: "james", name_ar: "يعقوب", testament: "new", chapters_count: 5, is_deutero: false },
  { slug: "1peter", name_ar: "بطرس الأولى", testament: "new", chapters_count: 5, is_deutero: false },
  { slug: "2peter", name_ar: "بطرس الثانية", testament: "new", chapters_count: 3, is_deutero: false },
  { slug: "1john", name_ar: "يوحنا الأولى", testament: "new", chapters_count: 5, is_deutero: false },
  { slug: "2john", name_ar: "يوحنا الثانية", testament: "new", chapters_count: 1, is_deutero: false },
  { slug: "3john", name_ar: "يوحنا الثالثة", testament: "new", chapters_count: 1, is_deutero: false },
  { slug: "jude", name_ar: "يهوذا", testament: "new", chapters_count: 1, is_deutero: false },
  { slug: "revelation", name_ar: "سفر الرؤيا", testament: "new", chapters_count: 22, is_deutero: false },
];

export default function BibleReaderPage() {
  const [testament, setTestament] = useState<"all" | "old" | "new">("all");
  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState(ALL_ORTHODOX_BOOKS[46]); // Matthew by default
  const [selectedChapter, setSelectedChapter] = useState(1);

  const filteredBooks = useMemo(() => {
    return ALL_ORTHODOX_BOOKS.filter((b) => {
      const matchTestament = testament === "all" || b.testament === testament;
      const matchSearch = !search.trim() || b.name_ar.includes(search.trim());
      return matchTestament && matchSearch;
    });
  }, [testament, search]);

  return (
    <div className="min-h-screen bg-alabasterBg pb-16">
      <PageHero
        title="قارئ الكتاب المقدس القبطي الأرثوذكسي"
        englishTitle="Orthodox Holy Bible Reader (73 Books)"
        description="تصفح وقراءة الأسفار المقدسة الـ 73 بعهديه القديم (بما فيه الأسفار القانونية الثانية) والعهد الجديد باللغة العربية والتشكيل الأصيل."
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
                  الكل (73)
                </button>
                <button
                  onClick={() => setTestament("old")}
                  className={`py-1.5 rounded-xl transition ${
                    testament === "old"
                      ? "bg-copticNavy text-white"
                      : "bg-copticGold-50 text-slateText-secondary hover:bg-copticGold-100"
                  }`}
                >
                  العهد القديم (46)
                </button>
                <button
                  onClick={() => setTestament("new")}
                  className={`py-1.5 rounded-xl transition ${
                    testament === "new"
                      ? "bg-copticNavy text-white"
                      : "bg-copticGold-50 text-slateText-secondary hover:bg-copticGold-100"
                  }`}
                >
                  العهد الجديد (27)
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
                      {b.is_deutero && (
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
                    {selectedBook.is_deutero && (
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
