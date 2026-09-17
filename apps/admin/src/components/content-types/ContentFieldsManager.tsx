"use client";

// apps/admin/src/components/content-types/ContentFieldsManager.tsx
// Interactive client manager for dynamic ContentField definitions.
// Allows staff to configure schema fields (type, label, slug, options, validation).

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit2,
  Trash2,
  ArrowRight,
  Loader2,
  X,
  Type,
  AlignLeft,
  Hash,
  Calendar,
  ToggleLeft,
  ListFilter,
  Image as ImageIcon,
  Network,
} from "lucide-react";
import type {
  ContentType,
  ContentField,
  FieldType,
  ContentFieldOption,
} from "@church-site/domain";
import {
  createContentFieldAction,
  updateContentFieldAction,
  deleteContentFieldAction,
} from "@/actions/content-type-actions";
import { AdminFeedback, type AdminFeedbackTone } from "@/components/admin/AdminFeedback";
import {
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

export interface ContentFieldsManagerProps {
  contentType: ContentType;
  fields: ContentField[];
  readOnly?: boolean;
}

const FIELD_TYPE_OPTIONS: Array<{ value: FieldType; label: string; icon: React.ElementType }> = [
  { value: "text", label: "نص قصير (Text)", icon: Type },
  { value: "richtext", label: "نص منسق (Rich Text)", icon: AlignLeft },
  { value: "number", label: "رقم (Number)", icon: Hash },
  { value: "date", label: "تاريخ ووقت (Date / Time)", icon: Calendar },
  { value: "boolean", label: "قيمة منطقية نعم/لا (Boolean)", icon: ToggleLeft },
  { value: "select", label: "قائمة خيارات (Select)", icon: ListFilter },
  { value: "media", label: "وسائط أو صورة (Media)", icon: ImageIcon },
  { value: "relation", label: "ارتباط بمحتوى آخر (Relation)", icon: Network },
];

export function ContentFieldsManager({
  contentType,
  fields,
  readOnly = false,
}: ContentFieldsManagerProps): React.ReactElement {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<ContentField | null>(null);

  // Form states
  const [slug, setSlug] = useState("");
  const [labelAr, setLabelAr] = useState("");
  const [labelEn, setLabelEn] = useState("");
  const [fieldType, setFieldType] = useState<FieldType>("text");
  const [isRequired, setIsRequired] = useState(false);
  const [isTranslatable, setIsTranslatable] = useState(false);
  const [optionsText, setOptionsText] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  const [feedback, setFeedback] = useState<{ message: string; tone: AdminFeedbackTone } | null>(null);
  const [isPending, startTransition] = useTransition();

  const sortedFields = [...fields].sort((a, b) => a.sortOrder - b.sortOrder);

  const openCreateModal = () => {
    setEditingField(null);
    setSlug("");
    setLabelAr("");
    setLabelEn("");
    setFieldType("text");
    setIsRequired(false);
    setIsTranslatable(false);
    setOptionsText("");
    setSortOrder((fields.length + 1) * 10);
    setModalOpen(true);
  };

  const openEditModal = (f: ContentField) => {
    setEditingField(f);
    setSlug(f.slug);
    setLabelAr(f.labelAr);
    setLabelEn(f.labelEn || "");
    setFieldType(f.fieldType);
    setIsRequired(f.isRequired);
    setIsTranslatable(f.isTranslatable);
    setOptionsText(
      Array.isArray(f.options)
        ? f.options.map((o) => (typeof o === "string" ? o : JSON.stringify(o))).join("\n")
        : typeof f.options === "object" && f.options !== null
        ? JSON.stringify(f.options, null, 2)
        : ""
    );
    setSortOrder(f.sortOrder);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!slug.trim() || !labelAr.trim()) {
      setFeedback({ message: "يرجى تحديد المعرّف (Slug) والتسمية بالعربية.", tone: "error" });
      return;
    }

    // Process options
    let parsedOptions: ContentFieldOption[] | string[] | null = null;
    if (optionsText.trim()) {
      try {
        parsedOptions = JSON.parse(optionsText.trim());
      } catch {
        // Line-delimited string array fallback
        parsedOptions = optionsText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    startTransition(async () => {
      if (editingField) {
        const res = await updateContentFieldAction(editingField.id, {
          slug: slug.trim(),
          labelAr: labelAr.trim(),
          labelEn: labelEn.trim() || null,
          fieldType,
          isRequired,
          isTranslatable,
          options: parsedOptions,
          sortOrder,
        });

        if (res.success) {
          setFeedback({ message: res.message, tone: "success" });
          setModalOpen(false);
          router.refresh();
        } else {
          setFeedback({ message: res.message, tone: "error" });
        }
      } else {
        const res = await createContentFieldAction(contentType.id, {
          slug: slug.trim(),
          labelAr: labelAr.trim(),
          labelEn: labelEn.trim() || null,
          fieldType,
          isRequired,
          isTranslatable,
          options: parsedOptions,
          sortOrder,
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

  const handleDelete = (fieldId: string, label: string) => {
    const confirmed = window.confirm(`هل أنت متأكد من حذف الحقل «${label}»؟`);
    if (!confirmed) return;

    startTransition(async () => {
      const res = await deleteContentFieldAction(fieldId);
      if (res.success) {
        setFeedback({ message: res.message, tone: "success" });
        router.refresh();
      } else {
        setFeedback({ message: res.message, tone: "error" });
      }
    });
  };

  const getTypeIcon = (type: FieldType) => {
    const match = FIELD_TYPE_OPTIONS.find((opt) => opt.value === type);
    const Icon = match?.icon || Type;
    return <Icon className="w-3.5 h-3.5" />;
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <AdminFeedback
          message={feedback.message}
          tone={feedback.tone}
        />
      )}

      {/* Navigation and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/content-types"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-copticNavy"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة إلى قائمة نماذج المحتوى</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/content/${contentType.slug}`}
            className={ADMIN_BUTTON_SECONDARY}
          >
            <span>استعراض المحتوى</span>
          </Link>

          {!readOnly && (
            <button
              type="button"
              onClick={openCreateModal}
              className={ADMIN_BUTTON_PRIMARY}
              disabled={isPending}
            >
              <Plus className="w-4 h-4" />
              <span>إضافة حقل جديد</span>
            </button>
          )}
        </div>
      </div>

      <div className={ADMIN_PANEL}>
        <div className="overflow-x-auto">
          <table className={ADMIN_TABLE}>
            <thead>
              <tr>
                <th className={ADMIN_TH}>الترتيب</th>
                <th className={ADMIN_TH}>التسمية (Label)</th>
                <th className={ADMIN_TH}>المعرّف (Slug)</th>
                <th className={ADMIN_TH}>نوع الحقل</th>
                <th className={ADMIN_TH}>إلزامي؟</th>
                <th className={ADMIN_TH}>خيارات إضافية</th>
                <th className={`${ADMIN_TH} text-start`}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {sortedFields.map((field) => (
                <tr key={field.id} className="hover:bg-slate-50/80 transition">
                  <td className={ADMIN_TD}>
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {field.sortOrder}
                    </span>
                  </td>
                  <td className={ADMIN_TD}>
                    <div>
                      <span className="font-bold text-copticNavy">{field.labelAr}</span>
                      {field.labelEn && (
                        <span className="text-[11px] text-slate-400 ms-1 font-normal">
                          ({field.labelEn})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={ADMIN_TD}>
                    <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-700">
                      {field.slug}
                    </code>
                  </td>
                  <td className={ADMIN_TD}>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 text-[11px] font-medium text-slate-700">
                      {getTypeIcon(field.fieldType)}
                      <span>{field.fieldType}</span>
                    </span>
                  </td>
                  <td className={ADMIN_TD}>
                    {field.isRequired ? (
                      <span className="text-xs font-bold text-red-600">نعم (إلزامي)</span>
                    ) : (
                      <span className="text-xs text-slate-400">اختياري</span>
                    )}
                  </td>
                  <td className={ADMIN_TD}>
                    <span className="text-[11px] text-slate-500">
                      {field.options
                        ? Array.isArray(field.options)
                          ? `${field.options.length} خيارات`
                          : "مهيأ"
                        : "—"}
                    </span>
                  </td>
                  <td className={`${ADMIN_TD} text-start`}>
                    {!readOnly && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(field)}
                          className={ADMIN_BUTTON_QUIET}
                          title="تعديل الحقل"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(field.id, field.labelAr)}
                          className={ADMIN_BUTTON_QUIET}
                          title="حذف الحقل"
                          disabled={isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {sortedFields.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    لم يتم تعريف أي حقول لهذا النموذج بعد. انقر على «إضافة حقل جديد» للبدء.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Create / Edit Field */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-heading text-sm font-bold text-copticNavy">
                {editingField ? `تعديل الحقل «${editingField.labelAr}»` : "إضافة حقل جديد للنموذج"}
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
                <label htmlFor="field-label-ar" className={ADMIN_LABEL}>
                  تسمية الحقل بالعربية (تظهر في النموذج) <span className="text-red-500">*</span>
                </label>
                <input
                  id="field-label-ar"
                  type="text"
                  value={labelAr}
                  onChange={(e) => {
                    setLabelAr(e.target.value);
                    if (!editingField && !slug) {
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .trim()
                          .replace(/[^a-z0-9]+/g, "_")
                          .replace(/^_+|_+$/g, "")
                      );
                    }
                  }}
                  placeholder="مثال: اسم المتكلم، نص العظة، صورة الغلاف"
                  className={ADMIN_INPUT}
                  required
                />
              </div>

              <div>
                <label htmlFor="field-slug" className={ADMIN_LABEL}>
                  المعرّف البرمجي للحقل (Slug / Key) <span className="text-red-500">*</span>
                </label>
                <input
                  id="field-slug"
                  type="text"
                  dir="ltr"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().trim())}
                  placeholder="speaker, sermon_body, cover_image"
                  className={`${ADMIN_INPUT} font-mono text-xs`}
                  required
                />
                <p className={ADMIN_HINT}>
                  المفتاح البرمجي المخزن في كائن البيانات JSON (يجب أن يكون فريداً داخل النموذج).
                </p>
              </div>

              <div>
                <label htmlFor="field-label-en" className={ADMIN_LABEL}>
                  تسمية الحقل بالإنجليزية (اختياري)
                </label>
                <input
                  id="field-label-en"
                  type="text"
                  dir="ltr"
                  value={labelEn}
                  onChange={(e) => setLabelEn(e.target.value)}
                  placeholder="Speaker, Content Body, Cover Image"
                  className={ADMIN_INPUT}
                />
              </div>

              <div>
                <label htmlFor="field-type" className={ADMIN_LABEL}>
                  نوع الحقل <span className="text-red-500">*</span>
                </label>
                <select
                  id="field-type"
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value as FieldType)}
                  className={ADMIN_INPUT}
                >
                  {FIELD_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {(fieldType === "select" || fieldType === "relation") && (
                <div>
                  <label htmlFor="field-options" className={ADMIN_LABEL}>
                    الخيارات المتاحة (سطر لكل خيار أو مصفوفة JSON)
                  </label>
                  <textarea
                    id="field-options"
                    rows={3}
                    dir="auto"
                    value={optionsText}
                    onChange={(e) => setOptionsText(e.target.value)}
                    placeholder="خيار أول&#10;خيار ثاني&#10;خيار ثالث"
                    className={`${ADMIN_INPUT} font-mono text-xs`}
                  />
                  <p className={ADMIN_HINT}>
                    اكتب كل خيار في سطر منفصل، أو أدخل مصفوفة JSON بصيغة [<br />
                    &nbsp;&nbsp;{`{"value": "val1", "label": "نص الخيار"}`}<br />
                    ]
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="field-order" className={ADMIN_LABEL}>
                  ترتيب العرض
                </label>
                <input
                  id="field-order"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className={ADMIN_INPUT}
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-copticNavy focus:ring-copticNavy-500"
                  />
                  <span className="text-xs font-bold text-slate-700">حقل إلزامي</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isTranslatable}
                    onChange={(e) => setIsTranslatable(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-copticNavy focus:ring-copticNavy-500"
                  />
                  <span className="text-xs font-bold text-slate-700">قابل للترجمة</span>
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
                  <span>{editingField ? "حفظ التعديلات" : "إضافة الحقل"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
