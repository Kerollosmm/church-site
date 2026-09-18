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
import type { AuditEntityType } from "./types";

export const ADMIN_PORTAL_ROLES = ["admin", "secretary"] as const;
export type AdminPortalRole = (typeof ADMIN_PORTAL_ROLES)[number];

export function isAdminPortalRole(role: string | null | undefined): role is AdminPortalRole {
  return typeof role === "string" && (ADMIN_PORTAL_ROLES as readonly string[]).includes(role);
}

export type AdminRole = "owner" | "editor" | "viewer";

/** Every action the event system can authorize. Names are `resource:verb`. */
export type Capability =
  // --- reads (granted to every role, including viewer) ---
  | "event:read"
  | "series:read"
  | "taxonomy:read"
  | "media:read"
  | "audit:read"
  | "subscribers:read"
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
  | "subscribers:write"
  | "cache:republish"
  | "users:manage"
  // --- masses ---
  | "mass:read"
  | "mass:create"
  | "mass:update"
  | "mass:delete"
  | "mass:toggle"
  // --- content types engine ---
  | "content:read"
  | "content:create"
  | "content:update"
  | "content:delete"
  | "content:publish"
  | "content:manage"
  // --- parish videos ---
  | "videos:read"
  | "videos:write"
  | "videos:delete"
  // --- services (CMS) ---
  | "services:read"
  | "services:write"
  | "services:delete"
  // --- navigation (CMS) ---
  | "navigation:read"
  | "navigation:write"
  // --- external assets ---
  | "assets:link";

