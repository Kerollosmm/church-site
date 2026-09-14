import React from "react";
import Link from "next/link";
import {
  Calendar,
  Stethoscope,
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
import { SEED_CLINIC_SPECIALTIES } from "@/lib/data/seed-data";

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
      title: "المستوصف الخيري",
      desc: `${SEED_CLINIC_SPECIALTIES.length} عيادة تخصصية بأحدث الأجهزة وكشف رمزي`,
      icon: Stethoscope,
      href: "/clinics",
      tag: "خدمة طبية",
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
          <span className="text-xs font-bold text-copticGold-800 bg-copticGold-100 px-2.5 py-1 rounded-full">
            الدليل السريع
          </span>
          <h2 className="text-2xl font-heading font-bold text-copticNavy mt-2">
            خدمات ومرافق الكنيسة
          </h2>
        </div>
        <p className="text-xs text-slateText-secondary max-w-md">
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
              className="bg-white border border-copticGold-200 hover:border-copticGold-400 rounded-2xl p-4 transition-all hover:shadow-md hover:-translate-y-0.5 group flex flex-col justify-between"
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
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
