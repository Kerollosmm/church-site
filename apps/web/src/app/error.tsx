"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[web:error-boundary]", error);
  }, [error]);

  return (
    <div
      data-web-state="error"
      className="min-h-[60vh] flex items-center justify-center px-4 py-16 bg-alabasterBg text-copticNavy"
    >
      <div className="max-w-md w-full bg-white rounded-3xl border-2 border-copticGold-300 p-8 shadow-xs text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-heading font-extrabold text-copticNavy">
            حدث خطأ غير متوقع أثناء تحميل الصفحة
          </h1>
          <p className="text-xs text-slateText-secondary leading-relaxed">
            نعتذر عن هذا الخطأ الفني. يمكنك محاولة إعادة تحميل الصفحة أو العودة إلى الصفحة الرئيسية للكنيسة.
          </p>
          {error.digest && (
            <p className="text-[11px] font-english text-slateText-muted mt-2" dir="ltr">
              Reference code: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-copticNavy hover:bg-copticNavy-700 text-white font-bold text-xs transition shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>إعادة المحاولة</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-copticGold-100 hover:bg-copticGold-200 text-copticNavy-900 border border-copticGold-300 font-bold text-xs transition"
          >
            <Home className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
