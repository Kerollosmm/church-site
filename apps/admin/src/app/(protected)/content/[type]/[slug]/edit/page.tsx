// apps/admin/src/app/(protected)/content/[type]/[slug]/edit/page.tsx
// Screen for editing an existing dynamic Content Entry.

import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/require-staff";
import {
  ADMIN_ROLE_LABELS_AR,
  adminRoleFromStaffRole,
  can,
  resolveAdminCapabilities,
  resolveRelationTarget,
} from "@church-site/domain";
import { getContentTypeRepository } from "@church-site/data-access";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminForbiddenNotice } from "@/components/admin/AdminForbiddenNotice";
import { ADMIN_BUTTON_SECONDARY } from "@/components/admin/admin-ui";
import { DynamicEntryForm } from "@/components/admin/DynamicEntryForm";

export const metadata = {
  title: "تعديل المحتوى — لوحة إدارة كنيسة القديسين",
};

export const dynamic = "force-dynamic";

interface EditContentEntryPageProps {
  params: Promise<{ type: string; slug: string }>;
}

export default async function EditContentEntryPage({
  params,
}: EditContentEntryPageProps): Promise<React.ReactElement> {
  const { type: typeSlug, slug: entrySlug } = await params;
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
  const contentType = await repo.getContentTypeBySlug(typeSlug);

  if (!contentType) {
    notFound();
  }

  const entry = await repo.getContentEntry(contentType.slug, entrySlug);
  if (!entry) {
    notFound();
  }

  const fields = await repo.listContentFields(contentType.id);

  // If any field is relation type, load candidate entries
  const relationOptions: Record<string, Array<{ value: string; label: string }>> = {};
  for (const field of fields) {
    if (field.fieldType === "relation" && field.options) {
      const targetTypeSlug = resolveRelationTarget(field.options);
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

  const canEdit = can(role, "content:update");
  const canPublish = can(role, "content:publish");
  const canDelete = can(role, "content:delete");

  return (
    <div className="max-w-7xl space-y-6">
      <AdminPageHeader
        title={`تعديل المحتوى: ${entry.slug} (${contentType.nameAr})`}
        description="تعديل بيانات المحتوى وحالته ونشره."
        roleLabel={roleLabel}
        readOnly={!canEdit}
      >
        <Link href={`/content/${contentType.slug}`} className={ADMIN_BUTTON_SECONDARY}>
          الرجوع للقائمة
        </Link>
        {entry.status === "published" && (
          <a
            href={`/content/${contentType.slug}/${entry.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className={ADMIN_BUTTON_SECONDARY}
          >
            معاينة في الموقع
          </a>
        )}
      </AdminPageHeader>

      <DynamicEntryForm
        contentType={contentType}
        fields={fields}
        entryId={entry.id}
        initialSlug={entry.slug}
        initialStatus={entry.status}
        initialData={entry.data}
        relationOptions={relationOptions}
        canPublish={canPublish}
        canDelete={canDelete}
      />
    </div>
  );
}
