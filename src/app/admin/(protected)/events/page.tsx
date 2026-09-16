// src/app/admin/(protected)/events/page.tsx
// `/admin/events` — every event row and every recurring series, with the actions the signed-in role
// is allowed to perform.
//
// THE ROLE IS RESOLVED HERE, ONCE, ON THE SERVER: `requireStaff()` (which also re-runs in the
// protected layout — defence in depth, never middleware alone) gives the identity, and
// `resolveAdminCapabilities()` turns it into the boolean set the client manager renders with. The
// same decision is re-taken inside every action when a mutation is attempted.
//
// A STORE FAILURE IS SHOWN, NOT SWALLOWED: if the repository cannot be read, the screen says so and
// offers a reload — it never renders "لا توجد فعاليات" over a file that could not be opened (that
// would tell a secretary their content is gone).

import React from "react";
import Link from "next/link";
import { BookOpenText, Image as ImageIcon, FileClock } from "lucide-react";
import { EventsManager } from "./EventsManager";
import { AdminFeedback } from "@/components/admin/AdminFeedback";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { RepublishControl } from "@/components/admin/RepublishControl";
import { ADMIN_BUTTON_SECONDARY, ADMIN_PANEL } from "@/components/admin/admin-ui";
import { requireStaff } from "@/lib/auth/require-staff";
import {
  ADMIN_ROLE_LABELS_AR,
  adminRoleFromStaffRole,
  isReadOnlyRole,
  resolveAdminCapabilities,
} from "@/lib/domain/capabilities";
import { getAdminStoreStatus, listAdminEvents, listAdminSeries, type AdminEventRow, type AdminSeriesRow } from "@/lib/events/admin";
import { getLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/locales";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import type { RepositoryStatus } from "@/lib/store";

export const metadata = {
  title: "إدارة الفعاليات — لوحة تحكم كنيسة القديسين",
};

const READ_FAILED_MESSAGE =
  "تعذّر قراءة بيانات الفعاليات من مخزن البيانات الآن. لم يتغيّر أي شيء في المحتوى — أعد تحميل الصفحة، وإن تكرر الخطأ راجع مسؤول النظام.";

export default async function AdminEventsPage(): Promise<React.ReactElement> {
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);
  const capabilities = resolveAdminCapabilities(role);

  let locale: Locale = DEFAULT_LOCALE;
  let events: AdminEventRow[] = [];
  let series: AdminSeriesRow[] = [];
  let storeStatus: RepositoryStatus | null = null;
  let readFailed = false;

  try {
    locale = await getLocale();
    [events, series, storeStatus] = await Promise.all([listAdminEvents(), listAdminSeries(), getAdminStoreStatus()]);
  } catch (error) {
    // Server-side detail only: the markup below carries no driver name, code or stack.
    console.error("[admin] events index read failed", {
      reason: error instanceof Error ? error.message : String(error),
    });
    readFailed = true;
  }

  return (
    <div className="max-w-7xl space-y-6">
      <AdminPageHeader
        title="إدارة الفعاليات والمواعيد"
        description="إنشاء الفعاليات وتعديلها ونشرها، وإدارة السلاسل المتكررة (القداسات والاجتماعات) مع إلغاء أو نقل موعد واحد دون المساس ببقية السلسلة. كل تعديل يُسجَّل في سجل التدقيق باسم الفاعل والوقت والحالة قبل وبعد."
        roleLabel={role ? ADMIN_ROLE_LABELS_AR[role] : "غير معروف"}
        readOnly={isReadOnlyRole(capabilities)}
      >
        {capabilities.create ? (
          <Link href="/admin/events/new" className={ADMIN_BUTTON_SECONDARY}>
            فعالية جديدة
          </Link>
        ) : null}
        <Link href="/admin/audit" className={ADMIN_BUTTON_SECONDARY}>
          <FileClock aria-hidden="true" className="h-4 w-4" />
          <span>سجل التدقيق</span>
        </Link>
        <Link href="/admin/media" className={ADMIN_BUTTON_SECONDARY}>
          <ImageIcon aria-hidden="true" className="h-4 w-4" />
          <span>مكتبة الوسائط</span>
        </Link>
        <Link href="/events" className={ADMIN_BUTTON_SECONDARY}>
          <BookOpenText aria-hidden="true" className="h-4 w-4" />
          <span>معاينة الصفحة العامة</span>
        </Link>
      </AdminPageHeader>

      {/* Republish + last-updated indicator. Rendered even when the reads failed: the control is the
          documented way out of a stale cache, and the timestamp simply reads as unknown. */}
      <section aria-labelledby="events-store-heading" className={ADMIN_PANEL}>
        <h2 id="events-store-heading" className="font-heading text-base font-bold text-copticNavy">
          نشر المحتوى وذاكرة التخزين المؤقت
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          نشر أي تعديل يتم تلقائياً على صفحات الموقع العامة. الزر التالي يمسح الذاكرة المؤقتة يدوياً إن ظهر محتوى قديم.
        </p>
        <div className="mt-4">
          <RepublishControl
            canRepublish={capabilities.republish}
            lastUpdatedAt={storeStatus?.lastUpdatedAt ?? null}
            driver={storeStatus?.driver ?? "—"}
          />
        </div>
      </section>

      {readFailed ? (
        <AdminFeedback tone="error" title="تعذّر تحميل البيانات" message={READ_FAILED_MESSAGE} />
      ) : (
        <EventsManager events={events} series={series} capabilities={capabilities} locale={locale} />
      )}
    </div>
  );
}
