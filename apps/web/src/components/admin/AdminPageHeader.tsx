// src/components/admin/AdminPageHeader.tsx
// The header every admin screen starts with: what this screen is, WHO is looking at it, and the one
// place a read-only role is told plainly that it may look but not touch.
//
// The role notice is not decoration: `resolveAdminCapabilities()` may legitimately produce a
// read-only set, and a screen that silently hides every button looks broken. Saying "دورك الحالي
// للعرض فقط" turns "the tool is missing something" into "this is what my role allows".

import React from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { ADMIN_BADGE } from "@/components/admin/admin-ui";

export interface AdminPageHeaderProps {
  title: string;
  description: string;
  /** The staff member's role in the event system, already labelled in Arabic. */
  roleLabel: string;
  /** True when the role may change nothing on this screen. */
  readOnly?: boolean;
  /** Page-level actions (links/buttons), rendered beside the title. */
  children?: React.ReactNode;
}

export function AdminPageHeader({
  title,
  description,
  roleLabel,
  readOnly = false,
  children,
}: AdminPageHeaderProps): React.ReactElement {
  return (
    <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-start sm:justify-between sm:p-6">
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-bold text-copticNavy">{title}</h1>
        <p className="max-w-3xl text-xs leading-relaxed text-slate-600">{description}</p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className={`${ADMIN_BADGE} border border-copticGold-300 bg-copticGold-50 text-copticGold-900`}>
            <ShieldCheck aria-hidden="true" className="h-3 w-3" />
            <span>دورك: {roleLabel}</span>
          </span>
          {readOnly ? (
            <span className={`${ADMIN_BADGE} border border-amber-300 bg-amber-50 text-amber-900`}>
              <Lock aria-hidden="true" className="h-3 w-3" />
              <span>عرض فقط — أدوات التعديل مخفية، وأي محاولة تعديل يرفضها الخادم وتُسجَّل في سجل التدقيق</span>
            </span>
          ) : null}
        </div>
      </div>

      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </header>
  );
}
