import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { BOOKING_REFERENCE_PREFIX } from "@/lib/domain/booking-reference";
import { Search, ChevronLeft, PhoneCall } from "lucide-react";
import { ReservationTrackingCard } from "./ReservationTrackingCard";

export const metadata: Metadata = {
  title: "متابعة والاستعلام عن حجز قاعة العزاء",
  description: "خدمة الاستعلام الفوري عن حالة طلب حجز قاعة العزاء بكنيسة القديسين بالعصافرة.",
};

interface Props {
  searchParams: Promise<{ code?: string }>;
}

export default async function CondolenceTrackPage({ searchParams }: Props) {
  const { code } = await searchParams;

  return (
    <div className="min-h-screen bg-alabasterBg pb-16">
      <PageHero
        title="متابعة والاستعلام عن حجز قاعة العزاء"
        englishTitle="Condolence Booking Verification & Status"
        description="استعلم عن حالة حجز قاعة العزاء فوراً عبر إدخال رمز الحجز المرجعي الخاص بك."
        breadcrumbs={[
          { label: "قاعة العزاء", href: "/condolence" },
          { label: "متابعة الحجز" },
        ]}
        icon={<Search className="w-8 h-8 text-copticGold-300" />}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-copticGold-300 shadow-xs">
          <div className="mb-6 pb-4 border-b border-copticGold-200">
            <h3 className="font-heading font-bold text-xl text-copticNavy">
              الاستعلام برمز الحجز المرجعي
            </h3>
            <p className="text-xs text-slateText-secondary mt-1">
              الرمز المرجعي يتكون من حروف وأرقام ويبدأ بـ {BOOKING_REFERENCE_PREFIX} (تم عرضه عند
              إتمام طلب الحجز).
            </p>
          </div>

          <ReservationTrackingCard initialCode={code || ""} />
        </div>

        <div className="flex justify-between items-center text-xs">
          <Link
            href="/condolence"
            className="inline-flex items-center gap-1.5 text-copticNavy font-bold hover:text-copticGold-800 transition"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
            <span>العودة لصفحة حجز القاعة</span>
          </Link>

          <a
            href="tel:01200000001"
            className="inline-flex items-center gap-1.5 text-copticGold-800 font-bold hover:text-copticNavy"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>سكرتارية العزاء: 01200000001</span>
          </a>
        </div>
      </div>
    </div>
  );
}
