// src/components/admin/AdminForbiddenNotice.tsx
// The screen a role sees when it opens a page whose capability it does not have.
//
// IT IS A STATE, NOT AN ERROR: the session is valid and the person is real staff — they simply may
// not do this thing. So the panel says exactly that, names the capability in Arabic, keeps a way back
// into the area they CAN use, and states that the refusal is recorded (which it is: the actions
// append a `denied` entry — see `describeRefusal()`).

import React from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { ADMIN_BUTTON_SECONDARY, ADMIN_PANEL } from "@/components/admin/admin-ui";
import { CAPABILITY_DENIED_MESSAGE_AR, CAPABILITY_LABELS_AR, type Capability } from "@/lib/domain/capabilities";

export interface AdminForbiddenNoticeProps {
  /** The capability this screen requires, so the message can name the missing action. */
  capability: Capability;
  /** Arabic role label of the current session. */
  roleLabel: string;
}

export function AdminForbiddenNotice({ capability, roleLabel }: AdminForbiddenNoticeProps): React.ReactElement {
  return (
    <section aria-labelledby="admin-forbidden-heading" className={`${ADMIN_PANEL} max-w-3xl`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-amber-50 text-amber-800">
          <ShieldAlert aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="space-y-2">
          <h1 id="admin-forbidden-heading" className="font-heading text-lg font-bold text-copticNavy">
            هذا الإجراء خارج صلاحيات دورك الحالي
          </h1>
          <p className="text-xs leading-relaxed text-slate-700" role="alert">
            {CAPABILITY_DENIED_MESSAGE_AR}
          </p>
          <ul className="space-y-1 text-xs text-slate-600">
            <li>
              الإجراء المطلوب: <strong className="text-copticNavy">{CAPABILITY_LABELS_AR[capability]}</strong>
            </li>
            <li>
              دورك الحالي: <strong className="text-copticNavy">{roleLabel}</strong>
            </li>
          </ul>
          <p className="text-[11px] leading-relaxed text-slate-500">
            لا يتغيّر أي محتوى عند الرفض، ويُضاف سطر «رفض صلاحية» إلى سجل التدقيق باسمك ووقت المحاولة. لمزيد من
            الصلاحيات راجع مسؤول النظام.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link href="/admin/events" className={ADMIN_BUTTON_SECONDARY}>
              العودة إلى إدارة الفعاليات
            </Link>
            <Link href="/admin" className={ADMIN_BUTTON_SECONDARY}>
              لوحة التحكم
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
