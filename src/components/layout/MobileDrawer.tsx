"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { X, ChevronDown, Phone, Heart, Radio, BookOpen } from "lucide-react";
import { CopticCrossIcon } from "@/components/ui/CopticDivider";
import { FontSizeSwitcher } from "@/components/ui/FontSizeSwitcher";
import { MEGA_MENU_CATEGORIES } from "./MegaMenu";
import { cn } from "@/lib/utils";

export interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const toggleCategory = (id: string) => {
    setExpandedCategory((prev) => (prev === id ? null : id));
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 md:hidden",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        aria-hidden="true"
      />

      {/* RTL Slide-out Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="القائمة الرئيسية للموقع"
        className={cn(
          "fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-surfaceCard shadow-2xl flex flex-col transition-transform duration-300 ease-out md:hidden border-l border-copticGold-300",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-copticGold-200 flex items-center justify-between bg-copticNavy-50/50">
          <div className="flex items-center gap-2">
            <CopticCrossIcon size={24} className="text-copticGold-600" />
            <div className="text-right">
              <span className="block font-heading font-bold text-sm text-copticNavy-700">
                كنيسة القديسين
              </span>
              <span className="block text-[11px] text-slateText-muted font-body">
                مكسيموس ودوماديوس والأنبا موسى
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق القائمة"
            className="p-2 rounded-xl text-slateText-muted hover:text-copticNavy-700 hover:bg-copticGold-100/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Tools Strip in Drawer */}
        <div className="px-4 py-2.5 bg-copticGold-50/60 border-b border-copticGold-200 flex items-center justify-between">
          <span className="text-xs font-heading font-medium text-copticGold-800">حجم الخط:</span>
          <FontSizeSwitcher />
        </div>

        {/* Scrollable Nav Tree */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {MEGA_MENU_CATEGORIES.map((cat) => {
            const isExpanded = expandedCategory === cat.id;
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                className="border border-copticGold-100 rounded-2xl overflow-hidden bg-surfaceCard"
              >
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  aria-expanded={isExpanded}
                  className="w-full flex items-center justify-between p-3.5 text-right font-heading text-sm font-bold text-copticNavy-700 hover:bg-copticGold-50/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-copticGold-700" />
                    <span>{cat.label}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-slateText-muted transition-transform duration-200",
                      isExpanded ? "rotate-180 text-copticGold-700" : ""
                    )}
                  />
                </button>

                {isExpanded && (
                  <div className="p-2 pt-0 space-y-1 bg-copticGold-50/30 border-t border-copticGold-100">
                    {cat.items.map((item, idx) => (
                      <Link
                        key={idx}
                        href={item.href}
                        onClick={onClose}
                        className="block px-3 py-2 rounded-xl text-xs font-heading text-slateText-secondary hover:text-copticNavy-700 hover:bg-white transition-colors"
                      >
                        <div className="font-semibold text-copticNavy-700">{item.title}</div>
                        <div className="text-[11px] text-slateText-muted font-body mt-0.5 line-clamp-1">
                          {item.description}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-2 space-y-2">
            <Link
              href="/live"
              onClick={onClose}
              className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-red-50 text-red-700 border border-red-200 font-heading text-sm font-bold"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>البث المباشر للصلوات والقداسات</span>
            </Link>

            <Link
              href="/bible"
              onClick={onClose}
              className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-copticGold-100/60 text-copticGold-900 border border-copticGold-200 font-heading text-sm font-bold"
            >
              <BookOpen className="w-4 h-4 text-copticGold-700" />
              <span>الكتاب المقدس وقراءات اليوم</span>
            </Link>

            <Link
              href="/donations"
              onClick={onClose}
              className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-copticNavy-50 text-copticNavy-700 border border-copticNavy-200 font-heading text-sm font-bold"
            >
              <Heart className="w-4 h-4 text-copticGold-600" />
              <span>المساهمات والتبرعات الكنسية</span>
            </Link>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-copticGold-200 bg-copticNavy-50/30 text-center">
          <Link
            href="/contact"
            onClick={onClose}
            className="inline-flex items-center gap-2 text-xs font-heading font-medium text-copticGold-800 hover:text-copticNavy-700"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>اتصل بسكرتارية الكنيسة: 03-5500000</span>
          </Link>
        </div>
      </div>
    </>
  );
}
