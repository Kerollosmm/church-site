import React from "react";
import Link from "next/link";
import { FileClock } from "lucide-react";
import { requireStaff } from "@/lib/auth/require-staff";
import { ADMIN_ROLE_LABELS_AR, adminRoleFromStaffRole, can } from "@church-site/domain";
import { getAltars, getWeeklyMasses } from "@church-site/data-access";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ADMIN_BUTTON_SECONDARY } from "@/components/admin/admin-ui";
import { AdminMassesTable } from "./AdminMassesTable";

export const metadata = {
  title: "إدارة جداول القداسات — لوحة تحكم كنيسة القديسين",
};

/**
 * `/admin/masses` — reads the real weekly schedule and the altars through the typed data layer
 * instead of importing the seed directly. The area is `force-dynamic` (see the protected layout),
 * so the numbers shown are the current ones.
 */
export default async function AdminMassesPage() {
  const [session, masses, altars] = await Promise.all([
    requireStaff(),
    getWeeklyMasses(),
    getAltars(),
  ]);

  const role = adminRoleFromStaffRole(session.role);
  const roleLabel = role ? ADMIN_ROLE_LABELS_AR[role] : "غير معروف";
  const canDelete = can(role, "mass:delete");
  const canEdit = can(role, "mass:update");
  const canCreate = can(role, "mass:create");

  return (
    <div className="max-w-7xl space-y-6">
      <AdminPageHeader
        title="إدارة جداول القداسات الإلهية والعشيات"
        description="إدارة مواعيد القداسات الأسبوعية وتعيين المذابح والتوقيتات وتفعيل أو تعطيل المواعيد، مع ظهور التحديثات فورياً في البوابة العامة."
        roleLabel={roleLabel}
        readOnly={!canEdit && !canCreate}
      >
        <Link href="/audit" className={ADMIN_BUTTON_SECONDARY}>
          <FileClock aria-hidden="true" className="h-4 w-4" />
          <span>سجل التدقيق</span>
        </Link>
      </AdminPageHeader>

      <AdminMassesTable
        masses={masses}
        altars={altars.map((altar) => ({ id: altar.id, name_ar: altar.name_ar }))}
        canDelete={canDelete}
        canEdit={canEdit}
        canCreate={canCreate}
      />
    </div>
  );
}

