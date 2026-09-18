"use client";

// apps/web/src/components/layout/HeaderClient.tsx
// Interactive client navigation header receiving data-driven public navigation hierarchy.
// Preserves exact styling, mobile drawer, dropdowns, accessibility, and locale resolution.

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Church,
  ChevronDown,
} from "lucide-react";
import { FontSizeSwitcher } from "@/components/ui/FontSizeSwitcher";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";
import { applyDocumentLocale, readLocaleCookie } from "@/lib/i18n/dom";
import { getCopticDateString } from "@/lib/utils/coptic-date";
import type { PublicNavItem } from "@church-site/domain";
import { SEED_PUBLIC_NAVIGATION } from "@church-site/data-access/client";

export interface PublicNavigationResult {
  main: PublicNavItem[];
  secondary: PublicNavItem[];
}

export interface HeaderClientProps {
  navigation?: PublicNavigationResult;
}

export function HeaderClient({ navigation }: HeaderClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const pathname = usePathname();
  const copticDate = getCopticDateString();

  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const resolved = readLocaleCookie();
    setLocale(resolved);
    applyDocumentLocale(resolved);
  }, []);

  // Safe fallback to seed navigation hierarchy if store returns empty
  const navData = navigation && navigation.main.length > 0
    ? navigation
    : SEED_PUBLIC_NAVIGATION;

  const mainNavItems = navData.main;
  const secondaryNavItems = navData.secondary;

  function getItemLabel(item: PublicNavItem): string {
    if (locale === "en" && item.labelEn) {
      return item.labelEn;
    }
    return item.labelAr;
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-copticGold-300 shadow-xs">
      {/* Top Bar for Coptic Date & Quick Info */}
      <div className="bg-copticNavy-700 text-white text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-copticGold-500 animate-pulse" />
            <span className="text-copticGold-200 font-medium">تاريخ اليوم القبطي:</span>
            <span className="font-semibold text-white">{copticDate}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 text-copticGold-200">
              <Church className="w-3.5 h-3.5 text-copticGold-400" />
              <span>إيبارشية شرق الإسكندرية — قطاع المنتزه</span>
            </div>
            <div className="flex items-center gap-2">
              <LocaleSwitcher locale={locale} />
              <FontSizeSwitcher className="scale-90" />
              <Link
                href="/donations"
                className="bg-copticGold-500 hover:bg-copticGold-600 text-copticNavy-900 font-bold px-2.5 py-0.5 rounded-full text-xs transition"
              >
                دعم الكنيسة
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex items-center justify-between">
          {/* Parish Brand Identity */}
          <Link href="/" className="flex items-center gap-3 group focus:outline-hidden">
            <div className="w-10 h-10 rounded-xl bg-copticNavy-500 border border-copticGold-400 flex items-center justify-center text-copticGold-300 shadow-inner group-hover:scale-105 transition-transform">
              <Church className="w-6 h-6 text-copticGold-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm md:text-base font-heading font-bold text-copticNavy leading-tight group-hover:text-copticGold-700 transition-colors">
                كنيسة القديسين مكسيموس ودوماديوس
              </span>
              <span className="text-xs text-copticGold-700 font-medium leading-tight">
                والشهيد الأنبا موسى الأسود — العصافرة
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden xl:flex items-center gap-1 text-sm font-medium">
            {mainNavItems.map((item) => {
              if (item.children && item.children.length > 0) {
                const isChildActive = item.children.some((c) => pathname.startsWith(c.href));
                const isOpen = activeDropdownId === item.id;

                return (
                  <div
                    key={item.id}
                    className="relative group"
                    onMouseEnter={() => setActiveDropdownId(item.id)}
                    onMouseLeave={() => setActiveDropdownId(null)}
                  >
                    <Link
                      href={item.href || "#"}
                      className={`px-3 py-2 rounded-lg flex items-center gap-1 transition-colors ${
                        isChildActive
                          ? "text-copticNavy font-bold bg-copticGold-50"
                          : "text-slateText-primary hover:text-copticNavy hover:bg-copticGold-50/60"
                      }`}
                    >
                      {getItemLabel(item)}
                      <ChevronDown className="w-3.5 h-3.5 text-copticGold-700" />
                    </Link>

                    {isOpen && (
                      <div className="absolute right-0 top-full pt-1 w-56 animate-in fade-in-50 z-50">
                        <div className="bg-white rounded-xl shadow-lg border border-copticGold-200 p-2 space-y-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.id}
                              href={child.href}
                              onClick={() => setActiveDropdownId(null)}
                              className={`block px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                pathname === child.href
                                  ? "bg-copticNavy text-white font-bold"
                                  : "text-slateText-primary hover:bg-copticGold-50 hover:text-copticNavy"
                              }`}
                            >
                              {getItemLabel(child)}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`px-2.5 py-1.5 rounded-lg text-xs 2xl:text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-copticNavy text-white font-bold shadow-xs"
                      : "text-slateText-primary hover:text-copticNavy hover:bg-copticGold-50"
                  }`}
                >
                  {getItemLabel(item)}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Hamburger Button */}
          <div className="xl:hidden flex items-center gap-2">
            <Link
              href="/events"
              className="bg-copticGold-50 text-copticNavy border border-copticGold-300 text-xs px-2.5 py-1 rounded-lg font-bold"
            >
              الفعاليات
            </Link>
            <Link
              href="/masses"
              className="bg-copticGold-50 text-copticNavy border border-copticGold-300 text-xs px-2.5 py-1 rounded-lg font-bold"
            >
              القداسات
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-copticNavy hover:bg-copticGold-50 border border-copticGold-300 transition"
              aria-label={mobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-t border-copticGold-200 px-4 py-4 space-y-2 max-h-[80vh] overflow-y-auto shadow-xl">
          {mainNavItems.map((item) => {
            if (item.children && item.children.length > 0) {
              return (
                <div key={item.id} className="border-b border-copticGold-100 pb-2">
                  <div className="px-2 py-1">
                    <Link
                      href={item.href || "#"}
                      onClick={() => setMobileMenuOpen(false)}
                      className="font-heading font-bold text-xs text-copticGold-800 hover:text-copticNavy transition-colors"
                    >
                      {getItemLabel(item)}
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 gap-1 pr-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.id}
                        href={child.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          pathname === child.href
                            ? "bg-copticNavy text-white font-bold"
                            : "text-slateText-primary hover:bg-copticGold-50"
                        }`}
                      >
                        {getItemLabel(child)}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-copticNavy text-white font-bold"
                    : "text-slateText-primary hover:bg-copticGold-50"
                }`}
              >
                {getItemLabel(item)}
              </Link>
            );
          })}

          {/* Secondary Nav Links */}
          {secondaryNavItems.length > 0 && (
            <div className="border-t border-copticGold-100 pt-2">
              {secondaryNavItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-copticNavy text-white font-bold"
                      : "text-slateText-primary hover:bg-copticGold-50"
                  }`}
                >
                  {getItemLabel(item)}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
