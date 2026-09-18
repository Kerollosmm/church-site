// apps/admin/src/app/(protected)/navigation/page.tsx
// Management surface for Parish Navigation Menu CMS.

import React from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ADMIN_BUTTON_SECONDARY } from "@/components/admin/admin-ui";
import { requireStaff } from "@/lib/auth/require-staff";
import {
  ADMIN_ROLE_LABELS_AR,
  adminRoleFromStaffRole,
  can,
  type NavigationMenuItem,
} from "@church-site/domain";
import { getParishNavigationRepository } from "@church-site/data-access";
import { AdminNavigationTable } from "./AdminNavigationTable";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "شريط التنقل — لوحة تحكم كنيسة القديسين",
};

export default async function AdminNavigationPage(): Promise<React.ReactElement> {
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);

  if (!role || !can(role, "navigation:read")) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-center font-heading">
        غير مصرح لك بالوصول إلى إدارة شريط التنقل.
      </div>
    );
  }

  const roleLabel = role ? ADMIN_ROLE_LABELS_AR[role] : "غير معروف";
  const canWrite = can(role, "navigation:write");

  let items: NavigationMenuItem[] = [];
  let readFailed = false;

  try {
    const repo = getParishNavigationRepository();
    items = await repo.listItems();
  } catch (error) {
    console.error("[admin] parish navigation read failed", {
      reason: error instanceof Error ? error.message : String(error),
    });
    readFailed = true;
  }

  return (
    <div className="max-w-7xl space-y-6">
      <AdminPageHeader
        title="شريط التنقل وقوائم الموقع"
        description="إدارة روابط الترويسة الرئيسية للموقع، القوائم المنسدلة، ترتيبها، وتفعيلها أو إخفائها بسهولة."
        roleLabel={roleLabel}
        readOnly={!canWrite}
      >
        <Link href="/audit" className={ADMIN_BUTTON_SECONDARY}>
          سجل التدقيق
        </Link>
      </AdminPageHeader>

      {readFailed ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
          فشل في تحميل عناصر شريط التنقل. يرجى المحاولة مرة أخرى لاحقاً.
        </div>
      ) : (
        <AdminNavigationTable
          initialItems={items}
          canWrite={canWrite}
        />
      )}
    </div>
  );
}
