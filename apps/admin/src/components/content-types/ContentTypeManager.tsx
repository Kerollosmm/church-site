"use client";

// apps/admin/src/components/content-types/ContentTypeManager.tsx
// Interactive client manager for Content Types (CMS models).
// Enables staff to create, edit, deactivate, and navigate to field definitions.

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit2,
  Trash2,
  SlidersHorizontal,
  FolderOpen,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  Copy,
  Search,
} from "lucide-react";
import type { ContentType } from "@church-site/domain";
import {
  createContentTypeAction,
  updateContentTypeAction,
  deleteContentTypeAction,
  duplicateContentTypeAction,
} from "@/actions/content-type-actions";
import { AdminFeedback, type AdminFeedbackTone } from "@/components/admin/AdminFeedback";
import {
  ADMIN_BADGE,
  ADMIN_BUTTON_PRIMARY,
  ADMIN_BUTTON_QUIET,
  ADMIN_BUTTON_SECONDARY,
  ADMIN_HINT,
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_PANEL,
  ADMIN_TABLE,
  ADMIN_TD,
  ADMIN_TH,
} from "@/components/admin/admin-ui";

export interface ContentTypeManagerProps {
  types: ContentType[];
  fieldCounts?: Record<string, number>;
  entryCounts?: Record<string, number>;
  readOnly?: boolean;
}

