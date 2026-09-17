"use client";

// src/app/admin/(protected)/events/_components/SeriesOccurrencesPanel.tsx
// The single-occurrence controls: cancel ONE date, move ONE date, or undo that deviation.
//
// THIS IS WHERE "WITHOUT BREAKING THE REST" IS ENFORCED, IN THE UI AND IN THE STORE: the panel never
// edits the series rule. It writes an `event_exceptions` row (`cancelOccurrenceAction` /
// `rescheduleOccurrenceAction`) which the recurrence engine folds in on read — the other dates are
// produced by the untouched rule. Undoing (`clearOccurrenceAction`) deletes that one exception.
//
// THE LIST COMES FROM THE SERVER: it is the engine's own expansion (cancelled dates and vacated slots
// included) for the next window, so what a secretary sees here is exactly what the engine will hand
// the public pages once the deviations are folded away.

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2, MoveRight, PlusCircle, Undo2, XCircle } from "lucide-react";
import {
  cancelOccurrenceAction,
  clearOccurrenceAction,
  rescheduleOccurrenceAction,
  type EventActionResult,
} from "@/actions/event-actions";
import { AdminFeedback, type AdminFeedbackTone } from "@/components/admin/AdminFeedback";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { FieldShell } from "@/components/admin/AdminFields";
import {
  ADMIN_BUTTON_DANGER,
  ADMIN_BUTTON_PRIMARY,
  ADMIN_BUTTON_QUIET,
  ADMIN_BUTTON_SECONDARY,
  ADMIN_INPUT,
  ADMIN_PANEL,
  ADMIN_SECTION_HEADING,
} from "@/components/admin/admin-ui";
import type { AdminCapabilities } from "@church-site/domain";
import type { AdminOccurrence } from "@church-site/data-access/client";
import { formatEventDayHeading, formatEventTime } from "@church-site/data-access/client";
import type { Locale } from "@church-site/ui";

/** Which inline form is open for which occurrence: one at a time, so the list stays readable. */
type OpenForm = { kind: "cancel" | "move"; occurrenceDate: string } | null;

export interface SeriesOccurrencesPanelProps {
  seriesId: string;
  occurrences: AdminOccurrence[];
  locale: Locale;
  capabilities: AdminCapabilities;
}

