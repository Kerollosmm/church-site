"use client";

// apps/admin/src/components/admin/AdminSidebarNav.tsx
// Interactive client sidebar navigation supporting active route detection.

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  Video,
  Building2,
  Compass,
  Layers,
  HeartHandshake,
  Image as ImageIcon,
  BellRing,
  FileClock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@church-site/ui";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/", label: "لوحة التحكم الرئيسية", icon: LayoutDashboard },
  { href: "/masses", label: "إدارة القداسات", icon: Calendar },
  { href: "/events", label: "الفعاليات والمواعيد", icon: CalendarDays },
  { href: "/videos", label: "فيديوهات الكنيسة", icon: Video },
  { href: "/services", label: "الخدمات والمرافق", icon: Building2 },
  { href: "/navigation", label: "شريط التنقل", icon: Compass },
  { href: "/content-types", label: "نماذج المحتوى (CMS)", icon: Layers },
  { href: "/bookings", label: "حجوزات العزاء", icon: HeartHandshake },
  { href: "/media", label: "مكتبة الوسائط", icon: ImageIcon },
  { href: "/subscribers", label: "المشتركون في التنبيهات", icon: BellRing },
  { href: "/audit", label: "سجل التدقيق", icon: FileClock },
];

export function AdminSidebarNav(): React.ReactElement {
  const pathname = usePathname();

  return (
    <nav className="space-y-1.5" aria-label="شريط التنقل الإداري">
      {ADMIN_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-heading font-bold transition",
              isActive
                ? "bg-copticGold-500 text-copticNavy-950 font-black shadow-xs"
                : "text-slate-300 hover:text-white hover:bg-copticNavy-800"
            )}
          >
            <Icon
              className={cn(
                "w-4 h-4 shrink-0",
                isActive ? "text-copticNavy-950" : "text-copticGold-400"
              )}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
