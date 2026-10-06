"use client";

// src/app/admin/(protected)/masses/AdminMassesTable.tsx
// Management table for Divine Liturgy schedules with modal editing, toggling, and deletion.

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { WeeklyMassRow } from "@church-site/data-access/client";
import { DAY_OF_WEEK_LABELS_AR } from "@church-site/data-access/client";
import {
  deleteMassAction,
  toggleMassStatusAction,
} from "@/actions/admin-mass-actions";
import { AdminFeedback } from "@/components/admin/AdminFeedback";
import { AdminMassModal } from "./AdminMassModal";

export interface AdminMassesTableProps {
  masses: WeeklyMassRow[];
  altars: Array<{ id: string; name_ar: string }>;
  canDelete?: boolean;
  canEdit?: boolean;
  canCreate?: boolean;
}

export function AdminMassesTable({
  masses: initialMasses,
  altars,
  canDelete = true,
  canEdit = true,
  canCreate = true,
}: AdminMassesTableProps) {
  const [massList, setMassList] = useState<WeeklyMassRow[]>(initialMasses);
  const [selectedAltar, setSelectedAltar] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "inactive">("all");
  const [timeSortOrder, setTimeSortOrder] = useState<"asc" | "desc" | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMass, setEditingMass] = useState<WeeklyMassRow | null>(null);

  // Status & action loading states
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  let filtered = massList.filter((s) => {
    const matchAltar = selectedAltar === "all" || s.altar_id === selectedAltar;
    const matchStatus =
      selectedStatus === "all" ||
      (selectedStatus === "active" && s.is_active) ||
      (selectedStatus === "inactive" && !s.is_active);
    return matchAltar && matchStatus;
  });

  if (timeSortOrder) {
    filtered = [...filtered].sort((a, b) => {
      const comp = a.start_time.localeCompare(b.start_time);
      return timeSortOrder === "asc" ? comp : -comp;
    });
  }

  function handleOpenCreateModal() {
    setEditingMass(null);
    setIsModalOpen(true);
  }

  function handleOpenEditModal(mass: WeeklyMassRow) {
    setEditingMass(mass);
    setIsModalOpen(true);
  }

  function handleSaveMass(savedMass: WeeklyMassRow) {
    setMassList((prev) => {
      const exists = prev.some((m) => m.id === savedMass.id);
      if (exists) {
        return prev.map((m) => (m.id === savedMass.id ? savedMass : m));
      }
      return [savedMass, ...prev];
    });

    setNotification({
      tone: "success",
      message: editingMass ? "تم حفظ تعديلات القداس بنجاح." : "تم إضافة القداس الجديد بنجاح.",
    });
    setTimeout(() => setNotification(null), 5000);
  }

  async function handleToggleStatus(item: WeeklyMassRow) {
    const nextState = !item.is_active;
    const previousList = [...massList];

    // Optimistic UI update
    setMassList((prev) =>
      prev.map((m) => (m.id === item.id ? { ...m, is_active: nextState } : m))
    );
    setTogglingId(item.id);

    try {
      const res = await toggleMassStatusAction(item.id, nextState);
      if (!res.success) {
        // Revert on failure
        setMassList(previousList);
        setNotification({ tone: "error", message: res.message });
      } else {
        setNotification({ tone: "success", message: res.message });
      }
    } catch (err) {
      console.error("[AdminMassesTable] toggle error", err);
      setMassList(previousList);
      setNotification({ tone: "error", message: "تعذّر تغيير حالة القداس." });
    } finally {
      setTogglingId(null);
      setTimeout(() => setNotification(null), 5000);
    }
  }

  async function handleDelete(item: WeeklyMassRow) {
    const confirmed = window.confirm(
      `هل أنت متأكد من رغبتك في حذف «${item.title_ar}» نهائياً من جدول الكنيسة؟`
    );
    if (!confirmed) return;

    const previousList = [...massList];

    // Optimistic UI update
    setMassList((prev) => prev.filter((m) => m.id !== item.id));
    setDeletingId(item.id);

    try {
      const res = await deleteMassAction(item.id);
      if (!res.success) {
        setMassList(previousList);
        setNotification({ tone: "error", message: res.message });
      } else {
        setNotification({ tone: "success", message: res.message });
      }
    } catch (err) {
      console.error("[AdminMassesTable] delete error", err);
      setMassList(previousList);
      setNotification({ tone: "error", message: "تعذّر حذف القداس." });
    } finally {
      setDeletingId(null);
      setTimeout(() => setNotification(null), 5000);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Control bar: Altar filter, Status filter & Add mass button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <label htmlFor="altar-select" className="text-xs font-heading font-bold text-slate-700 whitespace-nowrap">
              تصفية بالمذبح:
            </label>
            <select
              id="altar-select"
              value={selectedAltar}
              onChange={(e) => setSelectedAltar(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-copticNavy focus:outline-hidden"
            >
              <option value="all">كافة المذابح ({massList.length})</option>
              {altars.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name_ar}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="status-select" className="text-xs font-heading font-bold text-slate-700 whitespace-nowrap">
              تصفية بالحالة:
            </label>
            <select
              id="status-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as "all" | "active" | "inactive")}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-copticNavy focus:outline-hidden"
            >
              <option value="all">كافة الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">غير مُفعَّل</option>
            </select>
          </div>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="bg-copticGold-500 hover:bg-copticGold-600 text-copticNavy-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة قداس جديد</span>
          </button>
        )}
      </div>

      {/* Notification Feedback */}
      {notification && (
        <AdminFeedback
          tone={notification.tone}
          message={notification.message}
        />
      )}

      {/* Mass Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-heading font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">اليوم</th>
                <th className="p-4">اسم القداس</th>
                <th className="p-4">المذبح</th>
                <th
                  className="p-4"
                  aria-sort={
                    timeSortOrder === "asc"
                      ? "ascending"
                      : timeSortOrder === "desc"
                      ? "descending"
                      : "none"
                  }
                >
                  <button
                    type="button"
                    data-sort="time"
                    onClick={() => {
                      setTimeSortOrder((prev) => {
                        if (prev === null) return "asc";
                        if (prev === "asc") return "desc";
                        return null;
                      });
                    }}
                    className="inline-flex items-center gap-1.5 hover:text-copticNavy transition font-heading font-bold cursor-pointer"
                    title="ترتيب حسب التوقيت"
                  >
                    <span>التوقيت</span>
                    {timeSortOrder === "asc" ? (
                      <ArrowUp className="w-3.5 h-3.5 text-copticNavy" />
                    ) : timeSortOrder === "desc" ? (
                      <ArrowDown className="w-3.5 h-3.5 text-copticNavy" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="p-4">الفئة المستهدفة</th>
                <th className="p-4">ملاحظات</th>
                <th className="p-4 text-center">الحالة</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    لا توجد قداسات مطابقة للتصفية الحالية.
                  </td>
                </tr>
              )}

              {filtered.map((item) => {
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-bold text-copticNavy whitespace-nowrap">
                      {DAY_OF_WEEK_LABELS_AR[item.day_of_week]}
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      {item.title_ar}
                    </td>
                    <td className="p-4 text-slate-700 whitespace-nowrap">
                      {item.altar?.name_ar ?? "غير محدد"}
                    </td>
                    <td className="p-4 font-english font-bold text-copticNavy whitespace-nowrap" dir="ltr">
                      {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
                    </td>
                    <td className="p-4 text-slate-600">
                      {item.target_group_ar || "—"}
                    </td>
                    <td className="p-4 text-slate-500 max-w-xs truncate" title={item.notes_ar ?? undefined}>
                      {item.notes_ar || "—"}
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        disabled={togglingId === item.id}
                        title={item.is_active ? "انقر لإلغاء التفعيل" : "انقر للتفعيل"}
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full transition cursor-pointer ${
                          item.is_active
                            ? "text-emerald-800 bg-emerald-100 hover:bg-emerald-200"
                            : "text-slate-600 bg-slate-100 hover:bg-slate-200"
                        }`}
                      >
                        {togglingId === item.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : item.is_active ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-slate-400" />
                        )}
                        <span>{item.is_active ? "نشط" : "غير مُفعَّل"}</span>
                      </button>
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            title="تعديل بيانات القداس"
                            className="p-1.5 text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition flex items-center gap-1 font-bold cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">تعديل</span>
                          </button>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            disabled={deletingId === item.id}
                            title="حذف القداس نهائياً"
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition flex items-center gap-1 font-bold cursor-pointer disabled:opacity-50"
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden sm:inline">حذف</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <AdminMassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMass}
        initialData={editingMass}
        altars={altars}
      />
    </div>
  );
}
