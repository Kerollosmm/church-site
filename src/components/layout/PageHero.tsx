import React from "react";
import Link from "next/link";
import { ChevronLeft, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeroProps {
  title: string;
  englishTitle?: string;
  description?: string;
  breadcrumbs: BreadcrumbItem[];
  icon?: React.ReactNode;
  badgeText?: string;
}

export function PageHero({
  title,
  englishTitle,
  description,
  breadcrumbs,
  icon,
  badgeText,
}: PageHeroProps) {
  return (
    <div className="relative bg-gradient-to-b from-copticNavy-800 to-copticNavy-950 text-white py-10 md:py-14 border-b-2 border-copticGold-500 overflow-hidden">
      {/* Subtle geometric pattern overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C5A880_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="مسار التصفح" className="flex items-center gap-1.5 text-xs text-copticGold-200 mb-4 flex-wrap">
          <Link href="/" className="inline-flex items-center gap-1 hover:text-white transition">
            <Home className="w-3.5 h-3.5 text-copticGold-400" />
            <span>الرئيسية</span>
          </Link>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <ChevronLeft className="w-3.5 h-3.5 text-copticGold-400/70" />
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-white transition">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-white font-medium" aria-current="page">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Title and details */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            {badgeText && (
              <span className="inline-block bg-copticGold-500/20 text-copticGold-300 border border-copticGold-400/40 text-xs px-3 py-0.5 rounded-full mb-3 font-medium">
                {badgeText}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-white tracking-tight">
              {title}
            </h1>
            {englishTitle && (
              <p className="text-xs sm:text-sm text-copticGold-300 font-english mt-1 font-medium">
                {englishTitle}
              </p>
            )}
            {description && (
              <p className="text-sm sm:text-base text-slate-200 max-w-2xl mt-3 leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {icon && (
            <div className="hidden md:flex shrink-0 w-16 h-16 rounded-2xl bg-copticNavy-700/80 border border-copticGold-400/50 items-center justify-center text-copticGold-300 shadow-md">
              {icon}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
