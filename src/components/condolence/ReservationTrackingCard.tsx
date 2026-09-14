"use client";

import React, { useState } from "react";
import { Search, CheckCircle2, XCircle, Clock, AlertTriangle, Calendar, MapPin } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { trackBooking } from "@/actions/condolence-actions";

export interface BookingDetails {
  booking_reference_code: string;
  event_date: string;
  slot_time: string;
  hall_name: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string | null;
}

export function ReservationTrackingCard() {
  const [referenceCode, setReferenceCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingDetails | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceCode.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setBooking(null);

    try {
      const res = await trackBooking(referenceCode.trim());
      if (res.success && res.booking) {
        setBooking(res.booking as BookingDetails);
      } else {
        setErrorMsg(res.message || "لم يتم العثور على حجز بهذا الرمز المرجعي");
      }
    } catch {
      setErrorMsg("حدث خطأ أثناء الاستعلام، يرجى المحاولة لاحقاً");
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    pending: {
      label: "قيد المراجعة والتدقيق",
      badgeVariant: "warning" as const,
      icon: Clock,
      color: "text-amber-600",
      description: "طلبك مسجل لدى سكرتارية الكنيسة وجاري مراجعة المواعيد والتواصل هاتفياً.",
    },
    approved: {
      label: "تم التأكيد والحجز",
      badgeVariant: "success" as const,
      icon: CheckCircle2,
      color: "text-emerald-600",
      description: "تم تأكيد حجز القاعة في الموعد والتاريخ المحددين بنجاح.",
    },
    rejected: {
      label: "معتذر عنه",
      badgeVariant: "neutral" as const,
      icon: XCircle,
      color: "text-red-600",
      description: "تعذر قبول الحجز، يرجى مراجعة سبب الاعتذار أو الاتصال بالكنيسة.",
    },
  };

  return (
    <Card variant="default" className="max-w-xl mx-auto bg-surfaceCard shadow-sm">
      <CardHeader className="pb-3 border-b border-copticGold-100">
        <CardTitle className="text-lg font-bold text-copticNavy-800 flex items-center gap-2">
          <Search className="w-5 h-5 text-copticGold-700" />
          <span>الاستعلام عن حالة حجز قاعة العزاء</span>
        </CardTitle>
        <p className="text-xs text-slateText-muted font-body">
          أدخل كود الحجز المرجعي الخاص بك (مثال: COND-AB12CD) للاطلاع على حالة الحجز
        </p>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="text"
            dir="ltr"
            value={referenceCode}
            onChange={(e) => setReferenceCode(e.target.value.toUpperCase())}
            placeholder="COND-XXXXXX"
            className="flex-1 bg-white border border-copticGold-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-heading font-bold text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-copticGold-500 uppercase"
            required
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={loading}
            className="shrink-0"
          >
            <span>استعلام</span>
          </Button>
        </form>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 text-red-800 text-xs font-heading flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {booking && (
          <div className="mt-4 p-4 rounded-2xl bg-copticGold-50/50 border border-copticGold-200 space-y-3">
            <div className="flex items-center justify-between border-b border-copticGold-200/60 pb-3">
              <span className="text-xs font-heading font-bold text-copticNavy-800">
                رمز الحجز: {booking.booking_reference_code}
              </span>
              <Badge variant={statusConfig[booking.status]?.badgeVariant || "neutral"}>
                {statusConfig[booking.status]?.label || booking.status}
              </Badge>
            </div>

            <div className="space-y-1.5 text-xs font-body text-slateText-primary">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-copticGold-700" />
                <span>تاريخ المناسبة: <strong>{booking.event_date}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-copticGold-700" />
                <span>الفترة: {booking.slot_time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-copticGold-700" />
                <span>المكان: {booking.hall_name}</span>
              </div>
            </div>

            <p className="text-xs text-slateText-muted pt-2 border-t border-copticGold-100 font-body">
              {statusConfig[booking.status]?.description}
            </p>

            {booking.rejection_reason && (
              <div className="p-2.5 rounded-xl bg-red-100/60 text-red-900 text-xs mt-2">
                <strong>سبب الاعتذار:</strong> {booking.rejection_reason}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
