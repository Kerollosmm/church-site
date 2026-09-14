import React from "react";
import Link from "next/link";
import {
  Calendar,
  HeartHandshake,
  Stethoscope,
  Users,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import {
  SEED_MASS_SCHEDULES,
  SEED_CLINIC_DOCTORS,
  SEED_CLINIC_SPECIALTIES,
  SEED_CHURCH_MEETINGS,
} from "@/lib/queries";

export const metadata = {
  title: "لوحة التحكم الإدارية — كنيسة القديسين بالعصافرة",
};

export default function AdminDashboardPage() {
  const stats = [
    {
      title: "القداسات الأسبوعية",
      value: `${SEED_MASS_SCHEDULES.length} قداسات`,
      desc: "على المذابح الثلاثة",
      icon: Calendar,
      href: "/admin/masses",
      color: "bg-blue-50 text-blue-800 border-blue-200",
    },
    {
      title: "طلبات حجز العزاء",
      value: "نشط",
      desc: "متابعة وإقرار المواعيد",
      icon: HeartHandshake,
      href: "/admin/bookings",
      color: "bg-amber-50 text-amber-800 border-amber-200",
    },
    {
      title: "أطباء المستوصف",
      value: `${SEED_CLINIC_DOCTORS.length} طبيباً`,
      desc: "في 14 عيادة تخصصية",
      icon: Stethoscope,
      href: "/admin/clinics",
      color: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    {
      title: "قطاعات التربية الكنسية",
      value: `${SEED_CHURCH_MEETINGS.length} قطاعاً`,
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
            إدارة الجداول الطقسية، مراجعة طلبات حجز قاعة العزاء، وتحديث بيانات الأطباء.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-bold text-slate-700">النظام جاهز ومستقر</span>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <div className="text-xl font-bold font-english text-copticNavy">{s.value}</div>
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
                <strong>معيار المستوصف:</strong> الدليل طبي استاتيكي موثوق، ولا يتم عرض تيكر للاعتذارات لحماية خصوصية الأطباء والمرضى.
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
              <span className="font-bold text-slate-800">تحديث جداول ومواعيد القداسات الاستثنائية للأعياد</span>
              <ArrowLeft className="w-4 h-4 text-copticNavy" />
            </Link>
            <Link
              href="/admin/clinics"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition border border-slate-200"
            >
              <span className="font-bold text-slate-800">تعديل مواعيد أطباء العيادات الخارجية التخصصية</span>
              <ArrowLeft className="w-4 h-4 text-copticNavy" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
