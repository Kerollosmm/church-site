"use client";

// apps/admin/src/components/admin/DynamicEntryForm.tsx
// Dynamic runtime form generated from ContentField definitions.
// Supports text, richtext, number, date, boolean, select, media, and relation fields.

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Save,
  Send,
  Trash2,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Upload,
} from "lucide-react";
import type {
  ContentType,
  ContentField,
  ContentStatus,
  MediaRecord,
  ContentFieldOption,
} from "@church-site/domain";
import {
  resolveExternalImageUrl,
  isResolvedAsset,
} from "@church-site/data-access/client";
import {
  createContentEntryAction,
  updateContentEntryAction,
  deleteContentEntryAction,
} from "@/actions/content-entry-actions";
import { RichTextEditor } from "./RichTextEditor";
import { MediaUploader } from "@/components/media/MediaUploader";
import { AdminFeedback, type AdminFeedbackTone } from "./AdminFeedback";
import {
  ADMIN_BUTTON_DANGER,
  ADMIN_BUTTON_PRIMARY,
  ADMIN_BUTTON_SECONDARY,
  ADMIN_ERROR_TEXT,
  ADMIN_HINT,
  ADMIN_INPUT,
  ADMIN_INPUT_INVALID,
  ADMIN_LABEL,
  ADMIN_PANEL,
  ADMIN_SECTION_HEADING,
} from "./admin-ui";

export interface DynamicEntryFormProps {
  contentType: ContentType;
  fields: ContentField[];
  entryId?: string;
  initialSlug?: string;
  initialStatus?: ContentStatus;
  initialData?: Record<string, unknown>;
  relationOptions?: Record<string, Array<{ value: string; label: string }>>;
  canPublish?: boolean;
  canDelete?: boolean;
}

