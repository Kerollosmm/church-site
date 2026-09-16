// src/lib/auth/roles.ts
// Pure role vocabulary for the administrative portal (no server-only APIs, safe to import anywhere).

import type { StaffRoleEnum } from "@/types/database.types";

/**
 * Roles allowed to enter the `/admin` management area.
 *
 * BACKEND_AND_DATA_SPEC.md §8 scopes the dashboard to the parish secretariat and the
 * service supervisors, and `profiles.role` distinguishes four roles:
 *   admin / secretary → administrative management of the portal
 *   priest / servant  → pastoral and service roles without a management area of their own
 *      (they keep their database write access through `is_staff()` RLS policies; only the
 *       portal shell is restricted). Staff management (D9) remains `admin`-only.
 */
export const ADMIN_PORTAL_ROLES = ["admin", "secretary"] as const;

export type AdminPortalRole = (typeof ADMIN_PORTAL_ROLES)[number];

/** Type guard: is this `profiles.role` value allowed into `/admin`? */
export function isAdminPortalRole(role: string | null | undefined): role is AdminPortalRole {
  return typeof role === "string" && (ADMIN_PORTAL_ROLES as readonly string[]).includes(role);
}

/** Arabic display labels for every `profiles.role` value. */
export const ROLE_LABELS_AR: Record<StaffRoleEnum, string> = {
  admin: "مسؤول النظام",
  secretary: "سكرتارية الكنيسة",
  priest: "كاهن",
  servant: "خادم",
};
