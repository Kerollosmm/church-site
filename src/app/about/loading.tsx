import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AboutLoading() {
  return (
    <div
      className="min-h-screen bg-alabasterBg pb-16"
      role="status"
      aria-busy="true"
      aria-label="جاري تحميل قسم عن الكنيسة..."
    >
      {/* Hero banner skeleton */}
      <section className="relative bg-gradient-to-b from-copticNavy-900 via-copticNavy-800 to-copticNavy-900 text-white py-12 md:py-16 border-b-4 border-copticGold-500 overflow-hidden">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            {/* Breadcrumb shimmer */}
            <div className="flex items-center gap-2 mb-4">
              <Skeleton className="h-4 w-16 bg-white/10 rounded-md" />
              <Skeleton className="h-3 w-3 bg-white/10 rounded-full" />
              <Skeleton className="h-4 w-24 bg-white/20 rounded-md" />
            </div>

            {/* Badge shimmer */}
            <Skeleton className="h-6 w-28 rounded-full bg-copticGold-400/20 mb-3" />

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

      {/* Main content container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Tab navigation skeleton */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 border-b border-copticGold-200">
          <Skeleton className="h-9 w-28 rounded-xl shrink-0" />
          <Skeleton className="h-9 w-28 rounded-xl shrink-0" />
          <Skeleton className="h-9 w-28 rounded-xl shrink-0" />
          <Skeleton className="h-9 w-28 rounded-xl shrink-0" />
        </div>

        {/* Content body skeleton: Parish intro card */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-copticGold-300 shadow-xs space-y-4">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-copticGold-200">
            <Skeleton className="w-6 h-6 rounded-lg" />
            <Skeleton className="h-6 w-44 rounded-md" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-11/12 rounded-md" />
            <Skeleton className="h-4 w-4/5 rounded-md" />
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-copticGold-100 pt-6">
            <div className="rounded-2xl bg-alabasterBg p-4 border border-copticGold-200 space-y-2">
              <Skeleton className="h-3.5 w-24 rounded-md" />
              <Skeleton className="h-4 w-48 rounded-md" />
            </div>
            <div className="rounded-2xl bg-alabasterBg p-4 border border-copticGold-200 space-y-2">
              <Skeleton className="h-3.5 w-24 rounded-md" />
              <Skeleton className="h-4 w-48 rounded-md" />
            </div>
          </div>
        </section>

        {/* Figures / stats card skeleton */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-copticGold-300 shadow-xs">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-copticGold-200">
            <Skeleton className="w-6 h-6 rounded-lg" />
            <Skeleton className="h-6 w-36 rounded-md" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-copticGold-50/70 p-4 border border-copticGold-200 text-center space-y-2"
              >
                <Skeleton className="h-8 w-12 mx-auto rounded-md" />
                <Skeleton className="h-3 w-20 mx-auto rounded-md" />
              </div>
            ))}
          </div>
        </section>

        {/* Subpages 3-card grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-3xl border-2 border-copticGold-200 bg-white p-5 shadow-xs flex flex-col justify-between h-44"
            >
              <div>
                <Skeleton className="w-10 h-10 rounded-xl mb-3" />
                <Skeleton className="h-5 w-32 mb-2 rounded-md" />
                <Skeleton className="h-3.5 w-full rounded-md" />
              </div>
              <Skeleton className="h-3.5 w-24 rounded-md mt-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
