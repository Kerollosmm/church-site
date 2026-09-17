// src/app/admin/(protected)/subscribers/page.tsx
// `/admin/subscribers` — the notification list: who asked to hear about events.
//
// WHAT THIS SCREEN IS FOR: the parish office keeps the list of people who want updates. The site has
// NO mail provider, so nothing is ever e-mailed — the page says that in a banner instead of letting an
// operator assume messages are going out.
//
// WHAT IT CAN DO: read the list (every role) and stop/restart a subscription (editor and above). A
// subscription is NEVER deleted: stopping keeps the address and its audit trail, so the decision is
// reversible — which is also why there is no delete button here.
//
// The rows come from `listAdminSubscribers()` (the admin reader in `src/lib/events/admin.ts`), which
// resolves each stored topic slug to the term the office knows it by.

import React from "react";
import Link from "next/link";
import { BellRing, CalendarDays } from "lucide-react";
import { SubscribersManager } from "./SubscribersManager";
import { AdminFeedback } from "@/components/admin/AdminFeedback";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ADMIN_BUTTON_SECONDARY } from "@/components/admin/admin-ui";
import { requireStaff } from "@/lib/auth/require-staff";
import {
  ADMIN_ROLE_LABELS_AR,
  adminRoleFromStaffRole,
  isReadOnlyRole,
  resolveAdminCapabilities,
} from "@church-site/domain";
import { isEventSubscriptionsEnabled, listAdminSubscribers, type AdminSubscriberRow } from "@church-site/data-access";

export const metadata = {
  title: "المشتركون في التنبيهات — لوحة تحكم كنيسة القديسين",
};

export default async function AdminSubscribersPage(): Promise<React.ReactElement> {
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);
  const capabilities = resolveAdminCapabilities(role);
  const roleLabel = role ? ADMIN_ROLE_LABELS_AR[role] : "غير معروف";
  const featureEnabled = isEventSubscriptionsEnabled();

  let rows: AdminSubscriberRow[] = [];
  let readFailed = false;

  try {
    // Retired subscriptions stay listed: this is the record of who asked to be contacted.
    rows = await listAdminSubscribers({ includeInactive: true });
  } catch (error) {
    console.error("[admin] subscribers read failed", {
      reason: error instanceof Error ? error.message : String(error),
    });
    readFailed = true;
  }

  const activeCount = rows.filter((row) => row.subscriber.isActive).length;

  return (
    <div className="max-w-7xl space-y-6">
      <AdminPageHeader
        title="المشتركون في تنبيهات الفعاليات"
        description={`قائمة من سجّلوا بريدهم الإلكتروني لتصله تنبيهات الفعاليات (${activeCount} مشترك نشط من إجمالي ${rows.length}). يمكن إيقاف أي اشتراك أو إعادة تنشيطه — والبيانات محفوظة دائماً.`}
        roleLabel={roleLabel}
        readOnly={isReadOnlyRole(capabilities)}
      >
        <Link href="/events" className={ADMIN_BUTTON_SECONDARY}>
          إدارة الفعاليات
        </Link>
        <Link href="/audit" className={ADMIN_BUTTON_SECONDARY}>
          سجل التدقيق
        </Link>
      </AdminPageHeader>

      {/* Stated before anything else, because it is the single most important fact about this list. */}
      <AdminFeedback
        tone="info"
        title="لا يُرسل أي بريد إلكتروني"
        message="لا يوجد مزوّد بريد مضبوط على هذا الموقع: الاشتراكات تُحفظ وتُعرض هنا فقط، ولا تخرج أي رسالة. عند ربط مزوّد بريد لاحقاً تُستخدم هذه القائمة كما هي، ويُسجَّل كل إرسال في سجل التدقيق."
      />

      {!featureEnabled ? (
        <AdminFeedback
          tone="error"
          title="الميزة معطّلة عبر الإعداد"
          message="خدمة الاشتراك في التنبيهات معطّلة حالياً على الموقع العام (EVENTS_SUBSCRIPTIONS_ENABLED). القائمة معروضة للقراءة فقط، وتُرفض أي محاولة إيقاف أو تنشيط من الخادم."
        />
      ) : null}

      {readFailed ? (
        <AdminFeedback
          tone="error"
          title="تعذّر تحميل البيانات"
          message="تعذّر الوصول إلى قائمة المشتركين. لم يتغيّر أي شيء — أعد تحميل الصفحة، وإن تكرر الخطأ راجع مسؤول النظام."
        />
      ) : rows.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
          <div className="rounded-2xl border border-dashed border-copticGold-300 bg-copticGold-50/40 p-8 text-center">
            <BellRing aria-hidden="true" className="mx-auto h-6 w-6 text-copticGold-700" />
            <p className="mt-2 font-heading text-sm font-bold text-copticNavy">لا يوجد أي مشترك بعد</p>
            <p className="mt-1 text-xs text-slate-600">
              سيظهر هنا كل من يسجّل بريده من صفحة «تنبيهات الفعاليات» العامة.
            </p>
            <Link href="/subscribe" className={`mt-4 ${ADMIN_BUTTON_SECONDARY}`}>
              <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
              <span>عرض صفحة الاشتراك العامة</span>
            </Link>
          </div>
        </section>
      ) : (
        <SubscribersManager
          rows={rows}
          capabilities={capabilities}
          featureEnabled={featureEnabled}
        />
      )}
    </div>
  );
}
