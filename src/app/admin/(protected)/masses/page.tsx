import React from "react";
import { requireStaff } from "@/lib/auth/require-staff";
import { adminRoleFromStaffRole, can } from "@/lib/domain/capabilities";
import { getAltars, getWeeklyMasses } from "@/lib/queries";
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
  const canDelete = can(role, "mass:delete");
  const canEdit = can(role, "mass:update");
  const canCreate = can(role, "mass:create");

  return (
    <AdminMassesTable
      masses={masses}
      altars={altars.map((altar) => ({ id: altar.id, name_ar: altar.name_ar }))}
      canDelete={canDelete}
      canEdit={canEdit}
      canCreate={canCreate}
    />
  );
}
