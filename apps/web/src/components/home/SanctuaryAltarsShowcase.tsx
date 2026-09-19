import React from "react";
import Link from "next/link";
import {
  Church,
  Sparkles,
  Calendar,
  ArrowLeft,
  Flame,
  Award,
  BookOpen,
  Check,
} from "lucide-react";

export function SanctuaryAltarsShowcase() {
  const altars = [
    {
      orientation: "المذبح الأوسط الرئيسي",
      englishTitle: "The Main Central Altar",
      patronSaint: "السيدة العذراء مريم والقديسان مكسيموس ودوماديوس",
      consecration: "دُشن بيد البابا شنودة الثالث (1985)",
      liturgicalUsage:
        "تقام عليه قداسات الآحاد الرئيسية، الأعياد السيدية الكبرى، والصلوات الطقسية المركزية للكنيسة.",
      highlights: [
        "مكسو بالرخام الفاخر وحضن الآب الأيقونوغرافي",
        "القداس الرئيسي لأيام الآحاد والاحتفالات",
        "مدشن بزيت الميرون المقدس بمسحة رسولية",
      ],
      badgeColor: "bg-copticGold-100 text-copticGold-900 border-copticGold-300",
      accentBorder: "border-copticGold-400",
    },
    {
      orientation: "المذبح البحري",
      englishTitle: "The Northern Altar",
      patronSaint: "الشهيد العظيم مارجرجس الروماني",
      consecration: "مدشن بزيت الميرون المقدس",
      liturgicalUsage:
        "تقام عليه القداسات الإلهية الأسبوعية، صلوات العشيات، ونهضة عيد استشهاد أمير الشهداء مارجرجس.",
      highlights: [
        "مكرس لشفيع وأمير الشهداء مارجرجس",
        "قداسات إضافية تناسب طلبة المدارس والموظفين",
        "أيقونة تاريخية مباركة للشهيد العظيم",
      ],
      badgeColor: "bg-copticNavy-50 text-copticNavy-800 border-copticNavy-200",
      accentBorder: "border-copticNavy-300",
    },
    {
      orientation: "المذبح القبلي",
      englishTitle: "The Southern Altar",
      patronSaint: "القوي القديس الأنبا موسى الأسود",
      consecration: "مدشن ومجاور لمزار الرفات المقدسة",
      liturgicalUsage:
        "تقام عليه قداسات الفجر، نهضة الأنبا موسى الأسود السنوية، وتسبحة نصف الليل الأسبوعية المباركة.",
      highlights: [
        "مجاور لمزار رفات القديس الأنبا موسى للتبرك",
        "قداسات الصباح الباكر وصلوات الخلوات الروحية",
        "محطة روحية لطالبي التوبة والرجاء",
      ],
      badgeColor: "bg-amber-50 text-amber-900 border-amber-300",
      accentBorder: "border-amber-400",
    },
  ];

  return (
    <section
      aria-labelledby="sanctuary-altars-title"
      className="my-10 bg-white border-2 border-copticGold-300 rounded-3xl p-6 sm:p-8 md:p-10 shadow-xs relative overflow-hidden animate-fade-in"
    >
      {/* Decorative top border */}
      <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-copticGold-300 via-copticGold-500 to-copticNavy-800" />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 bg-copticGold-100 text-copticGold-900 border border-copticGold-300 font-bold text-xs px-3 py-1 rounded-full mb-4">
          <Church className="w-3.5 h-3.5 text-copticGold-700" />
          <span>المذابح المقدسة المدشنة بالميرون</span>
        </div>

        <h2
          id="sanctuary-altars-title"
          className="text-2xl sm:text-3xl md:text-4xl font-heading font-extrabold text-copticNavy mb-3"
        >
          مذابح كنيستنا الثلاثة
        </h2>

        <p className="text-slateText-secondary text-xs sm:text-sm leading-relaxed font-medium">
          ثلاثة هياكل مقدسة مدشنة بمسحة الميرون الغالي لرفع ذبيحة الشكر الإفخارستية والصلوات اليومية عن الكنيسة وسلام العالم
        </p>
      </div>

      {/* 3 Consecrated Altars Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {altars.map((altar, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-copticGold-200 bg-white shadow-xs hover:border-copticGold-400 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:transform-none flex flex-col justify-between p-6 group"
          >
            <div>
              {/* Orientation & Consecration Tag */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-copticNavy bg-white px-3 py-1 rounded-full border border-copticGold-300 shadow-2xs">
                  {altar.orientation}
                </span>
                <span className="text-[10px] font-english font-semibold text-copticGold-800 bg-copticGold-100/70 px-2 py-0.5 rounded-md">
                  {altar.englishTitle}
                </span>
              </div>

              {/* Patron Saint Name */}
              <h3 className="text-lg font-heading font-bold text-copticNavy mb-2 group-hover:text-copticNavy-700 transition-colors">
                {altar.patronSaint}
              </h3>

              {/* Consecration Note */}
              <div className="inline-flex items-center gap-1.5 text-xs text-copticGold-800 bg-copticGold-50 border border-copticGold-200 px-2.5 py-1 rounded-lg mb-4 w-full">
                <Award className="w-3.5 h-3.5 text-copticGold-700 shrink-0" />
                <span className="font-semibold">{altar.consecration}</span>
              </div>

              {/* Liturgical Usage */}
              <p className="text-xs sm:text-sm text-slateText-secondary leading-relaxed mb-4">
                {altar.liturgicalUsage}
              </p>

              {/* Highlights List */}
              <div className="space-y-1.5 mb-6 pt-3 border-t border-copticGold-200 text-xs">
                {altar.highlights.map((h, hIdx) => (
                  <div key={hIdx} className="flex items-start gap-1.5 text-slateText-primary">
                    <Check className="w-3.5 h-3.5 text-copticGold-700 mt-0.5 shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-copticGold-200 flex items-center justify-between text-xs">
              <Link
                href="/masses"
                className="text-copticNavy font-bold hover:text-copticNavy-700 inline-flex items-center gap-1"
              >
                <Calendar className="w-3.5 h-3.5 text-copticGold-600" />
                <span>قداسات هذا المذبح</span>
              </Link>
              <Link
                href="/about/altars"
                className="text-copticGold-800 hover:text-copticNavy font-bold inline-flex items-center gap-1"
              >
                <span>تفاصيل التدشين</span>
                <ArrowLeft className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Liturgical Usage & Canon Explanation Box */}
      <div className="bg-copticGold-50 rounded-2xl p-5 sm:p-6 border border-copticGold-300 flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-copticGold-500 text-copticNavy-950 flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5 text-copticNavy-950" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm sm:text-base text-copticNavy mb-1">
              النظام الطقسي للمذابح في الكنيسة القبطية الأرثوذكسية
            </h4>
            <p className="text-xs sm:text-sm text-slateText-secondary leading-relaxed">
              وفقاً للقوانين الكنسية الرسولية، لا تُقام الذبيحة الإلهية أكثر من مرة واحدة على المذبح ذاته في اليوم نفسه؛ لذا تتيح لنا المذابح الثلاثة إقامة قداسات متعددة في الصباح الباكر ليستفيد منها جميع أفراد الشعب والطلبة والموظفون.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/about/altars"
            className="inline-flex items-center gap-1.5 bg-copticNavy text-white hover:bg-copticNavy-700 font-heading font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-xs"
          >
            <span>استعراض مزارات المذابح</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link
            href="/masses"
            className="inline-flex items-center gap-1.5 bg-white hover:bg-copticGold-100 border border-copticGold-400 text-copticNavy font-heading font-bold text-xs px-4 py-2.5 rounded-xl transition"
          >
            <span>جدول القداسات الأسبوعي</span>
            <Calendar className="w-3.5 h-3.5 text-copticGold-700" />
          </Link>
        </div>
      </div>
    </section>
  );
}
