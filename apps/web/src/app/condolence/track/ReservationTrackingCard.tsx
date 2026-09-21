"use client";

import React, { useState } from "react";
import { trackBooking } from "@/actions/condolence-actions";
import {
  BOOKING_REFERENCE_PLACEHOLDER,
  normalizeBookingReference,
} from "@/lib/domain/booking-reference";
import { Search, Loader2, CheckCircle2, Clock, XCircle, AlertCircle, Building2, Calendar, Copy, Check } from "lucide-react";

interface Props {
  initialCode?: string;
}

/** Result shape is derived from the Server Action so the two can never drift apart. */
type TrackBookingResult = Awaited<ReturnType<typeof trackBooking>>;

export function ReservationTrackingCard({ initialCode = "" }: Props) {
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackBookingResult | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await trackBooking(normalizeBookingReference(code));
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
            placeholder={`أدخل رمز الحجز المرجعي (مثال: ${BOOKING_REFERENCE_PLACEHOLDER})`}
            value={code}
            onChange={(e) => setCode(normalizeBookingReference(e.target.value))}
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
                    <span className="font-english font-bold text-copticNavy text-base select-all">
                      {result.booking.booking_reference_code}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (result.booking?.booking_reference_code) {
                          navigator.clipboard.writeText(result.booking.booking_reference_code);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2500);
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-copticGold-200/60 hover:bg-copticGold-200 text-copticNavy transition"
                      title="نسخ رمز الحجز"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-700" />
                          <span>تم النسخ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-copticNavy" />
                          <span>نسخ</span>
                        </>
                      )}
                    </button>
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
                    {result.booking.status === "cancelled" && (
                      <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold px-3 py-1 rounded-full">
                        <XCircle className="w-4 h-4 text-slate-500" />
                        <span>تم إلغاء الحجز</span>
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
