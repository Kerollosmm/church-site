"use client";

// src/app/admin/login/SignInNotice.tsx
// Why the visitor is looking at the sign-in page — the "sign in again" state.
//
// The middleware and the sign-out action both land here; without a reason, a staff member whose
// session simply expired sees the same page as someone who typed the URL by mistake, and nobody can
// tell whether the attempt failed or the session ended. The reason travels as `?reason=` and is
// rendered here:
//
//   session     — no verifiable session (expired cookie, missing environment, auth error)
//   role        — a valid session whose account may not enter the management area
//   signed-out  — a deliberate sign-out (confirmed, not alarmed)
//
// IT IS A CLIENT COMPONENT ON PURPOSE, and it is wrapped in `<Suspense>` by the page: reading
// `useSearchParams()` on the client keeps `/admin/login` STATIC — the sign-in page must render even
// when the whole environment is missing, which is exactly the state in which the area has to be
// reachable.

import React from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";

type Notice = { tone: "error" | "warning" | "success"; title: string; body: string };

const NOTICES: Record<string, Notice> = {
  session: {
    tone: "warning",
    title: "انتهت جلسة الدخول",
    body: "لم نتمكن من التحقق من جلستك (انتهت المدة أو لم تُسجَّل الدخول بعد). سجّل الدخول من جديد للمتابعة — لن يُفقد أي تعديل كنت قد حفظته.",
  },
  role: {
    tone: "error",
    title: "هذا الحساب لا يملك صلاحية الدخول",
    body: "الحساب صالح لكنه خارج أدوار لوحة الإدارة (مسؤول أو سكرتارية). راجع مسؤول الطاقم بالكنيسة لتعديل الدور، ولا تُعد بيانات الحساب من هنا.",
  },
  "signed-out": {
    tone: "success",
    title: "تم تسجيل الخروج بنجاح",
    body: "أُغلقت جلستك على هذا المتصفح. يمكنك تسجيل الدخول من جديد في أي وقت.",
  },
};

const STYLES: Record<Notice["tone"], string> = {
  error: "border-red-200 bg-red-50 text-red-900",
  warning: "border-amber-300 bg-amber-50 text-amber-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
};

export function SignInNotice(): React.ReactElement | null {
  const params = useSearchParams();
  const reason = params.get("reason") ?? "";
  const notice = NOTICES[reason];
  if (!notice) return null;

  const Icon = notice.tone === "success" ? CheckCircle2 : notice.tone === "error" ? ShieldAlert : AlertCircle;

  return (
    <div
      role={notice.tone === "success" ? "status" : "alert"}
      data-signin-notice={reason}
      className={`flex items-start gap-3 rounded-2xl border p-4 text-xs leading-relaxed ${STYLES[notice.tone]}`}
    >
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-1">
        <p className="font-heading text-sm font-bold">{notice.title}</p>
        <p>{notice.body}</p>
      </div>
    </div>
  );
}
