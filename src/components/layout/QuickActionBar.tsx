"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, CalendarDays, Video, HeartHandshake, Phone } from "lucide-react";

export function QuickActionBar() {
  const pathname = usePathname();

  const actions = [
    { href: "/masses", label: "القداسات", icon: Calendar },
    { href: "/events", label: "الفعاليات", icon: CalendarDays },
    { href: "/live", label: "البث المباشر", icon: Video },
    { href: "/condolence", label: "قاعة العزاء", icon: HeartHandshake },
    { href: "/contact", label: "اتصل بنا", icon: Phone },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-copticGold-300 md:hidden shadow-lg">
      <div className="grid grid-cols-5 h-16">
        {actions.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive
                  ? "text-copticNavy font-bold bg-copticGold-50"
                  : "text-slateText-secondary hover:text-copticNavy"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-copticNavy scale-110" : "text-copticGold-700"}`} />
              <span className="text-[10px] font-heading">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
