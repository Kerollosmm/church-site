// apps/admin/src/app/(protected)/page.tsx
// Unified administrative dashboard landing page (`/`).
// Provides cheap server-side overview metrics, quick navigation to all managers,
// and static pastoral guidance checklist for parish staff.

import React from "react";
import Link from "next/link";
import {
  Calendar,
  CalendarDays,
  Video,
  Building2,
  Compass,
  Layers,
  HeartHandshake,
  Image as ImageIcon,
  BellRing,
  FileClock,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  ClipboardList,
} from "lucide-react";
import { requireStaff } from "@/lib/auth/require-staff";
import { ADMIN_ROLE_LABELS_AR, adminRoleFromStaffRole } from "@church-site/domain";
import {
  getWeeklyMasses,
  getParishFacilityRepository,
  getParishVideoRepository,
  listAdminEvents,
  listAdminSeries,
  getParishNavigationRepository,
  listAdminMedia,
  getContentTypeRepository,
  getCondolenceBookings,
  listAdminSubscribers,
} from "@church-site/data-access";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  ADMIN_BUTTON_SECONDARY,
  ADMIN_PANEL,
  ADMIN_SECTION_HEADING,
  ADMIN_STAT_CARD,
  ADMIN_QUICK_CARD,
  ADMIN_BADGE,
} from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "لوحة التحكم الرئيسية — كنيسة القديسين مكسيموس ودوماديوس والأنبا موسى",
};

interface ManagerQuickLink {
  href: string;
  title: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

export default async function AdminDashboardPage(): Promise<React.ReactElement> {
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);
  const roleLabel = role ? ADMIN_ROLE_LABELS_AR[role] : "خادم";

  // Fetch server-side counts concurrently with safe fallbacks
  const [
    massesRes,
    facilitiesRes,
    videosRes,
    eventsRes,
    seriesRes,
    navRes,
    mediaRes,
    contentTypesRes,
    bookingsRes,
    subscribersRes,
  ] = await Promise.allSettled([
    getWeeklyMasses(),
    getParishFacilityRepository().listFacilities(),
    getParishVideoRepository().listVideos(),
    listAdminEvents(),
    listAdminSeries(),
    getParishNavigationRepository().listItems(),
    listAdminMedia(),
    getContentTypeRepository().listContentTypes({ includeInactive: true }),
    getCondolenceBookings(),
    listAdminSubscribers({ includeInactive: true }),
  ]);

  const massesCount = massesRes.status === "fulfilled" ? massesRes.value.length : 0;
  const facilitiesCount = facilitiesRes.status === "fulfilled" ? facilitiesRes.value.length : 0;
  const videosCount = videosRes.status === "fulfilled" ? videosRes.value.length : 0;
  const eventsCount = eventsRes.status === "fulfilled" ? eventsRes.value.length : 0;
  const seriesCount = seriesRes.status === "fulfilled" ? seriesRes.value.length : 0;
  const navCount = navRes.status === "fulfilled" ? navRes.value.length : 0;
  const mediaCount = mediaRes.status === "fulfilled" ? mediaRes.value.length : 0;
  const contentTypesCount = contentTypesRes.status === "fulfilled" ? contentTypesRes.value.length : 0;
  const allBookings = bookingsRes.status === "fulfilled" ? bookingsRes.value.bookings : [];
  const bookingsCount = allBookings.length;
  const pendingBookingsCount = allBookings.filter((b) => b.status === "pending").length;
  const subscribersCount = subscribersRes.status === "fulfilled" ? subscribersRes.value.length : 0;

  const statCards = [
    {
      title: "القداسات الأسبوعية",
      value: massesCount,
      unit: "قداس / عشية",
      href: "/masses",
      icon: Calendar,
      accent: "text-copticGold-600 bg-copticGold-50 border-copticGold-200",
    },
    {
      title: "الفعاليات والمواعيد",
      value: eventsCount + seriesCount,
      unit: `${eventsCount} فعالية · ${seriesCount} سلسلة`,
      href: "/events",
      icon: CalendarDays,
      accent: "text-blue-700 bg-blue-50 border-blue-200",
    },
    {
      title: "فيديوهات الكنيسة",
      value: videosCount,
      unit: "مقطع معتمد",
      href: "/videos",
      icon: Video,
      accent: "text-red-700 bg-red-50 border-red-200",
    },
    {
      title: "الخدمات والمرافق",
      value: facilitiesCount,
      unit: "خدمة / عيادة",
      href: "/services",
      icon: Building2,
      accent: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      title: "شريط التنقل والقوائم",
      value: navCount,
      unit: "عنصر وروابط",
      href: "/navigation",
      icon: Compass,
      accent: "text-indigo-700 bg-indigo-50 border-indigo-200",
    },
    {
      title: "نماذج المحتوى CMS",
      value: contentTypesCount,
      unit: "نموذج ديناميكي",
      href: "/content-types",
      icon: Layers,
      accent: "text-purple-700 bg-purple-50 border-purple-200",
    },
    {
      title: "حجوزات العزاء",
      value: bookingsCount,
      unit: pendingBookingsCount > 0 ? `${pendingBookingsCount} بانتظار الاعتماد` : "طلب مسجل",
      href: "/bookings",
      icon: HeartHandshake,
      accent: pendingBookingsCount > 0
        ? "text-amber-800 bg-amber-50 border-amber-300"
        : "text-teal-700 bg-teal-50 border-teal-200",
      highlight: pendingBookingsCount > 0,
    },
    {
      title: "مكتبة الوسائط",
      value: mediaCount,
      unit: "أصل وصورة",
      href: "/media",
      icon: ImageIcon,
      accent: "text-sky-700 bg-sky-50 border-sky-200",
    },
  ];

