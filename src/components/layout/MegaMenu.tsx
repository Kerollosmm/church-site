"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import {
  Church,
  Calendar,
  Stethoscope,
  GraduationCap,
  Music,
  Users,
  HeartHandshake,
  Phone,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface MenuItem {
  title: string;
  description: string;
  href: string;
}

export interface MegaCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  items: MenuItem[];
}

export const MEGA_MENU_CATEGORIES: MegaCategory[] = [
  {
    id: "about",
    label: "عن الكنيسة",
    icon: Church,
    items: [
      { title: "شفيعا الكنيسة", description: "القديسان مكسيموس ودوماديوس والأنبا موسى الأسود", href: "/about/saints" },
      { title: "الآباء الكهنة", description: "مجمع كهنة الكنيسة وسير الرعاية الروحية", href: "/about/clergy" },
      { title: "تاريخ الكنيسة ومذابحها", description: "تأسيس الكنيسة وتدشين مذابحها وتذكاراتها", href: "/about/history" },
      { title: "مزار رفات القديسين", description: "بركة رفات الشهيد الأنبا موسى والقديسين", href: "/about/relics" },
    ],
  },
  {
    id: "masses",
    label: "القداسات والمناسبات",
    icon: Calendar,
    items: [
      { title: "جدول القداسات الإلهية", description: "مواعيد القداسات الأسبوعية عبر المذابح الثلاثة", href: "/masses" },
      { title: "العشيات والتسابيح", description: "تسبحة نصف الليل ورفع بخور عشية", href: "/masses/vespers" },
      { title: "النتيجة والأعياد القبطية", description: "التقويم القبطي ومواسم الأصوام والأعياد", href: "/calendar" },
      { title: "طلب سر المعمودية", description: "معلومات وإرشادات طقس المعمودية المباركة", href: "/sacraments/baptism" },
    ],
  },
  {
    id: "clinics",
    label: "العيادات التخصصية",
    icon: Stethoscope,
    items: [
      { title: "دليل الأطباء الشامل", description: "أطباء واستشاريو الكنيسة في مختلف التخصصات", href: "/clinics" },
      { title: "مواعيد العيادات", description: "الجداول الأسبوعية ومواعيد العمل بالمركز الطبي", href: "/clinics/schedule" },
      { title: "التخصصات الطبية", description: "الباطنة، الأطفال، الأسنان، العظام وغيرها", href: "/clinics/specialties" },
      { title: "خدمات الطوارئ والمختبر", description: "الإسعافات الأولية والفحوصات المخبرية", href: "/clinics/services" },
    ],
  },
  {
    id: "sunday-school",
    label: "مدارس الأحد",
    icon: Users,
    items: [
      { title: "مرحلة الطفولة والابتدائي", description: "فصول الحضانة والمرحلة الابتدائية للبنين والبنات", href: "/education/primary" },
      { title: "المرحلة الإعدادية", description: "أنشطة وبناء الشخصية للفتيان والفتيات", href: "/education/preparatory" },
      { title: "المرحلة الثانوية والجامعيين", description: "اجتماعات الشباب والمؤتمرات الروحية", href: "/education/youth" },
      { title: "إعداد الخدام", description: "دورات إعداد الخدام وتأهيل التعليم الكنسي", href: "/education/servants" },
    ],
  },
  {
    id: "academies",
    label: "الأكاديميات والمعاهد",
    icon: GraduationCap,
    items: [
      { title: "مدرسة الشمامسة", description: "تعليم الألحان القبطية والطقوس واللغة القبطية", href: "/programs/deacons" },
      { title: "أكاديمية كاروز", description: "دراسات الألحان الكنسية المتقدمة والموسيقى", href: "/programs/karouz" },
      { title: "معهد دراسات الكتاب المقدس", description: "تفسير أسفار العهدين القديم والجديد والعقيدة", href: "/programs/bible-institute" },
      { title: "المركز الثقافي والتنموي", description: "دورات اللغات، الحاسب الآلي، والمهارات الحياتية", href: "/programs/development" },
    ],
  },
  {
    id: "activities",
    label: "الأنشطة والكورال",
    icon: Music,
    items: [
      { title: "الكشافة الجوية", description: "مجموعة الشهيد الأنبا موسى الكشفية", href: "/activities/scouts" },
      { title: "كورال قيثارة", description: "فريق الترانيم الكنسية والتسبيح لجميع الأعمار", href: "/activities/choir" },
      { title: "النادي الصيفي", description: "رحلات وأنشطة صيفية وورش عمل للأطفال", href: "/activities/summer-club" },
      { title: "النشاط الرياضي", description: "دوريات الكنيسة وألعاب القوى وفرق كرة القدم", href: "/activities/sports" },
    ],
  },
  {
    id: "services",
    label: "الخدمات المجتمعية",
    icon: HeartHandshake,
    items: [
      { title: "حجز قاعة العزاء", description: "تسجيل طلب حجز قاعة المناسبات والعزاء وتتبع الحالة", href: "/condolence" },
      { title: "خدمة إخوة الرب", description: "الدعم الإنساني والاجتماعي للعائلات المستحقة", href: "/services/brethren" },
      { title: "رعاية كبار السن والمسنين", description: "الرعاية المنزلية والصحية والزيارات الروحية", href: "/services/seniors" },
      { title: "الاستشارات الأسرية", description: "جلسات التوجيه الأسري والمشورة الأرثوذكسية", href: "/services/family-counseling" },
    ],
  },
  {
    id: "contact",
    label: "التواصل والتبرعات",
    icon: Phone,
    items: [
      { title: "أرقام الكنيسة والعناوين", description: "شارع جمال عبد الناصر، العصافرة، الإسكندرية", href: "/contact" },
      { title: "التبرعات والمساهمات", description: "دعم خدمات الكنيسة ومبانيها والرعاية الطبية", href: "/donations" },
      { title: "استفسارات ورسائل الآباء", description: "إرسال رسالة مباشرة لسكرتارية الكنيسة أو الكاهن", href: "/contact#form" },
      { title: "خريطة الوصول ومواعيد الزيارة", description: "موقع الكنيسة على Google Maps ومواعيد الاستقبال", href: "/contact#map" },
    ],
  },
];

export function MegaMenu({
  activeMenu,
  onClose,
}: {
  activeMenu: string | null;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const activeCategory = MEGA_MENU_CATEGORIES.find((cat) => cat.id === activeMenu);
  if (!activeCategory) return null;

  return (
    <div
      ref={panelRef}
      onMouseLeave={onClose}
      className="absolute top-full inset-x-0 bg-surfaceCard border-b-2 border-copticGold-500 shadow-2xl py-8 px-6 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 pb-4 mb-6 border-b border-copticGold-100">
          <div className="p-2.5 rounded-2xl bg-copticNavy-50 text-copticNavy-700">
            <activeCategory.icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-copticNavy-700">
              {activeCategory.label}
            </h3>
            <p className="text-xs text-slateText-muted font-body">
              تصفح أقسام ومحتويات {activeCategory.label} المتاحة للجميع بدون تسجيل دخول
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeCategory.items.map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              onClick={onClose}
              className="group p-4 rounded-2xl border border-transparent hover:border-copticGold-300 hover:bg-copticGold-50/50 transition-all duration-150"
            >
              <h4 className="font-heading text-sm font-bold text-copticNavy-700 group-hover:text-copticGold-700 transition-colors">
                {item.title}
              </h4>
              <p className="font-body text-xs text-slateText-muted mt-1 leading-relaxed line-clamp-2">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
