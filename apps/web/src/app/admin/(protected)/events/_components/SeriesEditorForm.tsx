"use client";

// src/app/admin/(protected)/events/_components/SeriesEditorForm.tsx
// Create/edit a RECURRING SERIES (a weekly liturgy, a monthly meeting).
//
// WHAT A SERIES IS, AND WHY THIS FORM IS SHAPED THIS WAY: the parish stores the RULE once, not 300
// rows — occurrences are produced on read by `expandSeries()`. The form therefore asks for the rule
// (frequency + weekday/day-of-month + first date + optional last date), the wall-clock start time and
// the duration. There is no "generate the dates" step, because no dates are stored.
//
// The rule is validated by the SAME zod schema the action parses (which itself calls
// `validateRecurrenceRule()`), so "the form accepted it" and "the engine can expand it" cannot
// diverge, and the schema's Arabic problems appear next to the field they belong to.
//
// THE WEEKDAY NAMES COME FROM `DAY_OF_WEEK_LABELS_AR` — the schedule's own vocabulary — so the admin
// calls Friday "الجمعة" exactly as `/masses` does.

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Repeat, Save } from "lucide-react";
import { createSeriesAction, updateSeriesAction, type EventActionResult } from "@/actions/event-actions";
import { AdminFeedback, type AdminFeedbackTone } from "@/components/admin/AdminFeedback";
import { AdminSelect, AdminTextArea, AdminTextField, FieldShell } from "@/components/admin/AdminFields";
import { TermMultiSelect } from "@/components/admin/TermMultiSelect";
import {
  ADMIN_BUTTON_PRIMARY,
  ADMIN_BUTTON_SECONDARY,
  ADMIN_INPUT,
  ADMIN_INPUT_INVALID,
  ADMIN_PANEL,
  ADMIN_SECTION_HEADING,
} from "@/components/admin/admin-ui";
import type { AdminCapabilities } from "@/lib/domain/capabilities";
import { EVENT_STATUSES, EVENT_STATUS_LABELS_AR, type EventStatus, type RecurrenceFreq } from "@/lib/domain/types";
import type { AdminTaxonomyGroup } from "@/lib/events/admin";
import { seriesFormFieldErrors, seriesFormToPayload, type SeriesFormState } from "@/lib/events/admin-form";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n/messages";
import { PARISH_TIME_ZONE } from "@/lib/utils/cairo-time";
import { DAY_OF_WEEK_INDEX, DAY_OF_WEEK_LABELS_AR } from "@/lib/utils/mass-schedule";
import type { DayOfWeekEnum } from "@/types/database.types";

/** Sunday-first weekday list (index 0 = Sunday), built from the project's single day vocabulary. */
const WEEKDAY_OPTIONS: readonly { index: number; label: string }[] = (
  Object.keys(DAY_OF_WEEK_INDEX) as DayOfWeekEnum[]
)
  .map((name) => ({ index: DAY_OF_WEEK_INDEX[name], label: DAY_OF_WEEK_LABELS_AR[name] }))
  .sort((a, b) => a.index - b.index);

const FREQ_OPTIONS = [
  { value: "weekly", label: "أسبوعي (كل أسبوع / كل عدة أسابيع)" },
  { value: "monthly", label: "شهري (يوم محدد من الشهر)" },
] as const;

export interface SeriesEditorFormProps {
  mode: "create" | "edit";
  /** Present in edit mode only. */
  seriesId?: string;
  initial: SeriesFormState;
  taxonomy: AdminTaxonomyGroup[];
  locale: Locale;
  capabilities: AdminCapabilities;
}