  const quickNavItems: ManagerQuickLink[] = [
    {
      href: "/masses",
      title: "إدارة القداسات الإلهية",
      description: "مواعيد القداسات الأسبوعية والعشيات وتعيين المذابح والتوقيتات وتفعيل أو إيقاف المواعيد.",
      icon: Calendar,
      badge: `${massesCount} قداس`,
    },
    {
      href: "/events",
      title: "الفعاليات والمواعيد",
      description: "إنشاء الفعاليات وتعديلها ونشرها، وإدارة السلاسل المتكررة والمناسبات الكنسية.",
      icon: CalendarDays,
      badge: `${eventsCount + seriesCount} عنصر`,
    },
    {
      href: "/videos",
      title: "فيديوهات الكنيسة",
      description: "إدارة وتضمين مقاطع الفيديو من YouTube وFacebook وروابط البث المباشر والترتيب.",
      icon: Video,
      badge: `${videosCount} فيديو`,
    },
    {
      href: "/services",
      title: "الخدمات والمرافق الكنسية",
      description: "دليل العيادات التخصصية، الخدمات التعليمية، الأنشطة، وأرقام التواصل الرسمية.",
      icon: Building2,
      badge: `${facilitiesCount} خدمة`,
    },
    {
      href: "/navigation",
      title: "شريط التنقل وقوائم الموقع",
      description: "تخصيص القائمة الرئيسية والفرعية، الروابط المنسدلة، الترتيب، وإظهار أو إخفاء الصفحات.",
      icon: Compass,
      badge: `${navCount} رابط`,
    },
    {
      href: "/content-types",
      title: "نماذج المحتوى (CMS)",
      description: "هيكلة النماذج التحريرية، الحقول الديناميكية، وإدارة مقالات وصفحات الأقسام المختلفة.",
      icon: Layers,
      badge: `${contentTypesCount} نموذج`,
    },
    {
      href: "/bookings",
      title: "حجوزات قاعة العزاء",
      description: "متابعة طلبات حجز قاعة العزاء الواردة من الشعب، مراجعة البيانات، والاعتماد أو الاعتذار.",
      icon: HeartHandshake,
      badge: pendingBookingsCount > 0 ? `${pendingBookingsCount} معلق` : `${bookingsCount} طلب`,
      badgeColor: pendingBookingsCount > 0 ? "border-amber-300 bg-amber-50 text-amber-900 font-bold" : undefined,
    },
    {
      href: "/media",
      title: "مكتبة الوسائط والأصول",
      description: "رفع الصور، فحص الأحجام والأبعاد، إدارة أصول الفعاليات والصفحات، والربط بالمنشورات.",
      icon: ImageIcon,
      badge: `${mediaCount} ملف`,
    },
    {
      href: "/subscribers",
      title: "المشتركون في التنبيهات",
      description: "قوائم البريد الإلكتروني لشعب الكنيسة الراغبين في استلام إشعارات الأنشطة والفعاليات.",
      icon: BellRing,
      badge: `${subscribersCount} مشترك`,
    },
    {
      href: "/audit",
      title: "سجل التدقيق والعمليات",
      description: "سجل رقابي دقيق لكافة عمليات الإنشاء والتعديل والحذف وتغيير الصلاحيات مع هوية الفاعل.",
      icon: FileClock,
      badge: "رقابة أمنية",
    },
  ];

  const pastoralChecklist = [
    {
      title: "مراجعة واعتماد طلبات حجز قاعة العزاء",
      description: "فحص أحدث طلبات العزاء الواردة والتواصل مع أسر المنتقلين وتأكيد الحجز لمنع تضارب المواعيد.",
      href: "/bookings",
      actionText: "فحص الحجوزات",
      urgent: pendingBookingsCount > 0,
    },
    {
      title: "التأكد من دقة مواعيد قداسات الأسبوع والأعياد",
      description: "مراجعة توقيتات القداسات وتوزيع الآباء الكهنة والمذابح قبل حلول المناسبات الكنسية.",
      href: "/masses",
      actionText: "مراجعة القداسات",
      urgent: false,
    },
    {
      title: "إضافة وسائط معتمدة وتحديث صور الفعاليات",
      description: "التأكد من توفير صور واضحة وذات أبعاد متوافقة مع شاشات الهواتف لكل فعالية منشورة.",
      href: "/media",
      actionText: "فتح مكتبة الوسائط",
      urgent: false,
    },
    {
      title: "المراجعة الدورية لسجل التدقيق الأمني",
      description: "متابعة التغييرات الأخيرة والتأكد من توافق كافة التعديلات التحريرية مع تعليمات السكرتارية.",
      href: "/audit",
      actionText: "عرض سجل التدقيق",
      urgent: false,
    },
  ];

