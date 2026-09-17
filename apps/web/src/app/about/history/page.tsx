import React from "react";
import { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Church, Calendar, Award, Shield, Sparkles, ScrollText, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "تاريخ الكنيسة والشفعاء القديسين",
  description: "تاريخ ونشأة كنيسة القديسين مكسيموس ودوماديوس والشهيد الأنبا موسى الأسود بالعصافرة وتدشينها وشفعائها الأطهار.",
};

export default function HistoryPage() {
  const milestones = [
    {
      year: "1971",
      title: "وضع حجر الأساس وبداية الصلاة",
      desc: "بدأت نواة الكنيسة كخيمة صلاة صغيرة لخدمة أقباط منطقة العصافرة بحري وشارع 45، مع تزايد النمو السكاني والتوسع العمراني بالإسكندرية.",
    },
    {
      year: "1985",
      title: "التدشين الرسمي بيد البابا شنودة الثالث",
      desc: "تفضل مثلث الرحمات قداسة البابا المعظم الأنبا شنودة الثالث بتدشين المذبح الأوسط وتكريس الكنيسة على اسم القديسين مكسيموس ودوماديوس والأنبا موسى.",
    },
    {
      year: "1990",
      title: "توسعة الكنيسة وإضافة المذبحين البحري والقبلي",
      desc: "استكمال تشييد المذبح البحري باسم الشهيد الأنبا موسى الأسود، والمذبح القبلي باسم السيدة العذراء مريم والشهيد مارجرجس.",
    },
    {
      year: "2000",
      title: "إنشاء مبنى الخدمات الكنسية والمركز التعليمي",
      desc: "افتتاح الصرح الخدمي متعدد الطوابق الذي يضم قاعة العزاء، المركز التعليمي، وقاعات التربية الكنسية والحضانة النموذجية لخدمة مجتمع شرق الإسكندرية.",
    },
    {
      year: "2024",
      title: "تطوير المنظومة الرقمية والتحديث الشامل",
      desc: "تطوير البنية الرقمية الشاملة وتحديث قاعات التربية الكنسية وتدشين البوابة الرسمية التفاعلية لخدمة شعب الكنيسة وتسهيل الوصول للقداسات والخدمات دون عوائق.",
    },
  ];

  return (
    <div className="min-h-screen bg-alabasterBg pb-16">
      <PageHero
        title="تاريخ الكنيسة والشفعاء القديسين"
        englishTitle="Parish History & Patron Saints"
        description="تاريخ كنيستنا العريق في العصافرة، وسير الشفعاء الأطهار القديسين مكسيموس ودوماديوس والشهيد القوي الأنبا موسى الأسود."
        breadcrumbs={[
          { label: "عن الكنيسة", href: "/about" },
          { label: "تاريخ الكنيسة" },
        ]}
        icon={<ScrollText className="w-8 h-8 text-copticGold-300" />}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Patron Saints Section */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-copticGold-300 shadow-xs">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-copticGold-200">
            <Shield className="w-6 h-6 text-copticNavy" />
            <h2 className="font-heading font-bold text-2xl text-copticNavy">
              شفعاء الكنيسة الأطهار
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Maximus & Domadius */}
            <div className="bg-copticGold-50/60 rounded-2xl p-6 border border-copticGold-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-copticNavy bg-copticGold-200/80 px-2.5 py-1 rounded-full">
                    أميرا الروم المتنسكان
                  </span>
                  <span className="text-xs text-copticGold-800 font-bold">17 طوبة</span>
                </div>
                <h3 className="font-heading font-bold text-xl text-copticNavy mb-2">
                  القديسان مكسيموس ودوماديوس
                </h3>
                <p className="text-xs sm:text-sm text-slateText-secondary leading-relaxed">
                  ولدا في القسطنطينية ابنين للملك الروماني الأرثوذكسي فالنتينيانوس. تركا مجد العالم الزائل وطلبا الحياة الرهبانية الحقيقية في برية شيهيت بمصر تحت رعاية القديس العظيم مقاريوس الكبير. عاشا في صمت ونسك عميق حتى تنيحا في سن مبكرة، وصارا قدوة للشباب في تفضيل الملكوت السماوي.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-copticGold-200 text-xs text-copticNavy font-bold">
                شفيعا الطهارة والتجرد والخدمة الشبابية
              </div>
            </div>

            {/* Moses the Black */}
            <div className="bg-copticGold-50/60 rounded-2xl p-6 border border-copticGold-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-copticNavy bg-copticGold-200/80 px-2.5 py-1 rounded-full">
                    الشهيد العظيم القوي
                  </span>
                  <span className="text-xs text-copticGold-800 font-bold">24 بؤونة</span>
                </div>
                <h3 className="font-heading font-bold text-xl text-copticNavy mb-2">
                  الشهيد الأنبا موسى الأسود
                </h3>
                <p className="text-xs sm:text-sm text-slateText-secondary leading-relaxed">
                  نموذج التوبة الجارفة والجهاد الروحي العنيف الذي نقل إنساناً من رئيس عصابة قطاع طرق إلى أب روحي ومعلم في البرية وقديس عظيم وكاهن بار، ونال إكليل الشهادة عندما أغار البربر على دير البراموس. تضم كنيستنا مزاراً وبركة لجزء من رفاته المقدسة.
                </p>
              </div>
              <div className="mt-4 pt-3 border-copticGold-200 border-t text-xs text-copticNavy font-bold">
                شفيع التوبة والجهاد وغلبة الشهوات
              </div>
            </div>
          </div>
        </section>

        {/* Historical Milestones Timeline */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-copticGold-300 shadow-xs">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-copticGold-200">
            <Award className="w-6 h-6 text-copticNavy" />
            <h2 className="font-heading font-bold text-2xl text-copticNavy">
              محطات مضيئة في تاريخ الكنيسة والتدشين
            </h2>
          </div>

          <div className="relative border-r-2 border-copticGold-300 mr-4 md:mr-8 space-y-8 pr-6">
            {milestones.map((m, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -right-[33px] top-1 w-4 h-4 rounded-full bg-copticGold-500 border-4 border-white shadow-xs" />
                <div className="bg-alabasterBg rounded-2xl p-5 border border-copticGold-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold font-english text-white bg-copticNavy px-2.5 py-0.5 rounded-md">
                      {m.year}
                    </span>
                    <h3 className="font-heading font-bold text-base text-copticNavy">
                      {m.title}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slateText-secondary leading-relaxed">
                    {m.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
