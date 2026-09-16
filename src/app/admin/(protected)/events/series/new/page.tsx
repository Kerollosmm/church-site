// src/app/admin/(protected)/events/series/new/page.tsx
// `/admin/events/series/new` — create a recurring series.

import React from "react";
import Link from "next/link";
import { SeriesEditorForm } from "../../_components/SeriesEditorForm";
import { AdminForbiddenNotice } from "@/components/admin/AdminForbiddenNotice";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ADMIN_BUTTON_SECONDARY } from "@/components/admin/admin-ui";
import { requireStaff } from "@/lib/auth/require-staff";
import { ADMIN_ROLE_LABELS_AR, adminRoleFromStaffRole, resolveAdminCapabilities } from "@/lib/domain/capabilities";
import { getAdminTaxonomy } from "@/lib/events/admin";
import { emptySeriesFormState } from "@/lib/events/admin-form";
import { getLocale } from "@/lib/i18n/server";

export const metadata = {
  title: "سلسلة متكررة جديدة — لوحة تحكم كنيسة القديسين",
};

export default async function NewSeriesPage(): Promise<React.ReactElement> {
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);
  const capabilities = resolveAdminCapabilities(role);
  const roleLabel = role ? ADMIN_ROLE_LABELS_AR[role] : "غير معروف";

  if (!capabilities.seriesWrite) {
    return <AdminForbiddenNotice capability="series:create" roleLabel={roleLabel} />;
  }

  const [locale, taxonomy] = await Promise.all([getLocale(), getAdminTaxonomy()]);

  return (
    <div className="max-w-5xl space-y-6">
      <AdminPageHeader
        title="سلسلة متكررة جديدة"
        description="تُخزَّن القاعدة مرة واحدة وتُحسب المواعيد منها عند العرض، فلا تُنشأ صفوف لكل موعد. بعد الحفظ يمكنك إلغاء أو نقل موعد واحد دون التأثير على بقية السلسلة."
        roleLabel={roleLabel}
      >
        <Link href="/admin/events" className={ADMIN_BUTTON_SECONDARY}>
          العودة إلى القائمة
        </Link>
      </AdminPageHeader>

      <SeriesEditorForm
        mode="create"
        initial={emptySeriesFormState()}
        taxonomy={taxonomy}
        locale={locale}
        capabilities={capabilities}
      />
    </div>
  );
}
