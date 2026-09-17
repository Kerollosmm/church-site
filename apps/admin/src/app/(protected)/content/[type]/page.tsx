// apps/admin/src/app/(protected)/content/[type]/page.tsx
// Management list of entries for a specific Content Type.

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
import { ContentEntryList } from "@/components/content/ContentEntryList";

export const metadata = {
  title: "إدارة المحتوى — لوحة إدارة كنيسة القديسين",
};

export const dynamic = "force-dynamic";

interface ContentTypeEntriesPageProps {
  params: Promise<{ type: string }>;
}

export default async function ContentTypeEntriesPage({
  params,
}: ContentTypeEntriesPageProps): Promise<React.ReactElement> {
  const { type: typeSlug } = await params;
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

  const [fields, entries] = await Promise.all([
    repo.listContentFields(contentType.id),
    repo.listContentEntries(contentType.slug),
  ]);

  const canCreate = can(role, "content:create");
  const canEdit = can(role, "content:update");

  return (
    <div className="max-w-7xl space-y-6">
      <AdminPageHeader
        title={`إدارة محتوى «${contentType.nameAr}»`}
        description={
          `استعراض وتحرير ونشر عناصر المحتوى التابعة لنموذج ${contentType.nameAr} (${contentType.slug}).`
        }
        roleLabel={roleLabel}
        readOnly={!canEdit}
      >
        <Link href="/content-types" className={ADMIN_BUTTON_SECONDARY}>
          نماذج المحتوى
        </Link>
        <Link
          href={`/content-types/${contentType.id}/fields`}
          className={ADMIN_BUTTON_SECONDARY}
        >
          الحقول المعرفة ({fields.length})
        </Link>
      </AdminPageHeader>

      <ContentEntryList
        contentType={contentType}
        fields={fields}
        entries={entries}
        canCreate={canCreate}
        canEdit={canEdit}
      />
    </div>
  );
}