export function DynamicEntryForm({
  contentType,
  fields,
  entryId,
  initialSlug = "",
  initialStatus = "draft",
  initialData = {},
  relationOptions = {},
  canPublish = true,
  canDelete = false,
}: DynamicEntryFormProps): React.ReactElement {
  const router = useRouter();
  const isEditing = Boolean(entryId);

  const [slug, setSlug] = useState(initialSlug);
  const [status, setStatus] = useState<ContentStatus>(initialStatus);
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData);
  const [activeMediaField, setActiveMediaField] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{ message: string; tone: AdminFeedbackTone } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  // Sort fields by sortOrder
  const sortedFields = [...fields].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleFieldChange = (fieldSlug: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldSlug]: value }));
    // Clear error for this field
    if (fieldErrors[fieldSlug]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldSlug];
        return next;
      });
    }
  };

  const handleSubmit = (targetStatus: ContentStatus) => {
    setFeedback(null);
    setFieldErrors({});

    if (!slug.trim()) {
      setFeedback({ message: "يرجى تحديد المعرّف اللطيف (Slug) للعنصر.", tone: "error" });
      setFieldErrors({ slug: ["المعرّف اللطيف مطلوب."] });
      return;
    }

    const sanitizedData = { ...formData };
    for (const field of fields) {
      if (field.fieldType === "media") {
        const val = sanitizedData[field.slug];
        if (typeof val === "string") {
          const res = resolveExternalImageUrl(val);
          if (isResolvedAsset(res)) {
            sanitizedData[field.slug] = res.resolvedUrl;
          }
        }
      }
    }
    setFormData(sanitizedData);

    startTransition(async () => {
      if (isEditing && entryId) {
        const res = await updateContentEntryAction(entryId, {
          slug: slug.trim(),
          status: targetStatus,
          data: sanitizedData as Record<string, any>,
        });

        if (res.success) {
          setStatus(targetStatus);
          setFeedback({ message: res.message, tone: "success" });
          router.refresh();
        } else {
          setFeedback({ message: res.message, tone: "error" });
          if (res.errors) {
            setFieldErrors(res.errors);
          }
        }
      } else {
        const res = await createContentEntryAction(contentType.id, {
          slug: slug.trim(),
          status: targetStatus,
          data: sanitizedData as Record<string, any>,
        });

        if (res.success) {
          setFeedback({ message: res.message, tone: "success" });
          if (res.data) {
            router.push(`/content/${contentType.slug}/${res.data.slug}/edit`);
          }
          router.refresh();
        } else {
          setFeedback({ message: res.message, tone: "error" });
          if (res.errors) {
            setFieldErrors(res.errors);
          }
        }
      }
    });
  };

  const handleDelete = () => {
    if (!entryId) return;
    const confirmed = window.confirm("هل أنت متأكد من حذف هذا المحتوى نهائياً؟");
    if (!confirmed) return;

    startTransition(async () => {
      const res = await deleteContentEntryAction(entryId);
      if (res.success) {
        router.push(`/content/${contentType.slug}`);
        router.refresh();
      } else {
        setFeedback({ message: res.message, tone: "error" });
      }
    });
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <AdminFeedback
          message={feedback.message}
          tone={feedback.tone}
        />
      )}

      {/* Top Bar Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href={`/content/${contentType.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-copticNavy"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة إلى قائمة «{contentType.nameAr}»</span>
        </Link>

        <div className="flex items-center gap-2">
          {isEditing && canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className={ADMIN_BUTTON_DANGER}
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSubmit("draft")}
            disabled={isPending}
            className={ADMIN_BUTTON_SECONDARY}
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>حفظ كمسودة</span>
          </button>

          {canPublish && (
            <button
              type="button"
              onClick={() => handleSubmit("published")}
              disabled={isPending}
              className={ADMIN_BUTTON_PRIMARY}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{isEditing && status === "published" ? "تحديث ونشر" : "نشر الآن"}</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Fields (Main Column) */}
        <div className="lg:col-span-2 space-y-6">
          <div className={ADMIN_PANEL}>
            <h2 className={`${ADMIN_SECTION_HEADING} mb-4`}>بيانات المحتوى</h2>

            <div className="space-y-5">
              {sortedFields.map((field) => {
                const value = formData[field.slug];
                const error = fieldErrors[field.slug]?.[0];

                return (
                  <div key={field.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor={`field-${field.slug}`} className={ADMIN_LABEL}>
                        {field.labelAr}
                        {field.isRequired && <span className="text-red-500 ms-1">*</span>}
                        {field.labelEn && (
                          <span className="text-slate-400 font-normal ms-1 text-[11px]">
                            ({field.labelEn})
                          </span>
                        )}
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {field.slug}
                      </span>
                    </div>

                    {/* Field type input rendering */}
                    {field.fieldType === "text" && (
                      <input
                        id={`field-${field.slug}`}
                        type="text"
                        dir="auto"
                        value={(value as string) || ""}
                        onChange={(e) => handleFieldChange(field.slug, e.target.value)}
                        className={`${ADMIN_INPUT} ${error ? ADMIN_INPUT_INVALID : ""}`}
                        disabled={isPending}
                      />
                    )}

                    {field.fieldType === "richtext" && (
                      <div>
                        <RichTextEditor
                          id={`field-${field.slug}`}
                          value={(value as string) || ""}
                          onChange={(html) => handleFieldChange(field.slug, html)}
                          disabled={isPending}
                        />
                      </div>
                    )}

                    {field.fieldType === "number" && (
                      <input
                        id={`field-${field.slug}`}
                        type="number"
                        value={value !== undefined && value !== null ? String(value) : ""}
                        onChange={(e) => {
                          const val = e.target.value === "" ? null : Number(e.target.value);
                          handleFieldChange(field.slug, val);
                        }}
                        className={`${ADMIN_INPUT} ${error ? ADMIN_INPUT_INVALID : ""}`}
                        disabled={isPending}
                      />
                    )}

                    {field.fieldType === "date" && (
                      <input
                        id={`field-${field.slug}`}
                        type="datetime-local"
                        value={(value as string) || ""}
                        onChange={(e) => handleFieldChange(field.slug, e.target.value)}
                        className={`${ADMIN_INPUT} ${error ? ADMIN_INPUT_INVALID : ""}`}
                        disabled={isPending}
                      />
                    )}

                    {field.fieldType === "boolean" && (
                      <label className="flex items-center gap-3 cursor-pointer py-1">
                        <input
                          id={`field-${field.slug}`}
                          type="checkbox"
                          checked={Boolean(value)}
                          onChange={(e) => handleFieldChange(field.slug, e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-copticNavy focus:ring-copticNavy-500"
                          disabled={isPending}
                        />
                        <span className="text-xs text-slate-700 font-medium">
                          {Boolean(value) ? "مفعّل / نعم" : "معطّل / لا"}
                        </span>
                      </label>
                    )}

                    {field.fieldType === "select" && (
                      <select
                        id={`field-${field.slug}`}
                        value={(value as string) || ""}
                        onChange={(e) => handleFieldChange(field.slug, e.target.value)}
                        className={`${ADMIN_INPUT} ${error ? ADMIN_INPUT_INVALID : ""}`}
                        disabled={isPending}
                      >
                        <option value="">-- اختر خياراً --</option>
                        {Array.isArray(field.options)
                          ? (field.options as Array<string | ContentFieldOption>).map((opt, idx) => {
                              if (typeof opt === "string") {
                                return (
                                  <option key={idx} value={opt}>
                                    {opt}
                                  </option>
                                );
                              }
                              if (opt && typeof opt === "object" && "value" in opt) {
                                return (
                                  <option key={idx} value={opt.value}>
                                    {opt.labelAr || opt.value}
                                  </option>
                                );
                              }
                              return null;
                            })
                          : null}
                      </select>
                    )}

                    {field.fieldType === "relation" && (
                      <div>
                        {relationOptions[field.slug]?.length ? (
                          <select
                            id={`field-${field.slug}`}
                            value={(value as string) || ""}
                            onChange={(e) => handleFieldChange(field.slug, e.target.value)}
                            className={`${ADMIN_INPUT} ${error ? ADMIN_INPUT_INVALID : ""}`}
                            disabled={isPending}
                          >
                            <option value="">-- اختر العنصر المرتبط --</option>
                            {relationOptions[field.slug].map((item) => (
                              <option key={item.value} value={item.value}>
                                {item.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            id={`field-${field.slug}`}
                            type="text"
                            placeholder="أدخل معرّف أو slug العنصر المرتبط"
                            value={(value as string) || ""}
                            onChange={(e) => handleFieldChange(field.slug, e.target.value)}
                            className={`${ADMIN_INPUT} ${error ? ADMIN_INPUT_INVALID : ""}`}
                            disabled={isPending}
                          />
                        )}
                      </div>
                    )}

                    {field.fieldType === "media" && (() => {
                      const strValue = typeof value === "string" ? value.trim() : "";
                      const resolved = strValue ? resolveExternalImageUrl(strValue) : null;
                      const isResolved = isResolvedAsset(resolved);
                      const isDirectImg = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(strValue);
                      const previewUrl = isResolved ? resolved.resolvedUrl : strValue;

                      return (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <input
                              id={`field-${field.slug}`}
                              type="text"
                              placeholder="رابط الوسائط (URL) أو ارفع ملفاً أدناه"
                              value={(value as string) || ""}
                              onChange={(e) => handleFieldChange(field.slug, e.target.value)}
                              className={`${ADMIN_INPUT} ${error ? ADMIN_INPUT_INVALID : ""}`}
                              disabled={isPending}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setActiveMediaField(activeMediaField === field.slug ? null : field.slug)
                              }
                              className={ADMIN_BUTTON_SECONDARY}
                              title="رفع ملف جديد"
                            >
                              <Upload className="w-4 h-4" />
                              <span>رفع</span>
                            </button>
                          </div>

                          {isResolved && resolved && (
                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 p-2.5 text-xs">
                              <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>
                                  أصل خارجي معتمد ({resolved.kind === "youtube-thumb" ? "يوتيوب" : resolved.kind === "drive" ? "Google Drive" : "رابط مباشر"} - {resolved.host})
                                </span>
                              </div>
                              {resolved.resolvedUrl !== strValue && (
                                <button
                                  type="button"
                                  onClick={() => handleFieldChange(field.slug, resolved.resolvedUrl)}
                                  className="text-[11px] font-bold text-copticGold-700 underline hover:text-copticGold-900"
                                >
                                  اعتماد الرابط المباشر
                                </button>
                              )}
                            </div>
                          )}

                          {resolved && resolved.kind === "unsupported" && (
                            <p className="text-[11px] text-amber-700">
                              {resolved.reason || "الرابط غير مدرج في النطاقات المعتمدة."}
                            </p>
                          )}

                          {strValue.length > 0 && (
                            <div className="relative w-36 h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center shadow-xs">
                              {isResolved || isDirectImg ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={previewUrl}
                                  alt="معاينة"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <FileText className="w-8 h-8 text-slate-400" />
                              )}
                            </div>
                          )}

                          {activeMediaField === field.slug && (
                            <div className="p-4 rounded-xl border border-copticGold-200 bg-copticGold-50/50 space-y-3">
                              <p className="text-xs font-bold text-copticNavy">
                                رفع وسائط جديدة لحقل «{field.labelAr}»:
                              </p>
                              <MediaUploader
                                onUploadSuccess={(media: MediaRecord) => {
                                  handleFieldChange(field.slug, media.url);
                                  setActiveMediaField(null);
                                }}
                                disabled={isPending}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {error && (
                      <p className={ADMIN_ERROR_TEXT}>
                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>{error}</span>
                      </p>
                    )}
                  </div>
                );
              })}

              {sortedFields.length === 0 && (
                <div className="py-8 text-center text-slate-500">
                  <p className="text-sm font-medium">لم يتم تعريف حقول لهذا النموذج بعد.</p>
                  <Link
                    href={`/content-types/${contentType.id}/fields`}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-copticGold-600 hover:underline"
                  >
                    انقر هنا لإضافة حقول إلى النموذج
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar / Meta Column */}
        <div className="space-y-6">
          <div className={ADMIN_PANEL}>
            <h2 className={`${ADMIN_SECTION_HEADING} mb-4`}>بيانات النشر والتعريف</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="entry-slug" className={ADMIN_LABEL}>
                  المعرّف اللطيف في الرابط (Slug) <span className="text-red-500">*</span>
                </label>
                <input
                  id="entry-slug"
                  type="text"
                  dir="ltr"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="my-content-slug"
                  className={`${ADMIN_INPUT} font-mono text-xs ${
                    fieldErrors.slug ? ADMIN_INPUT_INVALID : ""
                  }`}
                  disabled={isPending}
                />
                <p className={ADMIN_HINT}>
                  يُستخدم في الرابط العام: <code className="text-copticNavy font-bold">/content/{contentType.slug}/{slug || "..."}</code>
                </p>
                {fieldErrors.slug && (
                  <p className={ADMIN_ERROR_TEXT}>
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{fieldErrors.slug[0]}</span>
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="entry-status" className={ADMIN_LABEL}>
                  حالة النشر
                </label>
                <select
                  id="entry-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ContentStatus)}
                  className={ADMIN_INPUT}
                  disabled={isPending}
                >
                  <option value="draft">مسودة (Draft)</option>
                  <option value="published" disabled={!canPublish}>
                    منشور للعامة (Published) {!canPublish ? "— غير مصرح" : ""}
                  </option>
                  <option value="archived">مؤرشف (Archived)</option>
                </select>
                <p className={ADMIN_HINT}>
                  المسودات لا تظهر للزوار على الموقع العام وتكون متاحة فقط لفريق الإدارة.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <div className="text-[11px] text-slate-500 space-y-1">
                  <p>
                    <span className="font-bold">نوع المحتوى:</span> {contentType.nameAr} ({contentType.slug})
                  </p>
                  {contentType.template && (
                    <p>
                      <span className="font-bold">القالب:</span> {contentType.template}
                    </p>
                  )}
                  {entryId && (
                    <p>
                      <span className="font-bold">معرف العنصر:</span>{" "}
                      <span className="font-mono text-[10px]">{entryId}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
