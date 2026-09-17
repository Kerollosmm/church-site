import React from "react";
import Link from "next/link";
import {
  Calendar,
  CalendarDays,
  HeartHandshake,
  Users,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ShieldCheck,
  FileClock,
  Image as ImageIcon,
} from "lucide-react";
import {
  getChurchMeetings,
  getCondolenceBookings,
  getWeeklyMasses,
} from "@/lib/queries";
import { listAdminEvents, listAdminSeries } from "@/lib/events/admin";

export const metadata = {
  title: "لوحة التحكم الإدارية — كنيسة القديسين بالعصافرة",
};

export default async function AdminDashboardPage() {
  const [masses, meetings, bookingsRead] = await Promise.all([
    getWeeklyMasses(),
    getChurchMeetings(),
    getCondolenceBookings(),
  ]);

  // The events store is read through its own admin reader. A store failure must not take the whole
  // dashboard down, so the card degrades to a "تعذّر الجلب" line instead of throwing.
  let publishedEvents: number | null = null;
  let draftEvents: number | null = null;
  let seriesCount: number | null = null;

  try {
    const [events, series] = await Promise.all([listAdminEvents(), listAdminSeries()]);
    publishedEvents = events.filter((row) => row.event.status === "published").length;
    draftEvents = events.filter((row) => row.event.status === "draft").length;
    seriesCount = series.length;
  } catch (error) {
    console.error("[admin] dashboard events summary failed", {
      reason: error instanceof Error ? error.message : String(error),
    });
  }

  const pendingBookings = bookingsRead.bookings.filter((b) => b.status === "pending").length;

  const stats = [
    {
      title: "القداسات الأسبوعية",
      value: `${masses.length} قداسات`,
      desc: "على مذابح الكنيسة",
      icon: Calendar,
      href: "/admin/masses",
      color: "bg-blue-50 text-blue-800 border-blue-200",
    },
    {
      title: "الفعاليات والمواعيد",
      value: publishedEvents === null ? "—" : `${publishedEvents} منشورة`,
      desc:
        publishedEvents === null
          ? "تعذّر جلب بيانات الفعاليات"
          : `${draftEvents ?? 0} مسودة · ${seriesCount ?? 0} سلسلة متكررة`,
      icon: CalendarDays,
      href: "/admin/events",
      color: "bg-copticGold-50 text-copticGold-900 border-copticGold-200",
    },
    {
      title: "طلبات حجز العزاء",
      // Real count of the requests awaiting a decision — never a decorative status word.
      value: bookingsRead.errorMessageAr ? "—" : `${pendingBookings} قيد المراجعة`,
      desc: bookingsRead.errorMessageAr ? "تعذّر جلب الطلبات" : "متابعة وإقرار المواعيد",
      icon: HeartHandshake,
      href: "/admin/bookings",
      color: "bg-amber-50 text-amber-800 border-amber-200",
    },
    {
      title: "قطاعات التربية الكنسية",
      value: `${meetings.length} قطاعاً`,
      desc: "من الحضانة حتى الشيوخ",
      icon: Users,
      href: "/meetings",
      color: "bg-purple-50 text-purple-800 border-purple-200",
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-bold text-copticGold-800 bg-copticGold-100 px-2.5 py-0.5 rounded-full">
            سكرتارية الكنيسة
          </span>
          <h1 className="text-2xl font-heading font-bold text-copticNavy mt-1">
            لوحة الإشراف والمتابعة الإدارية
          </h1>
          <p className="text-xs text-slate-500">
            إدارة الفعاليات والمواعيد، الجداول الطقسية، مراجعة طلبات حجز قاعة العزاء، وتحديث دليل التخصصات الطبية.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-bold text-slate-700">النظام جاهز ومستقر</span>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <Link
              key={idx}
              href={s.href}
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-copticNavy transition shadow-xs flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${s.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-slate-400 group-hover:text-copticNavy transition">
                    إدارة
                  </span>
                </div>
                <h3 className="font-heading font-bold text-sm text-slate-800 mb-1">{s.title}</h3>
                <div className="text-xl font-bold font-heading text-copticNavy">{s.value}</div>
                <p className="text-[11px] text-slate-500 mt-1">{s.desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-copticNavy font-bold">
                <span>فتح القسم</span>
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Overview Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick actions & guidelines */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-heading font-bold text-base text-copticNavy flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-copticNavy" />
            <span>الضوابط والمعايير المعمارية للموقع</span>
          </h3>
          <ul className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>معيار INV-01:</strong> كافة المسارات العامة مفتوحة دون أي حاجة لتسجيل دخول للمواطنين وشعب الكنيسة.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>معيار الوصولية WCAG 2.1 AA:</strong> تباين ألوان عالي ومناسب لكبار السن مع دعم كامل للغة العربية واتجاه RTL.
              </span>
            </li>
          </ul>
        </div>

        {/* Operational Quick Links */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-heading font-bold text-base text-copticNavy flex items-center gap-2">
            <Clock className="w-5 h-5 text-copticNavy" />
            <span>الإجراءات السريعة للسكرتارية</span>
          </h3>
          <div className="space-y-2 text-xs">
            <Link
              href="/admin/events"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition border border-slate-200"
            >
              <span className="font-bold text-slate-800">إدارة الفعاليات والمواعيد والسلاسل المتكررة</span>
              <ArrowLeft className="w-4 h-4 text-copticNavy" />
            </Link>
            <Link
              href="/admin/events/new"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition border border-slate-200"
            >
              <span className="font-bold text-slate-800">إنشاء فعالية جديدة</span>
              <ArrowLeft className="w-4 h-4 text-copticNavy" />
            </Link>
            <Link
              href="/admin/audit"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition border border-slate-200"
            >
              <span className="font-bold text-slate-800">مراجعة سجل التدقيق (كل تعديل ومن قام به)</span>
              <ArrowLeft className="w-4 h-4 text-copticNavy" />
            </Link>
            <Link
              href="/admin/media"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition border border-slate-200"
            >
              <span className="font-bold text-slate-800">تسجيل بيانات ملفات الوسائط وروابطها</span>
              <ArrowLeft className="w-4 h-4 text-copticNavy" />
            </Link>
            <Link
              href="/admin/subscribers"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition border border-slate-200"
            >
              <span className="font-bold text-slate-800">قائمة المشتركين في تنبيهات الفعاليات (إيقاف/تنشيط)</span>
              <ArrowLeft className="w-4 h-4 text-copticNavy" />
            </Link>
            <Link
              href="/admin/bookings"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition border border-slate-200"
            >
              <span className="font-bold text-slate-800">مراجعة واعتماد طلبات حجز قاعة العزاء الجديدة</span>
              <ArrowLeft className="w-4 h-4 text-copticNavy" />
            </Link>
            <Link
              href="/admin/masses"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition border border-slate-200"
            >
              <span className="font-bold text-slate-800">عرض جداول ومواعيد القداسات الحالية</span>
              <ArrowLeft className="w-4 h-4 text-copticNavy" />
            </Link>
          </div>

          <p className="text-[11px] leading-relaxed text-slate-500 border-t border-slate-100 pt-3">
            مكتبة الوسائط تُسجّل <strong>بيانات وصفية وروابط فقط</strong> — لا يوجد رفع للملفات ولا تخزين للبايتات على
            هذا الموقع.
          </p>
        </div>

        {/* Explicit scope marker: these modules are NOT implemented yet. */}
        <div className="bg-white rounded-3xl p-6 border border-dashed border-amber-300 shadow-xs space-y-3 lg:col-span-2">
          <h3 className="font-heading font-bold text-base text-amber-900">
            وحدات إدارية لم تُنفَّذ بعد
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            الشاشات التالية مخططة ولم تُبنَ بعد، ولا تعرض أي بيانات حالياً:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
            <li className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100">
              صندوق رسائل التواصل والاستفسارات الرعوية
            </li>
            <li className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100">
              مراجعة طلبات التسجيل في المدارس والأنشطة
            </li>
            <li className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100">
              مراجعة طلبات التوظيف
            </li>
            <li className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100">
              محرر شريط التنبيهات المركزي
            </li>
            <li className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100">
              جدولة البث المباشر والأرشيف
            </li>
            <li className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100">
              تحرير جداول القداسات والاستثناءات الموسمية
            </li>
            <li className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100">
              محرر مصطلحات التصنيف الستة (تُقرأ حالياً من مخزن البيانات كما هي)
            </li>
            <li className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100">
              رفع ملفات الوسائط (بايتات) — التسجيل الحالي بيانات وصفية وروابط فقط
            </li>
          </ul>
          <p className="text-[11px] leading-relaxed text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
            <strong>منفَّذ الآن:</strong> إدارة الفعاليات (إنشاء/تعديل/نشر/إلغاء/نسخ/حذف)، السلاسل المتكررة مع إلغاء أو
            نقل موعد واحد، سجل التدقيق، مكتبة الوسائط (بيانات وصفية)، واشتراكات تنبيهات الفعاليات (تُحفظ وتُعرض فقط —
            <strong> لا يُرسل أي بريد إلكتروني </strong>
            حتى ربط مزوّد بريد).
          </p>
        </div>
      </div>
    </div>
  );
}
