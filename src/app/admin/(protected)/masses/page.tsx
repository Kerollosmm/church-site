import React from "react";
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
  const [masses, altars] = await Promise.all([getWeeklyMasses(), getAltars()]);

  return (
    <AdminMassesTable
      masses={masses}
      altars={altars.map((altar) => ({ id: altar.id, name_ar: altar.name_ar }))}
    />
  );
}
