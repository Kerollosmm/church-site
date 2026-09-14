import React from "react";
import { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import {
  Phone,
  MapPin,
  Clock,
  Mail,
  AlertTriangle,
  Send,
  Building,
  Navigation,
  ExternalLink,
} from "lucide-react";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "اتصل بنا والعنوان التفاعلي",
  description: "بيانات الاتصال بكنيسة القديسين مكسيموس ودوماديوس والأنبا موسى الأسود بالعصافرة، هواتف الطوارئ، خريطة الموقع، واستمارة المراسلة.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-alabasterBg pb-16">
      <PageHero
        title="الاتصال بالكنيسة والعنوان التفاعلي"
        englishTitle="Parish Contact Directory & Location Map"
        description="نحن في خدمتكم دائماً. تواصل معنا للاستفسارات، طلبات الصلاة، حالات الطوارئ، أو لزيارة بيت الله."
        breadcrumbs={[{ label: "اتصل بنا" }]}
        icon={<Phone className="w-8 h-8 text-copticGold-300" />}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Emergency Contacts Banner */}
        <div className="bg-red-50 border-2 border-red-300 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-red-950">
                هواتف الطوارئ الكنسية والحالات العاجلة
              </h3>
              <p className="text-xs text-red-800">
                متاحة 24 ساعة للحالات الحرجة، انتقال الراقدين، والتعزيات الطارئة
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="tel:01200000001"
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              <span dir="ltr">01200000001</span>
            </a>
            <a
              href="tel:01200000002"
              className="bg-white border border-red-300 hover:bg-red-100 text-red-900 font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-2"
            >
              <Phone className="w-4 h-4 text-red-600" />
              <span dir="ltr">01200000002</span>
            </a>
          </div>
        </div>

        {/* Location Card and Quick Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-copticGold-300 shadow-xs space-y-6">
              <h3 className="font-heading font-bold text-xl text-copticNavy pb-3 border-b border-copticGold-200">
                معلومات المقر والزيارة
              </h3>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-copticGold-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-copticNavy block mb-0.5">العنوان بالتفصيل:</strong>
                    <p className="text-slateText-secondary leading-relaxed">
                      شارع 45 بحري — متفرع من طريق الكورنيش، العصافرة بحري، حي ثان المنتزه، الإسكندرية، جمهورية مصر العربية.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-copticGold-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-copticNavy block mb-0.5">أوقات فتح الكنيسة:</strong>
                    <p className="text-slateText-secondary leading-relaxed">
                      يومياً من الساعة 6:00 صباحاً وحتى 10:00 مساءً (تمتد في أيام النهضات والمناسبات).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-copticGold-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-copticNavy block mb-0.5">الهاتف الأرضي للسكرتارية:</strong>
                    <p className="text-slateText-secondary font-english text-xs font-bold" dir="ltr">
                      03-5500000 / 03-5500001
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Building className="w-5 h-5 text-copticGold-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-copticNavy block mb-0.5">استقبال المستوصف الخيري:</strong>
                    <a
                      href="tel:035500002"
                      className="text-slateText-secondary hover:text-copticNavy font-english text-xs font-bold underline-offset-4 hover:underline transition"
                      dir="ltr"
                    >
                      03-5500002
                    </a>
                  </div>
                </div>
              </div>

              {/* Map Directions Button */}
              <div className="pt-2">
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-copticNavy text-white hover:bg-copticNavy-700 font-bold text-xs py-3 rounded-xl transition shadow-xs"
                >
                  <Navigation className="w-4 h-4 text-copticGold-400" />
                  <span>فتح الموقع في خرائط Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form Container */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border-2 border-copticGold-300 shadow-xs">
            <h3 className="font-heading font-bold text-xl text-copticNavy mb-2">
              أرسل رسالة مباشرة لسكرتارية الكنيسة
            </h3>
            <p className="text-xs text-slateText-secondary mb-6 pb-4 border-b border-copticGold-200">
              يمكنك كتابة أي طلب صلاة، اقتراح، أو استفسار وسيتولى الأب الكاهن المسؤول المتابعة معك.
            </p>

            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
