import React from "react";
import Link from "next/link";
import {
  Calendar,
  Sparkles,
  BookOpen,
  GraduationCap,
  Users,
  Compass,
  HeartHandshake,
  DollarSign,
  Video,
  FileText,
  MapPin,
  ArrowLeft,
} from "lucide-react";

export function QuickServiceGrid() {
  const services = [
    {
      title: "القداسات والتسبحة",
      desc: "مواعيد قداسات الأسبوع على المذابح الثلاثة والعشيات",
      icon: Calendar,
      href: "/masses",
      tag: "مواعيد حية",
    },
    {
      title: "الاجتماعات الروحية وخدمة الشباب",
      desc: "اجتماعات الشباب والعائلات والخريجين والنهضات الروحية الدورية",
      icon: Sparkles,
      href: "/meetings",
      tag: "خدمة روحية",
    },
    {
      title: "قاعة العزاء",
      desc: "حجز القاعة المجهزة للمناسبات ومتابعة الحجوزات",
      icon: HeartHandshake,
      href: "/condolence",
      tag: "حجز إلكتروني",
    },
    {
      title: "التربية الكنسية",
      desc: "11 قطاعاً من مرحلة الحضانة وحتى كبار السن",
      icon: Users,
      href: "/meetings",
      tag: "مدارس الأحد",
    },
    {
      title: "المدارس والمعاهد",
      desc: "مدرسة الشمامسة ومعهد الكتاب وإعداد الخدام والكورال",
      icon: GraduationCap,
      href: "/education",
      tag: "تعليم كنسي",
    },
    {
      title: "الأنشطة والرعاية",
      desc: "فوج الكشافة، المكتبة العامة، النادي والكمبيوتر",
      icon: Compass,
      href: "/activities",
      tag: "أنشطة شبابية",
    },
    {
      title: "مرافق المجتمع",
      desc: "الحضانة، المطبخ الخيري، ومكتب التوظيف والسجل",
      icon: BookOpen,
      href: "/services",
      tag: "خدمات مجتمعية",
    },
    {
      title: "البث المباشر",
      desc: "متابعة صلوات القداسات والنهضات والاجتماعات مباشرة",
      icon: Video,
      href: "/live",
      tag: "بث عالي الجودة",
    },
    {
      title: "الكتاب المقدس",
      desc: "تصفح الـ 73 سفراً الأرثوذكسية مع البحث والتشكيل",
      icon: FileText,
      href: "/bible",
      tag: "دراسة وتأمل",
    },
    {
      title: "الحسابات البنكية",
      desc: "قنوات التبرع الرسمية لدعم أنشطة الكنيسة والفقراء",
      icon: DollarSign,
      href: "/donations",
      tag: "دعم الخدمة",
    },
  ];

  return (
    <div className="py-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
        <div>
          <span className="inline-flex items-center gap-1.5 bg-copticGold-100 text-copticGold-900 border border-copticGold-300 font-bold text-xs px-3 py-1 rounded-full">
            الدليل السريع
          </span>
          <h2 className="text-2xl font-heading font-extrabold text-copticNavy mt-2">
            خدمات ومرافق الكنيسة
          </h2>
        </div>
        <p className="text-slateText-secondary text-xs sm:text-sm max-w-md">
          تصفح مباشر لجميع القطاعات الخدمية والرعوية المتاحة مجاناً لشعب الإسكندرية.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {services.map((srv) => {
          const Icon = srv.icon;
          return (
            <Link
              key={srv.title}
              href={srv.href}
              className="rounded-2xl border border-copticGold-200 bg-white shadow-xs hover:border-copticGold-400 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:transform-none group flex flex-col justify-between p-4"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-copticGold-50 text-copticNavy group-hover:bg-copticNavy group-hover:text-copticGold-300 flex items-center justify-center transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] text-copticGold-800 font-bold bg-copticGold-50 px-2 py-0.5 rounded-full border border-copticGold-200">
                    {srv.tag}
                  </span>
                </div>
                <h3 className="font-heading font-bold text-sm text-copticNavy mb-1 group-hover:text-copticGold-800 transition-colors">
                  {srv.title}
                </h3>
                <p className="text-xs text-slateText-secondary line-clamp-2 leading-relaxed">
                  {srv.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-copticGold-800 font-medium group-hover:text-copticNavy">
                <span>تصفح المزيد</span>
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform motion-reduce:transition-none motion-reduce:group-hover:transform-none" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
