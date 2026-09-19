import React from "react";
import {
  Globe,
  Church,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { requireStaff } from "@/lib/auth/require-staff";
import { signOut } from "@/actions/auth-actions";
import { ROLE_LABELS_AR } from "@/lib/auth/roles";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { ADMIN_ROLE_LABELS_AR, adminRoleFromStaffRole } from "@church-site/domain";
import { LOCALE_DIRECTION } from "@church-site/ui";
import { getLocale } from "@church-site/ui/server";

/**
 * Administrative shell.
 *
 * The authorization check runs here, at the top of the protected route group.
 * The sign-in page lives outside this group (`/login`) so it cannot inherit the guard.
 *
 * The segment is explicitly DYNAMIC: the guard reads the session on every request.
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

          <AdminSidebarNav />
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

          <a
            href={process.env.NEXT_PUBLIC_SITE_URL || "/"}
            className="flex items-center gap-2 text-xs text-copticGold-300 hover:text-white transition"
          >
            <Globe className="w-4 h-4 text-copticGold-400" />
            <span>العودة للموقع العام</span>
          </a>
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
