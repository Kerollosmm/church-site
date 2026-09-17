import React from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Users,
  Church,
  ArrowLeft,
  Sparkles,
  Heart,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";

export function NewVisitorWelcome() {
  const visitorCards = [
    {
      title: "القداسات والصلوات اليومية",
      subtitle: "مواعيد القداسات والمذابح",
      description:
        "تقام القداسات الإلهية على مدار الأسبوع بمواعيد صباحية ومبكرة تناسب جميع أفراد الأسرة.",
      href: "/masses",
      ctaText: "جدول القداسات الأسبوعي",
      icon: Calendar,
      badge: "القداس الإلهي",
    },
    {
      title: "الوصول وموقع الكنيسة",
      subtitle: "العصافرة بحري — الإسكندرية",
      description:
        "تقع الكنيسة في موقع حيوي يسهل الوصول إليه من شارع جمال عبد الناصر أو طريق الكورنيش وشارع 45.",
      href: "/contact",
      ctaText: "العنوان ووسائل التواصل",
      icon: MapPin,
      badge: "الموقع الجغرافي",
    },
    {
      title: "مقابلة الآباء الكهنة والاعترافات",
      subtitle: "الرعاية الروحية والإرشاد",
      description:
        "يسعد مجمع الآباء الكهنة بلقائكم للاعتراف، المشورة الروحية، والصلوات الخاصة لسلام بيوتكم.",
      href: "/about/clergy",
      ctaText: "دليل الكهنة ومواعيدهم",
      icon: Users,
      badge: "الرعاية الكنسية",
    },
    {
      title: "الشفعاء وتاريخ الكنيسة",
      subtitle: "المذابح الثلاثة والمزارات",
      description:
        "تعرف على سيرة القديسين مكسيموس ودوماديوس والأنبا موسى الأسود، وتاريخ المذابح الثلاثة المدشنة.",
      href: "/about/altars",
      ctaText: "المذابح وتاريخ الكنيسة",
      icon: Church,
      badge: "بركة الشفعاء",
    },
  ];

  const etiquettePoints = [
    {
      title: "الحضور المبكر والسكينة",
      desc: "نوصي بالحضور قبل بدء قراءة الإنجيل لنوال بركة صلوات رفع بخور باكر وتهيئة القلب للصلاة.",
    },
    {
      title: "الوقار والحشمة في بيت الرب",
      desc: "الدخول بملابس محتشمة ولائقة بقدسية بيت الله وهيكله المقدس بكل خشوع وسلام.",
    },
    {
      title: "الخشوع والوقوف أثناء الصلوات",
      desc: "الوقوف باحترام أثناء قراءات الإنجيل المقدس وصلاة الصلح واستدعاء الروح القدس والتناول.",
    },
    {
      title: "نوال البركة المقدسة",
      desc: "التناول من الأسرار المقدسة للأرثوذكس المستعدين بالاعتراف والصوم، مع توزيع لقمة البركة على جميع الحاضرين بمحبة.",
    },
    {
      title: "الترحيب بالأسر والأطفال",
      desc: "الأطفال بركة الكنيسة وفرحها؛ نشجع الأسر على تعليم الصغار روح الهدوء والمشاركة في الصلوات والتسابيح.",
    },
  ];

  return (
    <section
      aria-labelledby="visitor-welcome-title"
      className="my-10 bg-white border-2 border-copticGold-300 rounded-3xl p-6 sm:p-8 md:p-10 shadow-xs relative overflow-hidden animate-fade-in"
    >
      {/* Decorative top accent */}
      <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-copticGold-400 via-copticNavy-700 to-copticGold-400" />

      {/* Header banner */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 bg-copticGold-100 text-copticGold-900 border border-copticGold-300 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold mb-4 animate-gold-glow">
          <Sparkles className="w-4 h-4 text-copticGold-700" />
          <span>أهلاً بك في بيتك الروحي</span>
        </div>

        <h2
          id="visitor-welcome-title"
          className="text-2xl sm:text-3xl md:text-4xl font-heading font-extrabold text-copticNavy mb-3"
        >
          أول مرة تزور كنيستنا؟
        </h2>

        <p className="text-sm sm:text-base text-slateText-secondary leading-relaxed mb-6 font-medium">
          نرحب بك بفرح في بيت الله — دليلك السريع للتعرف على كنيستنا وخدماتها
        </p>

        {/* Scripture Verse */}
        <div className="bg-alabasterBg rounded-2xl p-4 sm:p-5 border border-copticGold-200 text-copticNavy shadow-xs inline-block w-full max-w-2xl">
          <p className="font-scripture text-base sm:text-lg text-copticNavy-900 font-bold leading-loose">
            «أَمَّا أَنَا فَبِكَثْرَةِ رَحْمَتِكَ أَدْخُلُ بَيْتَكَ. أَسْجُدُ فِي هَيْكَلِ قُدْسِكَ بِخَوْفِكَ»
          </p>
          <span className="text-xs font-heading font-bold text-copticGold-800 mt-1 block">
            (مزمور 5: 7)
          </span>
        </div>
      </div>

      {/* 4 Accessible Visual Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6 mb-10">
        {visitorCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-alabasterBg hover:bg-white rounded-2xl p-5 sm:p-6 border border-copticGold-200 hover:border-copticGold-400 transition duration-200 shadow-xs flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-copticNavy text-copticGold-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold text-copticGold-800 bg-copticGold-100 px-2.5 py-1 rounded-full border border-copticGold-300">
                    {card.badge}
                  </span>
                </div>

                <h3 className="text-lg font-heading font-bold text-copticNavy mb-1 group-hover:text-copticNavy-700 transition-colors">
                  {card.title}
                </h3>
                <h4 className="text-xs font-semibold text-copticGold-700 mb-2.5">
                  {card.subtitle}
                </h4>
                <p className="text-xs sm:text-sm text-slateText-secondary leading-relaxed mb-5">
                  {card.description}
                </p>
              </div>

              <Link
                href={card.href}
                className="inline-flex items-center justify-between w-full bg-white group-hover:bg-copticNavy group-hover:text-white border border-copticGold-300 text-copticNavy font-heading font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all"
              >
                <span>{card.ctaText}</span>
                <ArrowLeft className="w-4 h-4 text-copticGold-600 group-hover:text-copticGold-300 group-hover:-translate-x-1 transition-all" />
              </Link>
            </div>
          );
        })}
      </div>

      {/* Practical Guide Box for Liturgical Reverence */}
      <div className="bg-copticNavy-900 text-white rounded-2xl p-6 sm:p-8 border border-copticGold-400 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-copticGold-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-copticGold-500/30">
            <div className="w-9 h-9 rounded-lg bg-copticGold-500/20 text-copticGold-300 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5 text-copticGold-300" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base sm:text-lg text-white">
                دليل الزائر لحضور الصلوات والقداسات الإلهية بسلام وخشوع
              </h3>
              <p className="text-xs text-copticGold-200">
                إرشادات محبة بسيطة تعينك على التمتع ببركة اللقاء الروحي في بيت الله
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs sm:text-sm">
            {etiquettePoints.map((point, index) => (
              <div
                key={index}
                className="bg-copticNavy-800/80 rounded-xl p-3.5 border border-copticGold-400/20 hover:border-copticGold-400/40 transition"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <CheckCircle2 className="w-4 h-4 text-copticGold-400 shrink-0" />
                  <span className="font-heading font-bold text-copticGold-300">
                    {point.title}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pr-6">
                  {point.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-copticGold-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-copticGold-200">
              <Heart className="w-4 h-4 text-copticGold-400 shrink-0" />
              <span>أبواب الكنيسة وقلوب خدامها مفتوحة دائماً لاستقبالكم بمحبة وفرح.</span>
            </div>
            <Link
              href="/contact"
              className="text-copticGold-300 hover:text-white font-bold inline-flex items-center gap-1 transition"
            >
              <span>هل لديك أي استفسار قبل زيارتك؟ تواصل معنا</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
