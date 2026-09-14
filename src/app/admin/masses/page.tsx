"use client";

import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Church,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { SEED_MASS_SCHEDULES, SEED_ALTARS } from "@/lib/data/seed-data";

export default function AdminMassesPage() {
  const [schedules, setSchedules] = useState(SEED_MASS_SCHEDULES);
  const [selectedAltar, setSelectedAltar] = useState("all");

  const filtered = schedules.filter(
    (s) => selectedAltar === "all" || s.altar_id === selectedAltar
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-heading font-bold text-copticNavy">
            إدارة جداول القداسات الإلهية والعشيات
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            عرض وتحديث مواعيد القداسات الأسبوعية وتعيين المذابح المخصصة والتنبيهات الطقسية.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedAltar}
            onChange={(e) => setSelectedAltar(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-copticNavy focus:outline-hidden"
          >
            <option value="all">كافة المذابح</option>
            {SEED_ALTARS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name_ar}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mass Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-heading font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">اليوم</th>
                <th className="p-4">المذبح</th>
                <th className="p-4">التوقيت</th>
                <th className="p-4">الفئة المستهدفة</th>
                <th className="p-4">ملاحظات</th>
                <th className="p-4 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => {
                const dayLabels: Record<string, string> = {
                  Sunday: "الأحد",
                  Monday: "الإثنين",
                  Tuesday: "الثلاثاء",
                  Wednesday: "الأربعاء",
                  Thursday: "الخميس",
                  Friday: "الجمعة",
                  Saturday: "السبت",
                };
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-bold text-copticNavy">
                      {dayLabels[item.day_of_week] || item.day_of_week || "يوم أسبوعي"}
                    </td>
                    <td className="p-4 text-slate-700">
                      {item.altar_name_ar || "المذبح الأوسط"}
                    </td>
                    <td className="p-4 font-english font-bold text-copticNavy" dir="ltr">
                      {item.start_time} - {item.end_time}
                    </td>
                    <td className="p-4 text-slate-600">
                      {item.target_audience_ar || "عام لجميع الشعب"}
                    </td>
                    <td className="p-4 text-slate-500 max-w-xs truncate">
                      {item.notes_ar || "—"}
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>نشط</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
