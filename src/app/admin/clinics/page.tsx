"use client";

import React, { useState } from "react";
import {
  Stethoscope,
  Users,
  Search,
  Building,
  Clock,
  Award,
  CheckCircle2,
} from "lucide-react";
import { SEED_CLINIC_DOCTORS, SEED_CLINIC_SPECIALTIES } from "@/lib/data/seed-data";

export default function AdminClinicsPage() {
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = SEED_CLINIC_DOCTORS.filter((d) => {
    const matchSpec =
      specialtyFilter === "all" || d.specialty_id === specialtyFilter;
    const matchSearch =
      !search.trim() ||
      d.doctor_name_ar?.includes(search.trim()) ||
      d.specialty_name_ar?.includes(search.trim());
    return matchSpec && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-heading font-bold text-copticNavy">
            إدارة أطباء ومواعيد المستوصف الطبي الخيري
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            دليل أطباء العيادات الخارجية الـ 14، تعديل جداول التواجد والعيادات المسندة.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث بالطبيب أو التخصص..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-1.5 text-xs text-copticNavy focus:outline-hidden"
            />
          </div>

          <select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-copticNavy focus:outline-hidden"
          >
            <option value="all">كافة العيادات</option>
            {SEED_CLINIC_SPECIALTIES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name_ar}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  عيادة {doc.specialty_name_ar}
                </span>
                <span className="text-xs text-slate-400 font-bold">30-35 ج</span>
              </div>

              <h3 className="font-heading font-bold text-base text-copticNavy mb-1">
                {doc.doctor_name_ar}
              </h3>

              {doc.qualification_ar && (
                <p className="text-xs text-slate-500 mb-3">{doc.qualification_ar}</p>
              )}

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Clock className="w-3.5 h-3.5 text-copticNavy" />
                  <span>المواعيد:</span>
                </div>
                <p>{doc.schedule_days_ar}</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>مدرج في الدليل العام</span>
              </span>
              <span className="text-slate-400">كشف منتظم</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
