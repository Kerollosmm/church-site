import React from "react";
import Link from "next/link";
import {
  Shield,
  Crown,
  Flame,
  ArrowLeft,
  Sparkles,
  Calendar,
  BookOpen,
  Heart,
  ExternalLink,
} from "lucide-react";

export function PatronSaintsSection() {
  const saints = [
    {
      name: "القديسان مكسيموس ودوماديوس",
      subtitle: "أولاد ملك الروم ورهبان برية شيهيت الأبرار",
      feastDay: "عيد النياحة: 17 طوبة",
      badgeTitle: "أميرا الروم المتنسكان",
      virtues: ["البتولية والطهارة", "التجرد الكامل", "حياة الصمت والهدوء", "محبة السماء الفائقة"],
      summary:
        "ولدا في القسطنطينية ابنين لملك الروم فالنتينيانوس. تركا المجد الإمبراطوري الزائل وتوجها إلى برية شيهيت ليعيشا في قلاية متواضعة في الصوم والصلوات الدائمة تحت إرشاد القديس مقاريوس الكبير، حتى تنيحا في ريعان شبابهما وصارا فخراً للرهبنة وقدوة للطهارة والنسك.",
      spiritualSaying:
        "«تركا عظمة الملك الأرضي طلباً للملكوت الأبدي، فصارا شعلتي نور في صحراء مصر المباركة.»",
      icon: Crown,
      accentColor: "from-copticGold-500/10 to-copticNavy-900/40",
      altarNote: "مكرس لهما المذبح الأوسط التاريخي بالكنيسة",
    },
    {
      name: "الشهيد القوي الأنبا موسى الأسود",
      subtitle: "معلم التوبة وشهيد المحبة والإفراز",
      feastDay: "عيد الاستشهاد: 24 بؤونة",
      badgeTitle: "أيقونة التوبة والرجاء",
      virtues: ["قوة التوبة الصادقة", "احتمال الضعفاء والستر", "الوداعة والاتضاع", "بذل النفس حتى الشهادة"],
      summary:
        "تحول بنعمة المسيح الفائقة من رئيس قطاع طرق إلى أعظم آباء البرية نسكاً وحكمة وإفرازاً. علّم الأجيال ألا يدينوا أحداً وأن يستروا على خطايا إخوتهم. نال إكليل الشهادة بدير البراموس رافضاً حمل السلاح، وتتشرف كنيستنا باحتضان مزار مقدس وبركة لجزء من رفاته الطاهرة.",
      spiritualSaying:
        "«الذي يعتقد في نفسه أنه بلا عيب، فقد حوى في ذاته جميع العيوب — التواضع يستر الضعفات.»",
      icon: Flame,
      accentColor: "from-amber-600/10 to-copticNavy-900/40",
      altarNote: "مكرس باسمه مذبح الكنيسة ومزاره للتبرك برفاته",
    },
  ];

  return (
    <section
      aria-labelledby="patron-saints-title"
      className="my-10 bg-gradient-to-b from-copticNavy-900 via-copticNavy-800 to-copticNavy-950 text-white rounded-3xl p-6 sm:p-8 md:p-10 border-2 border-copticGold-400 shadow-lg relative overflow-hidden animate-slide-up"
    >
      {/* Decorative Coptic Pattern Background */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C5A880_1.5px,transparent_1.5px)] [background-size:20px_20px] pointer-events-none" />

      {/* Illuminated Golden Accent Blur */}
      <div className="absolute -top-24 right-1/4 w-96 h-96 bg-copticGold-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 bg-copticGold-500/20 text-copticGold-300 border border-copticGold-400/40 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold mb-4 animate-gold-glow">
            <Sparkles className="w-4 h-4 text-copticGold-400" />
            <span>بركة شفعاء الكنيسة الأطهار</span>
          </div>

          <h2
            id="patron-saints-title"
            className="text-2xl sm:text-3xl md:text-4xl font-heading font-extrabold text-white mb-3"
          >
            شفعاء كنيستنا وحماتها الروحيون
          </h2>

          <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
            تتشرف كنيستنا في الإسكندرية بأن تحمل اسم شفعاء عظام يعلّموننا النسك والتوبة والمحبة الباذلة، وتفيض صلواتهم بالبركة والسلام لرعيتنا.
          </p>
        </div>

        {/* Saints Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-10">
          {saints.map((saint, idx) => {
            const Icon = saint.icon;
            return (
              <div
                key={idx}
                className="bg-copticNavy-800/90 hover:bg-copticNavy-800 rounded-2xl p-6 sm:p-8 border border-copticGold-400/30 hover:border-copticGold-400 transition-all duration-300 shadow-md flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Subtle card top gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${saint.accentColor} pointer-events-none opacity-50 group-hover:opacity-75 transition-opacity`} />

                <div className="relative">
                  {/* Badge & Feast Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-copticGold-400/20">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-copticGold-300 bg-copticGold-500/20 border border-copticGold-400/40 px-3 py-1 rounded-full">
                      <Icon className="w-3.5 h-3.5 text-copticGold-400" />
                      <span>{saint.badgeTitle}</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-xs text-copticGold-200 bg-copticNavy-900/60 px-3 py-1 rounded-full border border-copticNavy-700 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-copticGold-400" />
                      <span>{saint.feastDay}</span>
                    </span>
                  </div>

                  {/* Name and Subtitle */}
                  <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-white mb-1 group-hover:text-copticGold-300 transition-colors">
                    {saint.name}
                  </h3>
                  <h4 className="text-xs sm:text-sm text-copticGold-300 font-medium mb-4">
                    {saint.subtitle}
                  </h4>

                  {/* Virtues Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {saint.virtues.map((v, vIdx) => (
                      <span
                        key={vIdx}
                        className="text-[11px] bg-copticNavy-900/80 text-slate-200 px-2.5 py-0.5 rounded-md border border-copticGold-500/20 font-medium"
                      >
                        {v}
                      </span>
                    ))}
                  </div>

                  {/* Summary */}
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                    {saint.summary}
                  </p>

                  {/* Spiritual Saying / Meditation */}
                  <div className="bg-copticNavy-950/70 rounded-xl p-3.5 border-r-4 border-copticGold-400 mb-5 text-xs text-copticGold-200 italic leading-relaxed">
                    {saint.spiritualSaying}
                  </div>
                </div>

                <div className="relative pt-4 border-t border-copticGold-400/20 flex items-center justify-between text-xs">
                  <span className="text-copticGold-300 font-bold text-[11px] sm:text-xs">
                    {saint.altarNote}
                  </span>
                  <Link
                    href="/about/history"
                    className="inline-flex items-center gap-1 text-copticGold-300 hover:text-white font-bold transition"
                  >
                    <span>السيرة كاملة</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Navigation Links */}
        <div className="bg-copticNavy-950/80 rounded-2xl p-5 border border-copticGold-400/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-right">
            <div className="w-10 h-10 rounded-xl bg-copticGold-500/20 text-copticGold-300 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-copticGold-400" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-heading font-bold text-white">
                تاريخ الكنيسة العريق ومسيرة التدشين
              </div>
              <div className="text-xs text-copticGold-200">
                اقرأ عن وضع حجر الأساس عام 1971 وتدشين البابا شنودة الثالث عام 1985
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/about/history"
              className="inline-flex items-center gap-1.5 bg-copticGold-500 hover:bg-copticGold-600 text-copticNavy-950 font-heading font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-xs"
            >
              <span>تاريخ الكنيسة والشفعاء</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Link
              href="/about/altars"
              className="inline-flex items-center gap-1.5 bg-copticNavy-800 hover:bg-copticNavy-700 border border-copticGold-400/40 text-white font-heading font-bold text-xs px-4 py-2.5 rounded-xl transition"
            >
              <span>المذابح والمزارات</span>
              <ExternalLink className="w-3.5 h-3.5 text-copticGold-400" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
