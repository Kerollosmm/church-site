import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function RootLoading() {
  return (
    <div className="min-h-screen" role="status" aria-busy="true" aria-label="جاري تحميل الصفحة الرئيسية...">
      {/* 1. HeroBanner skeleton with matching dark gradient & border */}
      <section className="relative bg-gradient-to-b from-copticNavy-900 via-copticNavy-800 to-copticNavy-900 text-white py-16 md:py-24 border-b-4 border-copticGold-500 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Diocesan badge shimmer */}
            <div className="inline-flex items-center gap-2 bg-copticGold-500/10 border border-copticGold-400/20 px-4 py-1.5 rounded-full mb-6">
              <Skeleton className="w-4 h-4 rounded-full bg-copticGold-400/30" />
              <Skeleton className="w-64 h-4 rounded-md bg-copticGold-400/30" />
            </div>

            {/* Parish title shimmer */}
            <Skeleton className="h-10 sm:h-12 w-4/5 max-w-lg mx-auto mb-3 bg-white/20 rounded-xl" />
            <Skeleton className="h-8 sm:h-10 w-3/5 max-w-md mx-auto mb-5 bg-copticGold-400/30 rounded-xl" />

            {/* Intro paragraph shimmer */}
            <div className="space-y-2 max-w-2xl mx-auto mb-8">
              <Skeleton className="h-4 w-full bg-white/10 rounded-md" />
              <Skeleton className="h-4 w-5/6 mx-auto bg-white/10 rounded-md" />
            </div>

            {/* 4-column quick CTA grid shimmer */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 max-w-2xl mx-auto mb-10">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-white/5 border border-copticGold-400/20 h-[88px]"
                >
                  <Skeleton className="w-6 h-6 rounded-md bg-copticGold-400/30 mb-2" />
                  <Skeleton className="w-20 h-3.5 rounded-md bg-white/20 mb-1" />
                  <Skeleton className="w-14 h-2.5 rounded-md bg-copticGold-200/20" />
                </div>
              ))}
            </div>

            {/* Navigation links shimmer */}
            <div className="flex items-center justify-center gap-4">
              <Skeleton className="w-32 h-4 rounded-md bg-white/10" />
              <Skeleton className="w-28 h-4 rounded-md bg-white/10" />
            </div>
          </div>
        </div>
      </section>

      {/* Main content container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* 2. Countdown card skeleton */}
        <div className="bg-copticGold-50 border border-copticGold-300 rounded-2xl p-4 sm:p-6 shadow-xs">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Skeleton className="w-12 h-12 rounded-xl bg-copticNavy/15 shrink-0" />
              <div className="space-y-2 flex-1 md:flex-none">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-20 rounded-full" />
                  <Skeleton className="h-4 w-32 rounded-md" />
                </div>
                <Skeleton className="h-6 w-48 sm:w-64 rounded-md" />
              </div>
            </div>

            {/* Countdown units & schedule button shimmer */}
            <div className="flex items-center gap-3 self-end md:self-auto">
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white border border-copticGold-300 rounded-lg px-2.5 py-1 text-center min-w-[45px] h-[46px] flex flex-col justify-center items-center"
                  >
                    <Skeleton className="w-6 h-4 rounded-xs mb-1" />
                    <Skeleton className="w-4 h-2 rounded-xs" />
                  </div>
                ))}
              </div>
              <Skeleton className="w-28 h-9 rounded-xl bg-copticNavy/20" />
            </div>
          </div>
        </div>

        {/* 3. 4-column quick service skeleton */}
        <div className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
            <div>
              <Skeleton className="h-5 w-24 rounded-full mb-2" />
              <Skeleton className="h-8 w-52 rounded-xl" />
            </div>
            <Skeleton className="h-4 w-64 rounded-md" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-copticGold-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between h-[152px]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <Skeleton className="w-16 h-4 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-36 mb-2 rounded-md" />
                  <Skeleton className="h-3 w-full mb-1 rounded-md" />
                  <Skeleton className="h-3 w-4/5 rounded-md" />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-copticGold-100">
                  <Skeleton className="h-3 w-16 rounded-md" />
                  <Skeleton className="w-3.5 h-3.5 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
