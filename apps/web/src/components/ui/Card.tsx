import React from "react";
import { cn } from "@/lib/utils";

// Only the container is still used: CardHeader/CardTitle/CardContent/CardDescription/CardFooter
// lost their last consumers when the legacy condolence and bible-reader components were removed.
// Re-add them here (they are in git history) rather than inlining one-off header markup at call sites.
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "gold-border" | "navy-subtle";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-surfaceCard border border-copticGold-200 shadow-sm",
      elevated: "bg-surfaceCard border border-copticGold-200/80 shadow-md hover:shadow-lg transition-shadow duration-200",
      "gold-border": "bg-surfaceCard border-2 border-copticGold-500 shadow-sm",
      "navy-subtle": "bg-copticNavy-50/50 border border-copticNavy-100 shadow-sm",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl overflow-hidden transition-all duration-200",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";
