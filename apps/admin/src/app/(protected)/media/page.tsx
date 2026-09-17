// src/app/admin/(protected)/media/page.tsx
// `/admin/media` — the media registry (metadata + URL, never bytes).
//
// The page reads the registered metadata and the event list (the optional "link this URL to an event"
// choice needs titles to choose from). Both reads go through `src/lib/events/admin.ts`, so the screen
// never touches a driver, and a read failure is reported instead of being rendered as "no media".

import React from "react";
import Link from "next/link";
import { MediaManager } from "./MediaManager";
import { AdminFeedback } from "@/components/admin/AdminFeedback";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ADMIN_BUTTON_SECONDARY } from "@/components/admin/admin-ui";
import { requireStaff } from "@/lib/auth/require-staff";
import {
  ADMIN_ROLE_LABELS_AR,
  adminRoleFromStaffRole,
  isReadOnlyRole,
  resolveAdminCapabilities,
  type MediaRecord,
} from "@church-site/domain";
import { listAdminEvents, listAdminMedia, type AdminEventRow } from "@church-site/data-access";

export const metadata = {
  title: "مكتبة الوسائط — لوحة تحكم كنيسة القديسين",
};

export default async function AdminMediaPage(): Promise<React.ReactElement> {
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);
  const capabilities = resolveAdminCapabilities(role);
  const roleLabel = role ? ADMIN_ROLE_LABELS_AR[role] : "غير معروف";

  let media: MediaRecord[] = [];
  let events: AdminEventRow[] = [];
  let readFailed = false;

  try {
    [media, events] = await Promise.all([listAdminMedia(), listAdminEvents()]);
  } catch (error) {
    // Server-side detail only: the markup below carries no driver name, code or stack.
    console.error("[admin] media read failed", {
      reason: error instanceof Error ? error.message : String(error),
    });
    readFailed = true;
  }

  return (
    <div className="max-w-7xl space-y-6">
      <AdminPageHeader
        title="مكتبة الوسائط"
        description="سجل وصفي للملفات (صور ومستندات) التي تستخدمها الفعاليات والصفحات: اسم الملف ونوعه وحجمه ورابطه والنص البديل بالعربية والإنجليزية، مع رفض الحجم الذي يتجاوز الحد المسموح."
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

      {readFailed ? (
        <AdminFeedback
          tone="error"
          title="تعذّر تحميل البيانات"
          message="تعذّر الوصول إلى سجل الوسائط أو قائمة الفعاليات. لم يتغيّر أي شيء — أعد تحميل الصفحة، وإن تكرر الخطأ راجع مسؤول النظام."
        />
      ) : (
        <MediaManager media={media} events={events} capabilities={capabilities} />
      )}
    </div>
  );
}
