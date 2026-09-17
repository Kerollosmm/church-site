import React from "react";
import { Skeleton, TableSkeleton } from "@church-site/ui";

export default function AdminProtectedLoading() {
  return (
    <div
      className="space-y-8 max-w-6xl"
      role="status"
      aria-busy="true"
      aria-label="جاري تحميل لوحة التحكم الإدارية..."
    >
      {/* Admin header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <Skeleton className="h-5 w-28 rounded-full mb-2" />
          <Skeleton className="h-8 w-72 rounded-lg mb-2" />
          <Skeleton className="h-4 w-96 max-w-full rounded-md" />
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="w-2.5 h-2.5 rounded-full" />
          <Skeleton className="h-4 w-28 rounded-md" />
        </div>
      </div>

      {/* 4 metric/stat cards shimmer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between h-[152px]"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="w-12 h-4 rounded-md" />
              </div>
              <Skeleton className="h-4 w-28 mb-2 rounded-md" />
              <Skeleton className="h-6 w-20 rounded-md" />
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <Skeleton className="h-3 w-16 rounded-md" />
              <Skeleton className="w-3.5 h-3.5 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Action buttons skeleton */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded-md" />
          <Skeleton className="h-5 w-44 rounded-md" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
            >
              <Skeleton className="h-4 w-52 rounded-md" />
              <Skeleton className="w-4 h-4 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Table skeleton fallback for data lists */}
      <TableSkeleton rows={5} cols={5} />
    </div>
  );
}
