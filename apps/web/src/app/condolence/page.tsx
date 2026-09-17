import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import {
  HeartHandshake,
  CheckCircle2,
  Clock,
  MapPin,
  Volume2,
  Tv,
  AirVent,
  Search,
  PhoneCall,
} from "lucide-react";
import { CondolenceBookingForm } from "./CondolenceBookingForm";

export const metadata: Metadata = {
  title: "حجز قاعة العزاء والمناسبات",
  description: "خدمة حجز قاعة العزاء المجهزة بكنيسة القديسين بالعصافرة: نظام صوتي وشاشات عرض وتكييف مركزي ومتابعة إلكترونية للحجز.",
};

export default function CondolencePage() {
  const amenities = [
    { icon: AirVent, label: "تكييف مركزي كامل ونظام تهوية متطور" },
    { icon: Volume2, label: "شبكة صوتية نقية مع ميكروفونات ومكبرات احترافية" },
    { icon: Tv, label: "شاشات عرض رقمية لبث الترانيم والصلوات المعزية" },
    { icon: MapPin, label: "موقع مباشر يسهل الوصول إليه بشارع 45 بحري" },
  ];

  return (
    <div className="min-h-screen bg-alabasterBg pb-16">
      <PageHero
        title="حجز قاعة العزاء والمناسبات"
        englishTitle="Parish Funeral & Condolence Hall Reservation"
        description="قاعة وقورة ومجهزة بالكامل لاستقبال المعزين ومشاركة أسر الراقدين في أجواء ملؤها التعزية والرجاء في القيامة."
        breadcrumbs={[{ label: "قاعة العزاء" }]}
        icon={<HeartHandshake className="w-8 h-8 text-copticGold-300" />}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Tracking Quick Access Alert */}
        <div className="bg-copticNavy-900 text-white rounded-2xl p-4 sm:p-6 border-2 border-copticGold-400 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-copticNavy-700 text-copticGold-300 flex items-center justify-center shrink-0">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-white">
                هل لديك حجز سابق وترغب في متابعته؟
              </h3>
              <p className="text-xs text-copticGold-200">
                يمكنك التحقق من حالة القبول وموعد القاعة باستخدام رمز الحجز
              </p>
            </div>
          </div>
          <Link
            href="/condolence/track"
            className="inline-flex items-center gap-2 bg-copticGold-500 hover:bg-copticGold-600 text-copticNavy-950 font-bold text-xs px-4 py-2.5 rounded-xl transition shrink-0"
          >
            <span>استعلام ومتابعة الحجز</span>
            <Search className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Amenities & Hall Features */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-copticGold-300 shadow-xs">
          <h3 className="font-heading font-bold text-xl text-copticNavy mb-6 pb-3 border-b border-copticGold-200">
            تجهيزات وإمكانيات قاعة العزاء
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {amenities.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-copticGold-50/60 p-4 rounded-2xl border border-copticGold-200 flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-copticNavy text-copticGold-300 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-copticNavy font-semibold leading-relaxed">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Booking Form Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-copticGold-300 shadow-xs">
          <div className="mb-6 pb-4 border-b border-copticGold-200">
            <h3 className="font-heading font-bold text-xl text-copticNavy">
              استمارة طلب حجز قاعة العزاء
            </h3>
            <p className="text-xs text-slateText-secondary mt-1">
              الرجاء إدخال بيانات المتنيح ومقدم الطلب بدقة، وسيتم المراجعة وتأكيد الحجز هاتفياً فوراً.
            </p>
          </div>

          <CondolenceBookingForm />
        </div>

        {/* Guidelines */}
        <div className="bg-copticGold-100/70 border border-copticGold-300 rounded-3xl p-6 shadow-xs space-y-2 text-xs text-copticNavy-900 leading-relaxed">
          <h4 className="font-heading font-bold text-sm text-copticNavy">
            إرشادات وتعليمات هامة:
          </h4>
          <p>
            • الحجز خاضع للتأكيد النهائي من سكرتارية الكنيسة بعد مراجعة الجداول والأسبقية الزمنية.
          </p>
          <p>
            • في الحالات العاجلة جداً، يُرجى الاتصال المباشر بهاتف سكرتارية الطوارئ الكنسية: <strong className="font-english font-bold">01200000001</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
