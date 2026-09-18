// apps/admin/src/app/(protected)/services/page.tsx
// Management surface for Parish Facilities & Public Services CMS.

import React from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ADMIN_BUTTON_SECONDARY } from "@/components/admin/admin-ui";
import { requireStaff } from "@/lib/auth/require-staff";
import {
  ADMIN_ROLE_LABELS_AR,
  adminRoleFromStaffRole,
  can,
  type ParishFacility,
} from "@church-site/domain";
import { getParishFacilityRepository } from "@church-site/data-access";
import { AdminServicesTable } from "./AdminServicesTable";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "الخدمات والمرافق — لوحة تحكم كنيسة القديسين",
};

export default async function AdminServicesPage(): Promise<React.ReactElement> {
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);

  if (!role || !can(role, "services:read")) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-center font-heading">
        غير مصرح لك بالوصول إلى إدارة خدمات ومرافق الكنيسة.
      </div>
    );
  }

  const roleLabel = role ? ADMIN_ROLE_LABELS_AR[role] : "غير معروف";
  const canWrite = can(role, "services:write");
  const canDelete = can(role, "services:delete");

  let services: ParishFacility[] = [];
  let readFailed = false;

  try {
    const repo = getParishFacilityRepository();
    services = await repo.listFacilities();
  } catch (error) {
    console.error("[admin] parish facilities read failed", {
      reason: error instanceof Error ? error.message : String(error),
    });
    readFailed = true;
  }

  return (
    <div className="max-w-7xl space-y-6">
      <AdminPageHeader
        title="الخدمات والمرافق الكنسية"
        description="إدارة الخدمات التنموية والتعليمية والطبية والمجتمعية التابعة للكنيسة، ومواعيدها، وأرقام التواصل، وبياناتها المعروضة للجمهور."
        roleLabel={roleLabel}
        readOnly={!canWrite}
      >
        <Link href="/audit" className={ADMIN_BUTTON_SECONDARY}>
          سجل التدقيق
        </Link>
      </AdminPageHeader>

      {readFailed ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
          فشل في تحميل قائمة الخدمات والمرافق. يرجى المحاولة مرة أخرى لاحقاً.
        </div>
      ) : (
        <AdminServicesTable
          initialServices={services}
          canWrite={canWrite}
          canDelete={canDelete}
        />
      )}
    </div>
  );
}
