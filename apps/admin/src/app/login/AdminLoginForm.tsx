"use client";

import React, { useState } from "react";
import { LogIn, Loader2, AlertCircle, CheckCircle2, Mail, KeyRound } from "lucide-react";
import { signIn } from "@/actions/auth-actions";
import { StaffSignInSchema } from "@/lib/validations/auth-schema";

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = StaffSignInSchema.safeParse({ email: email.trim(), password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "يرجى مراجعة بيانات الدخول");
      return;
    }

    setSubmitting(true);
    try {
      const res = await signIn(parsed.data);
      if (!res.success) {
        setError(res.message ?? "تعذر تسجيل الدخول، يرجى المحاولة مرة أخرى");
        return;
      }
      const target = res.targetUrl || "/masses";
      window.location.assign(target);
    } catch {
      setError("تعذر الاتصال بخدمة الدخول حالياً، يرجى المحاولة لاحقاً");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="p-4 rounded-2xl flex items-start gap-3 text-xs sm:text-sm bg-red-50 text-red-950 border border-red-300">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-copticNavy mb-1" htmlFor="staff-email">
          البريد الإلكتروني الرسمي <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-copticGold-700 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="staff-email"
            type="email"
            dir="ltr"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@st-maximus.org"
            className="w-full bg-copticGold-50/50 border border-copticGold-300 rounded-xl pr-10 pl-3 py-2 text-xs text-copticNavy text-right focus:outline-hidden focus:ring-2 focus:ring-copticNavy"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-copticNavy mb-1" htmlFor="staff-password">
          كلمة المرور <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <KeyRound className="w-4 h-4 text-copticGold-700 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="staff-password"
            type="password"
            dir="ltr"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-copticGold-50/50 border border-copticGold-300 rounded-xl pr-10 pl-3 py-2 text-xs text-copticNavy text-right focus:outline-hidden focus:ring-2 focus:ring-copticNavy"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 bg-copticNavy hover:bg-copticNavy-700 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl transition shadow-xs disabled:opacity-50"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>جاري التحقق من الصلاحيات...</span>
          </>
        ) : (
          <>
            <LogIn className="w-4 h-4" />
            <span>تسجيل الدخول إلى لوحة الإدارة</span>
          </>
        )}
      </button>

      <p className="text-[11px] text-slateText-muted leading-relaxed flex items-start gap-2">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
        <span>
          لا تُنشئ الحسابات من هذه الشاشة: يتم إنشاء أول حساب مسؤول عبر Supabase ثم ترقيته بدور
          إداري، ولا يوجد أي مسار آخر لمنح الصلاحيات.
        </span>
      </p>
    </form>
  );
}