export function SeriesOccurrencesPanel({
  seriesId,
  occurrences,
  locale,
  capabilities,
}: SeriesOccurrencesPanelProps): React.ReactElement {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: AdminFeedbackTone; title: string; message: string } | null>(null);
  const [open, setOpen] = useState<OpenForm>(null);
  const [reason, setReason] = useState("");
  const [movedTo, setMovedTo] = useState("");

  function run<T>(key: string, title: string, action: () => Promise<EventActionResult<T>>): void {
    startTransition(async () => {
      setPendingKey(key);
      const result = await action();
      setPendingKey(null);
      setFeedback({ tone: result.success ? "success" : "error", title, message: result.message });
      if (result.success) {
        setOpen(null);
        setReason("");
        setMovedTo("");
        router.refresh();
      }
    });
  }

  const busy = (key: string) => isPending && pendingKey === key;

  return (
    <section aria-labelledby="series-occurrences-heading" className={ADMIN_PANEL}>
      <h2 id="series-occurrences-heading" className={ADMIN_SECTION_HEADING}>
        المواعيد القادمة والاستثناءات
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">
        القائمة التالية محسوبة من قاعدة التكرار (وقد تشمل موعداً ملغى أو موعداً منقولاً عن أصله). إلغاء موعد أو نقله هنا
        يُنشئ استثناءً لهذا التاريخ وحده؛ بقية المواعيد تظل كما هي.
      </p>

      {feedback ? <AdminFeedback tone={feedback.tone} title={feedback.title} message={feedback.message} className="mt-4" /> : null}

      {occurrences.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-copticGold-300 bg-copticGold-50/40 p-6 text-center text-xs text-slate-600">
          لا توجد مواعيد قادمة في نافذة العرض الحالية. راجع قاعدة التكرار وتاريخ آخر موعد، ثم احفظ.
        </p>
      ) : (
        <ul className="mt-4 space-y-3" data-admin-occurrences>
          {occurrences.map((occurrence) => {
            const key = `${occurrence.occurrenceDate}:${occurrence.state}`;
            const isOpen = open?.occurrenceDate === occurrence.occurrenceDate;
            const dayLabel =
              formatEventDayHeading(occurrence.startsAt, locale) || occurrence.occurrenceDate;
            const timeLabel = formatEventTime(occurrence.startsAt, locale);

            return (
              <li
                key={key}
                data-occurrence-date={occurrence.occurrenceDate}
                data-occurrence-state={occurrence.state}
                className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminStatusBadge status={occurrence.state} />
                    <span className="font-heading text-sm font-bold text-copticNavy">{dayLabel}</span>
                    {timeLabel ? <span className="text-xs text-slate-600">{timeLabel}</span> : null}
                    {occurrence.state === "moved" && occurrence.movedToDate ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-copticNavy-800">
                        <MoveRight aria-hidden="true" className="h-3 w-3" />
                        <span>نُقل إلى {occurrence.movedToDate}</span>
                      </span>
                    ) : null}
                  </div>

                  {capabilities.exceptionWrite ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {occurrence.state === "scheduled" ? (
                        <>
                          <button
                            type="button"
                            disabled={isPending}
                            aria-expanded={isOpen && open.kind === "cancel"}
                            onClick={() => {
                              setReason("");
                              setOpen(isOpen && open.kind === "cancel" ? null : { kind: "cancel", occurrenceDate: occurrence.occurrenceDate });
                            }}
                            className={`${ADMIN_BUTTON_QUIET} text-red-700 hover:bg-red-50`}
                          >
                            <XCircle aria-hidden="true" className="h-3.5 w-3.5" />
                            <span>إلغاء هذا الموعد</span>
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            aria-expanded={isOpen && open.kind === "move"}
                            onClick={() => {
                              setMovedTo("");
                              setOpen(isOpen && open.kind === "move" ? null : { kind: "move", occurrenceDate: occurrence.occurrenceDate });
                            }}
                            className={ADMIN_BUTTON_QUIET}
                          >
                            <CalendarClock aria-hidden="true" className="h-3.5 w-3.5" />
                            <span>نقل هذا الموعد</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={isPending}
                          aria-busy={busy(`clear:${occurrence.occurrenceDate}`)}
                          onClick={() =>
                            run(`clear:${occurrence.occurrenceDate}`, "إلغاء الاستثناء", () =>
                              clearOccurrenceAction(seriesId, occurrence.occurrenceDate)
                            )
                          }
                          className={ADMIN_BUTTON_QUIET}
                        >
                          {busy(`clear:${occurrence.occurrenceDate}`) ? (
                            <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Undo2 aria-hidden="true" className="h-3.5 w-3.5" />
                          )}
                          <span>إلغاء الاستثناء وإعادة الموعد</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500">عرض فقط — لا تملك صلاحية تعديل موعد واحد</span>
                  )}
                </div>

                {occurrence.reasonAr ? (
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-600">السبب المسجَّل: {occurrence.reasonAr}</p>
                ) : null}

                {isOpen && open.kind === "cancel" ? (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50/70 p-3">
                    <FieldShell
                      id={`occurrence-cancel-${occurrence.occurrenceDate}`}
                      label={`سبب إلغاء موعد ${dayLabel}`}
                      hint="يُحفظ السبب على الاستثناء نفسه، ويظهر للزوار مع الموعد الملغى في صفحة الفعالية."
                    >
                      <textarea
                        id={`occurrence-cancel-${occurrence.occurrenceDate}`}
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
                        aria-busy={busy(`cancel:${occurrence.occurrenceDate}`)}
                        onClick={() =>
                          run(`cancel:${occurrence.occurrenceDate}`, "إلغاء موعد واحد", () =>
                            cancelOccurrenceAction(seriesId, occurrence.occurrenceDate, reason)
                          )
                        }
                        className={ADMIN_BUTTON_DANGER}
                      >
                        {busy(`cancel:${occurrence.occurrenceDate}`) ? (
                          <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        <span>تأكيد إلغاء هذا الموعد فقط</span>
                      </button>
                      <button type="button" onClick={() => setOpen(null)} className={ADMIN_BUTTON_SECONDARY}>
                        تراجع
                      </button>
                    </div>
                  </div>
                ) : null}

                {isOpen && open.kind === "move" ? (
                  <div className="mt-3 rounded-xl border border-copticGold-300 bg-copticGold-50/70 p-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FieldShell
                        id={`occurrence-move-${occurrence.occurrenceDate}`}
                        label="التاريخ الجديد"
                        hint="بنفس وقت السلسلة، وبمنطقتها الزمنية. يجب أن يختلف عن التاريخ الأصلي."
                      >
                        <input
                          id={`occurrence-move-${occurrence.occurrenceDate}`}
                          type="date"
                          value={movedTo}
                          onChange={(event) => setMovedTo(event.target.value)}
                          className={ADMIN_INPUT}
                        />
                      </FieldShell>
                      <FieldShell id={`occurrence-move-reason-${occurrence.occurrenceDate}`} label="سبب النقل (اختياري)">
                        <input
                          id={`occurrence-move-reason-${occurrence.occurrenceDate}`}
                          type="text"
                          maxLength={500}
                          value={reason}
                          onChange={(event) => setReason(event.target.value)}
                          className={ADMIN_INPUT}
                        />
                      </FieldShell>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={isPending || movedTo.trim().length === 0 || movedTo === occurrence.occurrenceDate}
                        aria-busy={busy(`move:${occurrence.occurrenceDate}`)}
                        onClick={() =>
                          run(`move:${occurrence.occurrenceDate}`, "نقل موعد واحد", () =>
                            rescheduleOccurrenceAction(seriesId, occurrence.occurrenceDate, movedTo, reason)
                          )
                        }
                        className={ADMIN_BUTTON_PRIMARY}
                      >
                        {busy(`move:${occurrence.occurrenceDate}`) ? (
                          <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <PlusCircle aria-hidden="true" className="h-3.5 w-3.5" />
                        )}
                        <span>تأكيد نقل هذا الموعد</span>
                      </button>
                      <button type="button" onClick={() => setOpen(null)} className={ADMIN_BUTTON_SECONDARY}>
                        تراجع
                      </button>
                    </div>
                    {movedTo.trim().length > 0 && movedTo === occurrence.occurrenceDate ? (
                      <p className="mt-2 text-[11px] font-bold text-red-700" role="alert">
                        تاريخ النقل يجب أن يختلف عن الموعد الأصلي.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
