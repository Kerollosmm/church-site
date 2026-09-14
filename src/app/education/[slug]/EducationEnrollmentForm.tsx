"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProgramApplicationSchema, ProgramApplicationInput } from "@/lib/validations/church-schemas";
import { submitProgramApplication } from "@/actions/enrollment-actions";
import { CheckCircle2, AlertCircle, Send, Loader2 } from "lucide-react";

interface Props {
  programSlug: string;
}

export function EducationEnrollmentForm({ programSlug }: Props) {
  const [serverState, setServerState] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  // Normalize slug to match accepted schema union
  const validSlug = (
    ["deacon-school", "karouz-academy", "cithara-choir", "children-bible", "summer-club", "educational-center"].includes(
      programSlug
    )
      ? programSlug
      : "deacon-school"
  ) as ProgramApplicationInput["programSlug"];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProgramApplicationInput>({
    resolver: zodResolver(ProgramApplicationSchema),
    defaultValues: {
      programSlug: validSlug,
      applicantName: "",
      applicantBirthDate: "",
      applicantStage: "",
      guardianName: "",
      guardianPhone: "",
      confessionFather: "",
      requestedLevel: "",
      notes: "",
      turnstileToken: "mock-bypass-token",
    },
  });

  const onSubmit = async (data: ProgramApplicationInput) => {
    setServerState(null);
    try {
      const res = await submitProgramApplication(data);
      if (res.success) {
        setServerState({ success: true, message: res.message });
        reset();
      } else {
        setServerState({
          success: false,
          message: res.message || "حدث خطأ أثناء إرسال الطلب، يرجى المحاولة لاحقاً",
        });
      }
    } catch {
      setServerState({
        success: false,
        message: "تعذر الاتصال بالخادم حالياً، يرجى مراجعة إدارة الكنيسة",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverState && (
        <div
          className={`p-4 rounded-2xl flex items-start gap-3 text-xs sm:text-sm ${
            serverState.success
              ? "bg-emerald-50 text-emerald-900 border border-emerald-300"
              : "bg-red-50 text-red-900 border border-red-300"
          }`}
        >
          {serverState.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <p>{serverState.message}</p>
        </div>
      )}

      <input type="hidden" {...register("programSlug")} value={validSlug} />
      <input type="hidden" {...register("turnstileToken")} value="mock-bypass-token" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-copticNavy mb-1">
            اسم المتقدم ثلاثي أو رباعي <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register("applicantName")}
            placeholder="مثال: بيشوي كمال فريد"
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
            رقم هاتف الولي أو المتقدم (مفعل واتساب) <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            dir="ltr"
            {...register("guardianPhone")}
            placeholder="012XXXXXXXX"
            className="w-full bg-copticGold-50/50 border border-copticGold-300 rounded-xl px-3 py-2 text-xs text-copticNavy text-right focus:outline-hidden focus:ring-2 focus:ring-copticNavy"
          />
          {errors.guardianPhone && (
            <span className="text-[11px] text-red-600 mt-1 block">
              {errors.guardianPhone.message}
            </span>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-copticNavy mb-1">
            اسم ولي الأمر (في حال كان المتقدم طفلاً)
          </label>
          <input
            type="text"
            {...register("guardianName")}
            placeholder="اسم الوالد أو ولي الأمر"
            className="w-full bg-copticGold-50/50 border border-copticGold-300 rounded-xl px-3 py-2 text-xs text-copticNavy focus:outline-hidden focus:ring-2 focus:ring-copticNavy"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-copticNavy mb-1">
            تاريخ الميلاد
          </label>
          <input
            type="date"
            {...register("applicantBirthDate")}
            className="w-full bg-copticGold-50/50 border border-copticGold-300 rounded-xl px-3 py-2 text-xs text-copticNavy focus:outline-hidden focus:ring-2 focus:ring-copticNavy"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-copticNavy mb-1">
            المرحلة الدراسية أو المؤهل
          </label>
          <input
            type="text"
            {...register("applicantStage")}
            placeholder="مثال: الصف الثاني الإعدادي أو بكالوريوس تجارة"
            className="w-full bg-copticGold-50/50 border border-copticGold-300 rounded-xl px-3 py-2 text-xs text-copticNavy focus:outline-hidden focus:ring-2 focus:ring-copticNavy"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-copticNavy mb-1">
            أب الاعتراف
          </label>
          <input
            type="text"
            {...register("confessionFather")}
            placeholder="مثال: أبونا مكسيموس وصفي"
            className="w-full bg-copticGold-50/50 border border-copticGold-300 rounded-xl px-3 py-2 text-xs text-copticNavy focus:outline-hidden focus:ring-2 focus:ring-copticNavy"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-copticNavy mb-1">
          ملاحظات إضافية أو رغبات خاصة
        </label>
        <textarea
          rows={3}
          {...register("notes")}
          placeholder="أي استفسار أو تفاصيل ترغب في إيضاحها لإدارة المعهد..."
          className="w-full bg-copticGold-50/50 border border-copticGold-300 rounded-xl p-3 text-xs text-copticNavy focus:outline-hidden focus:ring-2 focus:ring-copticNavy"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-copticNavy hover:bg-copticNavy-700 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl transition shadow-xs disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>جاري إرسال الطلب...</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            <span>إرسال طلب الالتحاق</span>
          </>
        )}
      </button>
    </form>
  );
}
