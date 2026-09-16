// src/app/admin/(protected)/audit/page.tsx
// `/admin/audit` — the audit trail, newest first.
//
// WHAT IS IN HERE: one entry per mutation, written by the REPOSITORY (never by a screen), carrying the
// actor, the action, the entity, the row BEFORE and the row AFTER, plus a `denied` entry every time a
// capability refusal happened (`authorize()` in `src/actions/event-actions.ts` records it before it
// answers). Nothing in this project writes content without leaving a line here, and `audit_log` has no
// UPDATE/DELETE policy at all in the SQL layer.
//
// THE FILTERS ARE LINKS: entity type and action live in the query string, so a filtered view is
// shareable and the page needs no client JavaScript. `listAdminAudit()` does the narrowing in the
// store (the JSON driver filters in memory, the Supabase driver in SQL) — never in the markup.

import React from "react";
import Link from "next/link";
import { FileClock, FilterX, ShieldAlert } from "lucide-react";
import { AdminFeedback } from "@/components/admin/AdminFeedback";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ADMIN_BADGE, ADMIN_BUTTON_SECONDARY, ADMIN_PANEL, ADMIN_TABLE, ADMIN_TD, ADMIN_TH } from "@/components/admin/admin-ui";
import { requireStaff } from "@/lib/auth/require-staff";
import {
  ADMIN_ROLE_LABELS_AR,
  adminRoleFromStaffRole,
  isReadOnlyRole,
  resolveAdminCapabilities,
} from "@/lib/domain/capabilities";
import {
  AUDIT_ACTION_LABELS_AR,
  AUDIT_ENTITY_TYPE_LABELS_AR,
  type AuditAction,
  type AuditEntityType,
} from "@/lib/domain/types";
import { listAdminAudit } from "@/lib/events/admin";
import { summarizeAuditEntry } from "@/lib/events/audit-view";
import { formatCairoDateTime } from "@/lib/utils/cairo-time";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "سجل التدقيق — لوحة تحكم كنيسة القديسين",
};

const ENTITY_FILTERS: readonly AuditEntityType[] = [
  "event",
  "event_series",
  "event_exception",
  "event_terms",
  "taxonomy_term",
  "media",
];

const ACTION_FILTERS: readonly AuditAction[] = [
  "create",
  "update",
  "publish",
  "unpublish",
  "cancel",
  "reschedule",
  "duplicate",
  "delete",
  "denied",
];

const LIMIT_OPTIONS = [25, 50, 100, 200] as const;
const DEFAULT_LIMIT = 50;

function firstParam(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === "string" ? raw.trim() : "";
}

function parseEntity(value: string): AuditEntityType | undefined {
  return (ENTITY_FILTERS as readonly string[]).includes(value) ? (value as AuditEntityType) : undefined;
}

function parseAction(value: string): AuditAction | undefined {
  return (ACTION_FILTERS as readonly string[]).includes(value) ? (value as AuditAction) : undefined;
}

function parseLimit(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return (LIMIT_OPTIONS as readonly number[]).includes(parsed) ? parsed : DEFAULT_LIMIT;
}

/** Builds a filter link, keeping the other filters and dropping the one being cleared. */
function auditHref(current: { entity?: string; action?: string; limit: number }, patch: Partial<typeof current>): string {
  const next = { ...current, ...patch };
  const params = new URLSearchParams();
  if (next.entity) params.set("entity", next.entity);
  if (next.action) params.set("action", next.action);
  if (next.limit !== DEFAULT_LIMIT) params.set("limit", String(next.limit));
  const query = params.toString();
  return query.length > 0 ? `/admin/audit?${query}` : "/admin/audit";
}

