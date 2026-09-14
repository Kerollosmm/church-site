import React from "react";
import { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Users, Phone, MessageSquare, Calendar, Clock, Award, Shield } from "lucide-react";
import { getClergy } from "@/lib/queries";

export const metadata: Metadata = {
  title: "مجمع الآباء الكهنة ومواعيد الاعترافات",
  description: "مجمع كهنة كنيسة القديسين مكسيموس ودوماديوس والأنبا موسى الأسود بالعصافرة، وتواريخ الرسامة ومواعيد الاعترافات والتواصل المباشر.",
};

export const revalidate = 86400;

export default async function ClergyPage() {
  const clergyList = await getClergy();

  return (
    <div className="min-h-screen bg-alabasterBg pb-16">
      <PageHero
        title="مجمع الآباء الكهنة الأجلاء"
        englishTitle="Parish Clergy & Pastoral Care"
        description="كهنة الكنيسة المباركون، رعاتنا الروحيون ومواعيد المقابلات وجلسات سر الاعتراف المقدس."
        breadcrumbs={[
          { label: "عن الكنيسة", href: "/about/history" },
          { label: "مجمع الكهنة" },
        ]}
        icon={<Users className="w-8 h-8 text-copticGold-300" />}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clergyList.map((priest) => (
            <div
              key={priest.id}
              className="bg-white rounded-3xl p-6 border-2 border-copticGold-300 hover:border-copticNavy transition shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-copticGold-200">
                  <div className="w-14 h-14 rounded-2xl bg-copticNavy-700 border-2 border-copticGold-400 text-copticGold-300 flex items-center justify-center font-heading font-bold text-lg shrink-0">
                    {priest.clerical_name_ar.split(" ")[1]?.[0] || "أ"}
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-lg text-copticNavy leading-tight">
                      {priest.clerical_name_ar}
                    </h2>
                    {priest.clerical_name_en && (
                      <p className="text-xs text-copticGold-700 font-medium mt-0.5 font-english">
                        {priest.clerical_name_en}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 text-xs mb-6">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-copticGold-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slateText-muted">تاريخ الرسامة: </span>
                      <span className="font-semibold text-copticNavy font-english">{priest.ordination_date}</span>
                    </div>
                  </div>

                  {priest.feast_day && (
                    <div className="flex items-start gap-2">
                      <Award className="w-4 h-4 text-copticGold-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slateText-muted">عيد الشفيع: </span>
                        <span className="font-semibold text-copticNavy">{priest.feast_day}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-copticGold-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slateText-muted">المهام الرعوية: </span>
                      <span className="font-semibold text-copticNavy">{priest.responsibilities_ar}</span>
                    </div>
                  </div>

                  <div className="bg-copticGold-50 p-3 rounded-xl border border-copticGold-200">
                    <div className="flex items-center gap-1.5 font-bold text-copticNavy mb-1">
                      <Clock className="w-3.5 h-3.5 text-copticGold-700" />
                      <span>مواعيد الاعترافات والمقابلات:</span>
                    </div>
                    <p className="text-slateText-secondary leading-relaxed">
                      {priest.confession_hours_ar || "يرجى التنسيق المسبق هاتفياً أو عبر الواتساب"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct Actions */}
              <div className="pt-4 border-t border-copticGold-100 flex items-center gap-2">
                {priest.whatsapp_number && (
                  <a
                    href={`https://wa.me/${priest.whatsapp_number.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>واتساب</span>
                  </a>
                )}
                {priest.phone_office && (
                  <a
                    href={`tel:${priest.phone_office}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-copticNavy hover:bg-copticNavy-700 text-white font-bold text-xs py-2 rounded-xl transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>اتصال</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
