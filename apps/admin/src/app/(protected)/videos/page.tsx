// apps/admin/src/app/(protected)/videos/page.tsx
// Management surface for Parish Videos (External URL Embeds).

import React from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ADMIN_BUTTON_SECONDARY } from "@/components/admin/admin-ui";
import { requireStaff } from "@/lib/auth/require-staff";
import {
  ADMIN_ROLE_LABELS_AR,
  adminRoleFromStaffRole,
  can,
  type ParishVideo,
} from "@church-site/domain";
import { getParishVideoRepository } from "@church-site/data-access";
import { AdminVideosTable } from "./AdminVideosTable";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "فيديوهات الكنيسة — لوحة تحكم كنيسة القديسين",
};

export default async function AdminVideosPage(): Promise<React.ReactElement> {
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);

  if (!role || !can(role, "videos:read")) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-center font-heading">
        غير مصرح لك بالوصول إلى إدارة الفيديوهات.
      </div>
    );
  }

  const roleLabel = role ? ADMIN_ROLE_LABELS_AR[role] : "غير معروف";
  const canWrite = can(role, "videos:write");
  const canDelete = can(role, "videos:delete");

  let videos: ParishVideo[] = [];
  let readFailed = false;

  try {
    const repo = getParishVideoRepository();
    videos = await repo.listVideos();
  } catch (error) {
    console.error("[admin] parish videos read failed", {
      reason: error instanceof Error ? error.message : String(error),
    });
    readFailed = true;
  }

  return (
    <div className="max-w-7xl space-y-6">
      <AdminPageHeader
        title="فيديوهات الكنيسة"
        description="إدارة روابط فيديوهات الكنيسة (YouTube، Facebook، أو روابط مباشرة)، والتحكم في ظهورها وترتيبها في صفحة الكنيسة."
        roleLabel={roleLabel}
        readOnly={!canWrite}
      >
        <Link href="/audit" className={ADMIN_BUTTON_SECONDARY}>
          سجل التدقيق
        </Link>
      </AdminPageHeader>

      {readFailed ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
          فشل في تحميل قائمة الفيديوهات. يرجى المحاولة مرة أخرى لاحقاً.
        </div>
      ) : (
        <AdminVideosTable
          initialVideos={videos}
          canWrite={canWrite}
          canDelete={canDelete}
        />
      )}
    </div>
  );
}