export function SeriesEditorForm({
  mode,
  seriesId,
  initial,
  taxonomy,
  locale,
  capabilities,
}: SeriesEditorFormProps): React.ReactElement {
  const router = useRouter();
  const [state, setState] = useState<SeriesFormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ tone: AdminFeedbackTone; title: string; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof SeriesFormState>(key: K, value: SeriesFormState[K], errorKey?: string): void {
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

  function toggleWeekday(index: number): void {
    setState((current) => ({
      ...current,
      byWeekday: current.byWeekday.includes(index)
        ? current.byWeekday.filter((value) => value !== index)
        : [...current.byWeekday, index].sort((a, b) => a - b),
    }));
    clearError("rule.byWeekday");
  }

  function toggleTerm(termId: string): void {
    setState((current) => ({
      ...current,
      defaultTermIds: current.defaultTermIds.includes(termId)
        ? current.defaultTermIds.filter((id) => id !== termId)
        : [...current.defaultTermIds, termId],
    }));
  }

  /** The dimensions the term grid renders, minus the venue dimension (it has its own control here). */
  const termDimensions = taxonomy.filter((group) => group.dimension !== "venue");
  const venueTerms = taxonomy.find((group) => group.dimension === "venue")?.terms ?? [];

  function submit(formEvent: React.FormEvent<HTMLFormElement>): void {
    formEvent.preventDefault();
    const payload = seriesFormToPayload(state);
    const fieldErrors = seriesFormFieldErrors(state);
    setErrors(fieldErrors);

    if (Object.keys(fieldErrors).length > 0) {
      setFeedback({
        tone: "error",
        title: "لم يُحفظ بعد",
        message: "راجع الحقول المعلَّمة بالأحمر (خصوصاً قاعدة التكرار) ثم أعد المحاولة. لم يُرسَل أي تعديل إلى المخزن.",
      });
      const first = Object.keys(fieldErrors)[0].replace(/\./g, "\\.");
      document.querySelector<HTMLElement>(`#${CSS.escape(first)}, [name="${first}"]`)?.focus();
      return;
    }

    startTransition(async () => {
      const action = (): Promise<EventActionResult<{ id: string }>> =>
        mode === "create" ? createSeriesAction(payload) : updateSeriesAction(seriesId as string, payload);
      const result = await action();
      setFeedback({ tone: result.success ? "success" : "error", title: mode === "create" ? "إنشاء السلسلة" : "حفظ السلسلة", message: result.message });

      if (result.success) {
        if (mode === "create") router.push(`/admin/events/series/${result.data.id}`);
        else router.refresh();
      }
    });
  }

  const weekly = state.freq === "weekly";

  return (
    <form onSubmit={submit} noValidate aria-busy={isPending} className="space-y-6">
      {feedback ? <AdminFeedback tone={feedback.tone} title={feedback.title} message={feedback.message} /> : null}

      <section aria-labelledby="series-content-heading" className={ADMIN_PANEL}>
        <h2 id="series-content-heading" className={ADMIN_SECTION_HEADING}>
          بيانات السلسلة
        </h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <AdminTextField
            id="series-titleAr"
            label="عنوان السلسلة (عربي)"
            required
            lang="ar"
            value={state.titleAr}
            onChange={(value) => update("titleAr", value, "titleAr")}
            error={errors.titleAr}
            maxLength={255}
          />
          <AdminTextField
            id="series-titleEn"
            label="عنوان السلسلة (إنجليزي)"
            lang="en"
            value={state.titleEn}
            onChange={(value) => update("titleEn", value, "titleEn")}
            error={errors.titleEn}
            maxLength={255}
          />
          <AdminTextArea
            id="series-summaryAr"
            label="الوصف المختصر (عربي)"
            lang="ar"
            value={state.summaryAr}
            onChange={(value) => update("summaryAr", value, "summaryAr")}
            error={errors.summaryAr}
            rows={2}
            maxLength={6000}
          />
          <AdminTextArea
            id="series-summaryEn"
            label="الوصف المختصر (إنجليزي)"
            lang="en"
            value={state.summaryEn}
            onChange={(value) => update("summaryEn", value, "summaryEn")}
            error={errors.summaryEn}
            rows={2}
            maxLength={6000}
          />
          <AdminSelect
            id="series-status"
            label="الحالة"
            value={state.status}
            onChange={(value) => update("status", value as EventStatus)}
            options={EVENT_STATUSES.map((status: EventStatus) => ({
              value: status,
              label: EVENT_STATUS_LABELS_AR[status],
            }))}
            hint="السلسلة الملغاة أو المؤرشفة لا تُنتج أي موعد للزوار."
          />
        </div>
      </section>

      <section aria-labelledby="series-rule-heading" className={ADMIN_PANEL}>
        <h2 id="series-rule-heading" className={ADMIN_SECTION_HEADING}>
          قاعدة التكرار
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          المواعيد لا تُخزَّن، بل تُحسب من هذه القاعدة عند العرض — لذلك تعديل القاعدة يسري على كل المواعيد القادمة،
          بينما إلغاء موعد واحد أو نقله يكون باستثناء من شاشة السلسلة بعد الحفظ.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <AdminSelect
            id="series-freq"
            label="نوع التكرار"
            required
            value={state.freq}
            onChange={(value) => update("freq", value as RecurrenceFreq)}
            options={FREQ_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
          />
          <AdminTextField
            id="series-interval"
            label={weekly ? "كل كم أسبوع؟" : "كل كم شهر؟"}
            required
            type="number"
            lang="en"
            value={state.interval}
            onChange={(value) => update("interval", value, "rule.interval")}
            error={errors["rule.interval"]}
            hint="1 = كل أسبوع/شهر. مثال: 2 يعني كل أسبوعين أو كل شهرين."
          />

          {weekly ? (
            <fieldset
              id="series-weekdays"
              aria-invalid={errors["rule.byWeekday"] ? true : undefined}
              aria-describedby={errors["rule.byWeekday"] ? "series-weekdays-error" : "series-weekdays-hint"}
              className={`rounded-2xl border p-3.5 lg:col-span-2 ${
                errors["rule.byWeekday"] ? "border-red-300 bg-red-50/40" : "border-slate-200 bg-slate-50/60"
              }`}
            >
              <legend className="px-1 font-heading text-xs font-bold text-copticNavy">أيام الأسبوع</legend>
              <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-7">
                {WEEKDAY_OPTIONS.map((day) => {
                  const id = `series-weekday-${day.index}`;
                  return (
                    <li key={day.index} className="flex items-center gap-2">
                      <input
                        id={id}
                        type="checkbox"
                        checked={state.byWeekday.includes(day.index)}
                        onChange={() => toggleWeekday(day.index)}
                        className="h-4 w-4 rounded border-slate-400 text-copticNavy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copticNavy-500"
                      />
                      <label htmlFor={id} className="font-heading text-xs font-bold text-slate-700">
                        {day.label}
                      </label>
                    </li>
                  );
                })}
              </ul>
              <p id="series-weekdays-hint" className="mt-2 text-[11px] text-slate-500">
                اختر يوماً واحداً على الأقل. إن تُركت كلها فارغة يعتمد المحرك يوم تاريخ البداية.
              </p>
              {errors["rule.byWeekday"] ? (
                <p id="series-weekdays-error" className="mt-1 text-[11px] font-bold text-red-700">
                  {errors["rule.byWeekday"]}
                </p>
              ) : null}
            </fieldset>
          ) : (
            <AdminTextField
              id="series-monthday"
              label="يوم الشهر"
              type="number"
              lang="en"
              value={state.byMonthDay}
              onChange={(value) => update("byMonthDay", value, "rule.byMonthDay")}
              error={errors["rule.byMonthDay"]}
              hint="من 1 إلى 31. اتركه فارغاً لاستخدام يوم تاريخ البداية. الشهر الذي لا يحمل هذا اليوم (31 في فبراير) يُتخطّى."
            />
          )}

          <AdminTextField
            id="series-startDate"
            label="تاريخ أول موعد"
            required
            type="date"
            value={state.startDate}
            onChange={(value) => update("startDate", value, "rule.startDate")}
            error={errors["rule.startDate"]}
            hint="لا يوجد أي موعد قبل هذا التاريخ."
          />
          <AdminTextField
            id="series-endDate"
            label="تاريخ آخر موعد"
            type="date"
            value={state.endDate}
            onChange={(value) => update("endDate", value, "rule.endDate")}
            error={errors["rule.endDate"]}
            hint="اتركه فارغاً لسلسلة مفتوحة بلا نهاية."
          />
          <AdminTextField
            id="series-startTime"
            label="وقت البدء"
            required
            type="time"
            value={state.startTime}
            onChange={(value) => update("startTime", value, "startTime")}
            error={errors.startTime}
            hint={`بتوقيت ${PARISH_TIME_ZONE}.`}
          />
          <AdminTextField
            id="series-duration"
            label="مدة الموعد (دقائق)"
            type="number"
            lang="en"
            value={state.durationMinutes}
            onChange={(value) => update("durationMinutes", value, "durationMinutes")}
            error={errors.durationMinutes}
            hint="بين 5 و1440 دقيقة."
          />
        </div>

        {errors["rule.timezone"] || errors.rule ? (
          <p className="mt-3 text-xs font-bold text-red-700" role="alert">
            {errors["rule.timezone"] ?? errors.rule}
          </p>
        ) : null}
      </section>

      <section aria-labelledby="series-venue-heading" className={ADMIN_PANEL}>
        <h2 id="series-venue-heading" className={ADMIN_SECTION_HEADING}>
          المكان والتصنيفات
        </h2>
        <div className="mt-4 space-y-4">
          <FieldShell
            id="series-venue"
            label="المكان الافتراضي"
            error={errors.defaultVenueId}
            hint="يُطبَّق على كل موعد في السلسلة، ويمكن وسم السلسلة بأماكن إضافية من قائمة بُعد المكان بالأسفل."
          >
            <select
              id="series-venue"
              value={state.defaultVenueId}
              onChange={(event) => update("defaultVenueId", event.target.value, "defaultVenueId")}
              aria-invalid={errors.defaultVenueId ? true : undefined}
              className={`${ADMIN_INPUT} font-heading font-bold ${errors.defaultVenueId ? ADMIN_INPUT_INVALID : ""}`}
            >
              <option value="">بلا مكان افتراضي محدد</option>
              {venueTerms.map((term) => (
                <option key={term.id} value={term.id}>
                  {`${term.nameAr}${term.isActive ? "" : " (متوقف)"}`}
                </option>
              ))}
            </select>
          </FieldShell>

          {termDimensions.map((group) => (
            <TermMultiSelect
              key={group.dimension}
              id={`series-terms-${group.dimension}`}
              label={t(locale, `taxonomy.${group.dimension}` as const)}
              terms={group.terms}
              selected={state.defaultTermIds}
              onToggle={toggleTerm}
              locale={locale}
              hint="تُنسخ هذه التصنيفات على كل موعد تُنتجه السلسلة."
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="series-actions-heading" className={ADMIN_PANEL}>
        <h2 id="series-actions-heading" className={ADMIN_SECTION_HEADING}>
          الحفظ
        </h2>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {capabilities.seriesWrite ? (
            <button type="submit" disabled={isPending} aria-busy={isPending} className={ADMIN_BUTTON_PRIMARY}>
              {isPending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Save aria-hidden="true" className="h-4 w-4" />}
              <span>{isPending ? "جارٍ الحفظ…" : mode === "create" ? "إنشاء السلسلة" : "حفظ تعديلات السلسلة"}</span>
            </button>
          ) : (
            <p className="text-xs font-bold text-amber-900">
              صلاحياتك الحالية لا تسمح بتعديل السلاسل المتكررة. أي محاولة تُرفض على الخادم وتُسجَّل في سجل التدقيق.
            </p>
          )}
          <Link href="/admin/events" className={ADMIN_BUTTON_SECONDARY}>
            العودة إلى قائمة الفعاليات
          </Link>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
            <Repeat aria-hidden="true" className="h-3.5 w-3.5" />
            <span>تُحسب المواعيد من القاعدة عند العرض ولا تُخزَّن صفاً صفاً.</span>
          </span>
        </div>
      </section>
    </form>
  );
}
