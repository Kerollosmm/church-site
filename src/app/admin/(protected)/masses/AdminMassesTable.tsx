"use client";

import React, { useState } from "react";
import { CheckCircle2, Info } from "lucide-react";
import type { WeeklyMassRow } from "@/lib/queries";
import { DAY_OF_WEEK_LABELS_AR } from "@/lib/utils/mass-schedule";

export interface AdminMassesTableProps {
  masses: WeeklyMassRow[];
  altars: Array<{ id: string; name_ar: string }>;
}

export function AdminMassesTable({ masses, altars }: AdminMassesTableProps) {
  const [selectedAltar, setSelectedAltar] = useState("all");

  const filtered = masses.filter(
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
            عرض مواعيد القداسات الأسبوعية الحالية وتعيين المذابح المخصصة والتنبيهات الطقسية.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedAltar}
            onChange={(e) => setSelectedAltar(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-copticNavy focus:outline-hidden"
          >
            <option value="all">كافة المذابح</option>
            {altars.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name_ar}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Editing is deliberately absent: this screen is READ-ONLY for now. */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
        <p className="leading-relaxed">
          هذه الشاشة للعرض فقط: تُقرأ الجداول الفعلية من قاعدة البيانات (أو من بيانات البذر عند عدم
          تهيئتها)، ولم تُنفَّذ بعد إجراءات التحرير أو إدارة الاستثناءات الموسمية لأيام الأعياد.
        </p>
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
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    لا توجد قداسات مطابقة للتصفية الحالية.
                  </td>
                </tr>
              )}

              {filtered.map((item) => {
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-bold text-copticNavy">
                      {DAY_OF_WEEK_LABELS_AR[item.day_of_week]}
                    </td>
                    <td className="p-4 text-slate-700">
                      {item.altar?.name_ar ?? "غير محدد"}
                    </td>
                    <td className="p-4 font-english font-bold text-copticNavy" dir="ltr">
                      {item.start_time} - {item.end_time}
                    </td>
                    <td className="p-4 text-slate-600">
                      {item.target_group_ar || "—"}
                    </td>
                    <td className="p-4 text-slate-500 max-w-xs truncate">
                      {item.notes_ar || "—"}
                    </td>
                    <td className="p-4 text-center">
                      {item.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>نشط</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          <span>غير مُفعَّل</span>
                        </span>
                      )}
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
