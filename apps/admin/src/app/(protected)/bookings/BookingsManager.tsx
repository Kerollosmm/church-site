"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  HeartHandshake,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Phone,
  User,
  Calendar,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  approveCondolenceBooking,
  rejectCondolenceBooking,
  type AdminBookingActionResult,
} from "@/actions/admin-booking-actions";
import { AdminFeedback } from "@/components/admin/AdminFeedback";
import type { BookingStatusEnum, Tables } from "@church-site/domain";


/** Arabic labels for the `booking_status_enum` values (the enum is never displayed). */
const STATUS_LABELS_AR: Record<BookingStatusEnum, string> = {
  pending: "بانتظار الاعتماد",
  approved: "معتمد",
  rejected: "معتذر عنه",
  cancelled: "ملغى",
};

const STATUS_BADGE_CLASSES: Record<BookingStatusEnum, string> = {
  pending: "text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full",
  approved: "text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full",
  rejected: "text-[11px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded-full",
  cancelled: "text-[11px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full",
};

const STATUS_FILTERS = [
  { value: "all", label: "كافة الحالات" },
  { value: "pending", label: "قيد المراجعة" },
  { value: "approved", label: "تمت الموافقة" },
  { value: "rejected", label: "معتذر عنه" },
  { value: "cancelled", label: "ملغى" },
] as const;

type StatusFilter = BookingStatusEnum | "all";

export interface BookingsManagerProps {
  /** Real bookings from `getCondolenceBookings()` — never fabricated rows. */
  bookings: Tables<"condolence_bookings">[];
  /** Arabic message shown when the read itself failed (database unavailable, …). */
  loadErrorAr: string | null;
}

export function BookingsManager({ bookings, loadErrorAr }: BookingsManagerProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [feedback, setFeedback] = useState<AdminBookingActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const runDecision = (action: () => Promise<AdminBookingActionResult>) => {
    startTransition(async () => {
      const result = await action();
      setFeedback(result);
      if (result.success) {
        setRejectingId(null);
        setRejectionReason("");
        router.refresh();
      }
    });
  };

  const filtered = bookings.filter((b) => {
    const matchStatus = filter === "all" || b.status === filter;
    const term = search.trim();
    const matchSearch =
      !term ||
      b.deceased_full_name.includes(term) ||
      b.applicant_name.includes(term) ||
      b.booking_reference_code.includes(term);
    return matchStatus && matchSearch;
  });

  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Control bar: Search, Filter, and Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <p className="text-xs text-slate-600">
            إجمالي الطلبات: <strong className="text-copticNavy">{bookings.length}</strong>
            {pendingCount > 0 && (
              <span className="ms-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                {pendingCount} بانتظار الاعتماد
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث بالاسم أو الكود..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-1.5 text-xs text-copticNavy focus:outline-hidden"
            />
          </div>

          <select
            value={filter}
            onChange={(e) => {
              const next = STATUS_FILTERS.find((option) => option.value === e.target.value);
              if (next) setFilter(next.value);
            }}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-copticNavy focus:outline-hidden"
          >
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Read failure (database unreachable) */}
      {loadErrorAr && (
        <AdminFeedback
          tone="error"
          title="تعذر الاتصال بقاعدة البيانات"
          message={loadErrorAr}
        />
      )}

      {/* Result of the last decision */}
      {feedback && (
        <AdminFeedback
          tone={feedback.success ? "success" : "error"}
          message={feedback.message}
        />
      )}

      {/* Bookings List */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-xs text-center space-y-2">
            <HeartHandshake className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">
              {bookings.length === 0
                ? "لا توجد طلبات حجز حتى الآن"
                : "لا توجد طلبات مطابقة للتصفية الحالية"}
            </p>
            <p className="text-xs text-slate-500">
              تظهر طلبات حجز قاعة العزاء هنا فور وصولها من الاستمارة العامة.
            </p>
          </div>
        )}

        {filtered.map((b) => (
          <div
            key={b.id}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-english font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-200">
                  {b.booking_reference_code}
                </span>
                <span className={STATUS_BADGE_CLASSES[b.status]}>
                  {STATUS_LABELS_AR[b.status]}
                </span>
              </div>

              <h3 className="font-heading font-bold text-base text-copticNavy">
                {b.deceased_full_name}
              </h3>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <div className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>مقدم الطلب: {b.applicant_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <a href={`tel:${b.applicant_phone}`} className="font-english text-blue-600 hover:underline">
                    {b.applicant_phone}
                  </a>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-english">{b.event_date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{b.slot_time}</span>
                </div>
              </div>

              {b.special_requests && (
                <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {b.special_requests}
                </p>
              )}

              {b.rejection_reason && (
                <p className="text-xs text-red-800 bg-red-50 p-2.5 rounded-xl border border-red-100">
                  سبب الاعتذار: {b.rejection_reason}
                </p>
              )}

              {/* Rejection reason capture — a rejection is never recorded without one. */}
              {rejectingId === b.id && (
                <div className="pt-2 space-y-2">
                  <label
                    htmlFor={`rejection-reason-${b.id}`}
                    className="block text-xs font-bold text-slate-700"
                  >
                    سبب الاعتذار عن الحجز (سيُسجَّل مع الطلب)
                  </label>
                  <textarea
                    id={`rejection-reason-${b.id}`}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={2}
                    maxLength={500}
                    placeholder="مثال: القاعة محجوزة لقداس استثنائي في نفس اليوم"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-copticNavy focus:outline-hidden focus:border-copticNavy"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => runDecision(() => rejectCondolenceBooking(b.id, rejectionReason))}
                      className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
                    >
                      {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      <span>تأكيد الاعتذار</span>
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        setRejectingId(null);
                        setRejectionReason("");
                      }}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl border border-slate-200 transition"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Status action buttons — only a pending request can be decided. */}
            <div className="flex items-center gap-2 shrink-0">
              {b.status === "pending" && rejectingId !== b.id && (
                <>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => runDecision(() => approveCondolenceBooking(b.id))}
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>اعتماد الحجز</span>
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      setFeedback(null);
                      setRejectingId(b.id);
                      setRejectionReason("");
                    }}
                    className="inline-flex items-center gap-1.5 bg-red-100 hover:bg-red-200 disabled:opacity-50 text-red-800 font-bold text-xs px-3.5 py-2 rounded-xl transition"
                  >
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>اعتذار</span>
                  </button>
                </>
              )}

              {b.status === "approved" && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم الاعتماد</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
