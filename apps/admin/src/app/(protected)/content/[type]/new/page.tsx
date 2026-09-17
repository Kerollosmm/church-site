// apps/admin/src/app/(protected)/content/[type]/new/page.tsx
// Screen for creating a new dynamic Content Entry.

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
import { DynamicEntryForm } from "@/components/admin/DynamicEntryForm";

export const metadata = {
  title: "إضافة محتوى جديد — لوحة إدارة كنيسة القديسين",
};

export const dynamic = "force-dynamic";

interface NewContentEntryPageProps {
  params: Promise<{ type: string }>;
}

export default async function NewContentEntryPage({
  params,
}: NewContentEntryPageProps): Promise<React.ReactElement> {
  const { type: typeSlug } = await params;
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);
  const capabilities = resolveAdminCapabilities(role);
  const roleLabel = role ? ADMIN_ROLE_LABELS_AR[role] : "غير معروف";

  if (role === null || !can(role, "content:create")) {
    return (
      <AdminForbiddenNotice
        roleLabel={roleLabel}
        capability="content:create"
      />
    );
  }

  const repo = getContentTypeRepository();
  const contentType = await repo.getContentTypeBySlug(typeSlug);

  if (!contentType) {
    notFound();
  }

  const fields = await repo.listContentFields(contentType.id);

  // If any field is relation type, load candidate entries
  const relationOptions: Record<string, Array<{ value: string; label: string }>> = {};
  for (const field of fields) {
    if (field.fieldType === "relation" && field.options) {
      const targetTypeSlug = typeof field.options === "string" ? field.options : (field.options as any).targetType;
      if (targetTypeSlug) {
        const targetType = await repo.getContentTypeBySlug(targetTypeSlug);
        if (targetType) {
          const targetEntries = await repo.listContentEntries(targetType.slug, {
            status: "published",
          });
          relationOptions[field.slug] = targetEntries.map((e) => ({
            value: e.slug,
            label: (e.data.title || e.data.name || e.slug) as string,
          }));
        }
      }
    }
  }

  const canPublish = can(role, "content:publish");

  return (
    <div className="max-w-7xl space-y-6">
      <AdminPageHeader
        title={`إضافة محتوى جديد في «${contentType.nameAr}»`}
        description="إدخال بيانات المحتوى وفق الحقول المعرفة للنموذج. يمكنك حفظ المحتوى كمسودة أو نشره فوراً."
        roleLabel={roleLabel}
        readOnly={false}
      >
        <Link href={`/content/${contentType.slug}`} className={ADMIN_BUTTON_SECONDARY}>
          الرجوع للقائمة
        </Link>
      </AdminPageHeader>

      <DynamicEntryForm
        contentType={contentType}
        fields={fields}
        relationOptions={relationOptions}
        canPublish={canPublish}
        canDelete={false}
      />
    </div>
  );
}
