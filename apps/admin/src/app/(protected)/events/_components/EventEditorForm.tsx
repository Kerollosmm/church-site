"use client";

// src/app/admin/(protected)/events/_components/EventEditorForm.tsx
// The create/edit editor for ONE event: every field the domain actually stores, in both languages.
//
// WHERE VALIDATION HAPPENS (two places, ONE source): the form pre-validates with `EventCreateSchema`
// — the very schema the server action parses — and shows the resulting Arabic messages next to the
// offending control. The action re-parses the payload regardless, so the client check is a courtesy,
// never the boundary.
//
// WHERE THE TIMES COME FROM: `<input type="datetime-local">` carries a wall clock with no zone, which
// is exactly what a parish author means. It is read and written as a CAIRO wall clock through
// `src/lib/events/admin-form.ts` — never as the browser's zone, so a secretary travelling abroad
// still authors "07:00" as the parish's 07:00.
//
// WHAT IT DOES NOT OFFER: no series assignment. An occurrence override is created by the series
// screen's per-occurrence actions (`cancelOccurrenceAction` / `rescheduleOccurrenceAction`), which is
// the only path that keeps the series rule consistent — an editor dropdown here would let a row join
// a series without the deviation the recurrence engine expects.

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  Ban,
  Copy,
  FilePlus2,
  Info,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import {
  archiveEventAction,
  cancelEventAction,
  createEventAction,
  deleteEventAction,
  duplicateEventAction,
  publishEventAction,
  unpublishEventAction,
  updateEventAction,
  type EventActionResult,
} from "@/actions/event-actions";
import { AdminFeedback, type AdminFeedbackTone } from "@/components/admin/AdminFeedback";
import { AdminCheckbox, AdminSelect, AdminTextArea, AdminTextField, FieldShell } from "@/components/admin/AdminFields";
import { TermMultiSelect } from "@/components/admin/TermMultiSelect";
import {
  ADMIN_BUTTON_DANGER,
  ADMIN_BUTTON_PRIMARY,
  ADMIN_BUTTON_SECONDARY,
  ADMIN_INPUT,
  ADMIN_PANEL,
  ADMIN_SECTION_HEADING,
} from "@/components/admin/admin-ui";
import type { AdminTaxonomyGroup } from "@church-site/data-access/client";
import {
  emptyEventDocumentDraft,
  eventFormFieldErrors,
  eventFormToPayload,
  isBlankDocumentDraft,
  type EventDocumentDraft,
  type EventFormState,
} from "@church-site/data-access/client";
import type { AdminCapabilities } from "@church-site/domain";
import { EVENT_STATUSES, EVENT_STATUS_LABELS_AR, PARISH_TIME_ZONE, type EventStatus } from "@church-site/domain";
import type { Locale } from "@church-site/ui";
import { t } from "@church-site/ui";

/** The dimensions the multi-select grids render (venue is offered as the primary-venue select too). */
const TAXONOMY_GRID_DIMENSIONS = ["event_type", "ministry", "audience", "language", "venue", "tag"] as const;

export interface EventEditorFormProps {
  mode: "create" | "edit";
  /** Present in edit mode only. */
  eventId?: string;
  initial: EventFormState;
  taxonomy: AdminTaxonomyGroup[];
  locale: Locale;
  capabilities: AdminCapabilities;
  /** For an override row: the series it belongs to, so the screen can link back. */
  seriesId?: string | null;
}