const FILTER_CHIP = `${ADMIN_BADGE} transition hover:bg-copticGold-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copticNavy-500`;

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.ReactElement> {
  const params = await searchParams;
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);
  const capabilities = resolveAdminCapabilities(role);
  const roleLabel = role ? ADMIN_ROLE_LABELS_AR[role] : "غير معروف";

  const entity = parseEntity(firstParam(params.entity));
  const action = parseAction(firstParam(params.action));
  const limit = parseLimit(firstParam(params.limit));
  const current = { entity, action, limit };

  let entries: Awaited<ReturnType<typeof listAdminAudit>> = [];
  let readFailed = false;

  try {
    entries = await listAdminAudit({ entityType: entity, action, limit });
  } catch (error) {
    // Server-side detail only: the markup below never carries a driver name, code or stack.
    console.error("[admin] audit read failed", {
      reason: error instanceof Error ? error.message : String(error),
    });
    readFailed = true;
  }

  const isFiltered = Boolean(entity || action);

  return (
    <div className="max-w-7xl space-y-6">
      <AdminPageHeader
        title="سجل التدقيق"
        description="كل تعديل على الفعاليات والسلاسل والتصنيفات والوسائط يُسجَّل هنا: من قام به، ومتى، وما الذي تغيّر (الحالة قبل وبعد). كما تُسجَّل كل محاولة مرفوضة بحكم الصلاحيات بسطر «رفض صلاحية»."
        roleLabel={roleLabel}
        readOnly={isReadOnlyRole(capabilities)}
      >
        <Link href="/admin/events" className={ADMIN_BUTTON_SECONDARY}>
          إدارة الفعاليات
        </Link>
      </AdminPageHeader>

      <section aria-labelledby="audit-filters-heading" className={ADMIN_PANEL}>
        <h2 id="audit-filters-heading" className="font-heading text-base font-bold text-copticNavy">
          التصفية
        </h2>

        <div className="mt-3 space-y-3">
          <div>
            <p className="mb-1.5 font-heading text-[11px] font-bold text-slate-600">نوع السجل</p>
            <ul className="flex flex-wrap gap-1.5">
              <li>
                <Link
                  href={auditHref(current, { entity: undefined })}
                  aria-current={!entity ? "true" : undefined}
                  className={cn(FILTER_CHIP, !entity ? "bg-copticNavy text-white" : "border-slate-200 bg-slate-50 text-slate-700")}
                >
                  الكل
                </Link>
              </li>
              {ENTITY_FILTERS.map((value) => (
                <li key={value}>
                  <Link
                    href={auditHref(current, { entity: value })}
                    aria-current={entity === value ? "true" : undefined}
                    className={cn(
                      FILTER_CHIP,
                      entity === value
                        ? "bg-copticNavy text-white"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    )}
                  >
                    {AUDIT_ENTITY_TYPE_LABELS_AR[value]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-1.5 font-heading text-[11px] font-bold text-slate-600">نوع الإجراء</p>
            <ul className="flex flex-wrap gap-1.5">
              <li>
                <Link
                  href={auditHref(current, { action: undefined })}
                  aria-current={!action ? "true" : undefined}
                  className={cn(FILTER_CHIP, !action ? "bg-copticNavy text-white" : "border-slate-200 bg-slate-50 text-slate-700")}
                >
                  الكل
                </Link>
              </li>
              {ACTION_FILTERS.map((value) => (
                <li key={value}>
                  <Link
                    href={auditHref(current, { action: value })}
                    aria-current={action === value ? "true" : undefined}
                    className={cn(
                      FILTER_CHIP,
                      action === value ? "bg-copticNavy text-white" : "border-slate-200 bg-slate-50 text-slate-700"
                    )}
                  >
                    {AUDIT_ACTION_LABELS_AR[value]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <p className="font-heading text-[11px] font-bold text-slate-600">عدد السجلات</p>
            <ul className="flex flex-wrap gap-1.5">
              {LIMIT_OPTIONS.map((value) => (
                <li key={value}>
                  <Link
                    href={auditHref(current, { limit: value })}
                    aria-current={limit === value ? "true" : undefined}
                    className={cn(
                      FILTER_CHIP,
                      limit === value ? "bg-copticNavy text-white" : "border-slate-200 bg-slate-50 text-slate-700"
                    )}
                  >
                    <span className="font-english">{value}</span>
                  </Link>
                </li>
              ))}
            </ul>

            {isFiltered ? (
              <Link href="/admin/audit" className={`${ADMIN_BUTTON_SECONDARY} py-1.5`}>
                <FilterX aria-hidden="true" className="h-3.5 w-3.5" />
                <span>إزالة كل المرشّحات</span>
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {readFailed ? (
        <AdminFeedback
          tone="error"
          title="تعذّر قراءة السجل"
          message="تعذّر الوصول إلى سجل التدقيق الآن. لم يتغيّر أي شيء — أعد تحميل الصفحة، وإن تكرر الخطأ راجع مسؤول النظام."
        />
      ) : entries.length === 0 ? (
        <section className={ADMIN_PANEL}>
          <div className="rounded-2xl border border-dashed border-copticGold-300 bg-copticGold-50/40 p-8 text-center">
            <FileClock aria-hidden="true" className="mx-auto h-6 w-6 text-copticGold-700" />
            <p className="mt-2 font-heading text-sm font-bold text-copticNavy">
              {isFiltered ? "لا توجد سجلات مطابقة لهذه التصفية" : "لا توجد أي تعديلات مسجَّلة بعد"}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {isFiltered
                ? "جرّب إزالة المرشّحات لعرض السجل الكامل."
                : "سيظهر هنا أول تعديل تجريه على فعالية أو سلسلة أو وسائط."}
            </p>
          </div>
        </section>
      ) : (
        <section aria-labelledby="audit-entries-heading" className={ADMIN_PANEL}>
          <h2 id="audit-entries-heading" className="font-heading text-base font-bold text-copticNavy">
            السجلات ({entries.length})
          </h2>

          <div className="mt-4 overflow-x-auto">
            <table className={ADMIN_TABLE} aria-label="سجل التدقيق">
              <thead>
                <tr>
                  <th scope="col" className={ADMIN_TH}>
                    الوقت (القاهرة)
                  </th>
                  <th scope="col" className={ADMIN_TH}>
                    الفاعل
                  </th>
                  <th scope="col" className={ADMIN_TH}>
                    الإجراء
                  </th>
                  <th scope="col" className={ADMIN_TH}>
                    السجل
                  </th>
                  <th scope="col" className={ADMIN_TH}>
                    التفاصيل (قبل ← بعد)
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const summary = summarizeAuditEntry(entry);
                  const denied = summary.kind === "denied";

                  return (
                    <tr key={entry.id} data-audit-action={entry.action} data-audit-entity={entry.entityType}>
                      <td className={ADMIN_TD}>
                        <span className="text-[11px] text-slate-600">{formatCairoDateTime(entry.at) ?? entry.at}</span>
                      </td>
                      <td className={ADMIN_TD}>
                        <span className="font-heading text-xs font-bold text-copticNavy">{entry.actorName}</span>
                      </td>
                      <td className={ADMIN_TD}>
                        <span
                          className={cn(
                            ADMIN_BADGE,
                            denied
                              ? "border border-amber-300 bg-amber-50 text-amber-900"
                              : "border border-slate-200 bg-slate-50 text-slate-700"
                          )}
                        >
                          {denied ? <ShieldAlert aria-hidden="true" className="h-3 w-3" /> : null}
                          <span>{summary.actionLabelAr}</span>
                        </span>
                      </td>
                      <td className={ADMIN_TD}>
                        <span className="text-xs text-slate-700">{summary.entityLabelAr}</span>
                        <span className="mt-0.5 block font-english text-[10px] text-slate-400" dir="ltr">
                          {entry.entityId.slice(0, 8)}
                        </span>
                      </td>
                      <td className={ADMIN_TD}>
                        <p className="text-xs leading-relaxed text-slate-700">{entry.summary}</p>

                        {denied ? (
                          <p className="mt-1 text-[11px] leading-relaxed text-amber-900">
                            لم يتغيّر أي محتوى: الخادم رفض الإجراء قبل أي كتابة، وسجّل المحاولة هنا.
                          </p>
                        ) : summary.kind === "created" ? (
                          <p className="mt-1 text-[11px] text-slate-500">سجل جديد ({summary.changedCount} حقلاً).</p>
                        ) : summary.kind === "deleted" ? (
                          <p className="mt-1 text-[11px] text-slate-500">حُذف السجل (نسخة كاملة منه محفوظة هنا).</p>
                        ) : summary.kind === "unchanged" ? (
                          <p className="mt-1 text-[11px] text-slate-500">لا اختلاف في الحقول المسجَّلة.</p>
                        ) : (
                          <ul className="mt-1 space-y-0.5">
                            {summary.changes.map((change) => (
                              <li key={change.field} className="text-[11px] leading-relaxed text-slate-600">
                                <span className="font-bold text-slate-700">{change.labelAr}:</span>{" "}
                                <span className="text-slate-500">{change.before}</span>
                                {" ← "}
                                <span className="text-copticNavy">{change.after}</span>
                              </li>
                            ))}
                            {summary.changedCount > summary.changes.length ? (
                              <li className="text-[11px] text-slate-500">
                                و{summary.changedCount - summary.changes.length} حقلاً آخر تغيّر في نفس الإجراء.
                              </li>
                            ) : null}
                          </ul>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
