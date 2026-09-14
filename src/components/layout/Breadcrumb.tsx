import React from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import { CopticCrossIcon } from "@/components/ui/CopticDivider";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="مسار التنقل" className={cn("py-3 text-xs md:text-sm font-heading", className)}>
      <ol className="flex items-center flex-wrap gap-2 list-none p-0 m-0">
        <li>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-copticGold-800 hover:text-copticNavy-700 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>الرئيسية</span>
          </Link>
        </li>

        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="flex items-center gap-2">
              <CopticCrossIcon size={12} className="text-copticGold-400" />
              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className="font-bold text-copticNavy-700"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-copticGold-800 hover:text-copticNavy-700 transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
