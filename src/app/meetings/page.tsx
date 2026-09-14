import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { Users, Clock, MapPin, ChevronLeft, Heart, Sparkles } from "lucide-react";
import { getChurchMeetings } from "@/lib/queries";

export const metadata: Metadata = {
  title: "التربية الكنسية والاجتماعات الروحية",
  description: "دليل اجتماعات التربية الكنسية ومدارس الأحد (11 قطاعاً) بكنيسة القديسين بالعصافرة لجميع الأعمار من الحضانة إلى كبار السن.",
};

export const revalidate = 86400;

export default async function MeetingsPage() {
  const meetings = await getChurchMeetings();

  return (
    <div className="min-h-screen bg-alabasterBg pb-16">
      <PageHero
        title="قطاعات التربية الكنسية ومدارس الأحد"
        englishTitle="Sunday School Sectors & Church Fellowships"
        description="11 قطاعاً روحياً ورعوياً مصممة لتغذية النفوس بكلمة الله وحياة الفضيلة من الطفولة المبكرة وحتى مرحلة البركة والشيوخ."
        breadcrumbs={[{ label: "التربية الكنسية" }]}
        icon={<Users className="w-8 h-8 text-copticGold-300" />}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetings.map((meeting) => (
            <Link
              key={meeting.id}
              href={`/meetings/${meeting.slug}`}
              className="bg-white rounded-3xl p-6 border-2 border-copticGold-200 hover:border-copticNavy transition-all shadow-xs hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-copticNavy bg-copticGold-100 px-3 py-1 rounded-full border border-copticGold-200">
                    {meeting.target_age_ar || "التربية الكنسية"}
                  </span>
                  <span className="text-xs font-english text-copticGold-800 font-bold">
                    {meeting.slug}
                  </span>
                </div>

                <h2 className="font-heading font-bold text-lg text-copticNavy mb-2 group-hover:text-copticGold-800 transition-colors">
                  {meeting.name_ar}
                </h2>

                <p className="text-xs sm:text-sm text-slateText-secondary line-clamp-3 leading-relaxed mb-4">
                  {meeting.description_ar}
                </p>

                <div className="space-y-2 text-xs text-slateText-secondary bg-copticGold-50/60 p-3 rounded-xl border border-copticGold-100 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-copticGold-700 shrink-0" />
                    <span>{meeting.meeting_time_ar || `${meeting.start_time} - ${meeting.end_time}`}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-copticGold-700 shrink-0" />
                    <span>{meeting.location_room_ar || meeting.location_hall_ar}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-copticGold-100 flex items-center justify-between text-xs text-copticNavy font-bold">
                <span>عرض تفاصيل الاجتماع والأنشطة</span>
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-copticGold-700" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
