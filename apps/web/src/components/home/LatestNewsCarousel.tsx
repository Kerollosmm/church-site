import React from "react";
import Link from "next/link";
import { Bell, Calendar, ChevronLeft, Sparkles } from "lucide-react";
import type { Tables } from "@church-site/domain";

interface LatestNewsCarouselProps {
  news?: Tables<"news_articles">[];
}

export function LatestNewsCarousel({ news }: LatestNewsCarouselProps) {
  if (!news || news.length === 0) {
    return (
      <section
        data-home-state="empty-news"
        aria-labelledby="latest-news-title"
        className="py-8 border-t border-copticGold-200"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-copticGold-100 text-copticGold-900 border border-copticGold-300 font-bold text-xs px-3 py-1 rounded-full mb-2">
              <Sparkles className="w-3.5 h-3.5 text-copticGold-700" />
              <span>بيانات وإعلانات رسمية</span>
            </span>
            <h2 id="latest-news-title" className="font-heading font-extrabold text-xl sm:text-2xl text-copticNavy mt-1">
              أحدث الأخبار والبيانات الرسمية
            </h2>
            <p className="text-slateText-secondary text-xs sm:text-sm">
              إعلانات النهضات، مواعيد الأعياد، وفعاليات الخدمة
            </p>
          </div>

          <Link
            href="/contact"
            className="text-xs font-bold text-copticGold-800 hover:text-copticNavy flex items-center gap-1 shrink-0"
          >
            <span>تواصل مع السكرتارية</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="rounded-2xl border border-dashed border-copticGold-300 bg-white/60 p-8 text-center">
          <Bell className="w-8 h-8 text-copticGold-600 mx-auto mb-2 opacity-60" />
          <p className="text-xs sm:text-sm text-slateText-secondary font-medium">
            لا توجد بيانات أو إعلانات جديدة منشورة حالياً. ستظهر هنا كافة الأخبار الرسمية والنهضات فور صدورها.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      data-home-state="news-list"
      aria-labelledby="latest-news-title"
      className="py-8 border-t border-copticGold-200"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 bg-copticGold-100 text-copticGold-900 border border-copticGold-300 font-bold text-xs px-3 py-1 rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5 text-copticGold-700" />
            <span>بيانات وإعلانات رسمية</span>
          </span>
          <h2 id="latest-news-title" className="font-heading font-extrabold text-xl sm:text-2xl text-copticNavy mt-1">
            أحدث الأخبار والبيانات الرسمية
          </h2>
          <p className="text-slateText-secondary text-xs sm:text-sm">
            إعلانات النهضات، مواعيد الأعياد، وفعاليات الخدمة
          </p>
        </div>

        <Link
          href="/contact"
          className="text-xs font-bold text-copticGold-800 hover:text-copticNavy flex items-center gap-1 shrink-0"
        >
          <span>تواصل مع السكرتارية</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {news.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-copticGold-200 bg-white shadow-xs hover:border-copticGold-400 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:transform-none flex flex-col justify-between p-5 group"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-copticGold-800 mb-3">
                <span className="bg-copticGold-50 px-2.5 py-0.5 rounded-md border border-copticGold-200 font-medium">
                  {item.category === "liturgical"
                    ? "طقسي ونهضات"
                    : item.category === "service"
                    ? "نهضات ومناسبات"
                    : "تعليم ورعاية"}
                </span>
                <span className="flex items-center gap-1 text-slateText-muted">
                  <Calendar className="w-3 h-3" />
                  {item.published_at?.split("T")[0] || ""}
                </span>
              </div>

              <h3 className="font-heading font-bold text-base text-copticNavy mb-2 leading-snug">
                {item.title_ar}
              </h3>
              <p className="text-xs text-slateText-secondary leading-relaxed">
                {item.excerpt_ar || item.summary_ar}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-copticNavy font-bold">
              <span>تفاصيل الخبر</span>
              <ChevronLeft className="w-4 h-4 text-copticGold-700 transition-transform group-hover:-translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:transform-none" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
