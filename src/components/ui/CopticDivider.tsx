import React from "react";
import { cn } from "@/lib/utils";

export interface CopticDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  crossSize?: number;
  label?: string;
  variant?: "gold" | "navy" | "subtle";
}

export function CopticCrossIcon({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      {/* Traditional Coptic Cross Geometry with T-points and 4 small crosses/dots */}
      {/* Vertical beam */}
      <rect x="44" y="8" width="12" height="84" rx="2" />
      {/* Horizontal beam */}
      <rect x="8" y="32" width="84" height="12" rx="2" />
      {/* Top T-bar */}
      <rect x="36" y="8" width="28" height="6" rx="1.5" />
      {/* Bottom T-bar */}
      <rect x="36" y="86" width="28" height="6" rx="1.5" />
      {/* Left T-bar */}
      <rect x="8" y="24" width="6" height="28" rx="1.5" />
      {/* Right T-bar */}
      <rect x="86" y="24" width="6" height="28" rx="1.5" />
      {/* Center rosette circle */}
      <circle cx="50" cy="38" r="8" fill="none" stroke="currentColor" strokeWidth="4" />
      <circle cx="50" cy="38" r="3" />
      {/* Corner radiate beams (4 quadrants) */}
      <circle cx="28" cy="18" r="3.5" />
      <circle cx="72" cy="18" r="3.5" />
      <circle cx="28" cy="58" r="3.5" />
      <circle cx="72" cy="58" r="3.5" />
    </svg>
  );
}

export function CopticDivider({
  className,
  crossSize = 28,
  label,
  variant = "gold",
  ...props
}: CopticDividerProps) {
  const lineColors = {
    gold: "from-transparent via-copticGold-400 to-transparent",
    navy: "from-transparent via-copticNavy-300 to-transparent",
    subtle: "from-transparent via-copticGold-200 to-transparent",
  };

  const iconColors = {
    gold: "text-copticGold-600",
    navy: "text-copticNavy-500",
    subtle: "text-copticGold-500",
  };

  return (
    <div
      className={cn("flex items-center justify-center my-8 w-full gap-4", className)}
      role="separator"
      {...props}
    >
      <div className={cn("h-px flex-1 bg-gradient-to-r", lineColors[variant])} />
      <div className="flex items-center gap-2 px-2">
        <CopticCrossIcon size={crossSize} className={iconColors[variant]} />
        {label && (
          <span className="font-heading text-sm font-medium text-copticGold-700 select-none">
            {label}
          </span>
        )}
      </div>
      <div className={cn("h-px flex-1 bg-gradient-to-r", lineColors[variant])} />
    </div>
  );
}
