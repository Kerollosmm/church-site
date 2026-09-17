// apps/admin/src/lib/auth/roles.ts
// Pure role vocabulary for the administrative portal.

import type { StaffRoleEnum } from "@church-site/domain";

export const ADMIN_PORTAL_ROLES = ["admin", "secretary"] as const;

export type AdminPortalRole = (typeof ADMIN_PORTAL_ROLES)[number];

export function isAdminPortalRole(role: string | null | undefined): role is AdminPortalRole {
  return typeof role === "string" && (ADMIN_PORTAL_ROLES as readonly string[]).includes(role);
}

export const ROLE_LABELS_AR: Record<StaffRoleEnum, string> = {
  admin: "مسؤول النظام",
  secretary: "سكرتارية الكنيسة",
  priest: "كاهن",
  servant: "خادم",
};
