import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { GraduationCap, Clock, ChevronLeft, Award, UserCheck } from "lucide-react";
import { getSchoolsAcademies } from "@/lib/queries";

export const metadata: Metadata = {
  title: "المدارس والمعاهد الكنسية والأكاديميات",
  description: "التعليم الكنسي بكنيسة القديسين بالعصافرة: مدرسة الشمامسة، معهد الكتاب المقدس، معهد إعداد الخدام، ومدرسة التسابيح.",
};

export const revalidate = 86400;

export default async function EducationDirectoryPage() {
  const schools = await getSchoolsAcademies();

  return (
    <div className="min-h-screen bg-alabasterBg pb-16">
      <PageHero
        title="المدارس والمعاهد الكنسية والأكاديميات"
        englishTitle="Ecclesial Academies & Biblical Institutes"
        description="صروح التعليم الكنسي الأرثوذكسي الأصيل لتخريج شمامسة وخدام ودارسي كتاب مقدس على أعلى مستوى لاهوتي وطقسي."
        breadcrumbs={[{ label: "المدارس والمعاهد" }]}
        icon={<GraduationCap className="w-8 h-8 text-copticGold-300" />}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schools.map((school) => (
            <Link
              key={school.id}
              href={`/education/${school.slug}`}
              className="bg-white rounded-3xl p-6 border-2 border-copticGold-200 hover:border-copticNavy transition-all shadow-xs hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-copticNavy bg-copticGold-100 px-3 py-1 rounded-full border border-copticGold-200 font-english">
                    {school.academic_stages_count} مراحل دراسية
                  </span>
                  <span className="text-xs font-english text-copticGold-800 font-bold">
                    {school.slug}
                  </span>
                </div>

                <h2 className="font-heading font-bold text-lg text-copticNavy mb-2 group-hover:text-copticGold-800 transition-colors">
                  {school.name_ar}
                </h2>

                <p className="text-xs sm:text-sm text-slateText-secondary line-clamp-3 leading-relaxed mb-4">
                  {school.curriculum_summary_ar}
                </p>

                <div className="bg-copticGold-50 p-3 rounded-xl border border-copticGold-100 text-xs text-slateText-secondary space-y-1.5 mb-4">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-copticGold-700 shrink-0" />
                    <span>{school.study_schedule_ar}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slateText-muted">
                    <UserCheck className="w-3.5 h-3.5 text-copticGold-700 shrink-0" />
                    <span>مسؤول المعهد: {school.responsible_servant_ar}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-copticGold-100 flex items-center justify-between text-xs text-copticNavy font-bold">
                <span>المقررات واستمارة الالتحاق</span>
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-copticGold-700" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
