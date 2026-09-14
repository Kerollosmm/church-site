import React from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Calendar,
  HeartHandshake,
  Stethoscope,
  Globe,
  ShieldAlert,
  Church,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminNav = [
    { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
    { href: "/admin/masses", label: "إدارة القداسات", icon: Calendar },
    { href: "/admin/bookings", label: "حجوزات العزاء", icon: HeartHandshake },
    { href: "/admin/clinics", label: "دليل التخصصات الطبية", icon: Stethoscope },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-copticNavy-950 text-white p-6 border-b md:border-b-0 md:border-l-4 border-copticGold-500 shrink-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 pb-6 border-b border-copticNavy-800 mb-6">
            <div className="w-10 h-10 rounded-xl bg-copticGold-500 text-copticNavy-950 flex items-center justify-center font-bold">
              <Church className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-sm text-white">إدارة البوابة</h2>
              <p className="text-[11px] text-copticGold-400">كنيسة القديسين بالعصافرة</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            {adminNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-heading font-bold text-slate-300 hover:text-white hover:bg-copticNavy-800 transition"
                >
                  <Icon className="w-4 h-4 text-copticGold-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-copticNavy-800 mt-6 space-y-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-copticGold-300 hover:text-white transition"
          >
            <Globe className="w-4 h-4 text-copticGold-400" />
            <span>العودة للموقع العام</span>
          </Link>
          <div className="text-[10px] text-slate-400">
            لوحة الإشراف والسكرتارية الكنسية
          </div>
        </div>
      </aside>

      {/* Main Admin Work Area */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
