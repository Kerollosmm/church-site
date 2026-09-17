import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { ContactLinks } from "@/components/contact/ContactLinks";
import { Compass, Clock, MapPin, CheckCircle2, ChevronLeft, MessageCircle } from "lucide-react";
import { getActivityBySlug, SEED_ACTIVITIES } from "@/lib/queries";

export const revalidate = 86400;

export async function generateStaticParams() {
  return SEED_ACTIVITIES.map((activity) => ({ slug: activity.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const activity = await getActivityBySlug(slug);
  if (!activity) return { title: "الأنشطة الرعوية" };
  return {
    title: `${activity.name_ar}`,
    description: activity.description_ar,
  };
}

export default async function ActivityDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const activity = await getActivityBySlug(slug);

  if (!activity) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-alabasterBg pb-16">
      <PageHero
        title={activity.name_ar}
        englishTitle={activity.slug}
        description={activity.description_ar}
        breadcrumbs={[
          { label: "الأنشطة الرعوية", href: "/activities" },
          { label: activity.name_ar },
        ]}
        icon={<Compass className="w-8 h-8 text-copticGold-300" />}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-copticGold-300 shadow-xs space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-copticGold-50 p-4 rounded-2xl border border-copticGold-200">
              <div className="flex items-center gap-2 text-copticGold-800 font-bold text-xs mb-1">
                <Clock className="w-4 h-4" />
                <span>مواعيد النشاط:</span>
              </div>
              <p className="text-sm font-bold text-copticNavy">{activity.schedule_text_ar}</p>
            </div>

            <div className="bg-copticGold-50 p-4 rounded-2xl border border-copticGold-200">
              <div className="flex items-center gap-2 text-copticGold-800 font-bold text-xs mb-1">
                <MapPin className="w-4 h-4" />
                <span>المقر والمكان:</span>
              </div>
              <p className="text-sm font-bold text-copticNavy">{activity.location_ar}</p>
            </div>
          </div>

          {activity.whatsapp_link && (
            <div className="bg-copticGold-50 p-4 rounded-2xl border border-copticGold-200">
              <div className="flex items-center gap-2 text-copticGold-800 font-bold text-xs mb-3">
                <MessageCircle className="w-4 h-4" />
                <span>للتواصل ومتابعة النشاط:</span>
              </div>
              <ContactLinks whatsappGroupUrl={activity.whatsapp_link} />
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-heading font-bold text-xl text-copticNavy">
              عن النشاط وأهدافه
            </h3>
            <p className="text-sm sm:text-base text-slateText-secondary leading-relaxed">
              {activity.description_ar}
            </p>
          </div>

          <div className="border-t border-copticGold-200 pt-6">
            <h4 className="font-heading font-bold text-base text-copticNavy mb-4">
              مميزات وخدمات هذا النشاط:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slateText-secondary">
              <div className="flex items-center gap-2 bg-alabasterBg p-3 rounded-xl border border-copticGold-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>إشراف كنسي وتربوي متخصص: {activity.responsible_servant_ar}</span>
              </div>
              <div className="flex items-center gap-2 bg-alabasterBg p-3 rounded-xl border border-copticGold-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>الفئة المستهدفة: {activity.target_audience_ar}</span>
              </div>
              <div className="flex items-center gap-2 bg-alabasterBg p-3 rounded-xl border border-copticGold-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>بيئة آمنة مشجعة على الإبداع والنمو الإيجابي</span>
              </div>
              <div className="flex items-center gap-2 bg-alabasterBg p-3 rounded-xl border border-copticGold-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>أنشطة ومشاركات دورية على مستوى الكنيسة</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs">
          <Link
            href="/activities"
            className="inline-flex items-center gap-1.5 text-copticNavy font-bold hover:text-copticGold-800 transition"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
            <span>العودة لكافة الأنشطة والخدمات الرعوية</span>
          </Link>
          <Link
            href="/contact"
            className="bg-copticNavy text-white px-4 py-2 rounded-xl font-bold hover:bg-copticNavy-700 transition"
          >
            للاستفسار المباشر
          </Link>
        </div>
      </div>
    </div>
  );
}
