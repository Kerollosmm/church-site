"use client";

// src/app/admin/(protected)/subscribers/SubscribersManager.tsx
// The interactive half of `/admin/subscribers`: the list, and the one control it offers.
//
// THE CONTROL IS "STOP" / "RESTART", NEVER "DELETE": stopping a subscription keeps the address and
// its audit trail, so the parish office can reverse its own decision — and the server action behind
// the button re-checks the capability, so hiding the button is convenience, not security.
//
// A CONTROL THAT CANNOT WORK IS NOT RENDERED: when the feature is switched off through configuration
// the buttons disappear and a line says why (the server refuses the call as well).

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BellOff, BellRing, Loader2 } from "lucide-react";
import { AdminFeedback, type AdminFeedbackTone } from "@/components/admin/AdminFeedback";
import { ADMIN_BADGE, ADMIN_BUTTON_QUIET, ADMIN_PANEL, ADMIN_TABLE, ADMIN_TD, ADMIN_TH } from "@/components/admin/admin-ui";
import { setSubscriberActiveAction } from "@/actions/event-actions";
import type { AdminCapabilities } from "@/lib/domain/capabilities";
import type { AdminSubscriberRow } from "@/lib/events/admin";
import { formatCairoDateTime } from "@/lib/utils/cairo-time";
import { cn } from "@/lib/utils";

export interface SubscribersManagerProps {
  rows: AdminSubscriberRow[];
  capabilities: AdminCapabilities;
  /** False when the public feature is switched off: the toggle is then refused by the server too. */
  featureEnabled: boolean;
}

interface Feedback {
  tone: AdminFeedbackTone;
  message: string;
}

