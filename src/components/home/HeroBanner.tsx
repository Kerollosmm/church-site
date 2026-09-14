import React from "react";
import Link from "next/link";
import { Calendar, Stethoscope, Video, HeartHandshake, PhoneCall, ChevronLeft, Sparkles } from "lucide-react";

export function HeroBanner() {
  return (
    <section className="relative bg-gradient-to-b from-copticNavy-900 via-copticNavy-800 to-copticNavy-900 text-white py-16 md:py-24 border-b-4 border-copticGold-500 overflow-hidden">
      {/* Decorative coptic background pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C5A880_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-copticGold-500/20 text-copticGold-300 border border-copticGold-400/30 px-4 py-1.5 rounded-full text-xs md:text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 text-copticGold-400" />
            <span>إيبارشية شرق الإسكندرية — الكنيسة القبطية الأرثوذكسية</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-extrabold text-white leading-tight mb-4">
            كنيسة القديسين مكسيموس ودوماديوس
            <span className="block text-copticGold-400 mt-2">والشهيد الأنبا موسى الأسود</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-200 leading-relaxed mb-8">
            العصافرة — الإسكندرية. نرحب بكم في بوابتكم الروحية والمجتمعية، حيث تجدون مواعيد القداسات، خدمات المستوصف الخيري، حجز قاعة العزاء، والأنشطة الرعوية لجميع الأعمار.
          </p>

          {/* Primary Quick CTA Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 max-w-2xl mx-auto mb-10">
            <Link
              href="/masses"
              className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-copticGold-400/40 backdrop-blur-xs transition group"
            >
              <Calendar className="w-6 h-6 text-copticGold-400 group-hover:scale-110 transition-transform mb-1.5" />
              <span className="text-xs sm:text-sm font-bold text-white">القداسات الإلهية</span>
              <span className="text-[10px] text-copticGold-200">المواعيد والمذابح</span>
            </Link>

            <Link
              href="/clinics"
              className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-copticGold-400/40 backdrop-blur-xs transition group"
            >
              <Stethoscope className="w-6 h-6 text-copticGold-400 group-hover:scale-110 transition-transform mb-1.5" />
              <span className="text-xs sm:text-sm font-bold text-white">المستوصف الطبي</span>
              <span className="text-[10px] text-copticGold-200">14 عيادة تخصصية</span>
            </Link>

            <Link
              href="/live"
              className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-copticGold-400/40 backdrop-blur-xs transition group"
            >
              <Video className="w-6 h-6 text-copticGold-400 group-hover:scale-110 transition-transform mb-1.5" />
              <span className="text-xs sm:text-sm font-bold text-white">البث المباشر</span>
              <span className="text-[10px] text-copticGold-200">الصلوات والنهضات</span>
            </Link>

            <Link
              href="/condolence"
              className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-copticGold-400/40 backdrop-blur-xs transition group"
            >
              <HeartHandshake className="w-6 h-6 text-copticGold-400 group-hover:scale-110 transition-transform mb-1.5" />
              <span className="text-xs sm:text-sm font-bold text-white">قاعة العزاء</span>
              <span className="text-[10px] text-copticGold-200">حجز واستعلام</span>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <Link
              href="/about/history"
              className="inline-flex items-center gap-1.5 bg-copticGold-500 hover:bg-copticGold-600 text-copticNavy-950 font-bold px-4 py-2 rounded-lg transition"
            >
              <span>تعرف على تاريخ الكنيسة والشفعاء</span>
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 bg-copticNavy-700/80 hover:bg-copticNavy-600 border border-copticGold-400/40 text-white px-4 py-2 rounded-lg transition"
            >
              <PhoneCall className="w-4 h-4 text-copticGold-400" />
              <span>أرقام الطوارئ والتواصل السريع</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
