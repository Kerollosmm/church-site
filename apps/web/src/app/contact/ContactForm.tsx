"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ContactMessageSchema, ContactMessageInput } from "@/lib/validations/church-schemas";
import { submitContactMessage } from "@/actions/contact-actions";
import { TurnstileWidget } from "@/components/security/TurnstileWidget";
import { Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export function ContactForm() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const [result, setResult] = useState<{ success?: boolean; message?: string } | null>(null);
  // Turnstile tokens are single-use: every completed submit asks the widget for a fresh one.
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ContactMessageInput>({
    resolver: zodResolver(ContactMessageSchema),
    defaultValues: {
      senderName: "",
      senderPhone: "",
      senderEmail: "",
      urgency: "normal",
      messageContent: "",
      turnstileToken: "",
    },
  });

  const onSubmit = async (data: ContactMessageInput) => {
    setResult(null);
    try {
      const res = await submitContactMessage(data);
      if (res.success) {
        setResult({ success: true, message: res.message });
        reset();
      } else {
        setResult({ success: false, message: res.message || "حدث خطأ، يرجى إعادة المحاولة" });
      }
    } catch {
      setResult({
        success: false,
        message: "تعذر إرسال الرسالة حالياً، يرجى الاتصال هاتفياً بسكرتارية الكنيسة",
      });
    } finally {
      setTurnstileResetSignal((signal) => signal + 1);
    }
  };

  // Pre-hydration guard: `method="post"` keeps a pre-React submit from serialising the field
  // values into a GET query string; `onSubmit` cancels the native navigation once hydrated.
  return (
    <form
      method="post"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit(onSubmit)(event);
      }}
      className="space-y-4"
    >
      {result && (
        <div
          className={`p-4 rounded-2xl flex items-start gap-3 text-xs sm:text-sm ${
            result.success
              ? "bg-emerald-50 text-emerald-950 border border-emerald-300"
              : "bg-red-50 text-red-950 border border-red-300"
          }`}
        >
          {result.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <p>{result.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-copticNavy mb-1">
            الاسم الكامل <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register("senderName")}
            placeholder="الاسم ثلاثي"
            className="w-full bg-copticGold-50/50 border border-copticGold-300 rounded-xl px-3 py-2 text-xs text-copticNavy focus:outline-hidden focus:ring-2 focus:ring-copticNavy"
          />
          {errors.senderName && (
            <span className="text-[11px] text-red-600 mt-1 block">
              {errors.senderName.message}
            </span>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-copticNavy mb-1">
            رقم الهاتف للتواصل (واتساب) <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            dir="ltr"
            {...register("senderPhone")}
            placeholder="012XXXXXXXX"
            className="w-full bg-copticGold-50/50 border border-copticGold-300 rounded-xl px-3 py-2 text-xs text-copticNavy text-right focus:outline-hidden focus:ring-2 focus:ring-copticNavy"
          />
          {errors.senderPhone && (
            <span className="text-[11px] text-red-600 mt-1 block">
              {errors.senderPhone.message}
            </span>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-copticNavy mb-1">
            البريد الإلكتروني (اختياري)
          </label>
          <input
            type="email"
            dir="ltr"
            {...register("senderEmail")}
            placeholder="name@example.com"
            className="w-full bg-copticGold-50/50 border border-copticGold-300 rounded-xl px-3 py-2 text-xs text-copticNavy text-right focus:outline-hidden focus:ring-2 focus:ring-copticNavy"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-copticNavy mb-1">
            درجة الأهمية
          </label>
          <select
            {...register("urgency")}
            className="w-full bg-copticGold-50/50 border border-copticGold-300 rounded-xl px-3 py-2 text-xs text-copticNavy font-bold focus:outline-hidden focus:ring-2 focus:ring-copticNavy"
          >
            <option value="normal">استفسار عادي أو طلب صلاة</option>
            <option value="spiritual_urgent">أمر رعوي هام</option>
            <option value="emergency">حالة طارئة جداً</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-copticNavy mb-1">
          نص الرسالة أو الاستفسار <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={4}
          {...register("messageContent")}
          placeholder="اكتب رسالتك أو استفسارك هنا..."
          className="w-full bg-copticGold-50/50 border border-copticGold-300 rounded-xl p-3 text-xs text-copticNavy focus:outline-hidden focus:ring-2 focus:ring-copticNavy"
        />
        {errors.messageContent && (
          <span className="text-[11px] text-red-600 mt-1 block">
            {errors.messageContent.message}
          </span>
        )}
      </div>

      <TurnstileWidget
        onVerify={(token) => setValue("turnstileToken", token)}
        resetSignal={turnstileResetSignal}
      />

      <div className="rounded-2xl border border-amber-300 bg-amber-50/70 p-3 text-[11px] leading-relaxed text-amber-900 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p>
          ملاحظة: المتابعة تتم هاتفياً أو عبر واتساب من سكرتارية الكنيسة أو الآباء الكهنة. لا تُرسل رسائل بريد إلكتروني آلية حالياً من هذا الموقع.
        </p>
      </div>

      <button
        type="submit"
        disabled={!isMounted || isSubmitting}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-copticNavy hover:bg-copticNavy-700 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>جاري الإرسال...</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            <span>إرسال الرسالة للكهنة والسكرتارية</span>
          </>
        )}
      </button>
    </form>
  );
}
