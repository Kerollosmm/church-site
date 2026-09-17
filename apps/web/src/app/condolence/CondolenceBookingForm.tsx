"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { CondolenceBookingSchema, CondolenceBookingInput } from "@/lib/validations/church-schemas";
import { submitCondolenceBooking } from "@/actions/condolence-actions";
import { TurnstileWidget } from "@/components/security/TurnstileWidget";
import { CheckCircle2, AlertCircle, Send, Loader2, Search } from "lucide-react";

export function CondolenceBookingForm() {
  const [result, setResult] = useState<{
    success?: boolean;
    bookingCode?: string;
    message?: string;
  } | null>(null);
  // Turnstile tokens are single-use: every completed submit asks the widget for a fresh one.
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CondolenceBookingInput>({
    resolver: zodResolver(CondolenceBookingSchema),
    defaultValues: {
      deceasedFullName: "",
      applicantName: "",
      applicantPhone: "",
      relationshipToDeceased: "",
      eventDate: "",
      slotTime: "مسائي من 6:00 م إلى 10:00 م",
      hallName: "قاعة العزاء الرئيسية المجهزة",
      specialRequests: "",
      turnstileToken: "",
    },
  });

  const onSubmit = async (data: CondolenceBookingInput) => {
    setResult(null);
    try {
      const res = await submitCondolenceBooking(data);
      if (res.success) {
        setResult({ success: true, bookingCode: res.bookingCode, message: res.message });
        reset();
      } else {
        setResult({
          success: false,
          message: res.message || "فشل تسجيل الحجز، يرجى مراجعة البيانات المدخلة",
        });
      }
    } catch {
      setResult({
        success: false,
        message: "تعذر إرسال طلب الحجز، يرجى التواصل مع سكرتارية الكنيسة",
      });
    } finally {
      setTurnstileResetSignal((signal) => signal + 1);
    }
  };

  return (
    <div className="space-y-6">
      {result && (
        <div
          className={`p-5 rounded-2xl border ${
            result.success
              ? "bg-emerald-50 border-emerald-300 text-emerald-950"
              : "bg-red-50 border-red-300 text-red-950"
          }`}
        >
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold text-sm">{result.message}</p>
              {result.bookingCode && (
                <div className="mt-3 bg-white p-3 rounded-xl border border-emerald-200 inline-block">
                  <span className="text-xs text-slateText-secondary block">
                    رمز الحجز المرجعي (احتفظ به للمتابعة):
                  </span>
                  <span className="font-english text-lg font-bold text-copticNavy tracking-wider">
                    {result.bookingCode}
                  </span>
                  <div className="mt-2">
                    <Link
                      href={`/condolence/track?code=${result.bookingCode}`}
                      className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <Search className="w-3 h-3" />
                      <span>الانتقال لصفحة متابعة الحجز الآن</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-copticNavy mb-1">
              اسم المتنيح / المتنيحة بالكامل <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("deceasedFullName")}
              placeholder="مثال: المرحوم فلان الفلاني"
              className="w-full bg-copticGold-50/50 border border-copticGold-300 rounded-xl px-3 py-2 text-xs text-copticNavy focus:outline-hidden focus:ring-2 focus:ring-copticNavy"
            />
            {errors.deceasedFullName && (
              <span className="text-[11px] text-red-600 mt-1 block">
                {errors.deceasedFullName.message}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-copticNavy mb-1">
              اسم مقدم الطلب أو المسؤول <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("applicantName")}
              placeholder="مثال: المهندس/ مينا فلان"
              className="w-full bg-copticGold-50/50 border border-copticGold-300 rounded-xl px-3 py-2 text-xs text-copticNavy focus:outline-hidden focus:ring-2 focus:ring-copticNavy"
            />
            {errors.applicantName && (
              <span className="text-[11px] text-red-600 mt-1 block">
                {errors.applicantName.message}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-copticNavy mb-1">
              رقم هاتف مقدم الطلب (مفعل واتساب) <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              dir="ltr"
              {...register("applicantPhone")}
              placeholder="012XXXXXXXX"
              className="w-full bg-copticGold-50/50 border border-copticGold-300 rounded-xl px-3 py-2 text-xs text-copticNavy text-right focus:outline-hidden focus:ring-2 focus:ring-copticNavy"
            />
            {errors.applicantPhone && (
              <span className="text-[11px] text-red-600 mt-1 block">
                {errors.applicantPhone.message}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-copticNavy mb-1">
              صلة القرابة بالمتنيح <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("relationshipToDeceased")}
              placeholder="مثال: الابن / الأخ / الزوج"
              className="w-full bg-copticGold-50/50 border border-copticGold-300 rounded-xl px-3 py-2 text-xs text-copticNavy focus:outline-hidden focus:ring-2 focus:ring-copticNavy"
            />
            {errors.relationshipToDeceased && (
              <span className="text-[11px] text-red-600 mt-1 block">
                {errors.relationshipToDeceased.message}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-copticNavy mb-1">
              تاريخ العزاء المطلوب <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register("eventDate")}
              className="w-full bg-copticGold-50/50 border border-copticGold-300 rounded-xl px-3 py-2 text-xs text-copticNavy focus:outline-hidden focus:ring-2 focus:ring-copticNavy"
            />
            {errors.eventDate && (
              <span className="text-[11px] text-red-600 mt-1 block">
                {errors.eventDate.message}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-copticNavy mb-1">
              الفترة الزمنية المطلوبة
            </label>
            <select
              {...register("slotTime")}
              className="w-full bg-copticGold-50/50 border border-copticGold-300 rounded-xl px-3 py-2 text-xs text-copticNavy font-bold focus:outline-hidden focus:ring-2 focus:ring-copticNavy"
            >
              <option value="مسائي من 6:00 م إلى 10:00 م">مسائي (من 6:00 م إلى 10:00 م)</option>
              <option value="صباحي من 11:00 ص إلى 2:00 م">صباحي (من 11:00 ص إلى 2:00 م)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-copticNavy mb-1">
            طلبات أو ترتيبات خاصة (صوتيات، مياه وضيافة)
          </label>
          <textarea
            rows={2}
            {...register("specialRequests")}
            placeholder="أي تفاصيل ترغب في تنسيقها مع إدارة القاعة..."
            className="w-full bg-copticGold-50/50 border border-copticGold-300 rounded-xl p-3 text-xs text-copticNavy focus:outline-hidden focus:ring-2 focus:ring-copticNavy"
          />
        </div>

        <TurnstileWidget
          onVerify={(token) => setValue("turnstileToken", token)}
          resetSignal={turnstileResetSignal}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-copticNavy hover:bg-copticNavy-700 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl transition shadow-xs disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>جاري تسجيل الطلب...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>إرسال طلب حجز القاعة</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
