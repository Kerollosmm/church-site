import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import {
  Stethoscope,
  Heart,
  Clock,
  CheckCircle2,
  ArrowLeft,
  DollarSign,
  Layers,
} from "lucide-react";
import { getClinicSpecialties } from "@/lib/queries";

export const metadata: Metadata = {
  title: "المستوصف الطبي الخيري التخصصي",
  description: "المستوصف الطبي الخيري بكنيسة القديسين بالعصافرة: 14 عيادة تخصصية بأحدث التجهيزات وبكشف رمزي 30-35 جنيهاً لخدمة جميع المواطنين.",
};

export const revalidate = 86400;

export default async function ClinicsOverviewPage() {
  const specialties = await getClinicSpecialties();

  return (
    <div className="min-h-screen bg-alabasterBg pb-16">
      <PageHero
        title="المستوصف الطبي الخيري التخصصي"
        englishTitle="Parish Charitable Medical Clinics"
        description="صرح طبي إنساني متكامل يقدم رعاية صحية تخصصية متميزة لكافة المواطنين برسم كشف رمزي (30 - 35 جنيهاً مصرياً)."
        breadcrumbs={[{ label: "المستوصف الطبي" }]}
        icon={<Stethoscope className="w-8 h-8 text-copticGold-300" />}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Nominal Fee & Non-Discrimination Banner */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border-2 border-emerald-500 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-right">
            <div className="inline-flex items-center gap-2 bg-emerald-700/60 border border-emerald-400/40 text-emerald-200 text-xs px-3 py-1 rounded-full font-bold">
              <DollarSign className="w-4 h-4" />
              <span>تسعيرة رمزية غير هادفة للربح</span>
            </div>
            <h2 className="font-heading font-bold text-2xl text-white">
              قيمة الكشف: 30 إلى 35 جنيهاً مصرياً فقط
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
              خدمة طبية إنسانية مفتوحة لجميع أهالي الإسكندرية دون أي تمييز، تشمل الكشف ومتابعة الضغط والسكر ورسم القلب وفحوصات الطوارئ بأحدث الأجهزة الطبية.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <Link
              href="/clinics/specialties"
              className="inline-flex items-center justify-center gap-1.5 bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-xs px-5 py-3 rounded-xl transition shadow-xs"
            >
              <Layers className="w-4 h-4" />
              <span>دليل العيادات الـ 14</span>
            </Link>
          </div>
        </div>

        {/* 14 Specialties Grid Preview */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-copticGold-300 shadow-xs">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-copticGold-200">
            <div>
              <h3 className="font-heading font-bold text-xl text-copticNavy">
                العيادات التخصصية الـ 14
              </h3>
              <p className="text-xs text-slateText-secondary">
                مجهزة بغرف فحص وأجهزة تشخيصية متطورة
              </p>
            </div>
            <Link
              href="/clinics/specialties"
              className="text-xs font-bold text-copticGold-800 hover:text-copticNavy flex items-center gap-1"
            >
              <span>تفاصيل الأجهزة والغرف</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {specialties.map((spec) => (
              <div
                key={spec.id}
                className="bg-copticGold-50/50 hover:bg-copticGold-100/60 rounded-2xl p-4 border border-copticGold-200 transition"
              >
                <div className="flex items-center justify-between text-xs font-bold text-copticGold-800 mb-1">
                  <span>{spec.room_number ? `غرفة ${spec.room_number}` : "المبنى الخدمي"}</span>
                  <span className="font-english text-[10px] text-slateText-muted">30-35 ج</span>
                </div>
                <h4 className="font-heading font-bold text-sm text-copticNavy mb-1">
                  {spec.name_ar}
                </h4>
                <p className="text-[11px] text-slateText-secondary line-clamp-1">
                  {spec.description_ar}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Clinic Regulations & Guidelines */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-copticGold-300 shadow-xs">
            <h3 className="font-heading font-bold text-lg text-copticNavy mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>إرشادات وتعليمات الكشف</span>
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-slateText-secondary leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-copticGold-600 mt-2 shrink-0" />
                <span>يبدأ حجز التذاكر في الاستقبال يومياً من الساعة 9:00 صباحاً بأسبقية الحضور.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-copticGold-600 mt-2 shrink-0" />
                <span>إعادة الكشف (الاستشارة) مجانية تماماً خلال أسبوع من تاريخ الزيارة الأولى.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-copticGold-600 mt-2 shrink-0" />
                <span>يُرجى إحضار أي تحاليل أو تقارير أو أشعات سابقة لتيسير التشخيص على الطبيب.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-copticGold-300 shadow-xs">
            <h3 className="font-heading font-bold text-lg text-copticNavy mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-copticNavy" />
              <span>مواعيد العمل والاستفسار المباشر</span>
            </h3>
            <p className="text-xs sm:text-sm text-slateText-secondary mb-4 leading-relaxed">
              يعمل المستوصف طوال أيام الأسبوع على فترتين: صباحية (10:00 ص - 1:00 م) ومسائية (5:00 م - 9:00 م).
            </p>
            <div className="bg-copticGold-50 p-4 rounded-xl border border-copticGold-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slateText-muted">تليفون استقبال المستوصف:</span>
                <span className="font-english font-bold text-copticNavy">03-5500002</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slateText-muted">الموقع:</span>
                <span className="font-bold text-copticNavy">شارع 45 بحري — مبنى الخدمات الطبي</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
