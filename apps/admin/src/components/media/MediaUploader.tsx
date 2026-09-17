"use client";

// apps/admin/src/components/media/MediaUploader.tsx
// Interactive client component for uploading media files directly into active storage.
// Enforces client pre-validation (MIME type and size cap), generates image previews,
// and submits via the uploadMediaAction server action.

import React, { useState, useRef, useEffect, useTransition } from "react";
import {
  Upload,
  Image as ImageIcon,
  FileText,
  Video,
  File as FileIcon,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  MAX_MEDIA_SIZE_BYTES,
  isAllowedMediaMimeType,
  type MediaRecord,
} from "@church-site/domain";
import {
  formatBytes,
  MAX_MEDIA_SIZE_LABEL,
  type AdminEventRow,
} from "@church-site/data-access/client";
import { uploadMediaAction } from "@/actions/media-upload-actions";
import { AdminCheckbox, AdminSelect, AdminTextField } from "@/components/admin/AdminFields";
import { AdminFeedback, type AdminFeedbackTone } from "@/components/admin/AdminFeedback";
import {
  ADMIN_BADGE,
  ADMIN_BUTTON_PRIMARY,
  ADMIN_BUTTON_SECONDARY,
} from "@/components/admin/admin-ui";

export interface MediaUploaderProps {
  events?: AdminEventRow[];
  onUploadSuccess?: (media: MediaRecord) => void | Promise<void>;
  disabled?: boolean;
}

