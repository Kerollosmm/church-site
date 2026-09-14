"use client";

import React, { useState } from "react";
import {
  HeartHandshake,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Phone,
  User,
  Calendar,
} from "lucide-react";

interface AdminBooking {
  id: string;
  code: string;
  deceased: string;
  applicant: string;
  phone: string;
  date: string;
  slot: string;
  status: "pending" | "approved" | "rejected";
  notes?: string;
}

export default function AdminBookingsPage() {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [search, setSearch] = useState("");

  const [bookings, setBookings] = useState<AdminBooking[]>([
    {
      id: "1",
      code: "COND-78A91B",
      deceased: "المرحوم سمير عوض حنا",
      applicant: "مينا سمير عوض",
      phone: "01223344556",
      date: "2026-09-22",
      slot: "مسائي من 6:00 م إلى 10:00 م",
      status: "pending",
      notes: "طلب تجهيز شاشات العرض للترانيم المعزية",
    },
    {
      id: "2",
      code: "COND-B44E20",
      deceased: "المرحومة مريم جورج يوسف",
      applicant: "مايكل جورج",
      phone: "01009988776",
      date: "2026-09-24",
      slot: "مسائي من 6:00 م إلى 10:00 م",
      status: "approved",
      notes: "تم التأكيد هاتفياً",
    },
    {
      id: "3",
      code: "COND-DEMO01",
      deceased: "المرحوم فؤاد نجيب بشارة",
      applicant: "بشوي فؤاد نجيب",
      phone: "01122334411",
      date: "2026-09-25",
      slot: "مسائي من 6:00 م إلى 10:00 م",
      status: "approved",
      notes: "معتمد سكرتارية العزاء",
    },
  ]);

  const updateStatus = (id: string, newStatus: "approved" | "rejected") => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    );
  };

  const filtered = bookings.filter((b) => {
    const matchStatus = filter === "all" || b.status === filter;
    const matchSearch =
      !search.trim() ||
      b.deceased.includes(search.trim()) ||
      b.applicant.includes(search.trim()) ||
      b.code.includes(search.trim());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-heading font-bold text-copticNavy">
            إدارة ومراجعة طلبات حجز قاعة العزاء
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            مراجعة طلبات العزاء الواردة إلكترونياً، والاعتماد أو التنسيق الهاتفي مع أسر الراقدين.
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
            onChange={(e: any) => setFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-copticNavy focus:outline-hidden"
          >
            <option value="all">كافة الحالات</option>
            <option value="pending">قيد المراجعة</option>
            <option value="approved">تمت الموافقة</option>
            <option value="rejected">معتذر عنه</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filtered.map((b) => (
          <div
            key={b.id}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-english font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-200">
                  {b.code}
                </span>
                {b.status === "approved" && (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    معتمد
                  </span>
                )}
                {b.status === "pending" && (
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    بانتظار الاعتماد
                  </span>
                )}
                {b.status === "rejected" && (
                  <span className="text-[11px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded-full">
                    معتذر عنه
                  </span>
                )}
              </div>

              <h3 className="font-heading font-bold text-base text-copticNavy">{b.deceased}</h3>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <div className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>مقدم الطلب: {b.applicant}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <a href={`tel:${b.phone}`} className="font-english text-blue-600 hover:underline">
                    {b.phone}
                  </a>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-english">{b.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{b.slot}</span>
                </div>
              </div>

              {b.notes && (
                <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {b.notes}
                </p>
              )}
            </div>

            {/* Status action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {b.status === "pending" && (
                <>
                  <button
                    onClick={() => updateStatus(b.id, "approved")}
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>اعتماد الحجز</span>
                  </button>
                  <button
                    onClick={() => updateStatus(b.id, "rejected")}
                    className="inline-flex items-center gap-1.5 bg-red-100 hover:bg-red-200 text-red-800 font-bold text-xs px-3.5 py-2 rounded-xl transition"
                  >
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>اعتذار</span>
                  </button>
                </>
              )}

              {b.status === "approved" && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم الاعتماد والإخطار</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
