// apps/admin/src/components/admin/RepublishControl.tsx
// "آخر تحديث" + the manual cache clear, in one control.

"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { republishEventsAction } from "@/actions/event-actions";
import { AdminFeedback } from "./AdminFeedback";
import { ADMIN_BUTTON_SECONDARY } from "./admin-ui";
import { formatCairoDateTime } from "@church-site/data-access/client";

export interface RepublishControlProps {
  /** False for a read-only role: the button is not rendered at all. */
  canRepublish: boolean;
  /** Last mutation instant known to the store, or null before the first write. */
  lastUpdatedAt: string | null;
  /** "json" | "supabase" — shown plainly, because it explains WHERE the content lives. */
  driver: string;
}

export function RepublishControl({ canRepublish, lastUpdatedAt, driver }: RepublishControlProps): React.ReactElement {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string; at: string | null } | null>(null);

  const lastUpdatedLabel = formatCairoDateTime(lastUpdatedAt) ?? "لا يوجد أي تعديل مسجَّل بعد";

  const run = () => {
    startTransition(async () => {
      const answer = await republishEventsAction();
      if (answer.success) {
        setResult({
          success: true,
          message: answer.message,
          at: answer.data.lastUpdatedAt,
        });
        router.refresh();
      } else {
        setResult({ success: false, message: answer.message, at: null });
      }
    });
  };

  return (
    <div className="space-y-3" data-admin-republish>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          <span>
            آخر تعديل على المحتوى: <strong className="font-bold text-copticNavy">{lastUpdatedLabel}</strong>
          </span>
        </span>
        <span className="text-slate-400" aria-hidden="true">
          •
        </span>
        <span>
          مخزن البيانات: <span className="font-english font-bold">{driver}</span>
        </span>
      </div>

      {canRepublish ? (
        <button type="button" onClick={run} disabled={isPending} className={ADMIN_BUTTON_SECONDARY} aria-busy={isPending}>
          {isPending ? (
            <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
          )}
          <span>{isPending ? "جارٍ مسح الذاكرة المؤقتة…" : "مسح الذاكرة المؤقتة وإعادة النشر"}</span>
        </button>
      ) : (
        <p className="text-[11px] text-slate-500">
          دورك الحالي للعرض فقط، ولا يملك صلاحية مسح الذاكرة المؤقتة.
        </p>
      )}

      {result ? (
        <AdminFeedback
          tone={result.success ? "success" : "error"}
          title={result.success ? "تمت إعادة النشر" : "تعذّر مسح الذاكرة المؤقتة"}
          message={
            result.at
              ? `${result.message} — آخر تعديل مسجَّل: ${formatCairoDateTime(result.at) ?? result.at}`
              : result.message
          }
        />
      ) : null}
    </div>
  );
}
