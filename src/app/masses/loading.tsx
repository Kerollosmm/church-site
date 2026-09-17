import React from "react";
import { Skeleton, MassCardSkeleton } from "@/components/ui/Skeleton";

export default function MassesLoading() {
  return (
    <div
      className="min-h-screen bg-alabasterBg pb-16"
      role="status"
      aria-busy="true"
      aria-label="جاري تحميل جدول القداسات..."
    >
      {/* Page header skeleton matching PageHero */}
      <section className="relative bg-gradient-to-b from-copticNavy-900 via-copticNavy-800 to-copticNavy-900 text-white py-12 md:py-16 border-b-4 border-copticGold-500 overflow-hidden">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            {/* Breadcrumb shimmer */}
            <div className="flex items-center gap-2 mb-4">
              <Skeleton className="h-4 w-16 bg-white/10 rounded-md" />
              <Skeleton className="h-3 w-3 bg-white/10 rounded-full" />
              <Skeleton className="h-4 w-24 bg-white/20 rounded-md" />
            </div>

            {/* Page title shimmer */}
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className="w-8 h-8 rounded-xl bg-copticGold-400/20 shrink-0" />
              <Skeleton className="h-8 sm:h-10 w-72 bg-white/20 rounded-xl" />
            </div>

            {/* Subtitle & description shimmer */}
            <Skeleton className="h-4 w-60 bg-copticGold-400/20 rounded-md mb-3" />
            <Skeleton className="h-4 w-96 max-w-full bg-white/10 rounded-md" />
          </div>
        </div>
      </section>

      {/* Main container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Controls Toolbar: Day selector tabs skeleton (7 pills) & search input */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-copticGold-300 shadow-xs flex flex-col xl:flex-row items-center justify-between gap-4">
          {/* Day selector tabs skeleton: 7 pills for days of week */}
          <div className="flex flex-wrap items-center gap-1.5 w-full xl:w-auto">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-14 sm:w-16 rounded-xl" />
            ))}
          </div>

          {/* Search input & filter skeleton */}
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
            <Skeleton className="h-9 w-44 rounded-2xl" />
            <Skeleton className="h-9 w-36 rounded-xl" />
            <Skeleton className="h-9 w-20 rounded-xl" />
          </div>
        </div>

        {/* 3 MassCardSkeletons in responsive 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <MassCardSkeleton />
          <MassCardSkeleton />
          <MassCardSkeleton />
        </div>

        {/* Liturgical Feast Note placeholder */}
        <div className="bg-copticGold-100 border-2 border-copticGold-400 rounded-3xl p-6 shadow-xs flex items-start gap-4">
          <Skeleton className="w-6 h-6 rounded-lg bg-copticGold-400/40 shrink-0 mt-0.5" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-52 rounded-md bg-copticGold-400/40" />
            <Skeleton className="h-4 w-full rounded-md bg-copticGold-300/40" />
            <Skeleton className="h-4 w-4/5 rounded-md bg-copticGold-300/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
