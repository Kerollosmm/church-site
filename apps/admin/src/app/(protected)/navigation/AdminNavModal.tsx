"use client";

// apps/admin/src/app/(protected)/navigation/AdminNavModal.tsx
// Add / Edit Modal for Navigation Menu Items.

import React, { useState, useEffect } from "react";
import { X, Compass, Loader2, AlertCircle } from "lucide-react";
import type { NavigationMenuItem, NavSection } from "@church-site/domain";
import { upsertNavItemAction } from "@/actions/admin-navigation-actions";

export interface AdminNavModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (item: NavigationMenuItem) => void;
  initialData?: NavigationMenuItem | null;
  availableParents: NavigationMenuItem[];
}

export function AdminNavModal({
  isOpen,
  onClose,
  onSaved,
  initialData,
  availableParents,
}: AdminNavModalProps) {
  const isEditing = Boolean(initialData);

  const [key, setKey] = useState("");
  const [labelAr, setLabelAr] = useState("");
  const [labelEn, setLabelEn] = useState("");
  const [href, setHref] = useState("");
  const [section, setSection] = useState<NavSection>("main");
  const [parentId, setParentId] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [isPublic, setIsPublic] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      if (initialData) {
        setKey(initialData.key);
        setLabelAr(initialData.labelAr);
        setLabelEn(initialData.labelEn || "");
        setHref(initialData.href);
        setSection(initialData.section);
        setParentId(initialData.parentId || "");
        setSortOrder(initialData.sortOrder);
        setIsActive(initialData.isActive);
        setIsPublic(initialData.isPublic);
      } else {
        setKey("");
        setLabelAr("");
        setLabelEn("");
        setHref("");
        setSection("main");
        setParentId("");
        setSortOrder(0);
        setIsActive(true);
        setIsPublic(true);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!key.trim()) {
      setErrorMessage("يرجى إدخال المفتاح التعريفي (key).");
      return;
    }
    if (!labelAr.trim()) {
      setErrorMessage("يرجى إدخال عنوان الرابط بالعربية.");
      return;
    }
    if (!href.trim()) {
      setErrorMessage("يرجى إدخال مسار الرابط (href).");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await upsertNavItemAction({
        id: initialData?.id,
        key: key.trim(),
        label_ar: labelAr.trim(),
        label_en: labelEn.trim() || null,
        href: href.trim(),
        section,
        parent_id: parentId.trim() || null,
        sort_order: sortOrder,
        is_active: isActive,
        is_public: isPublic,
      });

      if (res.success && res.data) {
        onSaved(res.data);
        onClose();
      } else {
        setErrorMessage(res.message || "فشل حفظ عنصر التنقل.");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "حدث خطأ غير متوقع.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Exclude current item from potential parents if editing to avoid circular parenting
  const validParents = availableParents.filter(
    (p) => !initialData || p.id !== initialData.id
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-copticGold-300 w-full max-w-xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-copticNavy-950 text-white px-6 py-4 flex items-center justify-between border-b-2 border-copticGold-500">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-copticGold-500 text-copticNavy-950 flex items-center justify-center font-bold">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-white">
                {isEditing ? "تعديل عنصر في شريط التنقل" : "إضافة عنصر جديد لشريط التنقل"}
              </h3>
              <p className="text-xs text-copticGold-400">
                التحكم في روابط وقوائم الترويسة الرئيسية للموقع
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                عنوان الرابط (عربي) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={labelAr}
                onChange={(e) => setLabelAr(e.target.value)}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-copticNavy"
                placeholder="مثال: الخدمات المجتمعية"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                عنوان الرابط (إنجليزي)
              </label>
              <input
                type="text"
                value={labelEn}
                onChange={(e) => setLabelEn(e.target.value)}
                dir="ltr"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-copticNavy text-left"
                placeholder="e.g. Services"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المفتاح التعريفي (Key) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                required
                dir="ltr"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-copticNavy font-mono text-left"
                placeholder="services-main"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                مسار الرابط (Href) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={href}
                onChange={(e) => setHref(e.target.value)}
                required
                dir="ltr"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-copticNavy font-mono text-left"
                placeholder="/services"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                قسم التنقل
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value as NavSection)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-copticNavy bg-white"
              >
                <option value="main">القائمة الرئيسية (Main Navbar)</option>
                <option value="secondary">قائمة ثانوية / جانبية (Secondary)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                العنصر الرئيسي (للقوائم المنسدلة)
              </label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-copticNavy bg-white"
              >
                <option value="">عنصر رئيسي مستقل (بدون أب)</option>
                {validParents.map((p) => (
                  <option key={p.id} value={p.id}>
                    قائمة منسدلة تحت: {p.labelAr} ({p.key})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ترتيب الظهور
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-copticNavy"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-3">
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
                {isActive ? "الرابط نشط" : "الرابط معطل"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
              <span className="text-xs font-bold text-slate-700">
                {isPublic ? "ظاهر للجمهور" : "مخفي عن الجمهور"}
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
              <span>{isEditing ? "حفظ التعديلات" : "إضافة العنصر"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
