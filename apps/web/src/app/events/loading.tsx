import React from "react";
import { Skeleton, EventCardSkeleton } from "@/components/ui/Skeleton";

export default function EventsLoading() {
  return (
    <div
      className="min-h-screen bg-alabasterBg pb-16"
      role="status"
      aria-busy="true"
      aria-label="جاري تحميل الفعاليات والمناسبات..."
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
              <Skeleton className="h-8 sm:h-10 w-72 bg-white/20 rounded-xl" />
            </div>

            {/* Subtitle & description shimmer */}
            <Skeleton className="h-4 w-60 bg-copticGold-400/20 rounded-md mb-3" />
            <Skeleton className="h-4 w-96 max-w-full bg-white/10 rounded-md" />
          </div>
        </div>
      </section>

      {/* Main container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Toolbar shimmer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-copticGold-200 shadow-xs">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
          <Skeleton className="h-9 w-40 rounded-xl" />
        </div>

        {/* Category filter tabs skeleton */}
        <div className="space-y-3 bg-white rounded-3xl p-5 border border-copticGold-200 shadow-xs">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-4 w-16 rounded-md" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 sm:w-24 rounded-full" />
            ))}
          </div>
        </div>

        {/* 4 EventCardSkeletons in responsive grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
        </div>
      </div>
    </div>
  );
}
