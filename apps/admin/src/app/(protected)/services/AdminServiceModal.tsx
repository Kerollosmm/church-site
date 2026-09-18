"use client";

// apps/admin/src/app/(protected)/services/AdminServiceModal.tsx
// Add / Edit Modal for Parish Facilities & Public Services.

import React, { useState, useEffect } from "react";
import { X, Building2, Loader2, AlertCircle, Phone, Clock, MapPin, FileText } from "lucide-react";
import type { ParishFacility } from "@church-site/domain";
import { upsertServiceAction } from "@/actions/admin-facility-actions";

export interface AdminServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (service: ParishFacility) => void;
  initialData?: ParishFacility | null;
}

export function AdminServiceModal({
  isOpen,
  onClose,
  onSaved,
  initialData,
}: AdminServiceModalProps) {
  const isEditing = Boolean(initialData);

  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [slug, setSlug] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [workingHoursAr, setWorkingHoursAr] = useState("");
  const [locationAr, setLocationAr] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");
  const [guidelinesAr, setGuidelinesAr] = useState("");
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      if (initialData) {
        setNameAr(initialData.nameAr);
        setNameEn(initialData.nameEn || "");
        setSlug(initialData.slug);
        setServiceType(initialData.serviceType);
        setDescriptionAr(initialData.descriptionAr);
        setDescriptionEn(initialData.descriptionEn || "");
        setWorkingHoursAr(initialData.workingHoursAr);
        setLocationAr(initialData.locationAr);
        setContactPhone(initialData.contactPhone || "");
        setContactWhatsapp(initialData.contactWhatsapp || "");
        setGuidelinesAr(initialData.guidelinesAr || "");
        setDisplayOrder(initialData.displayOrder);
        setIsActive(initialData.isActive);
      } else {
        setNameAr("");
        setNameEn("");
        setSlug("");
        setServiceType("");
        setDescriptionAr("");
        setDescriptionEn("");
        setWorkingHoursAr("");
        setLocationAr("");
        setContactPhone("");
        setContactWhatsapp("");
        setGuidelinesAr("");
        setDisplayOrder(0);
        setIsActive(true);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!nameAr.trim()) {
      setErrorMessage("يرجى إدخال اسم الخدمة بالعربية.");
      return;
    }
    if (!slug.trim()) {
      setErrorMessage("يرجى إدخال الرابط التعريفي (slug).");
      return;
    }
    if (!serviceType.trim()) {
      setErrorMessage("يرجى إدخال نوع الخدمة.");
      return;
    }
    if (!descriptionAr.trim()) {
      setErrorMessage("يرجى إدخال وصف الخدمة بالعربية.");
      return;
    }
    if (!workingHoursAr.trim()) {
      setErrorMessage("يرجى إدخال مواعيد وساعات العمل.");
      return;
    }
    if (!locationAr.trim()) {
      setErrorMessage("يرجى إدخال مقر ومكان الخدمة.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await upsertServiceAction({
        id: initialData?.id,
        name_ar: nameAr.trim(),
        name_en: nameEn.trim() || null,
        slug: slug.trim(),
        service_type: serviceType.trim(),
        description_ar: descriptionAr.trim(),
        description_en: descriptionEn.trim() || null,
        working_hours_ar: workingHoursAr.trim(),
        location_ar: locationAr.trim(),
        contact_phone: contactPhone.trim() || null,
        contact_whatsapp: contactWhatsapp.trim() || null,
        guidelines_ar: guidelinesAr.trim() || null,
        display_order: displayOrder,
        is_active: isActive,
      });

      if (res.success && res.data) {
        onSaved(res.data);
        onClose();
      } else {
        setErrorMessage(res.message || "فشل حفظ بيانات الخدمة.");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "حدث خطأ غير متوقع.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-copticGold-300 w-full max-w-3xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-copticNavy-950 text-white px-6 py-4 flex items-center justify-between border-b-2 border-copticGold-500">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-copticGold-500 text-copticNavy-950 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-white">
                {isEditing ? "تعديل خدمة كنسية" : "إضافة خدمة كنسية جديدة"}
              </h3>
              <p className="text-xs text-copticGold-400">
                إدارة المرافق والخدمات المجتمعية التابعة للكنيسة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-copticNavy-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Grid fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم الخدمة (عربي) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-copticNavy"
                placeholder="مثال: مستوصف مارمرقس الخيري"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم الخدمة (إنجليزي)
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                dir="ltr"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-copticNavy text-left"
                placeholder="e.g. St. Mark Charity Clinic"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الرابط التعريفي (Slug) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                required
                dir="ltr"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-copticNavy text-left font-mono"
                placeholder="st-mark-clinic"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                يظهر في الرابط: /services/{slug || "slug"}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                تصنيف / نوع الخدمة <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-copticNavy"
                placeholder="مثال: رعاية صحية، تعليم وتقوية، توظيف"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              وصف ورسالة الخدمة (عربي) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={descriptionAr}
              onChange={(e) => setDescriptionAr(e.target.value)}
              required
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-copticNavy leading-relaxed"
              placeholder="وصف تفصيلي للخدمة وأهدافها والشرائح المستفيدة..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              وصف الخدمة (إنجليزي)
            </label>
            <textarea
              rows={2}
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              dir="ltr"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-copticNavy leading-relaxed text-left"
              placeholder="English description..."
            />
          </div>

          {/* Logistics & Contacts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                مواعيد وساعات العمل <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={workingHoursAr}
                onChange={(e) => setWorkingHoursAr(e.target.value)}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-copticNavy"
                placeholder="مثال: يومياً من 4:00 م حتى 9:00 م"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المقر ومكان المرفق <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={locationAr}
                onChange={(e) => setLocationAr(e.target.value)}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-copticNavy"
                placeholder="مثال: مبنى الخدمات - الدور الثاني"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                هاتف الاستفسار
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                dir="ltr"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-copticNavy text-left"
                placeholder="03-5551234"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رقم الواتساب
              </label>
              <input
                type="text"
                value={contactWhatsapp}
                onChange={(e) => setContactWhatsapp(e.target.value)}
                dir="ltr"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-copticNavy text-left"
                placeholder="01220000000"
              />
            </div>
          </div>

          {/* Guidelines */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              شروط وتعليمات التسجيل والاستفادة
            </label>
            <textarea
              rows={2}
              value={guidelinesAr}
              onChange={(e) => setGuidelinesAr(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-copticNavy leading-relaxed"
              placeholder="مثال: يشترط إحضار الرقم القومي، يتم الحجز المسبق..."
            />
          </div>

          {/* Sort order & Active toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ترتيب العرض
              </label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-copticNavy"
              />
            </div>

            <div className="flex items-center gap-3 pt-5">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
              <span className="text-xs font-bold text-slate-700">
                {isActive ? "الخدمة نشطة وتظهر بالموقع" : "الخدمة معطلة ومخفية"}
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-xs font-bold text-white bg-copticNavy hover:bg-copticNavy-800 disabled:opacity-50 rounded-xl transition flex items-center gap-2 shadow-xs"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEditing ? "حفظ التعديلات" : "إضافة الخدمة"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
