// src/app/admin/(protected)/events/[id]/edit/page.tsx
// `/admin/events/[id]/edit` — the editor for one existing `events` row.
//
// TWO READ OUTCOMES ARE NOT ERRORS AND ARE NOT THE SAME:
//   * the row does not exist (or was deleted from another device) → the segment's `notFound()`;
//   * the store could not be read at all → an explicit failure panel, because "the file is unreadable"
//     and "this event is gone" must never look alike to a secretary.
//
// An occurrence-override row (`seriesId !== null`) is editable here like any row, and the form says so
// and links back to its series: the deviation is what makes the row exist, and the series screen is
// where it can be cancelled or moved.

import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventEditorForm } from "../../_components/EventEditorForm";
import { AdminFeedback } from "@/components/admin/AdminFeedback";
import { AdminForbiddenNotice } from "@/components/admin/AdminForbiddenNotice";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ADMIN_BUTTON_SECONDARY } from "@/components/admin/admin-ui";
import { requireStaff } from "@/lib/auth/require-staff";
import {
  ADMIN_ROLE_LABELS_AR,
  adminRoleFromStaffRole,
  resolveAdminCapabilities,
  type EventWithTerms,
} from "@church-site/domain";
import {
  getAdminEvent,
  eventToFormState,
  type AdminTaxonomyGroup,
} from "@church-site/data-access";
import { DEFAULT_LOCALE, type Locale } from "@church-site/ui";
import { getLocale } from "@church-site/ui/server";

export const metadata = {
  title: "تعديل فعالية — لوحة تحكم كنيسة القديسين",
};

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);
  const capabilities = resolveAdminCapabilities(role);
  const roleLabel = role ? ADMIN_ROLE_LABELS_AR[role] : "غير معروف";

  if (!capabilities.update) {
    return <AdminForbiddenNotice capability="event:update" roleLabel={roleLabel} />;
  }

  let locale: Locale = DEFAULT_LOCALE;
  let payload: { event: EventWithTerms; taxonomy: AdminTaxonomyGroup[] } | null = null;
  let readFailed = false;

  try {
    locale = await getLocale();
    const read = await getAdminEvent(id);
    payload = read ? { event: read.row.event, taxonomy: read.taxonomy } : null;
  } catch (error) {
    // Server-side detail only — the markup carries no driver name, code or stack.
    console.error("[admin] event read failed", {
      id,
      reason: error instanceof Error ? error.message : String(error),
    });
    readFailed = true;
  }

  // Thrown OUTSIDE the catch on purpose: `notFound()` works by throwing, and catching it here would
  // turn "this row does not exist" into "the store is broken".
  if (!readFailed && !payload) notFound();

  if (readFailed || !payload) {
    return (
      <div className="max-w-3xl space-y-6">
        <AdminPageHeader
          title="تعديل فعالية"
          description="تعذّر تحميل بيانات هذه الفعالية من مخزن البيانات."
          roleLabel={roleLabel}
        />
        <AdminFeedback
          tone="error"
          title="تعذّر تحميل البيانات"
          message="لم يتغيّر أي محتوى. أعد تحميل الصفحة، وإن تكرر الخطأ راجع مسؤول النظام مع رقم الفعالية أدناه."
        />
        <p className="font-english text-[11px] text-slate-500" dir="ltr">
          {id}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <AdminPageHeader
        title="تعديل فعالية"
        description="عدّل بيانات الفعالية ثم احفظ. كل حفظ يُسجَّل في سجل التدقيق باسمك ووقت التعديل مع الحالة قبل وبعد."
        roleLabel={roleLabel}
      >
        <Link href="/events" className={ADMIN_BUTTON_SECONDARY}>
          العودة إلى القائمة
        </Link>
        <Link href={`/events/${encodeURIComponent(payload.event.slug)}`} className={ADMIN_BUTTON_SECONDARY}>
          معاينة الصفحة العامة
        </Link>
      </AdminPageHeader>

      <EventEditorForm
        mode="edit"
        eventId={payload.event.id}
        initial={eventToFormState(payload.event)}
        taxonomy={payload.taxonomy}
        locale={locale}
        capabilities={capabilities}
        seriesId={payload.event.seriesId}
      />
    </div>
  );
}