export function EventEditorForm({
  mode,
  eventId,
  initial,
  taxonomy,
  locale,
  capabilities,
  seriesId = null,
}: EventEditorFormProps): React.ReactElement {
  const router = useRouter();
  const [state, setState] = useState<EventFormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ tone: AdminFeedbackTone; title: string; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [panel, setPanel] = useState<"cancel" | "delete" | null>(null);
  const [reason, setReason] = useState("");

  /** A field update that also clears the field's own error, so the message never outlives the fix. */
  function update<K extends keyof EventFormState>(key: K, value: EventFormState[K], errorKey?: string): void {
    setState((current) => ({ ...current, [key]: value }));
    if (errorKey) clearError(errorKey);
  }

  function clearError(key: string): void {
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function updateTerm(termId: string): void {
    setState((current) => ({
      ...current,
      termIds: current.termIds.includes(termId)
        ? current.termIds.filter((id) => id !== termId)
        : [...current.termIds, termId],
    }));
  }

  function updateDocument(index: number, patch: Partial<EventDocumentDraft>): void {
    setState((current) => ({
      ...current,
      documents: current.documents.map((draft, position) => (position === index ? { ...draft, ...patch } : draft)),
    }));
    for (const key of Object.keys(patch)) clearError(`documents.${index}.${key === "sizeMb" ? "sizeMb" : key}`);
  }

  function addDocument(): void {
    setState((current) => ({ ...current, documents: [...current.documents, emptyEventDocumentDraft()] }));
  }

  function removeDocument(index: number): void {
    setState((current) => ({ ...current, documents: current.documents.filter((_, position) => position !== index) }));
    setErrors({});
  }

  /** Runs one action with a pending key, then reports and refreshes. */
  function runAction<T>(
    key: string,
    title: string,
    action: () => Promise<EventActionResult<T>>,
    onSuccess?: (data: T) => void
  ): void {
    startTransition(async () => {
      setPendingKey(key);
      const result = await action();
      setPendingKey(null);
      setFeedback({ tone: result.success ? "success" : "error", title, message: result.message });
      if (result.success) {
        setPanel(null);
        setReason("");
        onSuccess?.(result.data);
        router.refresh();
      }
    });
  }

  function submit(formEvent: React.FormEvent<HTMLFormElement>): void {
    formEvent.preventDefault();
    const payload = eventFormToPayload(state);
    const fieldErrors = eventFormFieldErrors(state);
    setErrors(fieldErrors);

    if (Object.keys(fieldErrors).length > 0) {
      setFeedback({
        tone: "error",
        title: "لم يُحفظ بعد",
        message: "راجع الحقول المعلَّمة بالأحمر في النموذج ثم أعد المحاولة. لم يُرسَل أي تعديل إلى المخزن.",
      });
      // Move the caret to the first problem instead of leaving the user to hunt for it.
      const firstKey = Object.keys(fieldErrors)[0];
      const escaped = firstKey.replace(/\./g, "\\.");
      const field = document.querySelector<HTMLElement>(`#${CSS.escape(escaped)}, [name="${escaped}"]`);
      field?.focus();
      return;
    }

    if (mode === "create") {
      runAction("create", "إنشاء الفعالية", () => createEventAction(payload), (data) => {
        router.push(`/events/${data.id}/edit`);
      });
      return;
    }

    runAction("save", "حفظ التعديلات", () => updateEventAction(eventId as string, payload));
  }

  const venueTerms = taxonomy.find((group) => group.dimension === "venue")?.terms ?? [];
  const busy = (key: string) => isPending && pendingKey === key;
  const statusOptions = EVENT_STATUSES.map((status: EventStatus) => ({
    value: status,
    label: EVENT_STATUS_LABELS_AR[status],
  }));
  const venueOptions = [
    { value: "", label: "بلا مكان رئيسي محدد" },
    ...venueTerms.map((term) => ({
      value: term.id,
      label: `${term.nameAr}${term.isActive ? "" : " (متوقف)"}`,
    })),
  ];

  return (
    <form onSubmit={submit} noValidate aria-busy={isPending} className="space-y-6">
      {feedback ? <AdminFeedback tone={feedback.tone} title={feedback.title} message={feedback.message} /> : null}

      {seriesId ? (
        <div className="flex items-start gap-2 rounded-2xl border border-copticNavy-200 bg-copticNavy-50 p-4 text-xs text-copticNavy-900">
          <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="leading-relaxed">
            هذا الصف <strong>تجاوز موعد داخل سلسلة متكررة</strong>: تاريخه الأصلي محفوظ في حقل «تاريخ الموعد». تعديل
            التوقيت هنا يغيّر هذا الصف فقط. لإلغاء موعد أو نقله في السلسلة استخدم{" "}
            <Link href={`/events/series/${seriesId}`} className="font-bold underline">
              شاشة السلسلة
            </Link>
            .
          </p>
        </div>
      ) : null}

      {/* 1 — Content, both languages */}
      <section aria-labelledby="event-content-heading" className={ADMIN_PANEL}>
        <h2 id="event-content-heading" className={ADMIN_SECTION_HEADING}>
          المحتوى (العربية والإنجليزية)
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          الحقول العربية هي الأصل وتظهر دائماً للزوار. الحقل الإنجليزي اختياري، وإن تُرك فارغاً يُعرض النص العربي مع
          علامة «ترجمة مفقودة» بدل فراغ صامت.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <AdminTextField
            id="titleAr"
            label="العنوان (عربي)"
            required
            lang="ar"
            value={state.titleAr}
            onChange={(value) => update("titleAr", value, "titleAr")}
            error={errors.titleAr}
            maxLength={255}
          />
          <AdminTextField
            id="titleEn"
            label="العنوان (إنجليزي)"
            lang="en"
            value={state.titleEn}
            onChange={(value) => update("titleEn", value, "titleEn")}
            error={errors.titleEn}
            maxLength={255}
          />
          <AdminTextArea
            id="summaryAr"
            label="الملخص (عربي)"
            lang="ar"
            value={state.summaryAr}
            onChange={(value) => update("summaryAr", value, "summaryAr")}
            error={errors.summaryAr}
            rows={2}
            maxLength={6000}
          />
          <AdminTextArea
            id="summaryEn"
            label="الملخص (إنجليزي)"
            lang="en"
            value={state.summaryEn}
            onChange={(value) => update("summaryEn", value, "summaryEn")}
            error={errors.summaryEn}
            rows={2}
            maxLength={6000}
          />
          <AdminTextArea
            id="descriptionAr"
            label="الوصف (عربي)"
            lang="ar"
            value={state.descriptionAr}
            onChange={(value) => update("descriptionAr", value, "descriptionAr")}
            error={errors.descriptionAr}
            rows={5}
            maxLength={6000}
            hint="نص عادي بلا محرر منسّق."
          />
          <AdminTextArea
            id="descriptionEn"
            label="الوصف (إنجليزي)"
            lang="en"
            value={state.descriptionEn}
            onChange={(value) => update("descriptionEn", value, "descriptionEn")}
            error={errors.descriptionEn}
            rows={5}
            maxLength={6000}
          />
          <AdminTextField
            id="slug"
            label="السلَج (رابط الصفحة)"
            lang="en"
            value={state.slug}
            onChange={(value) => update("slug", value, "slug")}
            error={errors.slug}
            hint="حروف إنجليزية صغيرة وأرقام وشرطات فقط. اتركه فارغاً ليُولَّد تلقائياً."
            maxLength={120}
          />
          <AdminSelect
            id="status"
            label="الحالة"
            value={state.status}
            onChange={(value) => update("status", value as EventStatus)}
            options={statusOptions}
            hint="المسودة لا تظهر للزوار. النشر وإلغاء النشر لهما أزرار مستقلة أسفل النموذج تُسجَّل في سجل التدقيق بنوع الحدث (نشر/إلغاء نشر)."
          />
        </div>
      </section>

      {/* 2 — Timing */}
      <section aria-labelledby="event-time-heading" className={ADMIN_PANEL}>
        <h2 id="event-time-heading" className={ADMIN_SECTION_HEADING}>
          التوقيت
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          كل الأوقات بتوقيت الكنيسة الرسمي <span className="font-english">{PARISH_TIME_ZONE}</span> — ويُخزَّن الموعد
          لحظةً مطلقة، فلا يتأثر بتغيير التوقيت الصيفي.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <AdminTextField
            id="startsAt"
            label="وقت البدء"
            required
            type="datetime-local"
            value={state.startWall}
            onChange={(value) => update("startWall", value, "startsAt")}
            error={errors.startsAt}
            hint="بتوقيت القاهرة."
          />
          <AdminTextField
            id="endsAt"
            label="وقت الانتهاء"
            type="datetime-local"
            value={state.endWall}
            onChange={(value) => update("endWall", value, "endsAt")}
            error={errors.endsAt}
            hint="اتركه فارغاً للفعاليات مفتوحة النهاية."
          />
        </div>

        <AdminCheckbox
          id="allDay"
          label="فعالية طوال اليوم"
          checked={state.allDay}
          onChange={(checked) => update("allDay", checked)}
          hint="تظهر للزوار بوصفها «طوال اليوم» دون عرض ساعة البدء."
          className="mt-4"
        />
      </section>

      {/* 3 — Venue and media */}
      <section aria-labelledby="event-media-heading" className={ADMIN_PANEL}>
        <h2 id="event-media-heading" className={ADMIN_SECTION_HEADING}>
          المكان والوسائط والمرفقات
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          الرابط (URL) هو ما يُخزَّن — لا يُرفع أي ملف إلى هذا الموقع، فالوسائط والمرفقات تُشار إليها بعنوانها.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <AdminSelect
            id="venueId"
            label="المكان الرئيسي"
            value={state.venueId}
            onChange={(value) => update("venueId", value, "venueId")}
            options={venueOptions}
            error={errors.venueId}
            hint="يُختار من مصطلحات بُعد «المكان». ويمكن أيضاً وسم الفعالية بعدة أماكن من قائمة التصنيفات بالأسفل."
          />
          <AdminTextField
            id="imageUrl"
            label="رابط الصورة"
            type="url"
            lang="en"
            value={state.imageUrl}
            onChange={(value) => update("imageUrl", value, "imageUrl")}
            error={errors.imageUrl}
            hint="مسار داخلي (مثل /assets/…) أو عنوان كامل. لا تُقدَّم أي صورة من نطاق غير معتمد في سياسة الأمان."
            maxLength={500}
          />
        </div>

        <fieldset className="mt-5 rounded-2xl border border-slate-200 p-3.5">
          <legend className="px-1 font-heading text-xs font-bold text-copticNavy">المرفقات</legend>
          {state.documents.length === 0 ? (
            <p className="text-[11px] text-slate-500">لا توجد مرفقات على هذه الفعالية.</p>
          ) : (
            <ul className="space-y-4">
              {state.documents.map((draft, index) => (
                <li key={index} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <AdminTextField
                      id={`doc-${index}-filename`}
                      label={`اسم الملف ${index + 1}`}
                      value={draft.filename}
                      onChange={(value) => updateDocument(index, { filename: value })}
                      error={errors[`documents.${index}.filename`]}
                      maxLength={255}
                    />
                    <AdminTextField
                      id={`doc-${index}-url`}
                      label="رابط الملف"
                      lang="en"
                      value={draft.url}
                      onChange={(value) => updateDocument(index, { url: value })}
                      error={errors[`documents.${index}.url`]}
                      maxLength={500}
                    />
                    <AdminTextField
                      id={`doc-${index}-mime`}
                      label="نوع الملف (اختياري)"
                      lang="en"
                      placeholder="application/pdf"
                      value={draft.mimeType}
                      onChange={(value) => updateDocument(index, { mimeType: value })}
                      error={errors[`documents.${index}.mimeType`]}
                      maxLength={127}
                    />
                    <AdminTextField
                      id={`doc-${index}-size`}
                      label="الحجم بالميجابايت (اختياري)"
                      lang="en"
                      placeholder="1.5"
                      value={draft.sizeMb}
                      onChange={(value) => updateDocument(index, { sizeMb: value })}
                      error={errors[`documents.${index}.sizeMb`]}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDocument(index)}
                    className={`${ADMIN_BUTTON_SECONDARY} mt-3 text-red-700`}
                  >
                    <X aria-hidden="true" className="h-3.5 w-3.5" />
                    <span>حذف هذا المرفق</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button type="button" onClick={addDocument} className={`${ADMIN_BUTTON_SECONDARY} mt-3`}>
            <FilePlus2 aria-hidden="true" className="h-3.5 w-3.5" />
            <span>إضافة مرفق</span>
          </button>
        </fieldset>
      </section>

      {/* 4 — Taxonomy */}
      <section aria-labelledby="event-taxonomy-heading" className={ADMIN_PANEL}>
        <h2 id="event-taxonomy-heading" className={ADMIN_SECTION_HEADING}>
          التصنيفات
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          اختر من كل بُعد ما يناسب الفعالية؛ لا حد أقصى عملياً (40 مصطلحاً). التصنيفات هي ما تُبنى عليه مرشّحات
          صفحة الفعاليات العامة.
        </p>

        <div className="mt-4 space-y-3">
          {TAXONOMY_GRID_DIMENSIONS.map((dimension) => {
            const group = taxonomy.find((candidate) => candidate.dimension === dimension);
            return (
              <TermMultiSelect
                key={dimension}
                id={`terms-${dimension}`}
                label={t(locale, `taxonomy.${dimension}` as const)}
                terms={group?.terms ?? []}
                selected={state.termIds}
                onToggle={updateTerm}
                locale={locale}
                error={errors.termIds}
                emptyLabel="لا توجد مصطلحات في هذا البُعد بعد."
              />
            );
          })}
        </div>
      </section>

      {/* 5 — Actions */}
      <section aria-labelledby="event-actions-heading" className={ADMIN_PANEL}>
        <h2 id="event-actions-heading" className={ADMIN_SECTION_HEADING}>
          الحفظ والإجراءات
        </h2>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {capabilities.create || capabilities.update ? (
            <button type="submit" disabled={isPending} aria-busy={isPending} className={ADMIN_BUTTON_PRIMARY}>
              {busy("create") || busy("save") ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Save aria-hidden="true" className="h-4 w-4" />
              )}
              <span>
                {isPending && (busy("create") || busy("save"))
                  ? "جارٍ الحفظ…"
                  : mode === "create"
                    ? "إنشاء الفعالية"
                    : "حفظ التعديلات"}
              </span>
            </button>
          ) : (
            <p className="text-xs font-bold text-amber-900">
              صلاحياتك الحالية لا تسمح بالحفظ. أي محاولة تعديل يرفضها الخادم وتُسجَّل في سجل التدقيق.
            </p>
          )}

          {mode === "edit" ? (
            <Link href="/events" className={ADMIN_BUTTON_SECONDARY}>
              العودة إلى القائمة
            </Link>
          ) : null}

          {mode === "create" ? (
            <button type="button" onClick={addDocument} className={ADMIN_BUTTON_SECONDARY}>
              <Plus aria-hidden="true" className="h-3.5 w-3.5" />
              <span>مرفق إضافي</span>
            </button>
          ) : null}
        </div>

        {mode === "edit" && eventId ? (
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
            {capabilities.publish ? (
              <>
                <button
                  type="button"
                  disabled={isPending}
                  aria-busy={busy("publish")}
                  onClick={() => runAction("publish", "نشر الفعالية", () => publishEventAction(eventId))}
                  className={ADMIN_BUTTON_SECONDARY}
                >
                  {busy("publish") ? (
                    <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send aria-hidden="true" className="h-3.5 w-3.5" />
                  )}
                  <span>نشر</span>
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  aria-busy={busy("unpublish")}
                  onClick={() => runAction("unpublish", "إلغاء النشر", () => unpublishEventAction(eventId))}
                  className={ADMIN_BUTTON_SECONDARY}
                >
                  {busy("unpublish") ? (
                    <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Undo2 aria-hidden="true" className="h-3.5 w-3.5" />
                  )}
                  <span>إلغاء النشر</span>
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  aria-busy={busy("archive")}
                  onClick={() => runAction("archive", "أرشفة الفعالية", () => archiveEventAction(eventId))}
                  className={ADMIN_BUTTON_SECONDARY}
                >
                  {busy("archive") ? (
                    <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Archive aria-hidden="true" className="h-3.5 w-3.5" />
                  )}
                  <span>أرشفة</span>
                </button>
              </>
            ) : null}

            {capabilities.duplicate ? (
              <button
                type="button"
                disabled={isPending}
                aria-busy={busy("duplicate")}
                onClick={() =>
                  runAction("duplicate", "نسخ الفعالية", () => duplicateEventAction(eventId), (data) => {
                    router.push(`/events/${data.id}/edit`);
                  })
                }
                className={ADMIN_BUTTON_SECONDARY}
              >
                {busy("duplicate") ? (
                  <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Copy aria-hidden="true" className="h-3.5 w-3.5" />
                )}
                <span>نسخ كمسودة مستقلة</span>
              </button>
            ) : null}

            {capabilities.cancel ? (
              <button
                type="button"
                disabled={isPending}
                aria-expanded={panel === "cancel"}
                onClick={() => setPanel(panel === "cancel" ? null : "cancel")}
                className={ADMIN_BUTTON_SECONDARY}
              >
                <Ban aria-hidden="true" className="h-3.5 w-3.5" />
                <span>إلغاء الفعالية</span>
              </button>
            ) : null}

            {capabilities.delete ? (
              <button
                type="button"
                disabled={isPending}
                aria-expanded={panel === "delete"}
                onClick={() => setPanel(panel === "delete" ? null : "delete")}
                className={ADMIN_BUTTON_DANGER}
              >
                <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                <span>حذف نهائي</span>
              </button>
            ) : null}
          </div>
        ) : null}

        {panel === "cancel" && eventId ? (
          <div className="mt-3 rounded-2xl border border-red-200 bg-red-50/70 p-3.5">
            <FieldShell id="editor-cancel-reason" label="سبب الإلغاء (يُحفظ في سجل التدقيق)">
              <textarea
                id="editor-cancel-reason"
                rows={2}
                maxLength={500}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className={ADMIN_INPUT}
              />
            </FieldShell>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isPending}
                aria-busy={busy("cancel")}
                onClick={() => runAction("cancel", "إلغاء الفعالية", () => cancelEventAction(eventId, reason))}
                className={ADMIN_BUTTON_DANGER}
              >
                {busy("cancel") ? <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" /> : null}
                <span>تأكيد الإلغاء</span>
              </button>
              <button type="button" onClick={() => setPanel(null)} className={ADMIN_BUTTON_SECONDARY}>
                تراجع
              </button>
            </div>
          </div>
        ) : null}

        {panel === "delete" && eventId ? (
          <div className="mt-3 rounded-2xl border border-red-300 bg-red-50 p-3.5">
            <p className="text-xs font-bold text-red-900">
              حذف هذه الفعالية نهائياً؟ لا يمكن التراجع، وسيُسجَّل الحذف باسمك في سجل التدقيق مع نسخة من الصف قبل حذفه.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isPending}
                aria-busy={busy("delete")}
                onClick={() =>
                  runAction("delete", "حذف الفعالية", () => deleteEventAction(eventId), () => {
                    router.push("/events");
                  })
                }
                className={ADMIN_BUTTON_DANGER}
              >
                {busy("delete") ? <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" /> : null}
                <span>نعم، احذف نهائياً</span>
              </button>
              <button type="button" onClick={() => setPanel(null)} className={ADMIN_BUTTON_SECONDARY}>
                إلغاء الأمر
              </button>
            </div>
          </div>
        ) : null}

        <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
          كل إجراء يُنفَّذ على الخادم بعد التحقق من الجلسة والصلاحية. عند الرفض لا يتغيّر أي محتوى، ويُضاف سطر «رفض
          صلاحية» إلى سجل التدقيق باسمك.
        </p>
      </section>
    </form>
  );
}
