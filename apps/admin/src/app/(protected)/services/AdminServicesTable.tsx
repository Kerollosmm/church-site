"use client";

// apps/admin/src/app/(protected)/services/AdminServicesTable.tsx
// Management table for Parish Facilities (Public Services) with search, modal edit, toggle, and delete.

import React, { useState } from "react";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Search,
  Phone,
  Clock,
  MapPin,
} from "lucide-react";
import type { ParishFacility } from "@church-site/domain";
import {
  deleteServiceAction,
  toggleServiceActiveAction,
} from "@/actions/admin-facility-actions";
import { AdminServiceModal } from "./AdminServiceModal";

export interface AdminServicesTableProps {
  initialServices: ParishFacility[];
  canWrite: boolean;
  canDelete: boolean;
}

export function AdminServicesTable({
  initialServices,
  canWrite,
  canDelete,
}: AdminServicesTableProps) {
  const [services, setServices] = useState<ParishFacility[]>(initialServices);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ParishFacility | null>(null);

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [notification, setNotification] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  function handleOpenCreate() {
    setEditingService(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(service: ParishFacility) {
    setEditingService(service);
    setIsModalOpen(true);
  }

  function handleSaved(saved: ParishFacility) {
    setServices((prev) => {
      const idx = prev.findIndex((s) => s.id === saved.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });

    setNotification({
      tone: "success",
      message: `تم حفظ الخدمة «${saved.nameAr}» بنجاح.`,
    });
    setTimeout(() => setNotification(null), 4000);
  }

  async function handleToggleActive(service: ParishFacility) {
    if (!canWrite || togglingId) return;
    setTogglingId(service.id);
    setNotification(null);

    const nextState = !service.isActive;

    try {
      const res = await toggleServiceActiveAction(service.id, nextState);
      if (res.success && res.data) {
        setServices((prev) =>
          prev.map((s) => (s.id === service.id ? res.data! : s))
        );
        setNotification({
          tone: "success",
          message: res.message,
        });
      } else {
        setNotification({
          tone: "error",
          message: res.message || "فشل تغيير حالة الخدمة.",
        });
      }
    } catch (err) {
      setNotification({
        tone: "error",
        message: err instanceof Error ? err.message : "حدث خطأ غير متوقع.",
      });
    } finally {
      setTogglingId(null);
      setTimeout(() => setNotification(null), 4000);
    }
  }

  async function handleDelete(service: ParishFacility) {
    if (!canDelete || deletingId) return;

    const confirmed = window.confirm(
      `هل أنت متأكد من رغبتك في حذف خدمة «${service.nameAr}»؟ لا يمكن التراجع عن هذا الإجراء.`
    );
    if (!confirmed) return;

    setDeletingId(service.id);
    setNotification(null);

    try {
      const res = await deleteServiceAction(service.id);
      if (res.success) {
        setServices((prev) => prev.filter((s) => s.id !== service.id));
        setNotification({
          tone: "success",
          message: res.message,
        });
      } else {
        setNotification({
          tone: "error",
          message: res.message || "فشل حذف الخدمة.",
        });
      }
    } catch (err) {
      setNotification({
        tone: "error",
        message: err instanceof Error ? err.message : "حدث خطأ غير متوقع.",
      });
    } finally {
      setDeletingId(null);
      setTimeout(() => setNotification(null), 4000);
    }
  }

  const filteredServices = services
    .filter((s) => {
      if (statusFilter === "active") return s.isActive;
      if (statusFilter === "inactive") return !s.isActive;
      return true;
    })
    .filter((s) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        s.nameAr.toLowerCase().includes(term) ||
        (s.nameEn && s.nameEn.toLowerCase().includes(term)) ||
        s.slug.toLowerCase().includes(term) ||
        s.serviceType.toLowerCase().includes(term) ||
        s.locationAr.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-xs transition-all ${
            notification.tone === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.tone === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 text-xs"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Control bar: Search, Filter, Add */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
          {/* Search input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث بالاسم أو الرابط أو التصنيف..."
              className="w-full text-xs pr-9 pl-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-copticNavy bg-slate-50 focus:bg-white"
            />
          </div>

          {/* Status selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-copticNavy"
          >
            <option value="all">كل الحالات ({services.length})</option>
            <option value="active">
              النشطة فقط ({services.filter((s) => s.isActive).length})
            </option>
            <option value="inactive">
              المعطلة فقط ({services.filter((s) => !s.isActive).length})
            </option>
          </select>
        </div>

        {canWrite && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-copticNavy hover:bg-copticNavy-800 text-white font-heading font-bold text-xs shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة خدمة جديدة</span>
          </button>
        )}
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredServices.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-heading font-bold text-slate-600 text-sm">
              لا توجد خدمات مطابقة لمعايير البحث.
            </p>
            {canWrite && (
              <button
                onClick={handleOpenCreate}
                className="text-xs text-copticNavy font-bold hover:underline"
              >
                إضافة خدمة جديدة الآن
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-heading font-bold text-slate-500">
                  <th className="py-3.5 px-4">الترتيب</th>
                  <th className="py-3.5 px-4">اسم الخدمة والتصنيف</th>
                  <th className="py-3.5 px-4">الرابط التعريفي</th>
                  <th className="py-3.5 px-4">المواعيد والمقر</th>
                  <th className="py-3.5 px-4">بيانات التواصل</th>
                  <th className="py-3.5 px-4 text-center">الحالة</th>
                  <th className="py-3.5 px-4 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredServices.map((service) => (
                  <tr
                    key={service.id}
                    className="hover:bg-slate-50/60 transition group"
                  >
                    {/* Order */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                      #{service.displayOrder}
                    </td>

                    {/* Name & Type */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="font-heading font-bold text-copticNavy text-sm">
                          {service.nameAr}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-copticGold-100 text-copticNavy-900 border border-copticGold-200 px-2 py-0.5 rounded-full font-bold">
                            {service.serviceType}
                          </span>
                          {service.nameEn && (
                            <span className="text-[10px] text-slate-400 font-english">
                              {service.nameEn}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Slug & Public link */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <span>{service.slug}</span>
                        <a
                          href={`/services/${service.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          title="عرض صفحة الخدمة على الموقع"
                          className="text-slate-400 hover:text-copticNavy transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>

                    {/* Hours & Location */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1 text-[11px] text-slate-600 max-w-xs">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Clock className="w-3 h-3 text-copticGold-700 shrink-0" />
                          <span className="truncate">{service.workingHoursAr}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <MapPin className="w-3 h-3 text-copticGold-700 shrink-0" />
                          <span className="truncate">{service.locationAr}</span>
                        </div>
                      </div>
                    </td>

                    {/* Contacts */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1 text-[11px] font-mono" dir="ltr">
                        {service.contactPhone && (
                          <div className="text-slate-600 text-right">
                            {service.contactPhone}
                          </div>
                        )}
                        {service.contactWhatsapp && (
                          <div className="text-emerald-700 text-right font-medium">
                            WA: {service.contactWhatsapp}
                          </div>
                        )}
                        {!service.contactPhone && !service.contactWhatsapp && (
                          <span className="text-slate-300">—</span>
                        )}
                      </div>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      {canWrite ? (
                        <button
                          type="button"
                          onClick={() => handleToggleActive(service)}
                          disabled={togglingId === service.id}
                          className="inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {togglingId === service.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                          ) : (
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                                service.isActive
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                              }`}
                            >
                              {service.isActive ? "نشط" : "معطل"}
                            </span>
                          )}
                        </button>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            service.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {service.isActive ? "نشط" : "معطل"}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-left">
                      <div className="flex items-center justify-end gap-1.5">
                        {canWrite && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(service)}
                            className="p-1.5 text-slate-500 hover:text-copticNavy hover:bg-slate-100 rounded-lg transition"
                            title="تعديل الخدمة"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(service)}
                            disabled={deletingId === service.id}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition disabled:opacity-50"
                            title="حذف الخدمة (خاص بالمدير)"
                          >
                            {deletingId === service.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <AdminServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={handleSaved}
        initialData={editingService}
      />
    </div>
  );
}
