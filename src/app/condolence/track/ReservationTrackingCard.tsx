"use client";

import React, { useState } from "react";
import { trackBooking } from "@/actions/condolence-actions";
import { Search, Loader2, CheckCircle2, Clock, XCircle, AlertCircle, Building2, Calendar } from "lucide-react";

interface Props {
  initialCode?: string;
}

export function ReservationTrackingCard({ initialCode = "" }: Props) {
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    booking?: {
      booking_reference_code: string;
      event_date: string;
      slot_time: string;
      hall_name: string;
      status: "pending" | "approved" | "rejected";
      rejection_reason?: string | null;
    };
    message?: string;
  } | null>(null);

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await trackBooking(code.trim());
      setResult(res);
    } catch {
      setResult({
        success: false,
        message: "حدث خطأ أثناء الاستعلام، يرجى المحاولة لاحقاً",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-copticGold-700 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="أدخل رمز الحجز المرجعي (مثال: COND-XXXXXX)"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="w-full bg-copticGold-50/50 border border-copticGold-300 rounded-xl pr-10 pl-4 py-2.5 text-xs sm:text-sm font-english text-copticNavy font-bold focus:outline-hidden focus:ring-2 focus:ring-copticNavy"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="inline-flex items-center justify-center gap-2 bg-copticNavy hover:bg-copticNavy-700 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl transition shadow-xs disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>جاري الاستعلام...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>تحقق من الحالة</span>
            </>
          )}
        </button>
      </form>

      {result && (
        <div className="pt-2 animate-in fade-in-50">
          {!result.success ? (
            <div className="bg-red-50 border border-red-300 rounded-2xl p-4 flex items-start gap-3 text-red-900 text-xs sm:text-sm">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p>{result.message}</p>
            </div>
          ) : (
            result.booking && (
              <div className="bg-copticGold-50 border-2 border-copticGold-300 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-copticGold-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slateText-secondary">رمز الحجز:</span>
                    <span className="font-english font-bold text-copticNavy text-base">
                      {result.booking.booking_reference_code}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {result.booking.status === "approved" && (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold px-3 py-1 rounded-full">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>تم تأكيد وقبول الحجز</span>
                      </span>
                    )}
                    {result.booking.status === "pending" && (
                      <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-3 py-1 rounded-full">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>قيد المراجعة والتنسيق</span>
                      </span>
                    )}
                    {result.booking.status === "rejected" && (
                      <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-900 border border-red-300 text-xs font-bold px-3 py-1 rounded-full">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span>تعذر قبول الحجز</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
                  <div className="bg-white p-3 rounded-xl border border-copticGold-200">
                    <span className="text-slateText-muted block text-xs mb-1">تاريخ العزاء:</span>
                    <span className="font-english font-bold text-copticNavy">
                      {result.booking.event_date}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-copticGold-200">
                    <span className="text-slateText-muted block text-xs mb-1">الفترة الزمنية:</span>
                    <span className="font-bold text-copticNavy">{result.booking.slot_time}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-copticGold-200">
                    <span className="text-slateText-muted block text-xs mb-1">القاعة:</span>
                    <span className="font-bold text-copticNavy">{result.booking.hall_name}</span>
                  </div>
                </div>

                {result.booking.rejection_reason && (
                  <div className="bg-red-50 p-3 rounded-xl border border-red-200 text-xs text-red-800">
                    <strong>سبب التعذر: </strong>
                    {result.booking.rejection_reason}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
