// src/lib/domain/capabilities.ts
// The capability model that sits ON TOP of the existing staff roles.
//
// The portal's `profiles.role` vocabulary is untouched (`admin` / `secretary` / `priest` /
// `servant` — see `src/lib/auth/roles.ts` and BACKEND §2.1). This module adds the three roles the
// event system reasons about:
//
//   owner  — full control, including deletion and staff management      (staff role: admin)
//   editor — create / edit / publish events, taxonomy and media         (staff role: secretary)
//   viewer — read-only access to the same screens                       (no staff role maps here today)
//
// `can()` is a PURE function of (role, capability): no session, no database, no framework. Server
// actions call it after `requireStaff()` has established identity, and tests/scripts can call it
// directly. Keeping the decision table in one place is what makes "who may do what" auditable.

import { isAdminPortalRole } from "@/lib/auth/roles";

export type AdminRole = "owner" | "editor" | "viewer";

/** Every action the event system can authorize. Names are `resource:verb`. */
export type Capability =
  // --- reads (granted to every role, including viewer) ---
  | "event:read"
  | "series:read"
  | "taxonomy:read"
  | "media:read"
  | "audit:read"
  // --- event authoring ---
  | "event:create"
  | "event:update"
  | "event:publish"
  | "event:unpublish"
  | "event:cancel"
  | "event:reschedule"
  | "event:duplicate"
  | "event:delete"
  // --- series + occurrence exceptions ---
  | "series:create"
  | "series:update"
  | "series:cancel"
  | "series:delete"
  | "exception:write"
  | "exception:delete"
  // --- taxonomy + media ---
  | "taxonomy:write"
  | "taxonomy:delete"
  | "media:create"
  | "media:update"
  | "media:delete"
  // --- operations ---
  | "cache:republish"
  | "users:manage";

/** What a `viewer` may do: read everything the event system exposes to the portal. */
const READ_ONLY_CAPABILITIES = [
  "event:read",
  "series:read",
  "taxonomy:read",
  "media:read",
  "audit:read",
] as const satisfies readonly Capability[];

/**
 * What an `editor` adds: the whole authoring surface — create/edit/publish/cancel/reschedule/
 * duplicate events, manage taxonomy and media metadata, and republish the cache. DERIVED from the
 * read-only set so a new read capability can never be forgotten for the two higher roles.
 */
const EDITOR_CAPABILITIES = [
  ...READ_ONLY_CAPABILITIES,
  "event:create",
  "event:update",
  "event:publish",
  "event:unpublish",
  "event:cancel",
  "event:reschedule",
  "event:duplicate",
  "series:create",
  "series:update",
  "series:cancel",
  "exception:write",
  "taxonomy:write",
  "media:create",
  "media:update",
  "cache:republish",
] as const satisfies readonly Capability[];

/** What only an `owner` may do: destructive operations and staff management. */
const OWNER_ONLY_CAPABILITIES = [
  "event:delete",
  "series:delete",
  "exception:delete",
  "taxonomy:delete",
  "media:delete",
  "users:manage",
] as const satisfies readonly Capability[];

/** The full decision table. Single source for `can()`. */
const ROLE_CAPABILITIES: Record<AdminRole, readonly Capability[]> = {
  viewer: READ_ONLY_CAPABILITIES,
  editor: EDITOR_CAPABILITIES,
  owner: [...EDITOR_CAPABILITIES, ...OWNER_ONLY_CAPABILITIES],
};

/** Pure capability check. An unknown/absent role can do nothing. */
export function can(role: AdminRole | null | undefined, capability: Capability): boolean {
  if (!role) return false;
  return (ROLE_CAPABILITIES[role] as readonly Capability[]).includes(capability);
}

/**
 * Maps an existing `profiles.role` to an event-system role, or null when the role has no access
 * to the management area at all (`priest` / `servant`, and anything unknown).
 *
 * `admin` → `owner`, `secretary` → `editor`. Priests and servants keep their database write access
 * through `is_staff()` RLS as before; they simply are not part of this decision table.
 */
export function adminRoleFromStaffRole(staffRole: string | null | undefined): AdminRole | null {
  if (!isAdminPortalRole(staffRole)) return null;
  return staffRole === "admin" ? "owner" : "editor";
}

/** Arabic message shown when a signed-in staff member lacks the capability for an action. */
export const CAPABILITY_DENIED_MESSAGE_AR =
  "صلاحياتك الحالية لا تسمح بهذا الإجراء، يرجى مراجعة مسؤول النظام.";
