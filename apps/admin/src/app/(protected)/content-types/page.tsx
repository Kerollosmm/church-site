// apps/admin/src/app/(protected)/content-types/page.tsx
// Management screen for Content Types (EAV-lite models).
// Protected by requireStaff() and content:manage capability.

import React from "react";
import Link from "next/link";
import { requireStaff } from "@/lib/auth/require-staff";
import {
  ADMIN_ROLE_LABELS_AR,
  adminRoleFromStaffRole,
  can,
  resolveAdminCapabilities,
} from "@church-site/domain";
import { getContentTypeRepository } from "@church-site/data-access";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminForbiddenNotice } from "@/components/admin/AdminForbiddenNotice";
import { ADMIN_BUTTON_SECONDARY } from "@/components/admin/admin-ui";
import { ContentTypeManager } from "@/components/content-types/ContentTypeManager";

export const metadata = {
  title: "نماذج المحتوى (CMS) — لوحة إدارة كنيسة القديسين",
};

export const dynamic = "force-dynamic";

export default async function ContentTypesPage(): Promise<React.ReactElement> {
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);
  const capabilities = resolveAdminCapabilities(role);
  const roleLabel = role ? ADMIN_ROLE_LABELS_AR[role] : "غير معروف";

  if (role === null || !can(role, "content:read")) {
    return (
      <AdminForbiddenNotice
        roleLabel={roleLabel}
        capability="content:read"
      />
    );
  }

  const repo = getContentTypeRepository();
  const types = await repo.listContentTypes({ includeInactive: true });

  // Aggregate field counts and entry counts
  const fieldCounts: Record<string, number> = {};
  const entryCounts: Record<string, number> = {};

  await Promise.all(
    types.map(async (t) => {
      const fields = await repo.listContentFields(t.id);
      const entries = await repo.listContentEntries(t.slug);
      fieldCounts[t.id] = fields.length;
      entryCounts[t.id] = entries.length;
    })
  );

  const canManage = can(role, "content:manage");

  return (
    <div className="max-w-7xl space-y-6">
      <AdminPageHeader
        title="نماذج المحتوى الديناميكية (CMS)"
        description="إدارة نماذج المحتوى وحقولها المعرفة مرناً بدون كود. يمكن للخدام إنشاء نماذج جديدة (عظات، مقالات، خدمات، تنويهات) وتحديد حقولها ونشر المحتوى المرتبط بها فوراً."
        roleLabel={roleLabel}
        readOnly={!canManage}
      >
        <Link href="/media" className={ADMIN_BUTTON_SECONDARY}>
          مكتبة الوسائط
        </Link>
        <Link href="/audit" className={ADMIN_BUTTON_SECONDARY}>
          سجل التدقيق
        </Link>
      </AdminPageHeader>

      <ContentTypeManager
        types={types}
        fieldCounts={fieldCounts}
        entryCounts={entryCounts}
        readOnly={!canManage}
      />
    </div>
  );
}
