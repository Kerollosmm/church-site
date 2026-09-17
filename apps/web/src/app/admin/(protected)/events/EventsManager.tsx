"use client";

// src/app/admin/(protected)/events/EventsManager.tsx
// The events/series index: every row the store holds, with the actions the CURRENT ROLE may perform.
//
// ROLE AWARENESS IS STRUCTURAL, NOT COSMETIC. `capabilities` arrives from the server (resolved by
// `resolveAdminCapabilities()` through the same `can()` table the actions use), and a control the
// role does not have is simply not rendered. That is convenience, never security: every action
// re-checks the capability server-side and records a `denied` audit entry when it refuses.
//
// EVERY ACTION RUNS AS A TRANSITION: the row's buttons disable and show a spinner while the request
// is in flight (`aria-busy`), the answer is rendered in ONE feedback banner above the tables, and a
// success refreshes the server components so the row shows its new state instead of a stale one.
//
// INPUT IS COLLECTED INLINE, NEVER IN A `window.prompt`: a cancellation reason and a relocation date
// are real form fields with labels, reachable by keyboard and announced by a screen reader.

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  Ban,
  CalendarClock,
  Copy,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";
import {
  archiveEventAction,
  cancelEventAction,
  cancelSeriesAction,
  duplicateEventAction,
  publishEventAction,
  publishSeriesAction,
  deleteEventAction,
  unpublishEventAction,
  updateEventAction,
  type EventActionResult,
} from "@/actions/event-actions";
import { AdminChip, AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminFeedback, type AdminFeedbackTone } from "@/components/admin/AdminFeedback";
import { FieldShell, describedBy } from "@/components/admin/AdminFields";
import {
  ADMIN_BUTTON_DANGER,
  ADMIN_BUTTON_PRIMARY,
  ADMIN_BUTTON_QUIET,
  ADMIN_BUTTON_SECONDARY,
  ADMIN_FOCUS_RING,
  ADMIN_INPUT,
  ADMIN_INPUT_INVALID,
  ADMIN_PANEL,
  ADMIN_SECTION_HEADING,
  ADMIN_TABLE,
  ADMIN_TD,
  ADMIN_TH,
} from "@/components/admin/admin-ui";
import { FlagBadge } from "@/components/events/FlagBadge";
import type { AdminCapabilities } from "@/lib/domain/capabilities";
import { EVENT_STATUS_LABELS_AR } from "@/lib/domain/types";
import { instantToWallInput, wallInputToInstant } from "@/lib/events/admin-form";
import type { AdminEventRow, AdminSeriesRow } from "@/lib/events/admin";
import { describeRecurrence, formatEventDayHeading, formatEventTime } from "@/lib/events/format";
import type { Locale } from "@/lib/i18n/locales";
import { localized } from "@/lib/i18n/localized";

const EVENT_STATUS_FILTERS = [
  { value: "all", label: "كافة الحالات" },
  { value: "draft", label: EVENT_STATUS_LABELS_AR.draft },
  { value: "published", label: EVENT_STATUS_LABELS_AR.published },
  { value: "cancelled", label: EVENT_STATUS_LABELS_AR.cancelled },
  { value: "archived", label: EVENT_STATUS_LABELS_AR.archived },
] as const;

