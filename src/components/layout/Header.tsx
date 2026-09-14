"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Church,
  Calendar,
  Stethoscope,
  BookOpen,
  HeartHandshake,
  Video,
  Phone,
  ChevronDown,
  Layers,
  GraduationCap,
  Users,
} from "lucide-react";
import { FontSizeSwitcher } from "@/components/ui/FontSizeSwitcher";
import { getCopticDateString } from "@/lib/utils/coptic-date";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);
  const pathname = usePathname();
  const copticDate = getCopticDateString();

  const navLinks = [
    { href: "/", label: "الرئيسية" },
    {
      label: "عن الكنيسة",
      children: [
        { href: "/about/history", label: "تاريخ الكنيسة والشفعاء" },
        { href: "/about/altars", label: "المذابح الثلاثة والمزارات" },
        { href: "/about/clergy", label: "مجمع الآباء الكهنة" },
      ],
    },
    { href: "/masses", label: "مواعيد القداسات" },
    { href: "/clinics", label: "المستوصف الطبي" },
    { href: "/meetings", label: "التربية الكنسية" },
    { href: "/education", label: "المدارس والمعاهد" },
    { href: "/activities", label: "الأنشطة الرعوية" },
    { href: "/services", label: "خدمات الكنيسة" },
    { href: "/condolence", label: "حجز قاعة العزاء" },
    { href: "/live", label: "البث المباشر" },
    { href: "/bible", label: "الكتاب المقدس" },
    { href: "/donations", label: "التبرعات" },
    { href: "/contact", label: "اتصل بنا" },
  ];

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
            {navLinks.map((item) => {
              if (item.children) {
                const isChildActive = item.children.some((c) => pathname.startsWith(c.href));
                return (
                  <div
                    key={item.label}
                    className="relative group"
                    onMouseEnter={() => setAboutDropdownOpen(true)}
                    onMouseLeave={() => setAboutDropdownOpen(false)}
                  >
                    <button
                      type="button"
                      className={`px-3 py-2 rounded-lg flex items-center gap-1 transition-colors ${
                        isChildActive
                          ? "text-copticNavy font-bold bg-copticGold-50"
                          : "text-slateText-primary hover:text-copticNavy hover:bg-copticGold-50/60"
                      }`}
                    >
                      {item.label}
                      <ChevronDown className="w-3.5 h-3.5 text-copticGold-700" />
                    </button>

                    {aboutDropdownOpen && (
                      <div className="absolute right-0 top-full pt-1 w-56 animate-in fade-in-50">
                        <div className="bg-white rounded-xl shadow-lg border border-copticGold-200 p-2 space-y-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setAboutDropdownOpen(false)}
                              className={`block px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                pathname === child.href
                                  ? "bg-copticNavy text-white font-bold"
                                  : "text-slateText-primary hover:bg-copticGold-50 hover:text-copticNavy"
                              }`}
                            >
                              {child.label}
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
                  key={item.href}
                  href={item.href}
                  className={`px-2.5 py-1.5 rounded-lg text-xs 2xl:text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-copticNavy text-white font-bold shadow-xs"
                      : "text-slateText-primary hover:text-copticNavy hover:bg-copticGold-50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Hamburger Button */}
          <div className="xl:hidden flex items-center gap-2">
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
          {navLinks.map((item) => {
            if (item.children) {
              return (
                <div key={item.label} className="border-b border-copticGold-100 pb-2">
                  <div className="font-heading font-bold text-xs text-copticGold-800 px-2 py-1">
                    {item.label}
                  </div>
                  <div className="grid grid-cols-1 gap-1 pr-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          pathname === child.href
                            ? "bg-copticNavy text-white font-bold"
                            : "text-slateText-primary hover:bg-copticGold-50"
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-copticNavy text-white font-bold"
                    : "text-slateText-primary hover:bg-copticGold-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
