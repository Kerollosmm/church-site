"use client";

// src/app/admin/(protected)/media/MediaManager.tsx
// The media registry: the METADATA of files the parish uses, and a form to register one.
//
// WHAT THIS SCREEN DOES NOT DO, STATED IN THE UI AS WELL AS HERE: it does not upload bytes. The store
// holds a filename, a MIME type, a size, a URL and alt text in both languages — `MediaRecord` has no
// blob and there is no file store behind this project. So a "media item" is a POINTER: an editor
// registers where the file lives (an internal path such as `/assets/poster.jpg` or a URL) and then
// uses that URL in an event, a document or a page.
//
// THE SIZE CAP IS ENFORCED TWICE: `MediaSchema` refuses a size above `MAX_MEDIA_SIZE_BYTES` on the
// server, and the form pre-checks with a message built from the SAME constant, so the number the
// editor is told is the number that is enforced. A file whose size is unknown can still be registered
// (the field is optional) — the cap applies to what is declared.

import React, { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  FileText,
  Globe,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  Save,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import {
  deleteMediaAction,
  registerMediaAction,
  updateEventAction,
  updateMediaAction,
  type EventActionResult,
} from "@/actions/event-actions";
import { linkExternalAssetAction } from "@/actions/admin-asset-actions";
import { MediaUploader } from "@/components/media/MediaUploader";
import { AdminChip } from "@/components/admin/AdminStatusBadge";
import { AdminFeedback, type AdminFeedbackTone } from "@/components/admin/AdminFeedback";
import { AdminCheckbox, AdminSelect, AdminTextField } from "@/components/admin/AdminFields";
import {
  ADMIN_BADGE,
  ADMIN_BUTTON_DANGER,
  ADMIN_BUTTON_PRIMARY,
  ADMIN_BUTTON_QUIET,
  ADMIN_BUTTON_SECONDARY,
  ADMIN_PANEL,
  ADMIN_SECTION_HEADING,
  ADMIN_TABLE,
  ADMIN_TD,
  ADMIN_TH,
} from "@/components/admin/admin-ui";
import type { AdminCapabilities, MediaRecord } from "@church-site/domain";
import {
  MAX_MEDIA_SIZE_LABEL,
  emptyMediaFormState,
  formatBytes,
  mediaFormFieldErrors,
  mediaFormToPayload,
  type MediaFormState,
  type AdminEventRow,
  formatCairoDateTime,
  resolveExternalImageUrl,
  isResolvedAsset,
} from "@church-site/data-access/client";

/** The public pages that consume a media URL — the honest answer to "for a page". */
const MEDIA_CONSUMER_PATHS = [
  { href: "/events", label: "صفحة الفعاليات" },
  { href: "/masses", label: "جدول القداسات" },
  { href: "/live", label: "البث المباشر" },
  { href: "/", label: "الصفحة الرئيسية" },
] as const;

export interface MediaManagerProps {
  media: MediaRecord[];
  events: AdminEventRow[];
  capabilities: AdminCapabilities;
}

export function MediaManager({ media, events, capabilities }: MediaManagerProps): React.ReactElement {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"upload" | "url" | "manual">("upload");
  const [form, setForm] = useState<MediaFormState>(emptyMediaFormState());
  const [targetEventId, setTargetEventId] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [urlAltAr, setUrlAltAr] = useState("");
  const [urlAltEn, setUrlAltEn] = useState("");
  const [urlIsPublic, setUrlIsPublic] = useState(true);
  const [urlTargetEventId, setUrlTargetEventId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ tone: AdminFeedbackTone; title: string; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [altAr, setAltAr] = useState("");
  const [altEn, setAltEn] = useState("");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const resolvedAsset = urlInput.trim() ? resolveExternalImageUrl(urlInput.trim()) : null;
  const isValidAsset = isResolvedAsset(resolvedAsset);

  function submitExternalAsset(formEvent: React.FormEvent<HTMLFormElement>): void {
    formEvent.preventDefault();
    if (!isValidAsset || !resolvedAsset) {
      setFeedback({
        tone: "error",
        title: "الرابط غير صالح",
        message: resolvedAsset?.reason || "يرجى إدخال رابط معتمد وصالح قبل الحفظ.",
      });
      return;
    }

    startTransition(async () => {
      setPendingKey("link-asset");
      const result = await linkExternalAssetAction({
        url: urlInput.trim(),
        altAr: urlAltAr.trim() || undefined,
        altEn: urlAltEn.trim() || undefined,
        isPublic: urlIsPublic,
        targetEventId: urlTargetEventId || undefined,
      });
      setPendingKey(null);
      setFeedback({
        tone: result.success ? "success" : "error",
        title: result.success ? "إضافة أصل خارجي" : "فشل التحقق من الأصل",
        message: result.message,
      });
      if (result.success) {
        setUrlInput("");
        setUrlAltAr("");
        setUrlAltEn("");
        setUrlTargetEventId("");
        router.refresh();
      }
    });
  }

  function update<K extends keyof MediaFormState>(key: K, value: MediaFormState[K], errorKey?: string): void {
    setForm((current) => ({ ...current, [key]: value }));
    if (errorKey) {
      setErrors((current) => {
        if (!current[errorKey]) return current;
        const next = { ...current };
        delete next[errorKey];
        return next;
      });
    }
  }

  function run<T>(
    key: string,
    title: string,
    action: () => Promise<EventActionResult<T>>,
    onSuccess?: (data: T) => void | Promise<void>
  ): void {
    startTransition(async () => {
      setPendingKey(key);
      const result = await action();
      setPendingKey(null);
      setFeedback({ tone: result.success ? "success" : "error", title, message: result.message });
      if (result.success) {
        setDeletingId(null);
        setEditingId(null);
        await onSuccess?.(result.data);
        router.refresh();
      }
    });
  }

  function submit(formEvent: React.FormEvent<HTMLFormElement>): void {
    formEvent.preventDefault();
    const fieldErrors = mediaFormFieldErrors(form);
    setErrors(fieldErrors);

    if (Object.keys(fieldErrors).length > 0) {
      setFeedback({
        tone: "error",
        title: "لم يُسجَّل الملف",
        message: "راجع الحقول المعلَّمة بالأحمر. لم يُرسَل أي شيء إلى المخزن.",
      });
      return;
    }

    const payload = mediaFormToPayload(form);

    run("register", "تسجيل وسائط", () => registerMediaAction(payload), async (data) => {
      setForm(emptyMediaFormState());
      setTargetEventId("");
      // The optional link: the SAME URL is set as the event's image through the ordinary update
      // action, so the association is a real field on the event (and its own audit entry) rather than
      // an invented column on the media row.
      if (targetEventId) {
        await updateEventImage(targetEventId, data.url);
      }
    });
  }

  /** Sets an event's image URL through the existing update action. Reports its own outcome. */
  async function updateEventImage(eventId: string, url: string): Promise<void> {
    const result = await updateEventAction(eventId, { imageUrl: url });
    if (!result.success) {
      setFeedback({ tone: "error", title: "تم التسجيل دون ربط", message: result.message });
      return;
    }
    setFeedback({
      tone: "success",
      title: "تم التسجيل والربط",
      message: "سُجّلت بيانات الملف، وضُبط الرابط كصورة الفعالية المختارة.",
    });
  }

  const busy = (key: string) => isPending && pendingKey === key;
  const eventOptions = [
    { value: "", label: "بلا ربط بفعالية" },
    ...events.map((row) => ({
      value: row.event.id,
      label: `${row.event.titleAr}${row.event.status === "published" ? "" : " (غير منشورة)"}`,
    })),
  ];

  return (
    <div className="space-y-6">
      <section aria-labelledby="media-register-heading" className={ADMIN_PANEL}>
        <h2 id="media-register-heading" className={ADMIN_SECTION_HEADING}>
          إدارة الوسائط والملفات
        </h2>

        {/* Tab switcher */}
        <div className="mt-4 flex border-b border-slate-200">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "upload"}
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-colors ${
              activeTab === "upload"
                ? "border-copticGold-600 text-copticNavy"
                : "border-transparent text-slate-500 hover:text-copticNavy"
            }`}
          >
            <Upload aria-hidden="true" className="h-4 w-4" />
            <span>رفع ملف جديد</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "url"}
            onClick={() => setActiveTab("url")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-colors ${
              activeTab === "url"
                ? "border-copticGold-600 text-copticNavy"
                : "border-transparent text-slate-500 hover:text-copticNavy"
            }`}
          >
            <Globe aria-hidden="true" className="h-4 w-4" />
            <span>إضافة رابط خارجي</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "manual"}
            onClick={() => setActiveTab("manual")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-colors ${
              activeTab === "manual"
                ? "border-copticGold-600 text-copticNavy"
                : "border-transparent text-slate-500 hover:text-copticNavy"
            }`}
          >
            <LinkIcon aria-hidden="true" className="h-4 w-4" />
            <span>تسجيل رابط يدوي</span>
          </button>
        </div>

        {activeTab === "upload" ? (
          <div className="mt-4">
            <MediaUploader
              events={events}
              disabled={!capabilities.mediaWrite}
              onUploadSuccess={() => {
                router.refresh();
              }}
            />
          </div>
        ) : activeTab === "url" ? (
          <div className="mt-4">
            {capabilities.assetsLink ? (
              <form onSubmit={submitExternalAsset} noValidate aria-busy={isPending} className="mt-4 space-y-4">
                <AdminTextField
                  id="asset-url"
                  label="رابط الأصل الخارجي (YouTube / Google Drive / مباشر)"
                  required
                  lang="en"
                  placeholder="https://www.youtube.com/watch?v=... أو https://drive.google.com/..."
                  value={urlInput}
                  onChange={setUrlInput}
                  hint="يتم التحقق فوراً من النطاق وتوليد رابط معاينة مباشر للملفات المعتمدة."
                  maxLength={1000}
                />

                {urlInput.trim().length > 0 && (
                  <div className="mt-3">
                    {isValidAsset && resolvedAsset ? (
                      <div className="rounded-xl border border-emerald-300 bg-emerald-50/50 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>الرابط معتمد ومطابق لسياسة الأمان.</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <AdminChip tone="gold">
                            {resolvedAsset.kind === "youtube-thumb"
                              ? "يوتيوب"
                              : resolvedAsset.kind === "drive"
                                ? "Google Drive"
                                : "رابط مباشر"}
                          </AdminChip>
                          <span
                            className="text-[11px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200"
                            dir="ltr"
                          >
                            {resolvedAsset.host}
                          </span>
                        </div>

                        <div className="relative w-60 h-36 rounded-lg overflow-hidden border border-slate-200 bg-slate-900/10 shadow-sm flex items-center justify-center">
                          <Image
                            src={resolvedAsset.resolvedUrl}
                            alt="معاينة الأصل"
                            width={240}
                            height={140}
                            className="h-full w-full object-cover rounded-lg"
                            unoptimized
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 flex items-start gap-2 text-xs text-rose-800">
                        <AlertTriangle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
                        <p className="leading-relaxed">
                          {resolvedAsset?.reason || "الرابط غير مدعوم في قائمة النطاقات المعتمدة."}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid gap-4 lg:grid-cols-2">
                  <AdminTextField
                    id="asset-altAr"
                    label="النص البديل (عربي)"
                    lang="ar"
                    value={urlAltAr}
                    onChange={setUrlAltAr}
                    hint="وصف مختصر للصورة لقارئات الشاشة."
                    maxLength={255}
                  />
                  <AdminTextField
                    id="asset-altEn"
                    label="النص البديل (إنجليزي)"
                    lang="en"
                    value={urlAltEn}
                    onChange={setUrlAltEn}
                    maxLength={255}
                  />
                </div>

                <AdminCheckbox
                  id="asset-isPublic"
                  label="متاح للعرض العام"
                  checked={urlIsPublic}
                  onChange={setUrlIsPublic}
                  hint="أزل العلامة لملف داخلي لا يُشار إليه من الصفحات العامة."
                />

                <AdminSelect
                  id="asset-target-event"
                  label="ربط الرابط بفعالية (اختياري)"
                  value={urlTargetEventId}
                  onChange={setUrlTargetEventId}
                  options={eventOptions}
                  hint="عند اختيار فعالية، يُضبط الرابط المعتمد كصورة لها بعد التسجيل مباشرة."
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="submit"
                    disabled={isPending || !isValidAsset}
                    aria-busy={busy("link-asset")}
                    className={ADMIN_BUTTON_PRIMARY}
                  >
                    {busy("link-asset") ? (
                      <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save aria-hidden="true" className="h-4 w-4" />
                    )}
                    <span>{busy("link-asset") ? "جارٍ التحقق والربط…" : "ربط الأصل الخارجي"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUrlInput("");
                      setUrlAltAr("");
                      setUrlAltEn("");
                      setUrlTargetEventId("");
                    }}
                    className={ADMIN_BUTTON_SECONDARY}
                  >
                    <X aria-hidden="true" className="h-3.5 w-3.5" />
                    <span>تفريغ الحقول</span>
                  </button>
                </div>
              </form>
            ) : (
              <p className="mt-4 text-xs font-bold text-amber-900">
                صلاحياتك الحالية لا تسمح بربط أصول خارجية. أي محاولة تُرفض على الخادم وتُسجَّل في سجل التدقيق.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-4">
            {/* The limitation, said plainly where it matters. */}
            <div className="flex items-start gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900">
              <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="leading-relaxed">
                هذه الشاشة تسجّل <strong>بيانات وصفية فقط</strong> (اسم الملف ونوعه وحجمه ورابطه ونصه البديل) — لا يوجد
                تخزين للملفات في هذا الموقع ولا رفع للبايتات. الرابط هو ما يُخزَّن، ويُستخدم بعدها في الفعاليات والمرفقات
                وصفحات الموقع. الحد الأقصى المسجَّل للحجم: <strong>{MAX_MEDIA_SIZE_LABEL}</strong>.
              </p>
            </div>

            {capabilities.mediaWrite ? (
              <form onSubmit={submit} noValidate aria-busy={isPending} className="mt-4 space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <AdminTextField
                    id="media-filename"
                    label="اسم الملف"
                    required
                    value={form.filename}
                    onChange={(value) => update("filename", value, "filename")}
                    error={errors.filename}
                    maxLength={255}
                  />
                  <AdminTextField
                    id="media-mimeType"
                    label="نوع الملف (MIME)"
                    required
                    lang="en"
                    placeholder="image/jpeg"
                    value={form.mimeType}
                    onChange={(value) => update("mimeType", value, "mimeType")}
                    error={errors.mimeType}
                    hint="مثال: image/jpeg أو application/pdf."
                    maxLength={127}
                  />
                  <AdminTextField
                    id="media-sizeMb"
                    label="الحجم بالميجابايت (اختياري)"
                    lang="en"
                    placeholder="2.5"
                    value={form.sizeMb}
                    onChange={(value) => update("sizeMb", value, "sizeBytes")}
                    error={errors.sizeBytes}
                    hint={`اتركه فارغاً إن كان الحجم غير معروف. الحد الأقصى ${MAX_MEDIA_SIZE_LABEL}.`}
                  />
                  <AdminTextField
                    id="media-url"
                    label="رابط الملف"
                    required
                    lang="en"
                    placeholder="/assets/poster.jpg"
                    value={form.url}
                    onChange={(value) => update("url", value, "url")}
                    error={errors.url}
                    hint="مسار داخلي أو عنوان كامل. لا تُقدَّم الصور من نطاقات غير مدرجة في سياسة أمان المحتوى."
                    maxLength={500}
                  />
                  <AdminTextField
                    id="media-altAr"
                    label="النص البديل (عربي)"
                    lang="ar"
                    value={form.altAr}
                    onChange={(value) => update("altAr", value)}
                    error={errors.altAr}
                    hint="وصف مختصر للصورة لقارئات الشاشة."
                    maxLength={255}
                  />
                  <AdminTextField
                    id="media-altEn"
                    label="النص البديل (إنجليزي)"
                    lang="en"
                    value={form.altEn}
                    onChange={(value) => update("altEn", value)}
                    error={errors.altEn}
                    maxLength={255}
                  />
                </div>

                <AdminCheckbox
                  id="media-isPublic"
                  label="متاح للعرض العام"
                  checked={form.isPublic}
                  onChange={(checked) => update("isPublic", checked)}
                  hint="أزل العلامة لملف داخلي لا يُشار إليه من الصفحات العامة."
                />

                <AdminSelect
                  id="media-target-event"
                  label="ربط الرابط بفعالية (اختياري)"
                  value={targetEventId}
                  onChange={setTargetEventId}
                  options={eventOptions}
                  hint="عند اختيار فعالية، يُضبط الرابط كصورة لها بعد التسجيل — وهذا تحديث حقيقي للفعالية يُسجَّل في سجل التدقيق."
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button type="submit" disabled={isPending} aria-busy={isPending} className={ADMIN_BUTTON_PRIMARY}>
                    {busy("register") ? (
                      <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save aria-hidden="true" className="h-4 w-4" />
                    )}
                    <span>{busy("register") ? "جارٍ التسجيل…" : "تسجيل بيانات الملف"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForm(emptyMediaFormState());
                      setErrors({});
                    }}
                    className={ADMIN_BUTTON_SECONDARY}
                  >
                    <X aria-hidden="true" className="h-3.5 w-3.5" />
                    <span>تفريغ الحقول</span>
                  </button>
                </div>
              </form>
            ) : (
              <p className="mt-4 text-xs font-bold text-amber-900">
                صلاحياتك الحالية لا تسمح بتسجيل وسائط. أي محاولة تُرفض على الخادم وتُسجَّل في سجل التدقيق.
              </p>
            )}
          </div>
        )}
      </section>

      {feedback ? <AdminFeedback tone={feedback.tone} title={feedback.title} message={feedback.message} /> : null}

      <section aria-labelledby="media-list-heading" className={ADMIN_PANEL}>
        <h2 id="media-list-heading" className={ADMIN_SECTION_HEADING}>
          الملفات المسجَّلة ({media.length})
        </h2>

        {media.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-copticGold-300 bg-copticGold-50/40 p-8 text-center">
            <ImageIcon aria-hidden="true" className="mx-auto h-6 w-6 text-copticGold-700" />
            <p className="mt-2 font-heading text-sm font-bold text-copticNavy">لا توجد ملفات مسجَّلة بعد</p>
            <p className="mt-1 text-xs text-slate-600">
              سجّل أول ملف من النموذج أعلاه: اسم الملف ونوعه وحجمه ورابطه والنص البديل بالعربية والإنجليزية.
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className={ADMIN_TABLE} aria-label="قائمة الوسائط المسجَّلة">
              <thead>
                <tr>
                  <th scope="col" className={ADMIN_TH}>
                    الملف
                  </th>
                  <th scope="col" className={ADMIN_TH}>
                    النوع
                  </th>
                  <th scope="col" className={ADMIN_TH}>
                    الحجم
                  </th>
                  <th scope="col" className={ADMIN_TH}>
                    النص البديل
                  </th>
                  <th scope="col" className={ADMIN_TH}>
                    سُجِّل في
                  </th>
                  <th scope="col" className={ADMIN_TH}>
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {media.map((item) => (
                  <tr key={item.id} data-admin-media={item.id}>
                    <td className={ADMIN_TD}>
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                          {item.mimeType.startsWith("image/") ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.resolvedUrl || item.url}
                              alt={item.altAr || item.filename}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : item.mimeType === "application/pdf" ? (
                            <FileText aria-hidden="true" className="h-6 w-6 text-red-600" />
                          ) : item.mimeType.startsWith("video/") ? (
                            <Video aria-hidden="true" className="h-6 w-6 text-copticNavy" />
                          ) : (
                            <ImageIcon aria-hidden="true" className="h-6 w-6 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-heading text-xs font-bold text-copticNavy" title={item.filename}>
                            {item.filename}
                          </p>
                          <p className="mt-0.5 truncate font-english text-[10px] text-slate-500" dir="ltr" title={item.url}>
                            {item.url}
                          </p>
                          {item.sourceUrl ? (
                            <p className="mt-0.5 truncate font-english text-[10px] text-slate-500" dir="ltr" title={item.sourceUrl}>
                              <span className="font-sans font-bold text-slate-600">المصدر:</span> {item.sourceUrl}
                            </p>
                          ) : null}
                          {item.resolvedUrl ? (
                            <p className="mt-0.5 truncate font-english text-[10px] text-slate-500" dir="ltr" title={item.resolvedUrl}>
                              <span className="font-sans font-bold text-slate-600">المعتمد:</span> {item.resolvedUrl}
                            </p>
                          ) : null}
                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            {item.isPublic ? <AdminChip tone="gold">عام</AdminChip> : <AdminChip>داخلي</AdminChip>}
                            {item.kind ? (
                              <AdminChip tone="navy">
                                {item.kind === "youtube-thumb"
                                  ? "يوتيوب"
                                  : item.kind === "drive"
                                    ? "Google Drive"
                                    : "رابط خارجي"}
                              </AdminChip>
                            ) : item.storagePath ? (
                              <AdminChip tone="navy">تخزين سحابي</AdminChip>
                            ) : (
                              <AdminChip>رابط خارجي</AdminChip>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={ADMIN_TD}>
                      <span className={`${ADMIN_BADGE} border border-slate-200 bg-slate-50 text-slate-700 font-english`} dir="ltr">
                        {item.mimeType}
                      </span>
                    </td>
                    <td className={ADMIN_TD}>{item.sizeBytes > 0 ? formatBytes(item.sizeBytes) : "غير معروف"}</td>
                    <td className={ADMIN_TD}>
                      <p className="text-[11px] text-slate-600">عربي: {item.altAr ?? "—"}</p>
                      <p className="text-[11px] text-slate-600" dir="ltr">
                        EN: {item.altEn ?? "—"}
                      </p>
                    </td>
                    <td className={ADMIN_TD}>
                      <span className="text-[11px] text-slate-600">{formatCairoDateTime(item.createdAt) ?? item.createdAt}</span>
                    </td>
                    <td className={ADMIN_TD}>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard?.writeText(item.url);
                            setCopiedUrl(item.id);
                          }}
                          className={ADMIN_BUTTON_QUIET}
                        >
                          {copiedUrl === item.id ? (
                            <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy aria-hidden="true" className="h-3.5 w-3.5" />
                          )}
                          <span>{copiedUrl === item.id ? "تم نسخ الرابط" : "نسخ الرابط"}</span>
                        </button>

                        {capabilities.mediaWrite ? (
                          <button
                            type="button"
                            aria-expanded={editingId === item.id}
                            onClick={() => {
                              setAltAr(item.altAr ?? "");
                              setAltEn(item.altEn ?? "");
                              setEditingId(editingId === item.id ? null : item.id);
                            }}
                            className={ADMIN_BUTTON_QUIET}
                          >
                            <span>تعديل النص البديل</span>
                          </button>
                        ) : null}

                        {capabilities.mediaDelete ? (
                          <button
                            type="button"
                            disabled={isPending}
                            aria-expanded={deletingId === item.id}
                            onClick={() => setDeletingId(deletingId === item.id ? null : item.id)}
                            className={`${ADMIN_BUTTON_QUIET} text-red-700 hover:bg-red-50`}
                          >
                            <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                            <span>حذف</span>
                          </button>
                        ) : null}
                      </div>

                      {editingId === item.id ? (
                        <div className="mt-2 space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                          <AdminTextField
                            id={`media-altAr-${item.id}`}
                            label="النص البديل (عربي)"
                            lang="ar"
                            value={altAr}
                            onChange={setAltAr}
                            maxLength={255}
                          />
                          <AdminTextField
                            id={`media-altEn-${item.id}`}
                            label="النص البديل (إنجليزي)"
                            lang="en"
                            value={altEn}
                            onChange={setAltEn}
                            maxLength={255}
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={isPending}
                              aria-busy={busy(`alt:${item.id}`)}
                              onClick={() =>
                                run(`alt:${item.id}`, "تحديث النص البديل", () =>
                                  updateMediaAction(item.id, { altAr: altAr.trim() || null, altEn: altEn.trim() || null })
                                )
                              }
                              className={ADMIN_BUTTON_PRIMARY}
                            >
                              {busy(`alt:${item.id}`) ? (
                                <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                              ) : null}
                              <span>حفظ</span>
                            </button>
                            <button type="button" onClick={() => setEditingId(null)} className={ADMIN_BUTTON_SECONDARY}>
                              تراجع
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {deletingId === item.id ? (
                        <div className="mt-2 rounded-xl border border-red-300 bg-red-50 p-3">
                          <p className="text-[11px] font-bold text-red-900">
                            حذف بيانات «{item.filename}»؟ يُحذف السجل الوصفي فقط — الملف نفسه لا يُمحى من مكان تخزينه.
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={isPending}
                              aria-busy={busy(`delete:${item.id}`)}
                              onClick={() => run(`delete:${item.id}`, "حذف بيانات الوسائط", () => deleteMediaAction(item.id))}
                              className={ADMIN_BUTTON_DANGER}
                            >
                              {busy(`delete:${item.id}`) ? (
                                <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                              ) : null}
                              <span>نعم، احذف السجل</span>
                            </button>
                            <button type="button" onClick={() => setDeletingId(null)} className={ADMIN_BUTTON_SECONDARY}>
                              إلغاء الأمر
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="media-pages-heading" className={ADMIN_PANEL}>
        <h2 id="media-pages-heading" className={ADMIN_SECTION_HEADING}>
          الاستخدام في الصفحات
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          الصفحات العامة لا تحمل حقلاً للوسائط في نموذج البيانات الحالي، فالربط بها يتم باستخدام الرابط يدوياً في محتوى
          الصفحة أو في حقل «رابط الصورة» في الفعالية. الصفحات التي تعرض صوراً اليوم:
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {MEDIA_CONSUMER_PATHS.map((page) => (
            <li key={page.href}>
              <a
                href={page.href}
                className={`${ADMIN_BADGE} border border-slate-200 bg-slate-50 text-copticNavy underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copticNavy-500`}
              >
                {page.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
