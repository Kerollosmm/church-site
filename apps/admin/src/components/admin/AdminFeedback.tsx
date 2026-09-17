// apps/admin/src/components/admin/AdminFeedback.tsx
// The result banner every admin screen shows after an action.

import React from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@church-site/ui";
import { ADMIN_BADGE } from "./admin-ui";

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
