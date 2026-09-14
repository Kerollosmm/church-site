import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { HeartHandshake, Clock, MapPin, ChevronLeft, Building2 } from "lucide-react";
import { getPublicServices } from "@/lib/queries";

export const metadata: Metadata = {
  title: "المرافق والخدمات المجتمعية",
  description: "خدمات ومرافق كنيسة القديسين بالعصافرة: الحضانة، المركز التعليمي، المطبخ الخيري، مكتب التوظيف، والسجل الكنسي.",
};

export const revalidate = 86400;

export default async function ServicesDirectoryPage() {
  const services = await getPublicServices();

  return (
    <div className="min-h-screen bg-alabasterBg pb-16">
      <PageHero
        title="المرافق والخدمات المجتمعية"
        englishTitle="Parish Community Facilities & Public Services"
        description="8 مرافق خدمية مجتمعية تعمل بمحبة وتفانٍ لتلبية الاحتياجات التنموية والاجتماعية والتعليمية لكل أسر المنطقة."
        breadcrumbs={[{ label: "الخدمات المجتمعية" }]}
        icon={<HeartHandshake className="w-8 h-8 text-copticGold-300" />}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((srv) => (
            <Link
              key={srv.id}
              href={`/services/${srv.slug}`}
              className="bg-white rounded-3xl p-5 border-2 border-copticGold-200 hover:border-copticNavy transition-all shadow-xs hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-copticNavy bg-copticGold-100 px-2.5 py-0.5 rounded-full border border-copticGold-200">
                    مرفق كنسي
                  </span>
                  <span className="text-[10px] font-english text-copticGold-800 font-bold">
                    {srv.slug}
                  </span>
                </div>

                <h2 className="font-heading font-bold text-base text-copticNavy mb-2 group-hover:text-copticGold-800 transition-colors">
                  {srv.name_ar}
                </h2>

                <p className="text-xs text-slateText-secondary line-clamp-3 leading-relaxed mb-4">
                  {srv.description_ar}
                </p>

                <div className="bg-copticGold-50 p-2.5 rounded-xl border border-copticGold-100 text-xs text-slateText-secondary space-y-1 mb-4">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-copticGold-700 shrink-0" />
                    <span className="line-clamp-1">{srv.working_hours_ar || srv.operating_hours_ar}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slateText-muted">
                    <MapPin className="w-3.5 h-3.5 text-copticGold-700 shrink-0" />
                    <span>{srv.location_ar}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-copticGold-100 flex items-center justify-between text-xs text-copticNavy font-bold">
                <span>عرض تفاصيل الخدمة</span>
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-copticGold-700" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
