"use client";

// apps/web/src/components/layout/HeaderClient.tsx
// Interactive client navigation header receiving data-driven public navigation hierarchy.
// Implements structured desktop mega-menu with <= 7 primary items & accessible dropdowns,
// touch-friendly mobile drawer (>= 44px) with body scroll lock, and full keyboard navigation.

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, HeartHandshake, Phone } from "lucide-react";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";
import { applyDocumentLocale, readLocaleCookie } from "@/lib/i18n/dom";
import type { PublicNavItem } from "@church-site/domain";
import { SEED_PUBLIC_NAVIGATION } from "@church-site/data-access/client";

export interface PublicNavigationResult {
  main: PublicNavItem[];
  secondary: PublicNavItem[];
}

export interface HeaderClientProps {
  navigation?: PublicNavigationResult;
  brand?: React.ReactNode;
}

export interface StructuredNavItem {
  id: string;
  key?: string;
  labelAr: string;
  labelEn: string;
  href: string;
  children?: StructuredNavItem[];
}

/**
 * Builds structured navigation items <= 7 primary desktop items.
 * If custom navigation with <= 7 non-default items is provided, it is rendered directly.
 * Otherwise, maps standard parish sections into 5-6 logical grouped dropdowns.
 */
export function buildStructuredNavigation(
  mainItems: PublicNavItem[],
  secondaryItems: PublicNavItem[] = []
): StructuredNavItem[] {
  const isCustomSmallNav =
    mainItems.length > 0 &&
    mainItems.length <= 7 &&
    !mainItems.some((i) => i.key === "about" && mainItems.some((j) => j.key === "masses"));

  if (isCustomSmallNav) {
    return mainItems.map((item) => ({
      id: item.id,
      key: item.key,
      labelAr: item.labelAr,
      labelEn: item.labelEn || item.labelAr,
      href: item.href,
      children: item.children?.map((c) => ({
        id: c.id,
        key: c.key,
        labelAr: c.labelAr,
        labelEn: c.labelEn || c.labelAr,
        href: c.href,
      })),
    }));
  }

  const allItems = [...mainItems, ...secondaryItems];
  const findItem = (href: string) => allItems.find((i) => i.href === href);

  return [
    {
      id: "nav-home",
      key: "home",
      labelAr: findItem("/")?.labelAr || "الرئيسية",
      labelEn: findItem("/")?.labelEn || "Home",
      href: "/",
    },
    {
      id: "nav-about",
      key: "about",
      labelAr: findItem("/about")?.labelAr || "عن الكنيسة",
      labelEn: findItem("/about")?.labelEn || "About",
      href: "/about",
      children: [
        {
          id: "nav-about-main",
          labelAr: "عن الكنيسة ومسيرتها",
          labelEn: "About Parish",
          href: "/about",
        },
        {
          id: "nav-about-history",
          labelAr: "تاريخ الكنيسة والشفعاء",
          labelEn: "History & Patrons",
          href: "/about/history",
        },
        {
          id: "nav-about-altars",
          labelAr: "المذابح الثلاثة والمزارات",
          labelEn: "Altars & Shrines",
          href: "/about/altars",
        },
        {
          id: "nav-about-clergy",
          labelAr: "مجمع الآباء الكهنة",
          labelEn: "Clergy",
          href: "/about/clergy",
        },
      ],
    },
    {
      id: "nav-liturgies-events",
      key: "liturgies_events",
      labelAr: "القداسات والفعاليات",
      labelEn: "Masses & Events",
      href: "/masses",
      children: [
        {
          id: "nav-masses",
          labelAr: "مواعيد القداسات والتسبحة",
          labelEn: "Mass Schedules",
          href: "/masses",
        },
        {
          id: "nav-events",
          labelAr: "الفعاليات والنهضات الروحية",
          labelEn: "Events",
          href: "/events",
        },
        {
          id: "nav-live",
          labelAr: "البث المباشر للصلوات",
          labelEn: "Live Stream",
          href: "/live",
        },
        {
          id: "nav-condolence",
          labelAr: "حجز قاعة العزاء",
          labelEn: "Condolence Booking",
          href: "/condolence",
        },
      ],
    },
    {
      id: "nav-services",
      key: "services",
      labelAr: "خدمات الكنيسة",
      labelEn: "Church Services",
      href: "/services",
      children: [
        {
          id: "nav-services-main",
          labelAr: "مرافق وخدمات المجتمع",
          labelEn: "Community Services",
          href: "/services",
        },
        {
          id: "nav-ministries",
          labelAr: "الخدمات الرعوية والاجتماعية",
          labelEn: "Pastoral Ministries",
          href: "/ministries",
        },
        {
          id: "nav-meetings",
          labelAr: "التربية الكنسية والشباب",
          labelEn: "Sunday School & Youth",
          href: "/meetings",
        },
        {
          id: "nav-activities",
          labelAr: "الأنشطة العامة والكشافة",
          labelEn: "Activities & Scouts",
          href: "/activities",
        },
        {
          id: "nav-education",
          labelAr: "المدارس والمعاهد الكنسية",
          labelEn: "Education & Institutes",
          href: "/education",
        },
      ],
    },
    {
      id: "nav-media",
      key: "media",
      labelAr: "الوسائط والروحيات",
      labelEn: "Media & Spiritual",
      href: "/bible",
      children: [
        {
          id: "nav-bible",
          labelAr: "الكتاب المقدس والتفاسير",
          labelEn: "Holy Bible",
          href: "/bible",
        },
        {
          id: "nav-sermons",
          labelAr: "العظات والتسجيلات",
          labelEn: "Sermons",
          href: "/sermons",
        },
        {
          id: "nav-gallery",
          labelAr: "معرض الصور والذكريات",
          labelEn: "Photo Gallery",
          href: "/gallery",
        },
      ],
    },
    {
      id: "nav-contact",
      key: "contact",
      labelAr: findItem("/contact")?.labelAr || "اتصل بنا",
      labelEn: findItem("/contact")?.labelEn || "Contact Us",
      href: "/contact",
    },
  ];
}

