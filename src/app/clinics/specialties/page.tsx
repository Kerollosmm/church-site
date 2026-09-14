import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { Layers, Users, ArrowLeft, Building2 } from "lucide-react";
import { getClinicSpecialties } from "@/lib/queries";

export const metadata: Metadata = {
  title: "دليل التخصصات الطبية والعيادات الـ 14",
  description: "كتالوج عيادات مستوصف كنيسة القديسين بالعصافرة: 14 تخصصاً طبياً مع أرقام الغرف والتجهيزات والأجهزة الطبية.",
};

export const revalidate = 86400;

export default async function ClinicSpecialtiesPage() {
  const specialties = await getClinicSpecialties();

  return (
    <div className="min-h-screen bg-alabasterBg pb-16">
      <PageHero
        title="دليل العيادات والتجهيزات الطبية (14 تخصصاً)"
        englishTitle="Clinic Specialties & Diagnostic Equipment"
        description="تفاصيل العيادات الطبية، أرقام الغرف في المبنى الخدمي، والأجهزة التشخيصية المتاحة لخدمة المرضى."
        breadcrumbs={[
          { label: "المستوصف الطبي", href: "/clinics" },
          { label: "دليل التخصصات" },
        ]}
        icon={<Layers className="w-8 h-8 text-copticGold-300" />}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <p className="text-xs sm:text-sm text-slateText-secondary">
            إجمالي العيادات المجهزة: <strong className="text-copticNavy">{specialties.length} عيادة متخصصة</strong>
          </p>
          <Link
            href="/clinics/doctors"
            className="inline-flex items-center gap-1.5 bg-copticNavy text-white hover:bg-copticNavy-700 font-bold text-xs px-3.5 py-2 rounded-xl transition"
          >
            <Users className="w-4 h-4" />
            <span>عرض جدول أطباء العيادات</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {specialties.map((spec) => (
            <div
              key={spec.id}
              className="bg-white rounded-3xl p-6 border-2 border-copticGold-300 hover:border-copticNavy transition shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-copticNavy bg-copticGold-100 px-3 py-1 rounded-full border border-copticGold-200">
                    {spec.room_number ? `غرفة رقم ${spec.room_number}` : "المبنى الطبي"}
                  </span>
                  <span className="text-xs font-english text-copticGold-800 font-bold">
                    {spec.name_en}
                  </span>
                </div>

                <h2 className="font-heading font-bold text-xl text-copticNavy mb-2">
                  عيادة {spec.name_ar}
                </h2>

                <p className="text-xs sm:text-sm text-slateText-secondary leading-relaxed mb-4">
                  {spec.description_ar}
                </p>

                <div className="bg-copticGold-50 p-3 rounded-xl border border-copticGold-200 text-xs mb-4">
                  <div className="flex items-center gap-1 font-bold text-copticNavy mb-1">
                    <Building2 className="w-3.5 h-3.5 text-copticGold-700" />
                    <span>موقع العيادة:</span>
                  </div>
                  <p className="text-slateText-secondary">
                    المبنى الخدمي التخصصي — الغرفة رقم {spec.room_number || "الرئيسية"}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-copticGold-100 flex items-center justify-between text-xs">
                <span className="text-copticGold-800 font-bold">رسم الكشف: 30-35 ج.م</span>
                <Link
                  href="/clinics/doctors"
                  className="font-bold text-copticNavy hover:text-copticGold-700 flex items-center gap-1"
                >
                  <span>أطباء التخصص</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
