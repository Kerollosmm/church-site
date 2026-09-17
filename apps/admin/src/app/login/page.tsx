import React, { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Church, ShieldCheck, Globe } from "lucide-react";
import { AdminLoginForm } from "./AdminLoginForm";
import { SignInNotice } from "./SignInNotice";

/**
 * Staff sign-in page for the `/admin` area.
 *
 * It lives OUTSIDE the protected route group (`src/app/admin/(protected)`) so it never inherits
 * the authorization guard, and it renders statically: no environment variable is read at build
 * time, so the no-env static build keeps working. The sign-in attempt itself fails closed with a
 * clear Arabic message when the deployment has no Supabase configuration.
 *
 * THE "SIGN IN AGAIN" STATE: the middleware and the sign-out action redirect here with `?reason=`
 * (an expired session, an account outside the portal roles, or a deliberate sign-out). That reason
 * is read by a SMALL CLIENT COMPONENT inside a `<Suspense>` boundary — `useSearchParams()` must not
 * be called during the static prerender, and this page has to stay static so it is reachable even
 * when the environment is missing.
 */
export const metadata: Metadata = {
  title: "تسجيل دخول سكرتارية الكنيسة",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-copticNavy-500 border border-copticGold-400 flex items-center justify-center text-copticGold-300 shadow-inner">
            <Church className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-xl text-copticNavy">
              بوابة سكرتارية الكنيسة
            </h1>
            <p className="text-xs text-slateText-secondary mt-1">
              الدخول مقصور على الطاقم الإداري المعتمد لكنيسة القديسين مكسيموس ودوماديوس والشهيد
              الأنبا موسى الأسود بالعصافرة.
            </p>
          </div>
        </div>

        {/* The reason a visitor was sent here (if any) — see SignInNotice.tsx. */}
        <Suspense fallback={null}>
          <SignInNotice />
        </Suspense>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-copticGold-300 shadow-xs">
          <AdminLoginForm />
        </div>

        <div className="bg-white/70 rounded-2xl p-4 border border-copticGold-200 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-copticNavy shrink-0 mt-0.5" />
          <p className="text-[11px] text-slateText-secondary leading-relaxed">
            الدخول محمي بجلسة آمنة، ويتم التحقق من دور الحساب في سجل
            <span className="font-english"> profiles </span>
            (مسؤول أو سكرتارية). أي محاولة دخول بحساب لا يملك الصلاحية يتم رفضها وإغلاق جلستها فوراً.
          </p>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-copticNavy hover:text-copticGold-800 transition"
          >
            <Globe className="w-4 h-4" />
            <span>العودة إلى الموقع العام</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