/** What a `viewer` may do: read everything the event system exposes to the portal. */
const READ_ONLY_CAPABILITIES = [
  "event:read",
  "series:read",
  "taxonomy:read",
  "media:read",
  "audit:read",
  "subscribers:read",
  "mass:read",
  "content:read",
  "videos:read",
  "services:read",
  "navigation:read",
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
  "mass:create",
  "mass:update",
  "mass:toggle",
  "content:create",
  "content:update",
  "content:publish",
  "videos:write",
  "services:write",
  "navigation:write",
  "assets:link",
  // Editing the notification list is an editorial act (retiring a subscription), not a destructive
  // one — the row is kept, so an editor may do it and only an owner can delete (there is no delete).
  "subscribers:write",
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
  "mass:delete",
  "content:delete",
  "content:manage",
  "videos:delete",
  "services:delete",
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

/** Arabic display names for the three roles, used by the admin shell and by refusal entries. */
export const ADMIN_ROLE_LABELS_AR: Record<AdminRole, string> = {
  owner: "مالك (مسؤول النظام)",
  editor: "محرر (سكرتارية الكنيسة)",
  viewer: "قارئ (عرض فقط)",
};

// ============================================================================
// Capability → audit vocabulary
// ============================================================================

/** Arabic name of each capability, as it appears in a refusal entry ("رُفض إجراء «حذف فعالية»"). */
export const CAPABILITY_LABELS_AR: Record<Capability, string> = {
  "event:read": "قراءة الفعاليات",
  "series:read": "قراءة السلاسل المتكررة",
  "taxonomy:read": "قراءة التصنيفات",
  "media:read": "قراءة بيانات الوسائط",
  "audit:read": "قراءة سجل التدقيق",
  "subscribers:read": "قراءة قائمة المشتركين في التنبيهات",
  "event:create": "إنشاء فعالية",
  "event:update": "تعديل فعالية",
  "event:publish": "نشر فعالية",
  "event:unpublish": "إلغاء نشر فعالية",
  "event:cancel": "إلغاء فعالية",
  "event:reschedule": "إعادة جدولة فعالية",
  "event:duplicate": "نسخ فعالية",
  "event:delete": "حذف فعالية",
  "series:create": "إنشاء سلسلة متكررة",
  "series:update": "تعديل سلسلة متكررة",
  "series:cancel": "إلغاء سلسلة متكررة",
  "series:delete": "حذف سلسلة متكررة",
  "exception:write": "تعديل استثناء موعد",
  "exception:delete": "حذف استثناء موعد",
  "taxonomy:write": "تعديل التصنيفات",
  "taxonomy:delete": "حذف مصطلح تصنيف",
  "media:create": "تسجيل وسائط",
  "media:update": "تعديل بيانات وسائط",
  "media:delete": "حذف بيانات وسائط",
  "subscribers:write": "إيقاف أو تنشيط اشتراك في التنبيهات",
  "cache:republish": "مسح ذاكرة الموقع المؤقتة",
  "users:manage": "إدارة المستخدمين",
  "mass:read": "قراءة القداسات",
  "mass:create": "إنشاء قداس",
  "mass:update": "تعديل قداس",
  "mass:delete": "حذف قداس",
  "mass:toggle": "تغيير حالة القداس",
  "content:read": "قراءة المحتوى المخصص",
  "content:create": "إنشاء عنصر محتوى",
  "content:update": "تعديل عنصر محتوى",
  "content:delete": "حذف عنصر محتوى",
  "content:publish": "نشر عنصر محتوى",
  "content:manage": "إدارة أنواع وحقول المحتوى",
  "videos:read": "قراءة الفيديوهات",
  "videos:write": "إضافة وتعديل الفيديوهات",
  "videos:delete": "حذف فيديو",
  "services:read": "قراءة خدمات الكنيسة",
  "services:write": "إضافة وتعديل الخدمات",
  "services:delete": "حذف خدمة",
  "navigation:read": "قراءة عناصر شريط التنقل",
  "navigation:write": "تعديل وترتيب شريط التنقل",
  "assets:link": "ربط أصل خارجي",
};

/**
 * The audit entity each capability acts on. A refusal entry names the thing the attempt was about,
 * so the audit screen reads "رفض صلاحية · حذف فعالية" instead of an unattributed denial.
 */
export const CAPABILITY_AUDIT_ENTITY: Record<Capability, AuditEntityType> = {
  "event:read": "event",
  "series:read": "event_series",
  "taxonomy:read": "taxonomy_term",
  "media:read": "media",
  "audit:read": "event",
  "subscribers:read": "subscriber",
  "event:create": "event",
  "event:update": "event",
  "event:publish": "event",
  "event:unpublish": "event",
  "event:cancel": "event",
  "event:reschedule": "event",
  "event:duplicate": "event",
  "event:delete": "event",
  "series:create": "event_series",
  "series:update": "event_series",
  "series:cancel": "event_series",
  "series:delete": "event_series",
  "exception:write": "event_exception",
  "exception:delete": "event_exception",
  "taxonomy:write": "taxonomy_term",
  "taxonomy:delete": "taxonomy_term",
  "media:create": "media",
  "media:update": "media",
  "media:delete": "media",
  "subscribers:write": "subscriber",
  "cache:republish": "event",
  "users:manage": "event",
  "mass:read": "mass",
  "mass:create": "mass",
  "mass:update": "mass",
  "mass:delete": "mass",
  "mass:toggle": "mass",
  "content:read": "content_entry",
  "content:create": "content_entry",
  "content:update": "content_entry",
  "content:delete": "content_entry",
  "content:publish": "content_entry",
  "content:manage": "content_type",
  "videos:read": "video",
  "videos:write": "video",
  "videos:delete": "video",
  "services:read": "service",
  "services:write": "service",
  "services:delete": "service",
  "navigation:read": "navigation",
  "navigation:write": "navigation",
  "assets:link": "asset",
};

/**
 * How a refused attempt is written into the audit trail: the entity the attempt was about and a
 * one-line Arabic summary naming the capability AND the acting role (the actor's name is already on
 * the entry). PURE — the caller supplies the two values to `recordAuditNote()`.
 */
export function describeRefusal(
  capability: Capability,
  role: AdminRole | null
): { entityType: AuditEntityType; summary: string } {
  return {
    entityType: CAPABILITY_AUDIT_ENTITY[capability],
    summary: `رُفض إجراء «${CAPABILITY_LABELS_AR[capability]}» — الدور الحالي (${
      role ? ADMIN_ROLE_LABELS_AR[role] : "غير معروف"
    }) لا يملك هذه الصلاحية.`,
  };
}

// ============================================================================
// The resolved capability set a screen renders with
// ============================================================================

/**
 * The capabilities an admin SCREEN needs as plain booleans, resolved once on the server and passed
 * down as props. The UI uses it to decide what to offer; the server actions re-check the same
 * decision through `can()` before touching anything, so hiding a control is convenience, never
 * security (see systemPatterns §26).
 */
export interface AdminCapabilities {
  read: boolean;
  create: boolean;
  update: boolean;
  publish: boolean;
  cancel: boolean;
  reschedule: boolean;
  duplicate: boolean;
  delete: boolean;
  seriesWrite: boolean;
  exceptionWrite: boolean;
  taxonomyWrite: boolean;
  mediaWrite: boolean;
  mediaDelete: boolean;
  republish: boolean;
  auditRead: boolean;
  subscribersRead: boolean;
  subscribersWrite: boolean;
  contentRead: boolean;
  contentWrite: boolean;
  contentPublish: boolean;
  contentDelete: boolean;
  contentManage: boolean;
  videosRead: boolean;
  videosWrite: boolean;
  videosDelete: boolean;
  servicesRead: boolean;
  servicesWrite: boolean;
  servicesDelete: boolean;
  navigationRead: boolean;
  navigationWrite: boolean;
  assetsLink: boolean;
}

/** Derives the screen-facing capability set from ONE role, through the same `can()` table. */
export function resolveAdminCapabilities(role: AdminRole | null): AdminCapabilities {
  return {
    read: can(role, "event:read"),
    create: can(role, "event:create"),
    update: can(role, "event:update"),
    publish: can(role, "event:publish"),
    cancel: can(role, "event:cancel"),
    reschedule: can(role, "event:reschedule"),
    duplicate: can(role, "event:duplicate"),
    delete: can(role, "event:delete"),
    seriesWrite: can(role, "series:create") && can(role, "series:update"),
    exceptionWrite: can(role, "exception:write"),
    taxonomyWrite: can(role, "taxonomy:write"),
    mediaWrite: can(role, "media:create") && can(role, "media:update"),
    mediaDelete: can(role, "media:delete"),
    republish: can(role, "cache:republish"),
    auditRead: can(role, "audit:read"),
    subscribersRead: can(role, "subscribers:read"),
    subscribersWrite: can(role, "subscribers:write"),
    contentRead: can(role, "content:read"),
    contentWrite: can(role, "content:create") && can(role, "content:update"),
    contentPublish: can(role, "content:publish"),
    contentDelete: can(role, "content:delete"),
    contentManage: can(role, "content:manage"),
    videosRead: can(role, "videos:read"),
    videosWrite: can(role, "videos:write"),
    videosDelete: can(role, "videos:delete"),
    servicesRead: can(role, "services:read"),
    servicesWrite: can(role, "services:write"),
    servicesDelete: can(role, "services:delete"),
    navigationRead: can(role, "navigation:read"),
    navigationWrite: can(role, "navigation:write"),
    assetsLink: can(role, "assets:link"),
  };
}

/** True when the role may change nothing at all — the read-only state the admin renders. */
export function isReadOnlyRole(capabilities: AdminCapabilities): boolean {
  return !capabilities.create && !capabilities.update && !capabilities.publish;
}
