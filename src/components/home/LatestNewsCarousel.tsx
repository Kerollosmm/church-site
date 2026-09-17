import React from "react";
import Link from "next/link";
import { Bell, Calendar, ChevronLeft, Sparkles } from "lucide-react";
import type { Tables } from "@/types/database.types";

interface LatestNewsCarouselProps {
  news?: Tables<"news_articles">[];
}

export function LatestNewsCarousel({ news }: LatestNewsCarouselProps) {
  const defaultNews: Partial<Tables<"news_articles">>[] = [
    {
      title_ar: "بدء نهضة الشهيد القوي الأنبا موسى الأسود السنوية",
      summary_ar: "تتشرف الكنيسة بدعوة شعبها المبارك لحضور صلوات النهضة الروحية والعشيات بمشاركة نخبة من الآباء الأساقفة والكهنة الأجلاء.",
      excerpt_ar: "تتشرف الكنيسة بدعوة شعبها المبارك لحضور صلوات النهضة الروحية والعشيات بمشاركة نخبة من الآباء الأساقفة والكهنة الأجلاء.",
      category: "liturgical",
      published_at: "2026-06-20",
    },
    {
      title_ar: "استعدادات نهضة عيد الشهيد العظيم الأنبا موسى الأسود",
      summary_ar: "استعدادات مكثفة لترتيبات النهضة الروحية السنوية لشفيع الكنيسة وتجهيز قاعات الترانيم والصلوات وبرامج الأطفال المصاحبة.",
      excerpt_ar: "استعدادات مكثفة لترتيبات النهضة الروحية السنوية لشفيع الكنيسة وتجهيز قاعات الترانيم والصلوات وبرامج الأطفال المصاحبة.",
      category: "service",
      published_at: "2026-06-18",
    },
    {
      title_ar: "فتح باب التسجيل في معهد الكتاب المقدس والشمامسة",
      summary_ar: "يعلن معهد الكتاب المقدس ومدرسة القديس إستفانوس للشمامسة عن بدء قبول الدفعات الجديدة للموسم التعليمي القادم.",
      excerpt_ar: "يعلن معهد الكتاب المقدس ومدرسة القديس إستفانوس للشمامسة عن بدء قبول الدفعات الجديدة للموسم التعليمي القادم.",
      category: "education",
      published_at: "2026-06-15",
    },
  ];

  const items = (news && news.length > 0) ? news : defaultNews;

  return (
    <div className="py-8 border-t border-copticGold-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-copticNavy text-copticGold-300 flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl text-copticNavy">
              أحدث الأخبار والبيانات الرسمية
            </h2>
            <p className="text-xs text-slateText-secondary">
              إعلانات النهضات، مواعيد الأعياد، وفعاليات الخدمة
            </p>
          </div>
        </div>

        <Link
          href="/contact"
          className="text-xs font-bold text-copticGold-800 hover:text-copticNavy flex items-center gap-1"
        >
          <span>تواصل مع السكرتارية</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-5 border border-copticGold-200 hover:border-copticGold-400 transition-all hover:shadow-md flex flex-col justify-between"
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
                  {item.published_at?.split("T")[0] || "يونيو 2026"}
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
              <ChevronLeft className="w-4 h-4 text-copticGold-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
