import React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="جاري التحميل..."
      className={cn(
        "animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-700/50",
        className
      )}
      {...props}
    />
  );
}

export interface MassCardSkeletonProps {
  className?: string;
}

export function MassCardSkeleton({ className }: MassCardSkeletonProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl p-5 border-2 border-copticGold-200 shadow-xs flex flex-col justify-between",
        className
      )}
    >
      <div>
        {/* Top Badges: Day pill, Altar badge, Period badge */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Skeleton className="h-6 w-14 rounded-full" />
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        {/* Liturgy Title */}
        <Skeleton className="h-5 w-3/4 mb-3 rounded-md" />

        {/* Details list (Time range, Celebrant priest, Audience) */}
        <div className="space-y-2.5 mt-3">
          {/* Time range */}
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-full shrink-0" />
            <Skeleton className="h-4 w-28 rounded-md" />
          </div>

          {/* Celebrant priest */}
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-full shrink-0" />
            <Skeleton className="h-4 w-32 rounded-md" />
          </div>

          {/* Target audience */}
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-full shrink-0" />
            <Skeleton className="h-4 w-24 rounded-full" />
          </div>
        </div>
      </div>

      {/* Coptic date indicator / Notes footer */}
      <div className="mt-4 pt-3 border-t border-copticGold-100 flex items-center justify-between">
        <Skeleton className="h-3.5 w-3/5 rounded-md" />
        <Skeleton className="h-3.5 w-20 rounded-md" />
      </div>
    </div>
  );
}

export interface EventCardSkeletonProps {
  className?: string;
  hasBanner?: boolean;
}

export function EventCardSkeleton({ className, hasBanner = true }: EventCardSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-copticGold-200 bg-white p-4 shadow-xs flex flex-col justify-between",
        className
      )}
    >
      <div>
        {/* Image banner skeleton */}
        {hasBanner && (
          <Skeleton className="w-full h-40 rounded-xl mb-3" />
        )}

        {/* Date badge / Status pill */}
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>

        {/* Event Title */}
        <Skeleton className="h-5 w-4/5 mb-2 rounded-md" />

        {/* Summary text */}
        <div className="space-y-1.5 mb-3">
          <Skeleton className="h-3.5 w-full rounded-md" />
          <Skeleton className="h-3.5 w-2/3 rounded-md" />
        </div>

        {/* Meta tags: Time and Location tag */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="flex items-center gap-1.5">
            <Skeleton className="w-3.5 h-3.5 rounded-full shrink-0" />
            <Skeleton className="h-3.5 w-24 rounded-md" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="w-3.5 h-3.5 rounded-full shrink-0" />
            <Skeleton className="h-3.5 w-28 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

export interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  className?: string;
}

export function TableSkeleton({ rows = 5, cols = 4, className }: TableSkeletonProps) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-copticGold-200 bg-white shadow-xs",
        className
      )}
    >
      {/* Header shimmer */}
      <div className="border-b border-copticGold-200 bg-copticNavy-700 p-4">
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-3/4 bg-white/20" />
          ))}
        </div>
      </div>

      {/* Body shimmer */}
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div
            key={rIdx}
            className="grid items-center gap-4 p-4"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: cols }).map((_, cIdx) => (
              <Skeleton
                key={cIdx}
                className={cn("h-4 rounded-md", cIdx === 0 ? "w-4/5" : "w-2/3")}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
