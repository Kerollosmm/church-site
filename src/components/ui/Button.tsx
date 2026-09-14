import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "secondary" | "ghost" | "gold";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-heading font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copticGold-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none";

    const variantStyles = {
      primary:
        "bg-copticNavy-500 text-white hover:bg-copticNavy-600 active:bg-copticNavy-700 shadow-sm border border-transparent",
      outline:
        "border-2 border-copticGold-500 text-copticGold-700 hover:bg-copticGold-50 hover:text-copticGold-800 active:bg-copticGold-100",
      secondary:
        "bg-copticGold-100 text-copticGold-800 hover:bg-copticGold-200 border border-copticGold-200",
      ghost:
        "text-slateText-primary hover:bg-copticGold-50 hover:text-copticNavy-600 active:bg-copticGold-100",
      gold:
        "bg-copticGold-500 text-white hover:bg-copticGold-600 active:bg-copticGold-700 shadow-sm border border-transparent",
    };

    const sizeStyles = {
      sm: "h-9 px-3 text-xs rounded-xl gap-1.5",
      md: "h-11 px-5 text-sm rounded-2xl gap-2",
      lg: "h-13 px-7 text-base rounded-2xl gap-2.5",
      icon: "h-11 w-11 rounded-2xl p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin me-2" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
