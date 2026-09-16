// src/app/admin/(protected)/events/new/page.tsx
// `/admin/events/new` — the create editor.
//
// The capability is checked BEFORE the form is built: a role without `event:create` gets an explicit
// "outside your role" screen (and the action would refuse anyway, recording the refusal). Rendering a
// form that cannot be saved would be a worse answer than saying so.

import React from "react";
import Link from "next/link";
import { EventEditorForm } from "../_components/EventEditorForm";
import { AdminForbiddenNotice } from "@/components/admin/AdminForbiddenNotice";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ADMIN_BUTTON_SECONDARY } from "@/components/admin/admin-ui";
import { requireStaff } from "@/lib/auth/require-staff";
import { ADMIN_ROLE_LABELS_AR, adminRoleFromStaffRole, resolveAdminCapabilities } from "@/lib/domain/capabilities";
import { getAdminTaxonomy } from "@/lib/events/admin";
import { emptyEventFormState } from "@/lib/events/admin-form";
import { getLocale } from "@/lib/i18n/server";

export const metadata = {
  title: "فعالية جديدة — لوحة تحكم كنيسة القديسين",
};

export default async function NewEventPage(): Promise<React.ReactElement> {
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);
  const capabilities = resolveAdminCapabilities(role);
  const roleLabel = role ? ADMIN_ROLE_LABELS_AR[role] : "غير معروف";

  if (!capabilities.create) {
    return <AdminForbiddenNotice capability="event:create" roleLabel={roleLabel} />;
  }

  const [locale, taxonomy] = await Promise.all([getLocale(), getAdminTaxonomy()]);

  return (
    <div className="max-w-5xl space-y-6">
      <AdminPageHeader
        title="فعالية جديدة"
        description="أدخل بيانات الفعالية بالعربية (وأضف الإنجليزية إن توفّرت الترجمة)، وحدّد موعدها بتوقيت القاهرة، واربطها بالمكان والتصنيفات. تُنشأ الفعالية كمسودة حتى تنشرها."
        roleLabel={roleLabel}
      >
        <Link href="/admin/events" className={ADMIN_BUTTON_SECONDARY}>
          العودة إلى القائمة
        </Link>
      </AdminPageHeader>

      <EventEditorForm
        mode="create"
        initial={emptyEventFormState()}
        taxonomy={taxonomy}
        locale={locale}
        capabilities={capabilities}
      />
    </div>
  );
}
