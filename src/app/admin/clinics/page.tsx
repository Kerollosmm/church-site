"use client";

import React, { useState } from "react";
import {
  Search,
  Building2,
  CheckCircle2,
  Layers,
  Stethoscope,
} from "lucide-react";
import { SEED_CLINIC_SPECIALTIES } from "@/lib/data/seed-data";
import { CLINIC_CONSULTATION_FEE_LABEL } from "@/lib/constants";

export default function AdminClinicsPage() {
  const [search, setSearch] = useState("");

  const filtered = SEED_CLINIC_SPECIALTIES.filter((spec) => {
    if (!search.trim()) return true;
    const term = search.trim().toLowerCase();
    return (
      spec.name_ar.toLowerCase().includes(term) ||
      (spec.description_ar && spec.description_ar.toLowerCase().includes(term)) ||
      (spec.name_en && spec.name_en.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-heading font-bold text-copticNavy flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-copticGold-600" />
            <span>إدارة عيادات وتخصصات المستوصف الطبي الخيري</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            دليل العيادات التخصصية الـ {SEED_CLINIC_SPECIALTIES.length} المجهزة بمبنى الخدمات، أرقام الغرف وحالة الخدمة.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث باسم العيادة أو التجهيزات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-xs text-copticNavy focus:outline-hidden focus:border-copticNavy"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          عرض <strong className="text-copticNavy">{filtered.length}</strong> من أصل{" "}
          <strong>{SEED_CLINIC_SPECIALTIES.length}</strong> عيادة تخصصية
        </span>
      </div>

      {/* Specialties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((spec) => (
          <div
            key={spec.id}
            className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  <span>غرفة {spec.room_number}</span>
                </span>
                <span className="text-xs text-copticGold-800 font-bold">
                  {CLINIC_CONSULTATION_FEE_LABEL}
                </span>
              </div>

              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-heading font-bold text-base text-copticNavy">
                  عيادة {spec.name_ar}
                </h3>
              </div>

              {spec.name_en && (
                <p className="text-[11px] font-english text-slate-400 font-medium mb-3">
                  {spec.name_en}
                </p>
              )}

              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {spec.description_ar}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              {spec.is_active ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>نشطة ومجهزة</span>
                </span>
              ) : (
                <span className="text-slate-500 font-bold flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  <span>تحت التجهيز</span>
                </span>
              )}
              <span className="text-slate-400 flex items-center gap-1">
                <Layers className="w-3 h-3" />
                <span>الترتيب: {spec.display_order}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