export function ContentTypeManager({
  types,
  fieldCounts = {},
  entryCounts = {},
  readOnly = false,
}: ContentTypeManagerProps): React.ReactElement {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<ContentType | null>(null);

  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [slug, setSlug] = useState("");
  const [template, setTemplate] = useState("default");
  const [isActive, setIsActive] = useState(true);

  // Search & Filter states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [feedback, setFeedback] = useState<{ message: string; tone: AdminFeedbackTone } | null>(null);
  const [isPending, startTransition] = useTransition();

  const openCreateModal = () => {
    setEditingType(null);
    setNameAr("");
    setNameEn("");
    setSlug("");
    setTemplate("default");
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (t: ContentType) => {
    setEditingType(t);
    setNameAr(t.nameAr);
    setNameEn(t.nameEn || "");
    setSlug(t.slug);
    setTemplate(t.template || "default");
    setIsActive(t.isActive);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!nameAr.trim() || !slug.trim()) {
      setFeedback({ message: "الاسم والمعرّف اللطيف (Slug) حقول إلزامية.", tone: "error" });
      return;
    }

    startTransition(async () => {
      if (editingType) {
        const res = await updateContentTypeAction(editingType.id, {
          nameAr: nameAr.trim(),
          nameEn: nameEn.trim() || null,
          slug: slug.trim(),
          template: template.trim() || "default",
          isActive,
        });

        if (res.success) {
          setFeedback({ message: res.message, tone: "success" });
          setModalOpen(false);
          router.refresh();
        } else {
          setFeedback({ message: res.message, tone: "error" });
        }
      } else {
        const res = await createContentTypeAction({
          nameAr: nameAr.trim(),
          nameEn: nameEn.trim() || null,
          slug: slug.trim(),
          template: template.trim() || "default",
          isActive,
        });

        if (res.success) {
          setFeedback({ message: res.message, tone: "success" });
          setModalOpen(false);
          router.refresh();
        } else {
          setFeedback({ message: res.message, tone: "error" });
        }
      }
    });
  };

  const handleDelete = (id: string, typeName: string) => {
    const confirmed = window.confirm(`هل أنت متأكد من حذف نموذج «${typeName}» وكل حقوله ومحتوياته؟`);
    if (!confirmed) return;

    startTransition(async () => {
      const res = await deleteContentTypeAction(id);
      if (res.success) {
        setFeedback({ message: res.message, tone: "success" });
        router.refresh();
      } else {
        setFeedback({ message: res.message, tone: "error" });
      }
    });
  };

  const handleDuplicate = (id: string) => {
    startTransition(async () => {
      const res = await duplicateContentTypeAction(id);
      if (res.success) {
        setFeedback({ message: res.message, tone: "success" });
        router.refresh();
      } else {
        setFeedback({ message: res.message, tone: "error" });
      }
    });
  };

  const filteredTypes = types.filter((t) => {
    if (statusFilter === "active" && !t.isActive) return false;
    if (statusFilter === "inactive" && t.isActive) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      t.nameAr.toLowerCase().includes(q) ||
      (t.nameEn && t.nameEn.toLowerCase().includes(q)) ||
      t.slug.toLowerCase().includes(q) ||
      (t.template && t.template.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {feedback && (
        <AdminFeedback
          message={feedback.message}
          tone={feedback.tone}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-700">
            نماذج المحتوى المعرفة ({types.length})
          </h2>
          <p className="text-xs text-slate-500">
            إنشاء وإدارة نماذج المحتوى الديناميكية وحقولها بدون الحاجة لتعديل الكود.
          </p>
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={openCreateModal}
            className={ADMIN_BUTTON_PRIMARY}
            disabled={isPending}
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء نموذج جديد</span>
          </button>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث في النماذج..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-1.5 text-xs text-copticNavy focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="content-type-status-select" className="text-xs font-heading font-bold text-slate-700 whitespace-nowrap">
              تصفية بالحالة:
            </label>
            <select
              id="content-type-status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-copticNavy focus:outline-hidden"
            >
              <option value="all">كافة الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">معطّل</option>
            </select>
          </div>
        </div>

        <p className="text-xs text-slate-500 whitespace-nowrap">
          النماذج المعروضة: <strong className="text-copticNavy">{filteredTypes.length}</strong> من أصل{" "}
          <strong className="text-copticNavy">{types.length}</strong>
        </p>
      </div>

      <div className={ADMIN_PANEL}>
        <div className="overflow-x-auto">
          <table className={ADMIN_TABLE}>
            <thead>
              <tr>
                <th className={ADMIN_TH}>النموذج</th>
                <th className={ADMIN_TH}>المعرّف (Slug)</th>
                <th className={ADMIN_TH}>القالب</th>
                <th className={ADMIN_TH}>الحقول</th>
                <th className={ADMIN_TH}>العناصر</th>
                <th className={ADMIN_TH}>الحالة</th>
                <th className={`${ADMIN_TH} text-start`}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredTypes.map((t) => {
                const fieldsCount = fieldCounts[t.id] ?? 0;
                const entriesCount = entryCounts[t.id] ?? 0;

                return (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className={ADMIN_TD}>
                      <div>
                        <span className="font-bold text-copticNavy">{t.nameAr}</span>
                        {t.nameEn && (
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {t.nameEn}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className={ADMIN_TD}>
                      <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-700">
                        {t.slug}
                      </code>
                    </td>
                    <td className={ADMIN_TD}>
                      <span className="text-xs text-slate-600">
                        {t.template || "default"}
                      </span>
                    </td>
                    <td className={ADMIN_TD}>
                      <span className="font-semibold text-slate-700">{fieldsCount}</span>
                    </td>
                    <td className={ADMIN_TD}>
                      <span className="font-semibold text-slate-700">{entriesCount}</span>
                    </td>
                    <td className={ADMIN_TD}>
                      {t.isActive ? (
                        <span className={`${ADMIN_BADGE} bg-emerald-50 text-emerald-700 border border-emerald-200`}>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>نشط</span>
                        </span>
                      ) : (
                        <span className={`${ADMIN_BADGE} bg-slate-100 text-slate-600 border border-slate-200`}>
                          <XCircle className="w-3 h-3" />
                          <span>معطّل</span>
                        </span>
                      )}
                    </td>
                    <td className={`${ADMIN_TD} text-start`}>
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/content-types/${t.id}/fields`}
                          className={ADMIN_BUTTON_QUIET}
                          title="إدارة الحقول"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-copticNavy" />
                          <span>الحقول</span>
                        </Link>

                        <Link
                          href={`/content/${t.slug}`}
                          className={ADMIN_BUTTON_QUIET}
                          title="استعراض المحتوى"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-copticNavy" />
                          <span>المحتوى</span>
                        </Link>

                        {!readOnly && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleDuplicate(t.id)}
                              className={ADMIN_BUTTON_QUIET}
                              title="نسخ النموذج"
                              disabled={isPending}
                            >
                              <Copy className="w-3.5 h-3.5 text-slate-600" />
                              <span>نسخ</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditModal(t)}
                              className={ADMIN_BUTTON_QUIET}
                              title="تعديل النموذج"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(t.id, t.nameAr)}
                              className={ADMIN_BUTTON_QUIET}
                              title="حذف النموذج"
                              disabled={isPending}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredTypes.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    لا توجد نماذج محتوى مطابقة للتصفية الحالية.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Create / Edit Content Type */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-heading text-sm font-bold text-copticNavy">
                {editingType ? `تعديل نموذج «${editingType.nameAr}»` : "إنشاء نموذج محتوى جديد"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label htmlFor="modal-name-ar" className={ADMIN_LABEL}>
                  اسم النموذج بالعربية <span className="text-red-500">*</span>
                </label>
                <input
                  id="modal-name-ar"
                  type="text"
                  value={nameAr}
                  onChange={(e) => {
                    setNameAr(e.target.value);
                    if (!editingType && !slug) {
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .trim()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-|-$/g, "")
                      );
                    }
                  }}
                  placeholder="مثال: مقالات الآباء، عظات، تنويهات"
                  className={ADMIN_INPUT}
                  required
                />
              </div>

              <div>
                <label htmlFor="modal-slug" className={ADMIN_LABEL}>
                  المعرّف اللطيف في الرابط (Slug) <span className="text-red-500">*</span>
                </label>
                <input
                  id="modal-slug"
                  type="text"
                  dir="ltr"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().trim())}
                  placeholder="articles, sermons, announcements"
                  className={`${ADMIN_INPUT} font-mono text-xs`}
                  required
                />
                <p className={ADMIN_HINT}>
                  يحدد مسار الموقع: <code className="text-copticNavy font-bold">/content/{slug || "slug"}</code>
                </p>
              </div>

              <div>
                <label htmlFor="modal-template" className={ADMIN_LABEL}>
                  قالب العرض في الموقع العام
                </label>
                <select
                  id="modal-template"
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className={ADMIN_INPUT}
                >
                  <option value="default">القالب الافتراضي (Default)</option>
                  <option value="article">قالب المقال والمدونة (Article / Blog)</option>
                </select>
              </div>

              <div>
                <label htmlFor="modal-name-en" className={ADMIN_LABEL}>
                  الاسم بالإنجليزية (اختياري)
                </label>
                <input
                  id="modal-name-en"
                  type="text"
                  dir="ltr"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="Articles, Sermons, etc."
                  className={ADMIN_INPUT}
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-copticNavy focus:ring-copticNavy-500"
                  />
                  <span className="text-xs font-bold text-slate-700">
                    نموذج نشط (متاح لإدخال المحتوى وظهوره للعامة)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className={ADMIN_BUTTON_SECONDARY}
                  disabled={isPending}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className={ADMIN_BUTTON_PRIMARY}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>{editingType ? "حفظ التعديلات" : "إنشاء النموذج"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
