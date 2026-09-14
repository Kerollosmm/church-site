"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, Calendar, ArrowLeft } from "lucide-react";

export function NextMassCountdown() {
  const [countdown, setCountdown] = useState({ hours: 14, minutes: 30, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-copticGold-50 border border-copticGold-300 rounded-2xl p-4 sm:p-6 shadow-xs">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center md:text-right">
          <div className="w-12 h-12 rounded-xl bg-copticNavy-500 text-copticGold-300 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <span className="text-xs font-bold text-copticGold-800 bg-copticGold-200/80 px-2 py-0.5 rounded-full">
                القداس القادم
              </span>
              <span className="text-xs text-slateText-secondary">غداً، المذبح الأوسط</span>
            </div>
            <h3 className="font-heading font-bold text-copticNavy text-base sm:text-lg">
              القداس الإلهي الصباحي (6:30 ص - 8:30 ص)
            </h3>
          </div>
        </div>

        {/* Countdown units */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="bg-white border border-copticGold-300 rounded-lg px-2.5 py-1 text-center min-w-[45px]">
              <span className="font-english font-bold text-base text-copticNavy">
                {String(countdown.hours).padStart(2, "0")}
              </span>
              <span className="block text-[9px] text-slateText-muted">ساعة</span>
            </div>
            <span className="font-bold text-copticGold-700">:</span>
            <div className="bg-white border border-copticGold-300 rounded-lg px-2.5 py-1 text-center min-w-[45px]">
              <span className="font-english font-bold text-base text-copticNavy">
                {String(countdown.minutes).padStart(2, "0")}
              </span>
              <span className="block text-[9px] text-slateText-muted">دقيقة</span>
            </div>
            <span className="font-bold text-copticGold-700">:</span>
            <div className="bg-white border border-copticGold-300 rounded-lg px-2.5 py-1 text-center min-w-[45px]">
              <span className="font-english font-bold text-base text-copticNavy">
                {String(countdown.seconds).padStart(2, "0")}
              </span>
              <span className="block text-[9px] text-slateText-muted">ثانية</span>
            </div>
          </div>

          <Link
            href="/masses"
            className="inline-flex items-center gap-1 bg-copticNavy text-white hover:bg-copticNavy-700 text-xs font-bold px-3 py-2 rounded-xl transition"
          >
            <span>جدول الأسبوع</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
