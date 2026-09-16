import React from "react";
import { getClinicSpecialties } from "@/lib/queries";
import { AdminClinicsGrid } from "./AdminClinicsGrid";

export const metadata = {
  title: "إدارة تخصصات المستوصف — لوحة تحكم كنيسة القديسين",
};

/**
 * `/admin/clinics` — reads the specialties through the typed data layer instead of importing the
 * seed directly, exactly like the public `/clinics` pages do.
 */
export default async function AdminClinicsPage() {
  const specialties = await getClinicSpecialties();

  return <AdminClinicsGrid specialties={specialties} />;
}
