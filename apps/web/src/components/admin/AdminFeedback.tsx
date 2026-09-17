// src/components/admin/AdminFeedback.tsx
// The result banner every admin screen shows after an action — the ONE place a server action's
// answer is rendered.
//
// TWO RULES IT ENFORCES:
//   1. A failure is `role="alert"` (announced immediately); a success is `role="status"` (announced
//      politely). A screen reader user must not have to go looking for either.
//   2. Only the message the ACTION returned is shown. Technical detail (a PostgREST code, a stack, a
//      driver name) is logged server-side and never reaches this component — which is why it takes a
//      plain Arabic string and not an error object.
//
// A caller that knows which control produced the message can point at it with `anchorId`; the banner
// then also names the operation ("تعذّر حفظ الفعالية") instead of an unattributed failure.

import React from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_BADGE } from "@/components/admin/admin-ui";

export type AdminFeedbackTone = "success" | "error" | "info";

export interface AdminFeedbackProps {
  tone: AdminFeedbackTone;
  message: string;
  /** Optional heading naming the operation the message is about. */
  title?: string;
  className?: string;
}

const TONE_STYLES: Record<AdminFeedbackTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-900",
  info: "border-copticGold-300 bg-copticGold-50 text-copticNavy-900",
};

const TONE_ICON_STYLES: Record<AdminFeedbackTone, string> = {
  success: "text-emerald-600",
  error: "text-red-600",
  info: "text-copticGold-700",
};

export function AdminFeedback({ tone, message, title, className }: AdminFeedbackProps): React.ReactElement {
  const Icon = tone === "success" ? CheckCircle2 : tone === "error" ? AlertCircle : Info;

  return (
    <div
      // A failure interrupts; a success waits its turn.
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      data-admin-feedback={tone}
      className={cn("flex items-start gap-3 rounded-2xl border p-4 text-xs leading-relaxed", TONE_STYLES[tone], className)}
    >
      <Icon aria-hidden="true" className={cn("mt-0.5 h-4 w-4 shrink-0", TONE_ICON_STYLES[tone])} />
      <div className="space-y-1">
        {title ? <p className={cn(ADMIN_BADGE, "bg-white/70 text-current")}>{title}</p> : null}
        <p>{message}</p>
      </div>
    </div>
  );
}
