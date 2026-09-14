import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { ContactLinks } from "@/components/contact/ContactLinks";
import { Users, Clock, MapPin, UserCheck, BookOpen, ChevronLeft, Heart, CheckCircle2 } from "lucide-react";
import { getMeetingBySlug, SEED_CHURCH_MEETINGS } from "@/lib/queries";

export const revalidate = 86400;

export async function generateStaticParams() {
  return SEED_CHURCH_MEETINGS.map((meeting) => ({ slug: meeting.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const meeting = await getMeetingBySlug(slug);
  if (!meeting) return { title: "التربية الكنسية" };
  return {
    title: `${meeting.name_ar}`,
    description: meeting.description_ar,
  };
}

export default async function MeetingDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const meeting = await getMeetingBySlug(slug);

  if (!meeting) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-alabasterBg pb-16">
      <PageHero
        title={meeting.name_ar}
        englishTitle={meeting.slug}
        description={meeting.description_ar}
        breadcrumbs={[
          { label: "التربية الكنسية", href: "/meetings" },
          { label: meeting.name_ar },
        ]}
        icon={<Users className="w-8 h-8 text-copticGold-300" />}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Main Details Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-copticGold-300 shadow-xs space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-copticGold-50 p-4 rounded-2xl border border-copticGold-200">
              <div className="flex items-center gap-2 text-copticGold-800 font-bold text-xs mb-1">
                <Users className="w-4 h-4" />
                <span>الفئة المستهدفة:</span>
              </div>
              <p className="text-sm font-bold text-copticNavy">{meeting.target_age_ar}</p>
            </div>

            <div className="bg-copticGold-50 p-4 rounded-2xl border border-copticGold-200">
              <div className="flex items-center gap-2 text-copticGold-800 font-bold text-xs mb-1">
                <Clock className="w-4 h-4" />
                <span>الموعد الأسبوعي:</span>
              </div>
              <p className="text-sm font-bold text-copticNavy">{meeting.meeting_time_ar || `${meeting.start_time} - ${meeting.end_time}`}</p>
            </div>

            <div className="bg-copticGold-50 p-4 rounded-2xl border border-copticGold-200">
              <div className="flex items-center gap-2 text-copticGold-800 font-bold text-xs mb-1">
                <MapPin className="w-4 h-4" />
                <span>مكان الانعقاد:</span>
              </div>
              <p className="text-sm font-bold text-copticNavy">{meeting.location_room_ar || meeting.location_hall_ar}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-heading font-bold text-xl text-copticNavy">
              الرسالة والرؤية الروحية
            </h3>
            <p className="text-sm sm:text-base text-slateText-secondary leading-relaxed">
              {meeting.description_ar} يهدف هذا القطاع إلى بناء الإنسان الروحي المتمسك بعقيدته الأرثوذكسية، وإعداد أجيال واعية تجمع بين الفضيلة والنجاح الأكاديمي والاجتماعي.
            </p>
          </div>

          {(meeting.supervisor_priest_ar || meeting.servant_in_charge_ar) && (
            <div className="bg-copticNavy-50 p-4 rounded-2xl border border-copticNavy-200 flex items-center gap-3">
              <UserCheck className="w-6 h-6 text-copticNavy shrink-0" />
              <div>
                <span className="text-xs text-slateText-muted">المسؤول عن الخدمة:</span>
                <p className="font-heading font-bold text-sm text-copticNavy">
                  {meeting.supervisor_priest_ar || meeting.servant_in_charge_ar}
                </p>
              </div>
            </div>
          )}

          {meeting.whatsapp_group_link && (
            <div className="bg-copticGold-50 p-4 rounded-2xl border border-copticGold-200">
              <div className="flex items-center gap-2 text-copticGold-800 font-bold text-xs mb-3">
                <Users className="w-4 h-4" />
                <span>قناة التواصل مع أمانة القطاع:</span>
              </div>
              <ContactLinks whatsappGroupUrl={meeting.whatsapp_group_link} />
            </div>
          )}

          {/* Activities List */}
          <div className="border-t border-copticGold-200 pt-6">
            <h4 className="font-heading font-bold text-base text-copticNavy mb-4">
              الأنشطة الدورية للقطاع:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slateText-secondary">
              <div className="flex items-center gap-2 bg-alabasterBg p-3 rounded-xl border border-copticGold-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>دراسة منتظمة في أسفار العهدين القديم والجديد</span>
              </div>
              <div className="flex items-center gap-2 bg-alabasterBg p-3 rounded-xl border border-copticGold-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>رحلات ومؤتمرات روحية وترفيهية دورية</span>
              </div>
              <div className="flex items-center gap-2 bg-alabasterBg p-3 rounded-xl border border-copticGold-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>دوري رياضي ومسابقات ثقافية ومواهب</span>
              </div>
              <div className="flex items-center gap-2 bg-alabasterBg p-3 rounded-xl border border-copticGold-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>متابعة فردية وافتقاد للمخدومين على مدار الأسبوع</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs">
          <Link
            href="/meetings"
            className="inline-flex items-center gap-1.5 text-copticNavy font-bold hover:text-copticGold-800 transition"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
            <span>العودة لكافة قطاعات التربية الكنسية</span>
          </Link>
          <Link
            href="/contact"
            className="bg-copticNavy text-white px-4 py-2 rounded-xl font-bold hover:bg-copticNavy-700 transition"
          >
            تواصل مع أمانة الخدمة
          </Link>
        </div>
      </div>
    </div>
  );
}
