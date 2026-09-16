import React from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Calendar,
  HeartHandshake,
  Stethoscope,
  Globe,
  Church,
  LogOut,
  ShieldCheck,
  CalendarDays,
  FileClock,
  Image as ImageIcon,
  BellRing,
} from "lucide-react";
import { requireStaff } from "@/lib/auth/require-staff";
import { signOut } from "@/actions/auth-actions";
import { ROLE_LABELS_AR } from "@/lib/auth/roles";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { ADMIN_ROLE_LABELS_AR, adminRoleFromStaffRole } from "@/lib/domain/capabilities";
import { LOCALE_DIRECTION } from "@/lib/i18n/locales";
import { getLocale } from "@/lib/i18n/server";

/**
 * Administrative shell.
 *
 * The authorization check runs here, at the top of the protected route group, in addition to
 * `src/middleware.ts` — server-side checks must never rely on middleware alone. The sign-in
 * page lives outside this group (`src/app/admin/login`) so it cannot inherit the guard.
 *
 * The segment is explicitly DYNAMIC: the guard reads the session on every request, and without
 * this the no-env build would prerender the fail-closed `redirect("/admin/login")` as a static
 * 307 for the whole area — a signed-in member of staff would then be bounced back to the sign-in
 * page forever, because the redirect would be served from the build output instead of being
 * re-evaluated per request.
 *
 * THE LOCALE IS RESPECTED HERE TOO: the admin reads the same cookie the public site does, applies the
 * direction to its own subtree, and mounts the locale switcher in the sidebar. The staff area's own
 * labels stay Arabic (its server actions answer in Arabic — see `src/actions/event-actions.ts`), while
 * CONTENT (titles, taxonomy names) follows the cookie through `localized()` — so an English-reading
 * secretary reads English event titles in an LTR shell without losing the Arabic controls.
 */
export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requireStaff();
  const locale = await getLocale();
  const eventRole = adminRoleFromStaffRole(staff.role);

  const adminNav = [
    { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
    { href: "/admin/events", label: "الفعاليات والمواعيد", icon: CalendarDays },
    { href: "/admin/masses", label: "إدارة القداسات", icon: Calendar },
    { href: "/admin/bookings", label: "حجوزات العزاء", icon: HeartHandshake },
    { href: "/admin/clinics", label: "دليل التخصصات الطبية", icon: Stethoscope },
    { href: "/admin/media", label: "مكتبة الوسائط", icon: ImageIcon },
    { href: "/admin/subscribers", label: "المشتركون في التنبيهات", icon: BellRing },
    { href: "/admin/audit", label: "سجل التدقيق", icon: FileClock },
  ];

  return (
    <div
      dir={LOCALE_DIRECTION[locale]}
      lang={locale}
      data-admin-locale={locale}
      className="min-h-screen bg-slate-100 flex flex-col md:flex-row"
    >
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

          {/* The same cookie the public site uses, so a language chosen anywhere applies everywhere. */}
          <div className="mb-6 space-y-2">
            <p className="text-[10px] font-bold text-slate-400">لغة العرض في لوحة الإدارة والعناوين</p>
            <LocaleSwitcher locale={locale} />
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
          <div className="bg-copticNavy-900/70 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-bold text-copticGold-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{ROLE_LABELS_AR[staff.role]}</span>
            </div>
            <p className="text-[11px] text-slate-200 truncate">{staff.fullNameAr}</p>
            {staff.email && (
              <p className="text-[10px] text-slate-400 font-english truncate" dir="ltr">
                {staff.email}
              </p>
            )}
            {/* The event-system role is what the events screens authorize against — shown so nobody
                has to guess why a button is missing. */}
            <p className="text-[10px] text-slate-400">
              صلاحية الفعاليات:{" "}
              <span className="font-bold text-slate-200">
                {eventRole ? ADMIN_ROLE_LABELS_AR[eventRole] : "بلا وصول"}
              </span>
            </p>
          </div>

          <form action={signOut}>
            <button
              type="submit"
              className="w-full flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-copticNavy-900 hover:bg-copticNavy-800 px-3 py-2 rounded-xl transition"
            >
              <LogOut className="w-4 h-4 text-copticGold-400" />
              <span>تسجيل الخروج</span>
            </button>
          </form>

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
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto bg-slate-100">{children}</main>
    </div>
  );
}
