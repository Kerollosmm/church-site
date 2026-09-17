// apps/admin/src/app/(protected)/content-types/[id]/fields/page.tsx
// Management screen for defining dynamic fields for a specific Content Type.

import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
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
import { ContentFieldsManager } from "@/components/content-types/ContentFieldsManager";

export const metadata = {
  title: "إدارة حقول النموذج — لوحة إدارة كنيسة القديسين",
};

export const dynamic = "force-dynamic";

interface ContentFieldsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContentFieldsPage({
  params,
}: ContentFieldsPageProps): Promise<React.ReactElement> {
  const { id } = await params;
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
  const contentType = await repo.getContentTypeById(id);

  if (!contentType) {
    notFound();
  }

  const fields = await repo.listContentFields(contentType.id);
  const canManage = can(role, "content:manage");

  return (
    <div className="max-w-7xl space-y-6">
      <AdminPageHeader
        title={`حقول نموذج «${contentType.nameAr}» (${contentType.slug})`}
        description="تحديد الحقول المخصصة لهذا النموذج البرمجي (النصوص، النصوص المنسقة، الصور، التواريخ، القوائم). بناء النماذج يتم تلقائياً دون أي كود برمجي."
        roleLabel={roleLabel}
        readOnly={!canManage}
      >
        <Link href="/content-types" className={ADMIN_BUTTON_SECONDARY}>
          قائمة النماذج
        </Link>
        <Link href={`/content/${contentType.slug}`} className={ADMIN_BUTTON_SECONDARY}>
          عرض المحتوى
        </Link>
      </AdminPageHeader>

      <ContentFieldsManager
        contentType={contentType}
        fields={fields}
        readOnly={!canManage}
      />
    </div>
  );
}