export function SubscribersManager({ rows, capabilities, featureEnabled }: SubscribersManagerProps): React.ReactElement {
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const canToggle = capabilities.subscribersWrite && featureEnabled;

  const toggle = async (row: AdminSubscriberRow) => {
    const next = !row.subscriber.isActive;
    setPendingId(row.subscriber.id);
    setFeedback(null);

    try {
      const result = await setSubscriberActiveAction(row.subscriber.id, next);
      setFeedback({ tone: result.success ? "success" : "error", message: result.message });
      // The list is re-read from the server (this route is force-dynamic) rather than patched in
      // place, so the screen always shows what the store holds — including a row another device
      // changed in the meantime.
      if (result.success) router.refresh();
    } catch {
      setFeedback({ tone: "error", message: "تعذّر تنفيذ الإجراء الآن، يرجى إعادة المحاولة." });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {feedback ? <AdminFeedback tone={feedback.tone} message={feedback.message} /> : null}

      {!featureEnabled ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900">
          الميزة معطّلة عبر الإعداد، فأزرار الإيقاف والتنشيط مخفية ويُرفض أي نداء من الخادم.
        </p>
      ) : !capabilities.subscribersWrite ? (
        <p className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-700">
          دورك الحالي للعرض فقط: يمكنك مراجعة القائمة دون إيقاف أو تنشيط أي اشتراك.
        </p>
      ) : null}

      <section aria-labelledby="subscribers-list-heading" className={ADMIN_PANEL}>
        <h2 id="subscribers-list-heading" className="font-heading text-base font-bold text-copticNavy">
          المشتركون ({rows.length})
        </h2>

        <div className="mt-4 overflow-x-auto">
          <table className={ADMIN_TABLE} aria-label="قائمة المشتركين في تنبيهات الفعاليات">
            <thead>
              <tr>
                <th scope="col" className={ADMIN_TH}>
                  البريد الإلكتروني
                </th>
                <th scope="col" className={ADMIN_TH}>
                  الاسم
                </th>
                <th scope="col" className={ADMIN_TH}>
                  اللغة
                </th>
                <th scope="col" className={ADMIN_TH}>
                  التصنيفات المطلوبة
                </th>
                <th scope="col" className={ADMIN_TH}>
                  تاريخ التسجيل (القاهرة)
                </th>
                <th scope="col" className={ADMIN_TH}>
                  الحالة
                </th>
                {canToggle ? (
                  <th scope="col" className={ADMIN_TH}>
                    إجراء
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const { subscriber, topics, unknownTopics } = row;
                const pending = pendingId === subscriber.id;

                return (
                  <tr key={subscriber.id} data-subscriber-active={subscriber.isActive ? "true" : "false"}>
                    <td className={ADMIN_TD}>
                      <span className="font-english text-xs text-copticNavy" dir="ltr">
                        {subscriber.email}
                      </span>
                    </td>
                    <td className={ADMIN_TD}>
                      <span className="text-xs text-slate-700">{subscriber.name ?? "—"}</span>
                    </td>
                    <td className={ADMIN_TD}>
                      <span className="font-english text-[11px] text-slate-600" dir="ltr">
                        {subscriber.locale}
                      </span>
                    </td>
                    <td className={ADMIN_TD}>
                      {topics.length === 0 && unknownTopics.length === 0 ? (
                        <span className="text-[11px] text-slate-500">كل الفعاليات</span>
                      ) : (
                        <ul className="flex flex-wrap gap-1">
                          {topics.map((term) => (
                            <li
                              key={term.id}
                              className={cn(
                                ADMIN_BADGE,
                                "border border-copticGold-300 bg-copticGold-50 text-copticGold-900",
                                !term.isActive && "opacity-70"
                              )}
                              title={!term.isActive ? "مصطلح متوقف (لم يعد معروضاً للزوار)" : undefined}
                            >
                              {term.nameAr}
                              {!term.isActive ? <span aria-hidden="true">*</span> : null}
                            </li>
                          ))}
                          {/* A stored slug with no term left is REPORTED, never silently dropped. */}
                          {unknownTopics.length > 0 ? (
                            <li className={cn(ADMIN_BADGE, "border border-amber-300 bg-amber-50 text-amber-900")}>
                              {`${unknownTopics.length} تصنيفاً غير معروف`}
                            </li>
                          ) : null}
                        </ul>
                      )}
                    </td>
                    <td className={ADMIN_TD}>
                      <span className="text-[11px] text-slate-600">
                        {formatCairoDateTime(subscriber.createdAt) ?? subscriber.createdAt}
                      </span>
                      {subscriber.confirmedAt ? (
                        <span className="mt-0.5 block text-[10px] text-slate-400">
                          {`مؤكَّد: ${formatCairoDateTime(subscriber.confirmedAt) ?? subscriber.confirmedAt}`}
                        </span>
                      ) : (
                        <span className="mt-0.5 block text-[10px] text-amber-800">لم يُؤكَّد بعد</span>
                      )}
                    </td>
                    <td className={ADMIN_TD}>
                      <span
                        className={cn(
                          ADMIN_BADGE,
                          subscriber.isActive
                            ? "border border-emerald-300 bg-emerald-50 text-emerald-900"
                            : "border border-slate-300 bg-slate-100 text-slate-700"
                        )}
                      >
                        {subscriber.isActive ? "نشط" : "موقوف"}
                      </span>
                    </td>
                    {canToggle ? (
                      <td className={ADMIN_TD}>
                        <button
                          type="button"
                          onClick={() => toggle(row)}
                          disabled={pending}
                          aria-busy={pending}
                          className={ADMIN_BUTTON_QUIET}
                        >
                          {pending ? (
                            <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                          ) : subscriber.isActive ? (
                            <BellOff aria-hidden="true" className="h-3.5 w-3.5" />
                          ) : (
                            <BellRing aria-hidden="true" className="h-3.5 w-3.5" />
                          )}
                          <span>{subscriber.isActive ? "إيقاف الاشتراك" : "إعادة التنشيط"}</span>
                        </button>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
          ملاحظة: إيقاف الاشتراك لا يحذف البريد ولا سجلّه، ويمكن إعادة تنشيطه في أي وقت. ويُسجَّل كل إيقاف
          وتنشيط في سجل التدقيق باسم من قام به.
        </p>
      </section>
    </div>
  );
}
