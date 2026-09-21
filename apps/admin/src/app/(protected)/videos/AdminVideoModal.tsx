"use client";

// apps/admin/src/app/(protected)/videos/AdminVideoModal.tsx
// Add / Edit Modal for Parish Videos with live provider detection and embed preview.

import React, { useState, useEffect } from "react";
import { X, Video, Loader2, AlertCircle, CheckCircle, ExternalLink } from "lucide-react";
import type { ParishVideo, VideoProvider } from "@church-site/domain";
import { normalizeVideoUrl } from "@church-site/data-access/client";
import { upsertVideoAction } from "@/actions/admin-video-actions";
import {
  ParishVideoInputSchema,
  type ParishVideoFormInput,
  type AdminVideoActionResult,
} from "@/actions/admin-video-actions.shared";

export interface AdminVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (video: ParishVideo) => void;
  initialData?: ParishVideo | null;
}

const PROVIDER_LABELS: Record<VideoProvider, { label: string; color: string }> = {
  youtube: { label: "يوتيوب (YouTube)", color: "bg-red-100 text-red-800 border-red-200" },
  facebook: { label: "فيسبوك (Facebook)", color: "bg-blue-100 text-blue-800 border-blue-200" },
  direct: { label: "رابط فيديو مباشر", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
};

export function AdminVideoModal({
  isOpen,
  onClose,
  onSaved,
  initialData,
}: AdminVideoModalProps) {
  const isEditing = Boolean(initialData);

  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isPublic, setIsPublic] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live provider detection and embed preview
  const normalized = sourceUrl.trim().length > 0 ? normalizeVideoUrl(sourceUrl) : null;
  const isUrlInvalid = sourceUrl.trim().length > 0 && !normalized;

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      if (initialData) {
        setTitleAr(initialData.titleAr);
        setTitleEn(initialData.titleEn || "");
        setDescriptionAr(initialData.descriptionAr || "");
        setDescriptionEn(initialData.descriptionEn || "");
        setSourceUrl(initialData.sourceUrl);
        setSortOrder(initialData.sortOrder);
        setIsPublic(initialData.isPublic);
        setIsActive(initialData.isActive);
      } else {
        setTitleAr("");
        setTitleEn("");
        setDescriptionAr("");
        setDescriptionEn("");
        setSourceUrl("");
        setSortOrder(0);
        setIsPublic(true);
        setIsActive(true);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!titleAr.trim()) {
      setErrorMessage("يرجى إدخال عنوان الفيديو بالعربية.");
      return;
    }

    if (!sourceUrl.trim()) {
      setErrorMessage("يرجى إدخال رابط الفيديو.");
      return;
    }

    if (!normalized) {
      setErrorMessage(
        "رابط الفيديو غير معتمد أمنياً. يقبل النظام فقط روابط HTTPS موثوقة من YouTube أو Facebook أو ملفات وسائط مدعومة."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await upsertVideoAction({
        id: initialData?.id,
        title_ar: titleAr,
        title_en: titleEn || null,
        description_ar: descriptionAr || null,
        description_en: descriptionEn || null,
        source_url: sourceUrl,
        sort_order: sortOrder,
        is_public: isPublic,
        is_active: isActive,
      });

      if (!res.success) {
        setErrorMessage(res.message);
        setIsSubmitting(false);
        return;
      }

      if (res.data) {
        onSaved(res.data);
      }
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "حدث خطأ غير متوقع.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-fade-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-copticGold-100 text-copticGold-800 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900">
                {isEditing ? "تعديل فيديو كنسي" : "إضافة فيديو كنسي جديد"}
              </h3>
              <p className="text-xs text-slate-500">
                إدراج رابط فيديو خارجي موثوق لعرضه على الموقع العام
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* URL Input with Live Detection */}
          <div className="space-y-2">
            <label htmlFor="video-source-url" className="block text-xs font-bold text-slate-700">
              رابط الفيديو الأصلي <span className="text-red-500">*</span>
            </label>
            <input
              id="video-source-url"
              name="source_url"
              type="url"
              dir="ltr"
              placeholder="https://www.youtube.com/watch?v=... أو https://facebook.com/..."
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-copticGold-400 text-xs font-mono text-slate-800"
              required
            />

            {/* Provider Status Pill */}
            {normalized && (
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                    PROVIDER_LABELS[normalized.provider].color
                  }`}
                >
                  <CheckCircle className="w-3 h-3" />
                  {PROVIDER_LABELS[normalized.provider].label}
                </span>
                <span className="text-[11px] text-slate-500">تم التحقق من أمان الرابط</span>
              </div>
            )}

            {isUrlInvalid && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>تنبيه أمان: الرابط غير مدعوم</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  يقبل النظام روابط موثوقة فقط من يوتيوب (YouTube / Shorts / youtu.be) أو فيسبوك (Facebook Videos) لحماية الزوار ومنع التضمين العشوائي غير الآمن.
                </p>
              </div>
            )}
          </div>

          {/* Live Embed Preview */}
          {normalized && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-600">
                معاينة التضمين المباشر:
              </label>
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                <iframe
                  src={normalized.embedUrl}
                  title="معاينة الفيديو"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Arabic Title */}
          <div className="space-y-1.5">
            <label htmlFor="video-title-ar" className="block text-xs font-bold text-slate-700">
              عنوان الفيديو (بالعربية) <span className="text-red-500">*</span>
            </label>
            <input
              id="video-title-ar"
              name="title_ar"
              type="text"
              placeholder="مثال: قداس عيد القيامة المجيد 2026"
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-copticGold-400 text-xs text-slate-800"
              required
            />
          </div>

          {/* English Title */}
          <div className="space-y-1.5">
            <label htmlFor="video-title-en" className="block text-xs font-bold text-slate-700">
              العنوان (بالإنجليزية - اختياري)
            </label>
            <input
              id="video-title-en"
              name="title_en"
              type="text"
              dir="ltr"
              placeholder="e.g. Resurrection Feast Divine Liturgy 2026"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-copticGold-400 text-xs text-slate-800 text-left font-english"
            />
          </div>

          {/* Arabic Description */}
          <div className="space-y-1.5">
            <label htmlFor="video-description-ar" className="block text-xs font-bold text-slate-700">
              وصف مختصر للفيديو (اختياري)
            </label>
            <textarea
              id="video-description-ar"
              name="description_ar"
              rows={3}
              placeholder="تفاصيل ونبذة عن مناسبة الفيديو..."
              value={descriptionAr}
              onChange={(e) => setDescriptionAr(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-copticGold-400 text-xs text-slate-800"
            />
          </div>

          {/* English Description */}
          <div className="space-y-1.5">
            <label htmlFor="video-description-en" className="block text-xs font-bold text-slate-700">
              الوصف بالإنجليزية (اختياري)
            </label>
            <textarea
              id="video-description-en"
              name="description_en"
              rows={2}
              dir="ltr"
              placeholder="English description..."
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-copticGold-400 text-xs text-slate-800 font-english text-left"
            />
          </div>

          {/* Settings Grid: Sort Order, Public, Active */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label htmlFor="video-sort-order" className="block text-xs font-bold text-slate-700 mb-1.5">
                ترتيب الظهور
              </label>
              <input
                id="video-sort-order"
                name="sort_order"
                type="number"
                min="0"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
              <span className="text-[10px] text-slate-400">الأصغر يظهر أولاً</span>
            </div>

            <div className="flex flex-col justify-center space-y-1">
              <label htmlFor="video-is-public" className="text-xs font-bold text-slate-700 cursor-pointer">الظهور في الموقع العام</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="video-is-public"
                  name="is_public"
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-copticGold-600"></div>
                <span className="mr-2 text-xs font-medium text-slate-600">
                  {isPublic ? "منشور للجمهور" : "مخفي"}
                </span>
              </label>
            </div>

            <div className="flex flex-col justify-center space-y-1">
              <label htmlFor="video-is-active" className="text-xs font-bold text-slate-700 cursor-pointer">تفعيل السجل</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="video-is-active"
                  name="is_active"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="mr-2 text-xs font-medium text-slate-600">
                  {isActive ? "نشط" : "معطل"}
                </span>
              </label>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              disabled={isSubmitting}
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !normalized}
              className="flex items-center gap-2 px-5 py-2.5 bg-copticGold-600 hover:bg-copticGold-700 text-slate-950 font-heading font-bold text-xs rounded-xl transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isEditing ? "حفظ التعديلات" : "إضافة الفيديو"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
