import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "gold" | "navy" | "success" | "warning" | "neutral" | "outline";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-copticNavy-50 text-copticNavy-700 border border-copticNavy-200",
    gold: "bg-copticGold-100 text-copticGold-800 border border-copticGold-300 font-semibold",
    navy: "bg-copticNavy-600 text-white border border-transparent shadow-xs",
    success: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    warning: "bg-amber-50 text-amber-900 border border-amber-200",
    neutral: "bg-slate-100 text-slate-700 border border-slate-200",
    outline: "bg-transparent text-copticGold-700 border border-copticGold-400 font-medium",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px] rounded-full",
    md: "px-2.5 py-1 text-xs rounded-full",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-heading transition-colors select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