export function MediaUploader({
  events = [],
  onUploadSuccess,
  disabled = false,
}: MediaUploaderProps): React.ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [altAr, setAltAr] = useState("");
  const [altEn, setAltEn] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [targetEventId, setTargetEventId] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: AdminFeedbackTone; title: string; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Revoke object URL on preview change or unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function resetForm(): void {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setAltAr("");
    setAltEn("");
    setIsPublic(true);
    setTargetEventId("");
    setClientError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFileSelection(selectedFile: File | null): void {
    setFeedback(null);
    setClientError(null);

    if (!selectedFile) {
      return;
    }

    // Pre-validation: Empty file check
    if (selectedFile.size === 0) {
      setClientError("الملف المختار فارغ (0 بايت). يرجى اختيار ملف صالح.");
      return;
    }

    // Pre-validation: Size cap
    if (selectedFile.size > MAX_MEDIA_SIZE_BYTES) {
      setClientError(
        `حجم الملف (${formatBytes(selectedFile.size)}) يتجاوز الحد الأقصى المسموح به (${MAX_MEDIA_SIZE_LABEL}).`
      );
      return;
    }

    // Pre-validation: MIME type check
    const mime = selectedFile.type || "";
    if (!isAllowedMediaMimeType(mime)) {
      setClientError(
        `نوع الملف (${mime || "غير معروف"}) غير مدعوم. الأنواع المسموح بها: الصور، مقاطع MP4، ومستندات PDF.`
      );
      return;
    }

    // Valid file: Set up state and preview
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(selectedFile);
    if (selectedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isPending) {
      setIsDragging(true);
    }
  }

  function onDragLeave(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isPending) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileSelection(droppedFile);
    }
  }

  function handleUploadSubmit(e: React.FormEvent): void {
    e.preventDefault();
    if (!file || disabled || isPending) return;

    startTransition(async () => {
      setFeedback(null);

      const formData = new FormData();
      formData.set("file", file);
      formData.set("filename", file.name);
      formData.set("mimeType", file.type);
      if (altAr.trim()) formData.set("altAr", altAr.trim());
      if (altEn.trim()) formData.set("altEn", altEn.trim());
      formData.set("isPublic", isPublic ? "true" : "false");
      if (targetEventId) formData.set("targetEventId", targetEventId);

      const result = await uploadMediaAction(formData);

      if (result.success) {
        setFeedback({
          tone: "success",
          title: "تم الرفع بنجاح",
          message: result.message,
        });
        const uploadedRecord = result.data;
        resetForm();
        if (onUploadSuccess) {
          await onUploadSuccess(uploadedRecord);
        }
      } else {
        setFeedback({
          tone: "error",
          title: "فشل رفع الملف",
          message: result.message,
        });
      }
    });
  }

  const eventOptions = [
    { value: "", label: "بلا ربط بفعالية" },
    ...events.map((row) => ({
      value: row.event.id,
      label: `${row.event.titleAr}${row.event.status === "published" ? "" : " (غير منشورة)"}`,
    })),
  ];

  return (
    <div className="space-y-4">
      {/* Drag & drop upload area */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
          disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-100/60 opacity-60"
            : isDragging
              ? "border-copticGold-500 bg-copticGold-50/80 scale-[0.99]"
              : "border-copticNavy/20 bg-slate-50/50 hover:border-copticNavy/40 hover:bg-slate-50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          disabled={disabled || isPending}
          className="hidden"
          accept="image/*,video/mp4,application/pdf"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileSelection(e.target.files[0]);
            }
          }}
        />

        {!file ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="rounded-full bg-copticGold-100 p-3 text-copticGold-700">
              <Upload aria-hidden="true" className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-copticNavy">
              اسحب الملف وأفلته هنا، أو اضغط لاختيار ملف من جهازك
            </p>
            <p className="text-xs text-slate-500">
              الأنواع المسموحة: الصور (JPEG, PNG, WebP, GIF, SVG)، الفيديو (MP4)، المستندات (PDF). الحد الأقصى: {MAX_MEDIA_SIZE_LABEL}.
            </p>
            <button
              type="button"
              disabled={disabled || isPending}
              onClick={() => fileInputRef.current?.click()}
              className={`${ADMIN_BUTTON_SECONDARY} mt-2 text-xs`}
            >
              <Upload aria-hidden="true" className="h-3.5 w-3.5" />
              <span>اختيار ملف من الجهاز</span>
            </button>
          </div>
        ) : (
          <div className="flex w-full flex-col sm:flex-row items-center gap-4 text-right">
            {/* Preview thumbnail or type icon */}
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="معاينة الملف المختار"
                  className="h-full w-full object-cover"
                />
              ) : file.type.startsWith("video/") ? (
                <Video aria-hidden="true" className="h-10 w-10 text-copticNavy" />
              ) : file.type === "application/pdf" ? (
                <FileText aria-hidden="true" className="h-10 w-10 text-red-600" />
              ) : (
                <FileIcon aria-hidden="true" className="h-10 w-10 text-slate-500" />
              )}
            </div>

            {/* File metadata summary */}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-emerald-600" />
                <p className="truncate font-heading text-xs font-bold text-copticNavy" title={file.name}>
                  {file.name}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-500">
                <span className={`${ADMIN_BADGE} bg-slate-100 text-slate-700 font-english`} dir="ltr">
                  {file.type || "unknown"}
                </span>
                <span className={`${ADMIN_BADGE} bg-slate-100 text-slate-700 font-english`}>
                  {formatBytes(file.size)}
                </span>
              </div>
            </div>

            {/* Change / remove file button */}
            <button
              type="button"
              disabled={disabled || isPending}
              onClick={resetForm}
              className={`${ADMIN_BUTTON_SECONDARY} text-xs text-red-700 hover:bg-red-50`}
              title="إلغاء الملف المختار"
            >
              <X aria-hidden="true" className="h-3.5 w-3.5" />
              <span>إلغاء</span>
            </button>
          </div>
        )}
      </div>

      {/* Client validation error chip */}
      {clientError ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 p-3 text-xs text-red-800"
        >
          <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0 text-red-600" />
          <span>{clientError}</span>
        </div>
      ) : null}

      {/* Upload Feedback */}
      {feedback ? <AdminFeedback tone={feedback.tone} title={feedback.title} message={feedback.message} /> : null}

      {/* Detailed metadata inputs when a valid file is loaded */}
      {file ? (
        <form onSubmit={handleUploadSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <AdminTextField
              id="upload-altAr"
              label="النص البديل (عربي)"
              lang="ar"
              value={altAr}
              onChange={setAltAr}
              disabled={disabled || isPending}
              hint="وصف تفصيلي للملف باللغة العربية لقارئات الشاشة وسهولة الوصول."
              maxLength={255}
            />
            <AdminTextField
              id="upload-altEn"
              label="النص البديل (إنجليزي)"
              lang="en"
              value={altEn}
              onChange={setAltEn}
              disabled={disabled || isPending}
              hint="Optional English alternative text description."
              maxLength={255}
            />
          </div>

          <AdminCheckbox
            id="upload-isPublic"
            label="متاح للعرض العام في الموقع"
            checked={isPublic}
            onChange={setIsPublic}
            disabled={disabled || isPending}
            hint="الملفات العامة يمكن عرضها في صفحات الفعاليات، المعرض، والصفحة الرئيسية."
          />

          {events.length > 0 ? (
            <AdminSelect
              id="upload-targetEvent"
              label="ربط الملف بفعالية كصورة رئيسية (اختياري)"
              value={targetEventId}
              onChange={setTargetEventId}
              options={eventOptions}
              disabled={disabled || isPending}
              hint="عند اختيار فعالية، سيتم ضبط رابط هذا الملف تلقائياً كصورة رئيسية لها وتوثيق ذلك في سجل التدقيق."
            />
          ) : null}

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={disabled || isPending || !file}
              aria-busy={isPending}
              className={ADMIN_BUTTON_PRIMARY}
            >
              {isPending ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Upload aria-hidden="true" className="h-4 w-4" />
              )}
              <span>{isPending ? "جارٍ الرفع وحفظ الملف…" : "رفع الملف وتخزينه"}</span>
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={disabled || isPending}
              className={ADMIN_BUTTON_SECONDARY}
            >
              <span>إلغاء الأمر</span>
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
