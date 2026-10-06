"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[web:global-error]", error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased min-h-screen flex items-center justify-center bg-slate-50 text-slate-800 p-4">
        <div
          data-web-state="error"
          className="max-w-md w-full bg-white rounded-3xl border-2 border-amber-300 p-8 shadow-md text-center space-y-6"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900">
              حدث خطأ غير متوقع أثناء تحميل الصفحة
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              نعتذر عن هذا الخطأ الفني. يمكنك محاولة إعادة تحميل الصفحة أو العودة إلى الصفحة الرئيسية للكنيسة.
            </p>
            {error.digest && (
              <p className="text-[11px] text-slate-400 mt-2" dir="ltr">
                Reference code: {error.digest}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>إعادة المحاولة</span>
            </button>

            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-slate-900 border border-amber-300 font-bold text-xs transition"
            >
              <Home className="w-4 h-4" />
              <span>العودة للرئيسية</span>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
