import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { GraduationCap, BookOpen, Clock, UserCheck, ChevronLeft } from "lucide-react";
import { getSchoolBySlug, SEED_SCHOOLS } from "@/lib/queries";
import { isProgramSlug } from "@/lib/validations/church-schemas";
import { EducationEnrollmentForm } from "./EducationEnrollmentForm";

export const revalidate = 86400;

export async function generateStaticParams() {
  return SEED_SCHOOLS.map((school) => ({ slug: school.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const school = await getSchoolBySlug(slug);
  if (!school) return { title: "المدارس والمعاهد الكنسية" };
  return {
    title: `${school.name_ar}`,
    description: school.curriculum_summary_ar,
  };
}

export default async function SchoolDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const school = await getSchoolBySlug(slug);

  // Only programmes that accept online enrolment have a detail page: an unknown or
  // non-enrolable slug (e.g. a row added straight to the database) 404s instead of
  // silently enrolling the applicant in a different programme.
  if (!school || !isProgramSlug(school.slug)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-alabasterBg pb-16">
      <PageHero
        title={school.name_ar}
        englishTitle={school.slug}
        description={school.curriculum_summary_ar}
        breadcrumbs={[
          { label: "المدارس والمعاهد", href: "/education" },
          { label: school.name_ar },
        ]}
        icon={<GraduationCap className="w-8 h-8 text-copticGold-300" />}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Institute Syllabus & Overview */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-copticGold-300 shadow-xs space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-copticGold-50 p-4 rounded-2xl border border-copticGold-200">
              <span className="text-xs text-copticGold-800 font-bold block mb-1">
                المراحل الدراسية:
              </span>
              <p className="text-base font-bold text-copticNavy font-english">
                {school.academic_stages_count} مراحل تعليمية متدرجة
              </p>
            </div>

            <div className="bg-copticGold-50 p-4 rounded-2xl border border-copticGold-200">
              <span className="text-xs text-copticGold-800 font-bold block mb-1">
                مواعيد المحاضرات الأسبوعية:
              </span>
              <p className="text-base font-bold text-copticNavy">{school.study_schedule_ar}</p>
            </div>
          </div>

          <div className="border border-copticGold-200 rounded-2xl p-5 bg-alabasterBg">
            <h3 className="font-heading font-bold text-base text-copticNavy mb-2 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-copticGold-700" />
              <span>المشرف والمسؤول عن المعهد:</span>
            </h3>
            <p className="text-xs sm:text-sm text-slateText-secondary leading-relaxed">
              {school.responsible_servant_ar}
            </p>
          </div>

          {/* Curriculum Syllabus */}
          <div>
            <h3 className="font-heading font-bold text-xl text-copticNavy mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-copticNavy" />
              <span>المقررات والمناهج الدراسية:</span>
            </h3>
            <div className="bg-copticGold-50/60 rounded-2xl p-5 border border-copticGold-200 text-xs sm:text-sm text-slateText-secondary leading-relaxed">
              {school.curriculum_summary_ar}
            </div>
          </div>
        </div>

        {/* Enrollment Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-copticGold-300 shadow-xs">
          <div className="mb-6 pb-4 border-b border-copticGold-200">
            <h3 className="font-heading font-bold text-xl text-copticNavy">
              استمارة التقديم والالتحاق الإلكترونية
            </h3>
            <p className="text-xs text-slateText-secondary mt-1">
              املأ البيانات التالية وسيتم مراجعة طلبك وإخطارك بموعد المقابلة الشخصية وبدء الدراسة.
            </p>
          </div>

          <EducationEnrollmentForm programSlug={school.slug} />
        </div>

        <div className="flex justify-between items-center text-xs">
          <Link
            href="/education"
            className="inline-flex items-center gap-1.5 text-copticNavy font-bold hover:text-copticGold-800 transition"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
            <span>العودة لجميع المدارس والمعاهد</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
