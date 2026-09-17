// src/components/admin/AdminStatusBadge.tsx
// The status pill for an event, a series or a deviation — the Arabic label, never the enum value.
//
// The colour is derived from the status, and so is the TEXT: an Arabic-speaking secretary must never
// read "published" or "moved" in the middle of an Arabic sentence. `data-admin-status` carries the
// raw value for styling and for tests, exactly like the public surfaces do.

import React from "react";
import { Archive, Ban, CheckCircle2, Clock, FileEdit, MoveRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { EVENT_STATUS_LABELS_AR, type EventStatus } from "@/lib/domain/types";
import { ADMIN_BADGE } from "@/components/admin/admin-ui";

/**
 * The four lifecycle values, plus the occurrence states the series screen shows: `scheduled` (this
 * date happens as ruled) and `moved` (this is the slot a relocated occurrence left behind).
 */
export type AdminBadgeStatus = EventStatus | "moved" | "scheduled";

const STATUS_STYLES: Record<AdminBadgeStatus, string> = {
  draft: "border border-slate-300 bg-slate-100 text-slate-700",
  published: "border border-emerald-200 bg-emerald-50 text-emerald-800",
  cancelled: "border border-red-200 bg-red-50 text-red-800",
  archived: "border border-amber-200 bg-amber-50 text-amber-900",
  moved: "border border-copticNavy-200 bg-copticNavy-50 text-copticNavy-800",
  scheduled: "border border-emerald-200 bg-emerald-50 text-emerald-800",
};

const STATUS_LABELS_AR: Record<AdminBadgeStatus, string> = {
  ...EVENT_STATUS_LABELS_AR,
  moved: "نُقل الموعد",
  scheduled: "مجدول",
};

const STATUS_ICONS: Record<AdminBadgeStatus, typeof Clock> = {
  draft: FileEdit,
  published: CheckCircle2,
  cancelled: Ban,
  archived: Archive,
  moved: MoveRight,
  scheduled: Clock,
};

export interface AdminStatusBadgeProps {
  status: AdminBadgeStatus;
  className?: string;
}

export function AdminStatusBadge({ status, className }: AdminStatusBadgeProps): React.ReactElement {
  const Icon = STATUS_ICONS[status];

  return (
    <span
      data-admin-status={status}
      className={cn(ADMIN_BADGE, STATUS_STYLES[status], className)}
      title={STATUS_LABELS_AR[status]}
    >
      <Icon aria-hidden="true" className="h-3 w-3 shrink-0" />
      <span>{STATUS_LABELS_AR[status]}</span>
    </span>
  );
}

/** A small neutral chip for anything else an admin row needs to state ("مستقلة", "تجاوز موعد", …). */
export function AdminChip({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "gold" | "navy";
  className?: string;
}): React.ReactElement {
  const toneClass =
    tone === "gold"
      ? "border border-copticGold-300 bg-copticGold-50 text-copticGold-900"
      : tone === "navy"
        ? "border border-copticNavy-200 bg-copticNavy-50 text-copticNavy-800"
        : "border border-slate-200 bg-slate-50 text-slate-600";

  return <span className={cn(ADMIN_BADGE, toneClass, className)}>{children}</span>;
}