  return (
    <div className="max-w-7xl space-y-8">
      {/* Top Admin Page Header */}
      <AdminPageHeader
        title="لوحة التحكم الرئيسية"
        description="نظرة شاملة على بيانات ومحتوى البوابة الرعوية، مع وصول سريع لجميع أقسام الإدارة وسجل التدقيق."
        roleLabel={roleLabel}
      >
        <Link href="/audit" className={ADMIN_BUTTON_SECONDARY}>
          <FileClock aria-hidden="true" className="h-4 w-4 text-copticGold-600" />
          <span>سجل التدقيق</span>
        </Link>
        <a
          href={process.env.NEXT_PUBLIC_SITE_URL || "/"}
          className={ADMIN_BUTTON_SECONDARY}
        >
          <ExternalLink aria-hidden="true" className="h-4 w-4 text-copticNavy-700" />
          <span>الموقع العام</span>
        </a>
      </AdminPageHeader>

      {/* Overview Stat Cards Grid */}
      <section aria-labelledby="overview-stats-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="overview-stats-heading" className={ADMIN_SECTION_HEADING}>
            إحصائيات ومؤشرات سريعة
          </h2>
          <span className="text-[11px] text-slate-500 font-bold">
            بيانات آنية محدثة مباشرة من الخادم
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.href}
                href={stat.href}
                className={`${ADMIN_STAT_CARD} group flex flex-col justify-between`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-heading font-bold text-slate-600 group-hover:text-copticNavy transition">
                    {stat.title}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 transition group-hover:scale-105 ${stat.accent}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-100 flex items-baseline justify-between">
                  <span className="text-2xl font-heading font-black text-copticNavy tracking-tight">
                    {stat.value}
                  </span>
                  <span
                    className={`text-[11px] font-bold ${
                      stat.highlight ? "text-amber-700 font-black animate-pulse" : "text-slate-500"
                    }`}
                  >
                    {stat.unit}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Quick Navigation Grid (10 Managers) */}
      <section aria-labelledby="quick-nav-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="quick-nav-heading" className={ADMIN_SECTION_HEADING}>
            أقسام الإدارة والتحكم (Quick Managers)
          </h2>
          <span className="text-[11px] text-slate-500 font-bold">
            10 بوابات فرعية متكاملة
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          {quickNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={ADMIN_QUICK_CARD}
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-copticNavy flex items-center justify-center shrink-0 group-hover:bg-copticGold-50 group-hover:border-copticGold-300 group-hover:text-copticGold-900 transition">
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-bold text-sm text-copticNavy group-hover:text-copticGold-900 transition">
                      {item.title}
                    </h3>
                    {item.badge ? (
                      <span
                        className={`${ADMIN_BADGE} ${
                          item.badgeColor || "border-slate-200 bg-slate-100 text-slate-700"
                        } border`}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="text-slate-300 group-hover:text-copticNavy group-hover:-translate-x-1 transition shrink-0">
                  <ArrowLeft className="w-5 h-5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Static Pastoral Checklist Section */}
      <section aria-labelledby="checklist-heading" className={ADMIN_PANEL}>
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-5">
          <div className="w-10 h-10 rounded-xl bg-copticNavy text-copticGold-400 flex items-center justify-center font-bold">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h2 id="checklist-heading" className={ADMIN_SECTION_HEADING}>
              إجراءات وتوجيهات المتابعة الرعوية
            </h2>
            <p className="text-xs text-slate-500">
              دليل عمل استرشادي لسكرتارية الكنيسة ومسؤولي النظام للحفاظ على جودة ودقة المحتوى المنشور.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pastoralChecklist.map((task, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition flex flex-col justify-between gap-3 ${
                task.urgent
                  ? "bg-amber-50/70 border-amber-200"
                  : "bg-slate-50/70 border-slate-200"
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${
                      task.urgent ? "text-amber-600" : "text-copticGold-600"
                    }`}
                  />
                  <h3 className="font-heading font-bold text-xs text-copticNavy">
                    {task.title}
                  </h3>
                  {task.urgent ? (
                    <span className="text-[10px] font-black text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full">
                      تتطلب إجراء
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pr-6">
                  {task.description}
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <Link
                  href={task.href}
                  className="text-xs font-heading font-bold text-copticNavy hover:text-copticGold-700 flex items-center gap-1 transition"
                >
                  <span>{task.actionText}</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
