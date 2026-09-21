"use client";

// src/app/admin/(protected)/masses/AdminMassModal.tsx
// Modal dialog for creating and editing Divine Liturgy / Mass schedules.

import React, { useState, useEffect } from "react";
import { X, Calendar, Loader2, AlertCircle } from "lucide-react";
import {
  createMassAction,
  updateMassAction,
  type CreateMassInput,
} from "@/actions/admin-mass-actions";
import type { WeeklyMassRow } from "@church-site/data-access/client";
import { DAY_OF_WEEK_LABELS_AR } from "@church-site/data-access/client";
import type { DayOfWeekEnum } from "@church-site/domain";

export interface AdminMassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (savedMass: WeeklyMassRow) => void;
  initialData?: WeeklyMassRow | null;
  altars: Array<{ id: string; name_ar: string }>;
}

const DAYS_ORDER: DayOfWeekEnum[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function AdminMassModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  altars,
}: AdminMassModalProps) {
  const isEditing = Boolean(initialData);

  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeekEnum>("Sunday");
  const [altarId, setAltarId] = useState<string>("");
  const [titleAr, setTitleAr] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("06:00");
  const [endTime, setEndTime] = useState<string>("08:30");
  const [targetGroupAr, setTargetGroupAr] = useState<string>("عام لجميع الشعب");
  const [notesAr, setNotesAr] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize / reset state when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      if (initialData) {
        setDayOfWeek(initialData.day_of_week);
        setAltarId(initialData.altar_id || (altars[0]?.id ?? ""));
        setTitleAr(initialData.title_ar || "");
        setStartTime(initialData.start_time ? initialData.start_time.slice(0, 5) : "06:00");
        setEndTime(initialData.end_time ? initialData.end_time.slice(0, 5) : "08:30");
        setTargetGroupAr(initialData.target_group_ar || "عام لجميع الشعب");
        setNotesAr(initialData.notes_ar || "");
        setIsActive(initialData.is_active ?? true);
      } else {
        setDayOfWeek("Sunday");
        setAltarId(altars[0]?.id ?? "");
        setTitleAr("");
        setStartTime("06:00");
        setEndTime("08:30");
        setTargetGroupAr("عام لجميع الشعب");
        setNotesAr("");
        setIsActive(true);
      }
    }
  }, [isOpen, initialData, altars]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side quick validations
    if (titleAr.trim().length < 3) {
      setErrorMessage("عنوان القداس يجب ألا يقل عن 3 أحرف");
      return;
    }
    if (!altarId) {
      setErrorMessage("يرجى اختيار المذبح");
      return;
    }
    if (!startTime || !endTime) {
      setErrorMessage("يرجى تحديد مواعيد البدء والانتهاء");
      return;
    }

    const payload: CreateMassInput = {
      day_of_week: dayOfWeek,
      altar_id: altarId,
      title_ar: titleAr.trim(),
      start_time: startTime,
      end_time: endTime,
      target_group_ar: targetGroupAr.trim() || "عام لجميع الشعب",
      notes_ar: notesAr.trim() ? notesAr.trim() : null,
      is_active: isActive,
    };

    setIsSubmitting(true);

    try {
      if (isEditing && initialData) {
        const result = await updateMassAction(initialData.id, payload);
        if (!result.success) {
          setErrorMessage(result.message);
          setIsSubmitting(false);
          return;
        }

        const selectedAltar = altars.find((a) => a.id === altarId);
        const updatedRow: WeeklyMassRow = {
          ...initialData,
          ...payload,
          start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
          end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
          target_group_ar: payload.target_group_ar || "عام لجميع الشعب",
          notes_ar: payload.notes_ar ?? null,
          altar: selectedAltar ? { id: selectedAltar.id, name_ar: selectedAltar.name_ar, name_en: null } : initialData.altar,
          updated_at: new Date().toISOString(),
        };

        onSave(updatedRow);
        onClose();
      } else {
        const result = await createMassAction(payload);
        if (!result.success) {
          setErrorMessage(result.message);
          setIsSubmitting(false);
          return;
        }

        const selectedAltar = altars.find((a) => a.id === altarId);
        const createdRow: WeeklyMassRow = {
          id: (result.data as { id?: string })?.id || `m-${Date.now()}`,
          altar_id: altarId,
          celebrant_priest_id: null,
          day_of_week: dayOfWeek,
          title_ar: payload.title_ar,
          start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
          end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
          target_group_ar: payload.target_group_ar || "عام لجميع الشعب",
          notes_ar: payload.notes_ar ?? null,
          is_seasonal: false,
          is_active: isActive,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          altar: selectedAltar ? { id: selectedAltar.id, name_ar: selectedAltar.name_ar, name_en: null } : null,
          celebrant: null,
        };

        onSave(createdRow);
        onClose();
      }
    } catch (err) {
      console.error("[AdminMassModal] submit error", err);
      setErrorMessage(err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء حفظ البيانات.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mass-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-copticGold-100 text-copticGold-800 flex items-center justify-center shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 id="mass-modal-title" className="text-base sm:text-lg font-heading font-bold text-copticNavy">
                {isEditing ? "تعديل بيانات القداس الإلهي" : "إضافة قداس إلهي جديد"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing ? "تحديث التوقيت والمذبح وتفاصيل الحضور" : "إدراج موعد قداس أسبوعي في جدول الكنيسة"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="mass-title-ar" className="block text-xs font-bold text-copticNavy mb-1">
              عنوان أو اسم القداس <span className="text-rose-500">*</span>
            </label>
            <input
              id="mass-title-ar"
              name="title_ar"
              type="text"
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
              placeholder="مثال: قداس الأحد الصباحي الأول"
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-copticGold-500 focus:outline-hidden transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Day of Week */}
            <div>
              <label htmlFor="mass-day-of-week" className="block text-xs font-bold text-copticNavy mb-1">
                اليوم <span className="text-rose-500">*</span>
              </label>
              <select
                id="mass-day-of-week"
                name="day_of_week"
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value as DayOfWeekEnum)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-copticGold-500 focus:outline-hidden transition"
              >
                {DAYS_ORDER.map((day) => (
                  <option key={day} value={day}>
                    {DAY_OF_WEEK_LABELS_AR[day]}
                  </option>
                ))}
              </select>
            </div>

            {/* Altar */}
            <div>
              <label htmlFor="mass-altar-id" className="block text-xs font-bold text-copticNavy mb-1">
                المذبح المخصص <span className="text-rose-500">*</span>
              </label>
              <select
                id="mass-altar-id"
                name="altar_id"
                value={altarId}
                onChange={(e) => setAltarId(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-copticGold-500 focus:outline-hidden transition"
              >
                {altars.map((altar) => (
                  <option key={altar.id} value={altar.id}>
                    {altar.name_ar}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Start Time */}
            <div>
              <label htmlFor="mass-start-time" className="block text-xs font-bold text-copticNavy mb-1">
                وقت البدء (رفع بخور باكر) <span className="text-rose-500">*</span>
              </label>
              <input
                id="mass-start-time"
                name="start_time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-english font-bold text-copticNavy focus:bg-white focus:border-copticGold-500 focus:outline-hidden transition"
                dir="ltr"
              />
            </div>

            {/* End Time */}
            <div>
              <label htmlFor="mass-end-time" className="block text-xs font-bold text-copticNavy mb-1">
                وقت الانتهاء (صرف الشعب) <span className="text-rose-500">*</span>
              </label>
              <input
                id="mass-end-time"
                name="end_time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-english font-bold text-copticNavy focus:bg-white focus:border-copticGold-500 focus:outline-hidden transition"
                dir="ltr"
              />
            </div>
          </div>

          {/* Target Group */}
          <div>
            <label htmlFor="mass-target-group-ar" className="block text-xs font-bold text-copticNavy mb-1">
              الفئة المستهدفة
            </label>
            <input
              id="mass-target-group-ar"
              name="target_group_ar"
              type="text"
              value={targetGroupAr}
              onChange={(e) => setTargetGroupAr(e.target.value)}
              placeholder="مثال: عام لجميع الشعب، شباب، عائلات"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-copticGold-500 focus:outline-hidden transition"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="mass-notes-ar" className="block text-xs font-bold text-copticNavy mb-1">
              ملاحظات وتنبيهات طقسية
            </label>
            <textarea
              id="mass-notes-ar"
              name="notes_ar"
              value={notesAr}
              onChange={(e) => setNotesAr(e.target.value)}
              placeholder="مثال: يسبق القداس تسبحة نصف الليل أو كلمة منفعة روحية..."
              rows={3}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-copticGold-500 focus:outline-hidden transition resize-none"
            />
          </div>

          {/* Is Active Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <div>
              <label htmlFor="mass-is-active" className="text-xs font-bold text-copticNavy cursor-pointer">حالة القداس في الجدول الأسبوعي</label>
              <p className="text-[11px] text-slate-500">
                {isActive ? "القداس نشط ويظهر للمصلين في الجداول العامة" : "القداس معطّل ومخفي من العرض العام"}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="mass-is-active"
                name="is_active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-copticNavy-950 bg-copticGold-500 hover:bg-copticGold-600 rounded-xl transition shadow-xs flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <span>{isEditing ? "تحديث القداس" : "إضافة القداس"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