export function HeaderClient({ navigation, brand }: HeaderClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  const handleDropdownEnter = (id: string) => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setActiveDropdownId(id);
  };

  const handleDropdownLeave = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }
    leaveTimeoutRef.current = setTimeout(() => {
      setActiveDropdownId(null);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const resolved = readLocaleCookie();
    setLocale(resolved);
    applyDocumentLocale(resolved);
  }, []);

  // Body scroll lock when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileMenuOpen]);

  // Global Escape key and click outside listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setActiveDropdownId(null);
        setMobileMenuOpen(false);
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (
        navContainerRef.current &&
        !navContainerRef.current.contains(e.target as Node)
      ) {
        setActiveDropdownId(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Safe fallback to seed navigation hierarchy if store returns empty
  const navData =
    navigation && navigation.main.length > 0
      ? navigation
      : SEED_PUBLIC_NAVIGATION;

  const structuredItems = buildStructuredNavigation(
    navData.main,
    navData.secondary
  );

  function getItemLabel(item: { labelAr: string; labelEn?: string }): string {
    if (locale === "en" && item.labelEn) {
      return item.labelEn;
    }
    return item.labelAr;
  }

  return (
    <>
      {/* Main Navigation Bar */}
      <div
        ref={navContainerRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5"
      >
        <div className="flex items-center justify-between">
          <div className="shrink-0">{brand}</div>

          {/* Desktop Nav Items (Structured <= 7 Primary Items) */}
          <nav
            className="hidden xl:flex items-center gap-1.5 text-sm font-medium"
            aria-label="التنقل الرئيسي"
          >
            {structuredItems.map((item) => {
              const hasChildren = item.children && item.children.length > 0;

              if (hasChildren && item.children) {
                const isChildActive = item.children.some(
                  (c) =>
                    pathname === c.href ||
                    (c.href !== "/" && pathname.startsWith(c.href))
                );
                const isOpen = activeDropdownId === item.id;

                return (
                  <div
                    key={item.id}
                    className="relative"
                    onMouseEnter={() => handleDropdownEnter(item.id)}
                    onMouseLeave={handleDropdownLeave}
                  >
                    <button
                      type="button"
                      id={`nav-trigger-${item.id}`}
                      aria-haspopup="true"
                      aria-expanded={isOpen}
                      aria-controls={`nav-menu-${item.id}`}
                      onClick={() =>
                        setActiveDropdownId((prev) =>
                          prev === item.id ? null : item.id
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setActiveDropdownId((prev) =>
                            prev === item.id ? null : item.id
                          );
                        } else if (e.key === "Escape") {
                          e.preventDefault();
                          setActiveDropdownId(null);
                        } else if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setActiveDropdownId(item.id);
                        }
                      }}
                      className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-copticNavy focus-visible:outline-offset-2 ${
                        isChildActive
                          ? "text-copticNavy font-bold bg-copticGold-100/80 border border-copticGold-300 shadow-2xs"
                          : "text-slateText-primary hover:text-copticNavy hover:bg-copticGold-50/80"
                      }`}
                    >
                      <span className="font-heading font-semibold text-xs 2xl:text-sm">
                        {getItemLabel(item)}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-copticGold-700 transition-transform duration-150 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Smooth disclosure dropdown menu */}
                    {isOpen && (
                      <div
                        id={`nav-menu-${item.id}`}
                        role="menu"
                        aria-labelledby={`nav-trigger-${item.id}`}
                        aria-orientation="vertical"
                        className="absolute start-0 top-full pt-1.5 w-64 z-50 animate-in fade-in-50 duration-150 origin-top"
                      >
                        <div className="bg-white rounded-2xl shadow-xl border border-copticGold-200 p-2 space-y-1">
                          {item.children.map((child) => {
                            const isCurrent = pathname === child.href;
                            return (
                              <Link
                                key={child.id}
                                href={child.href}
                                role="menuitem"
                                tabIndex={0}
                                onClick={() => setActiveDropdownId(null)}
                                className={`block px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-copticNavy focus-visible:outline-offset-1 ${
                                  isCurrent
                                    ? "bg-copticNavy text-white font-bold shadow-xs"
                                    : "text-slateText-primary hover:bg-copticGold-50 hover:text-copticNavy"
                                }`}
                              >
                                <div className="font-heading font-bold text-xs">
                                  {getItemLabel(child)}
                                </div>
                              </Link>
                            );
                          })}
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
                  className={`px-3 py-2 rounded-xl text-xs 2xl:text-sm font-heading font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-copticNavy focus-visible:outline-offset-2 ${
                    isActive
                      ? "bg-copticNavy text-white font-bold shadow-xs"
                      : "text-slateText-primary hover:text-copticNavy hover:bg-copticGold-50/80"
                  }`}
                >
                  {getItemLabel(item)}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Fast Links & Hamburger Button */}
          <div className="xl:hidden flex items-center gap-2">
            <Link
              href="/masses"
              className="bg-copticGold-50 text-copticNavy border border-copticGold-300 text-xs px-2.5 py-1.5 rounded-lg font-bold hover:bg-copticGold-100 transition min-h-[36px] flex items-center"
            >
              القداسات
            </Link>
            <Link
              href="/events"
              className="bg-copticGold-50 text-copticNavy border border-copticGold-300 text-xs px-2.5 py-1.5 rounded-lg font-bold hover:bg-copticGold-100 transition min-h-[36px] flex items-center"
            >
              الفعاليات
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-copticNavy hover:bg-copticGold-50 border border-copticGold-300 transition min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-copticNavy"
              aria-label={mobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Structured Drawer (Touch targets >= 44px, Sectional Cards) */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="قائمة التنقل الجوال"
          className="xl:hidden bg-white/98 backdrop-blur-md border-t border-copticGold-200 px-4 py-5 max-h-[calc(100vh-4.5rem)] overflow-y-auto shadow-2xl space-y-5 animate-in fade-in-50 duration-150"
        >
          {/* Top Info Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-copticGold-100">
            <span className="font-heading font-extrabold text-xs text-copticNavy">
              أقسام وخدمات الكنيسة
            </span>
            <Link
              href="/donations"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center gap-1 bg-copticGold-500 hover:bg-copticGold-600 text-copticNavy-900 font-bold px-3 py-1 rounded-full text-xs transition"
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>دعم الكنيسة</span>
            </Link>
          </div>

          {/* Structured Sections */}
          {structuredItems.map((item) => {
            if (item.children && item.children.length > 0) {
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-copticGold-200 bg-alabasterBg/60 p-3 space-y-2"
                >
                  <div className="px-1 font-heading font-extrabold text-xs text-copticGold-800">
                    {getItemLabel(item)}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {item.children.map((child) => {
                      const isChildCurrent = pathname === child.href;
                      return (
                        <Link
                          key={child.id}
                          href={child.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`min-h-[44px] flex items-center px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors border focus-visible:outline-2 focus-visible:outline-copticNavy ${
                            isChildCurrent
                              ? "bg-copticNavy text-white font-bold border-copticNavy shadow-xs"
                              : "bg-white text-slateText-primary border-copticGold-100 hover:bg-copticGold-50 hover:text-copticNavy hover:border-copticGold-300"
                          }`}
                        >
                          {getItemLabel(child)}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            const isCurrent = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`min-h-[44px] flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-heading font-bold transition-colors border focus-visible:outline-2 focus-visible:outline-copticNavy ${
                  isCurrent
                    ? "bg-copticNavy text-white border-copticNavy shadow-xs"
                    : "bg-white text-copticNavy border-copticGold-200 hover:bg-copticGold-50"
                }`}
              >
                <span>{getItemLabel(item)}</span>
                {item.href === "/contact" && (
                  <Phone className="w-4 h-4 text-copticGold-700" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