const SORT_OPTIONS = [
  { value: "date-desc", label: "الأقرب موعداً (الأحدث أولاً)" },
  { value: "date-asc", label: "الأقدم موعداً" },
  { value: "updated-desc", label: "الأحدث تعديلاً" },
  { value: "title", label: "أبجدياً بالعنوان" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

/** Which inline input panel is open, and for which row. One at a time — the screens are dense. */
type Panel = { kind: "cancel" | "move" | "delete"; id: string } | null;

export interface EventsManagerProps {
  events: AdminEventRow[];
  series: AdminSeriesRow[];
  capabilities: AdminCapabilities;
  locale: Locale;
}

function titleOf(row: { titleAr: string; titleEn: string | null }, locale: Locale): string {
  return localized({ ar: row.titleAr, en: row.titleEn }, locale);
}

/** "الجمعة، 18 سبتمبر 2026 · 07:00 ص" for an occurrence, or a clear "—" when there is none. */
function occurrenceLabel(startsAt: string, dateKey: string | null, locale: Locale): string {
  const dayLabel = dateKey ? formatEventDayHeading(dateKey, locale) : formatEventDayHeading(startsAt, locale);
  const timeLabel = formatEventTime(startsAt, locale);
  return [dayLabel, timeLabel].filter((part) => part.length > 0).join(" · ") || "—";
}

export function EventsManager({ events, series, capabilities, locale }: EventsManagerProps): React.ReactElement {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: AdminFeedbackTone; title: string; message: string } | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [reason, setReason] = useState("");
  const [moveWall, setMoveWall] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortValue>("date-desc");
  const [seriesSearch, setSeriesSearch] = useState("");

  const term = search.trim().toLowerCase();
  const visibleEvents = useMemo(() => {
    const filtered = events.filter((row) => {
      if (statusFilter !== "all" && row.event.status !== statusFilter) return false;
      if (term.length === 0) return true;
      return (
        row.event.titleAr.toLowerCase().includes(term) ||
        (row.event.titleEn ?? "").toLowerCase().includes(term) ||
        row.event.slug.toLowerCase().includes(term) ||
        (row.venue?.nameAr ?? "").toLowerCase().includes(term)
      );
    });

    return [...filtered].sort((a, b) => {
      if (sort === "updated-desc") return b.event.updatedAt.localeCompare(a.event.updatedAt);
      if (sort === "title") return a.event.titleAr.localeCompare(b.event.titleAr, "ar");
      const comparison = a.event.startsAt.localeCompare(b.event.startsAt);
      return sort === "date-asc" ? comparison : -comparison;
    });
  }, [events, statusFilter, term, sort]);

  const seriesTerm = seriesSearch.trim().toLowerCase();
  const visibleSeries = useMemo(
    () =>
      seriesTerm.length === 0
        ? series
        : series.filter(
            (row) => row.series.titleAr.toLowerCase().includes(seriesTerm) || (row.series.titleEn ?? "").toLowerCase().includes(seriesTerm)
          ),
    [series, seriesTerm]
  );

  /**
   * Runs one action and reports it in the shared banner. Returns nothing: every caller either lets
   * the refresh show the result or navigates afterwards.
   */
  const runAction = <T,>(
    key: string,
    title: string,
    action: () => Promise<EventActionResult<T>>,
    onSuccess?: (data: T) => void
  ) => {
    startTransition(async () => {
      setPendingKey(key);
      const result = await action();
      setPendingKey(null);
      setFeedback({ tone: result.success ? "success" : "error", title, message: result.message });
      if (result.success) {
        setPanel(null);
        setReason("");
        setMoveWall("");
        onSuccess?.(result.data);
        router.refresh();
      }
    });
  };

  const busy = (key: string) => isPending && pendingKey === key;
  const statusOptions = EVENT_STATUS_FILTERS.map((option) => ({ value: option.value, label: option.label }));
  const sortOptions = SORT_OPTIONS.map((option) => ({ value: option.value, label: option.label }));

  // --- per-row action groups -------------------------------------------------

  function eventActions(row: AdminEventRow): React.ReactNode {
    const id = row.event.id;
    const status = row.event.status;

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {capabilities.update ? (
          <Link href={`/admin/events/${id}/edit`} className={ADMIN_BUTTON_QUIET}>
            <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
            <span>تعديل</span>
          </Link>
        ) : null}

        {capabilities.publish && status !== "published" ? (
          <button
            type="button"
            disabled={isPending}
            aria-busy={busy(`publish:${id}`)}
            onClick={() => runAction(`publish:${id}`, "نشر الفعالية", () => publishEventAction(id))}
            className={ADMIN_BUTTON_QUIET}
          >
            {busy(`publish:${id}`) ? (
              <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send aria-hidden="true" className="h-3.5 w-3.5" />
            )}
            <span>نشر</span>
          </button>
        ) : null}

        {capabilities.publish && status === "published" ? (
          <button
            type="button"
            disabled={isPending}
            aria-busy={busy(`unpublish:${id}`)}
            onClick={() => runAction(`unpublish:${id}`, "إلغاء النشر", () => unpublishEventAction(id))}
            className={ADMIN_BUTTON_QUIET}
          >
            {busy(`unpublish:${id}`) ? (
              <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Undo2 aria-hidden="true" className="h-3.5 w-3.5" />
            )}
            <span>إلغاء النشر</span>
          </button>
        ) : null}

        {capabilities.update && !row.isOverride ? (
          <button
            type="button"
            disabled={isPending}
            aria-expanded={panel?.kind === "move" && panel.id === id}
            onClick={() => {
              setMoveWall(instantToWallInput(row.event.startsAt));
              setPanel({ kind: "move", id });
            }}
            className={ADMIN_BUTTON_QUIET}
          >
            <CalendarClock aria-hidden="true" className="h-3.5 w-3.5" />
            <span>نقل الموعد</span>
          </button>
        ) : null}

        {capabilities.duplicate ? (
          <button
            type="button"
            disabled={isPending}
            aria-busy={busy(`duplicate:${id}`)}
            onClick={() =>
              runAction(`duplicate:${id}`, "نسخ الفعالية", () => duplicateEventAction(id), (data) => {
                router.push(`/admin/events/${data.id}/edit`);
              })
            }
            className={ADMIN_BUTTON_QUIET}
          >
            {busy(`duplicate:${id}`) ? (
              <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Copy aria-hidden="true" className="h-3.5 w-3.5" />
            )}
            <span>نسخ</span>
          </button>
        ) : null}

        {capabilities.publish && status !== "archived" ? (
          <button
            type="button"
            disabled={isPending}
            aria-busy={busy(`archive:${id}`)}
            onClick={() => runAction(`archive:${id}`, "أرشفة الفعالية", () => archiveEventAction(id))}
            className={ADMIN_BUTTON_QUIET}
          >
            {busy(`archive:${id}`) ? (
              <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Archive aria-hidden="true" className="h-3.5 w-3.5" />
            )}
            <span>أرشفة</span>
          </button>
        ) : null}

        {capabilities.cancel && status !== "cancelled" ? (
          <button
            type="button"
            disabled={isPending}
            aria-expanded={panel?.kind === "cancel" && panel.id === id}
            onClick={() => {
              setReason("");
              setPanel({ kind: "cancel", id });
            }}
            className={ADMIN_BUTTON_QUIET}
          >
            <Ban aria-hidden="true" className="h-3.5 w-3.5" />
            <span>إلغاء الفعالية</span>
          </button>
        ) : null}

        {capabilities.delete ? (
          <button
            type="button"
            disabled={isPending}
            aria-expanded={panel?.kind === "delete" && panel.id === id}
            onClick={() => setPanel({ kind: "delete", id })}
            className={`${ADMIN_BUTTON_QUIET} text-red-700 hover:bg-red-50`}
          >
            <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
            <span>حذف</span>
          </button>
        ) : null}
      </div>
    );
  }

  /** The inline input a destructive or date-changing action needs, rendered under its row. */
  function eventPanel(row: AdminEventRow): React.ReactNode {
    if (!panel || panel.id !== row.event.id) return null;
    const id = row.event.id;
    const title = titleOf(row.event, locale);

    if (panel.kind === "cancel") {
      return (
        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50/70 p-3.5">
          <FieldShell
            id={`cancel-reason-${id}`}
            label={`سبب إلغاء «${title}»`}
            hint="يُحفظ السبب مع الفعالية في سجل التدقيق، ويُعرض على الزوار لاحقاً في سجل الفعاليات."
          >
            <textarea
              id={`cancel-reason-${id}`}
              rows={2}
              maxLength={500}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="مثال: تعارض مع قداس استثنائي"
              aria-describedby={describedBy(`cancel-reason-${id}`, "hint")}
              className={ADMIN_INPUT}
            />
          </FieldShell>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isPending}
              aria-busy={busy(`cancel:${id}`)}
              onClick={() => runAction(`cancel:${id}`, "إلغاء الفعالية", () => cancelEventAction(id, reason))}
              className={ADMIN_BUTTON_DANGER}
            >
              {busy(`cancel:${id}`) ? <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" /> : null}
              <span>تأكيد إلغاء الفعالية</span>
            </button>
            <button type="button" onClick={() => setPanel(null)} className={ADMIN_BUTTON_SECONDARY}>
              تراجع
            </button>
          </div>
        </div>
      );
    }

    if (panel.kind === "move") {
      const instant = wallInputToInstant(moveWall);
      const invalid = moveWall.trim().length > 0 && instant === null;

      return (
        <div className="mt-3 rounded-2xl border border-copticGold-300 bg-copticGold-50/70 p-3.5">
          <FieldShell
            id={`move-${id}`}
            label="الموعد الجديد (بتوقيت القاهرة)"
            hint="يُحدَّث وقت بدء الفعالية، ويُحفظ التغيير في سجل التدقيق."
            error={invalid ? "صيغة التاريخ أو الوقت غير مكتملة." : undefined}
          >
            <input
              id={`move-${id}`}
              type="datetime-local"
              value={moveWall}
              onChange={(event) => setMoveWall(event.target.value)}
              aria-invalid={invalid ? true : undefined}
              aria-describedby={describedBy(`move-${id}`, "hint", invalid ? "error" : undefined)}
              className={`${ADMIN_INPUT} ${invalid ? ADMIN_INPUT_INVALID : ""}`}
            />
          </FieldShell>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isPending || !instant}
              aria-busy={busy(`move:${id}`)}
              onClick={() => {
                if (!instant) return;
                runAction(`move:${id}`, "نقل موعد الفعالية", () => updateEventAction(id, { startsAt: instant }));
              }}
              className={ADMIN_BUTTON_PRIMARY}
            >
              {busy(`move:${id}`) ? <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" /> : null}
              <span>تأكيد النقل</span>
            </button>
            <button type="button" onClick={() => setPanel(null)} className={ADMIN_BUTTON_SECONDARY}>
              تراجع
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-3 rounded-2xl border border-red-300 bg-red-50 p-3.5">
        <p className="text-xs font-bold text-red-900">
          حذف «{title}» نهائياً؟ لا يمكن التراجع عن هذا الإجراء، وسيُسجَّل في سجل التدقيق.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isPending}
            aria-busy={busy(`delete:${id}`)}
            onClick={() => runAction(`delete:${id}`, "حذف الفعالية", () => deleteEventAction(id))}
            className={ADMIN_BUTTON_DANGER}
          >
            {busy(`delete:${id}`) ? <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" /> : null}
            <span>نعم، احذف نهائياً</span>
          </button>
          <button type="button" onClick={() => setPanel(null)} className={ADMIN_BUTTON_SECONDARY}>
            إلغاء الأمر
          </button>
        </div>
      </div>
    );
  }

  function seriesActions(row: AdminSeriesRow): React.ReactNode {
    const id = row.series.id;
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <Link href={`/admin/events/series/${id}`} className={ADMIN_BUTTON_QUIET}>
          <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
          <span>تعديل السلسلة والمواعيد</span>
        </Link>
        {capabilities.publish && row.series.status !== "published" ? (
          <button
            type="button"
            disabled={isPending}
            aria-busy={busy(`series-publish:${id}`)}
            onClick={() => runAction(`series-publish:${id}`, "نشر السلسلة", () => publishSeriesAction(id))}
            className={ADMIN_BUTTON_QUIET}
          >
            {busy(`series-publish:${id}`) ? (
              <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send aria-hidden="true" className="h-3.5 w-3.5" />
            )}
            <span>نشر</span>
          </button>
        ) : null}
        {capabilities.cancel && row.series.status !== "cancelled" ? (
          <button
            type="button"
            disabled={isPending}
            aria-expanded={panel?.kind === "cancel" && panel.id === id}
            onClick={() => {
              setReason("");
              setPanel({ kind: "cancel", id });
            }}
            className={`${ADMIN_BUTTON_QUIET} text-red-700 hover:bg-red-50`}
          >
            <Ban aria-hidden="true" className="h-3.5 w-3.5" />
            <span>إلغاء السلسلة كاملة</span>
          </button>
        ) : null}
      </div>
    );
  }

  function seriesPanel(row: AdminSeriesRow): React.ReactNode {
    if (!panel || panel.kind !== "cancel" || panel.id !== row.series.id) return null;
    const id = row.series.id;

    return (
      <div className="mt-3 rounded-2xl border border-red-200 bg-red-50/70 p-3.5">
        <FieldShell
          id={`series-cancel-${id}`}
          label={`سبب إلغاء سلسلة «${row.series.titleAr}»`}
          hint="يُلغى كل موعد قادم في السلسلة. إلغاء موعد واحد فقط يتم من شاشة السلسلة نفسها."
        >
          <textarea
            id={`series-cancel-${id}`}
            rows={2}
            maxLength={500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className={ADMIN_INPUT}
          />
        </FieldShell>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isPending}
            aria-busy={busy(`series-cancel:${id}`)}
            onClick={() => runAction(`series-cancel:${id}`, "إلغاء السلسلة", () => cancelSeriesAction(id, reason))}
            className={ADMIN_BUTTON_DANGER}
          >
            {busy(`series-cancel:${id}`) ? <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" /> : null}
            <span>تأكيد إلغاء السلسلة</span>
          </button>
          <button type="button" onClick={() => setPanel(null)} className={ADMIN_BUTTON_SECONDARY}>
            تراجع
          </button>
        </div>
      </div>
    );
  }

  // --- render ----------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Filters */}
      <section aria-labelledby="events-filters-heading" className={ADMIN_PANEL}>
        <h2 id="events-filters-heading" className={ADMIN_SECTION_HEADING}>
          البحث والتصفية
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FieldShell id="events-search" label="بحث في الفعاليات">
            <span className="relative block">
              <Search aria-hidden="true" className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="events-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="بالعنوان أو السلَج أو المكان…"
                className={`${ADMIN_INPUT} pe-9`}
              />
            </span>
          </FieldShell>

          <FieldShell id="events-status" label="تصفية بالحالة">
            <select
              id="events-status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={`${ADMIN_INPUT} font-heading font-bold`}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FieldShell>

          <FieldShell id="events-sort" label="الترتيب">
            <select
              id="events-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortValue)}
              className={`${ADMIN_INPUT} font-heading font-bold`}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FieldShell>
        </div>
        <p className="mt-3 text-[11px] text-slate-500" aria-live="polite">
          الفعاليات المعروضة: <strong className="text-copticNavy">{visibleEvents.length}</strong> من أصل{" "}
          <strong className="text-copticNavy">{events.length}</strong>
        </p>
      </section>

      {feedback ? <AdminFeedback tone={feedback.tone} title={feedback.title} message={feedback.message} /> : null}

      {/* Events */}
      <section aria-labelledby="events-list-heading" className={ADMIN_PANEL}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="events-list-heading" className={ADMIN_SECTION_HEADING}>
            الفعاليات ({events.length})
          </h2>
          {capabilities.create ? (
            <Link href="/admin/events/new" className={ADMIN_BUTTON_PRIMARY}>
              <Plus aria-hidden="true" className="h-4 w-4" />
              <span>فعالية جديدة</span>
            </Link>
          ) : null}
        </div>

        {events.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-copticGold-300 bg-copticGold-50/40 p-8 text-center">
            <p className="font-heading text-sm font-bold text-copticNavy">لا توجد فعاليات بعد</p>
            <p className="mt-1 text-xs text-slate-600">
              أنشئ أول فعالية (قداس، اجتماع، نشاط) وحدّد موعدها ومكانها وتصنيفاتها، ثم انشرها لتظهر للزوار.
            </p>
            {capabilities.create ? (
              <Link href="/admin/events/new" className={`mt-4 ${ADMIN_BUTTON_PRIMARY}`}>
                <Plus aria-hidden="true" className="h-4 w-4" />
                <span>إنشاء فعالية</span>
              </Link>
            ) : (
              <p className="mt-4 text-xs font-bold text-slate-600">
                دورك الحالي للعرض فقط، وطلب الإنشاء يحتاج صلاحية المحرر.
              </p>
            )}
          </div>
        ) : visibleEvents.length === 0 ? (
          <p className="mt-4 text-xs text-slate-600">لا توجد فعاليات مطابقة للبحث أو التصفية الحالية.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className={ADMIN_TABLE} aria-label="قائمة الفعاليات">
              <thead>
                <tr>
                  <th scope="col" className={ADMIN_TH}>
                    الفعالية
                  </th>
                  <th scope="col" className={ADMIN_TH}>
                    الحالة
                  </th>
                  <th scope="col" className={ADMIN_TH}>
                    الموعد القادم
                  </th>
                  <th scope="col" className={ADMIN_TH}>
                    المكان
                  </th>
                  <th scope="col" className={ADMIN_TH}>
                    التصنيفات
                  </th>
                  <th scope="col" className={ADMIN_TH}>
                    آخر تعديل
                  </th>
                  <th scope="col" className={ADMIN_TH}>
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleEvents.map((row) => (
                  <tr key={row.event.id} data-admin-event={row.event.slug}>
                    <td className={ADMIN_TD}>
                      <div className="space-y-1">
                        <p className="font-heading text-sm font-bold text-copticNavy">{titleOf(row.event, locale)}</p>
                        <p className="font-english text-[10px] text-slate-400" dir="ltr">
                          {row.event.slug}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {row.isOverride ? (
                            <>
                              <AdminChip tone="navy">تجاوز موعد في سلسلة</AdminChip>
                              <Link
                                href={`/admin/events/series/${row.event.seriesId}`}
                                className={`inline-flex items-center gap-1 text-[11px] font-bold text-copticNavy underline ${ADMIN_FOCUS_RING}`}
                              >
                                <span>فتح السلسلة</span>
                                <ExternalLink aria-hidden="true" className="h-3 w-3" />
                              </Link>
                            </>
                          ) : (
                            <AdminChip>فعالية مستقلة</AdminChip>
                          )}
                          {row.event.allDay ? <AdminChip tone="gold">طوال اليوم</AdminChip> : null}
                          {row.event.imageUrl ? <AdminChip>لها صورة</AdminChip> : null}
                          {row.event.documents.length > 0 ? (
                            <AdminChip>{`${row.event.documents.length} مرفق`}</AdminChip>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className={ADMIN_TD}>
                      <AdminStatusBadge status={row.event.status} />
                    </td>
                    <td className={ADMIN_TD}>
                      {row.isOverride
                        ? row.event.occurrenceDate ?? "—"
                        : occurrenceLabel(row.event.startsAt, row.nextOccurrenceDateKey, locale)}
                    </td>
                    <td className={ADMIN_TD}>{row.venue ? localized({ ar: row.venue.nameAr, en: row.venue.nameEn }, locale) : "—"}</td>
                    <td className={ADMIN_TD}>
                      {row.terms.length === 0 ? (
                        <span className="text-slate-400">بلا تصنيف</span>
                      ) : (
                        <div className="flex max-w-xs flex-wrap gap-1">
                          {row.terms.map((term) => (
                            <FlagBadge key={term.id} term={term} locale={locale} />
                          ))}
                        </div>
                      )}
                    </td>
                    <td className={ADMIN_TD}>
                      <span className="font-english text-[11px] text-slate-500" dir="ltr">
                        {row.event.updatedAt.slice(0, 16).replace("T", " ")}Z
                      </span>
                    </td>
                    <td className={ADMIN_TD}>
                      {eventActions(row)}
                      {eventPanel(row)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Series */}
      <section aria-labelledby="series-list-heading" className={ADMIN_PANEL}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="series-list-heading" className={ADMIN_SECTION_HEADING}>
              السلاسل المتكررة ({series.length})
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              المواعيد المتكررة تُحسب من القاعدة عند العرض، ولا تُخزَّن صفاً لكل موعد. إلغاء موعد واحد أو نقله يتم من
              شاشة السلسلة.
            </p>
          </div>
          {capabilities.seriesWrite ? (
            <Link href="/admin/events/series/new" className={ADMIN_BUTTON_SECONDARY}>
              <Plus aria-hidden="true" className="h-4 w-4" />
              <span>سلسلة متكررة جديدة</span>
            </Link>
          ) : null}
        </div>

        {series.length > 0 ? (
          <div className="mt-4 max-w-sm">
            <FieldShell id="series-search" label="بحث في السلاسل">
              <input
                id="series-search"
                type="search"
                value={seriesSearch}
                onChange={(event) => setSeriesSearch(event.target.value)}
                className={ADMIN_INPUT}
              />
            </FieldShell>
          </div>
        ) : null}

        {series.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-copticGold-300 bg-copticGold-50/40 p-8 text-center">
            <p className="font-heading text-sm font-bold text-copticNavy">لا توجد سلاسل متكررة بعد</p>
            <p className="mt-1 text-xs text-slate-600">
              السلسلة تمثّل موعداً يتكرر أسبوعياً أو شهرياً (قداس الجمعة، اجتماع الشباب…)، وتُوسَّع مواعيدها تلقائياً.
            </p>
            {capabilities.seriesWrite ? (
              <Link href="/admin/events/series/new" className={`mt-4 ${ADMIN_BUTTON_SECONDARY}`}>
                <Plus aria-hidden="true" className="h-4 w-4" />
                <span>إنشاء سلسلة متكررة</span>
              </Link>
            ) : null}
          </div>
        ) : visibleSeries.length === 0 ? (
          <p className="mt-4 text-xs text-slate-600">لا توجد سلاسل مطابقة للبحث.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className={ADMIN_TABLE} aria-label="قائمة السلاسل المتكررة">
              <thead>
                <tr>
                  <th scope="col" className={ADMIN_TH}>
                    السلسلة
                  </th>
                  <th scope="col" className={ADMIN_TH}>
                    الحالة
                  </th>
                  <th scope="col" className={ADMIN_TH}>
                    قاعدة التكرار
                  </th>
                  <th scope="col" className={ADMIN_TH}>
                    الموعد القادم
                  </th>
                  <th scope="col" className={ADMIN_TH}>
                    المكان
                  </th>
                  <th scope="col" className={ADMIN_TH}>
                    استثناءات
                  </th>
                  <th scope="col" className={ADMIN_TH}>
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleSeries.map((row) => (
                  <tr key={row.series.id} data-admin-series={row.series.id}>
                    <td className={ADMIN_TD}>
                      <p className="font-heading text-sm font-bold text-copticNavy">{titleOf(row.series, locale)}</p>
                      {row.terms.length > 0 ? (
                        <div className="mt-1 flex max-w-xs flex-wrap gap-1">
                          {row.terms.slice(0, 4).map((term) => (
                            <FlagBadge key={term.id} term={term} locale={locale} />
                          ))}
                        </div>
                      ) : null}
                    </td>
                    <td className={ADMIN_TD}>
                      <AdminStatusBadge status={row.series.status} />
                    </td>
                    <td className={ADMIN_TD}>
                      {row.ruleProblemAr ? (
                        <span className="text-[11px] font-bold text-red-700">{row.ruleProblemAr}</span>
                      ) : (
                        describeRecurrence(row.series.rule, row.series.startTime, locale)
                      )}
                    </td>
                    <td className={ADMIN_TD}>
                      {row.nextOccurrence
                        ? occurrenceLabel(row.nextOccurrence.startsAt, row.nextOccurrence.occurrenceDate, locale)
                        : "لا مواعيد قادمة في نافذة العرض"}
                    </td>
                    <td className={ADMIN_TD}>
                      {row.venue ? localized({ ar: row.venue.nameAr, en: row.venue.nameEn }, locale) : "—"}
                    </td>
                    <td className={ADMIN_TD}>{row.exceptionCount}</td>
                    <td className={ADMIN_TD}>
                      {seriesActions(row)}
                      {seriesPanel(row)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
