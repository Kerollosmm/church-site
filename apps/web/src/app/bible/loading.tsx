import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function BibleLoading() {
  return (
    <div
      className="min-h-screen bg-alabasterBg pb-16"
      role="status"
      aria-busy="true"
      aria-label="جاري تحميل قارئ الكتاب المقدس..."
    >
      {/* Page header skeleton matching PageHero */}
      <section className="relative bg-gradient-to-b from-copticNavy-900 via-copticNavy-800 to-copticNavy-900 text-white py-12 md:py-16 border-b-4 border-copticGold-500 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            {/* Breadcrumb shimmer */}
            <div className="flex items-center gap-2 mb-4">
              <Skeleton className="h-4 w-16 bg-white/10 rounded-md" />
              <Skeleton className="h-3 w-3 bg-white/10 rounded-full" />
              <Skeleton className="h-4 w-28 bg-white/20 rounded-md" />
            </div>

            {/* Title shimmer */}
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className="w-8 h-8 rounded-xl bg-copticGold-400/20 shrink-0" />
              <Skeleton className="h-8 sm:h-10 w-80 bg-white/20 rounded-xl" />
            </div>

            {/* Subtitle & description shimmer */}
            <Skeleton className="h-4 w-72 bg-copticGold-400/20 rounded-md mb-3" />
            <Skeleton className="h-4 w-96 max-w-full bg-white/10 rounded-md" />
          </div>
        </div>
      </section>

      {/* Main container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Books Directory Sidebar skeleton */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-5 border-2 border-copticGold-300 shadow-xs space-y-4">
            {/* Search and Filter */}
            <div className="space-y-3">
              <Skeleton className="h-9 w-full rounded-xl" />

              <div className="grid grid-cols-3 gap-1.5">
                <Skeleton className="h-7 rounded-xl" />
                <Skeleton className="h-7 rounded-xl" />
                <Skeleton className="h-7 rounded-xl" />
              </div>
            </div>

            {/* Books List Shimmer */}
            <div className="space-y-2 pr-1">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50"
                >
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24 rounded-md" />
                    {i % 3 === 0 && <Skeleton className="h-3.5 w-14 rounded-full" />}
                  </div>
                  <Skeleton className="h-3.5 w-12 rounded-md" />
                </div>
              ))}
            </div>
          </div>

          {/* Reader Window skeleton */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border-2 border-copticGold-300 shadow-xs flex flex-col justify-between space-y-6">
            <div>
              {/* Active Book & Chapter Header + Chapter selector pills skeleton */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-copticGold-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-28 rounded-full" />
                  </div>
                  <Skeleton className="h-8 w-56 rounded-lg" />
                </div>

                {/* Chapter selector skeleton */}
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={i} className="w-8 h-8 rounded-lg shrink-0" />
                  ))}
                </div>
              </div>

              {/* Verse card / Scripture text block skeleton */}
              <div className="bg-alabasterBg p-6 sm:p-8 rounded-2xl border border-copticGold-200 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="w-6 h-6 rounded-full shrink-0 mt-0.5" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full rounded-md" />
                      <Skeleton
                        className={
                          i % 2 === 0
                            ? "h-4 w-4/5 rounded-md"
                            : "h-4 w-3/5 rounded-md"
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation buttons shimmer */}
            <div className="flex items-center justify-between pt-4 border-t border-copticGold-200">
              <Skeleton className="h-9 w-28 rounded-xl" />
              <Skeleton className="h-9 w-28 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
