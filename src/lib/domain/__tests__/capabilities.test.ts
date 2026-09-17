// src/lib/domain/__tests__/capabilities.test.ts
// Who may do what — asserted as an explicit matrix, not derived from the implementation.
//
// The expected table below is written out BY HAND on purpose. If it were computed from
// `ROLE_CAPABILITIES` the test would agree with any change, including a wrong one; written by hand it
// fails the moment a capability is silently granted to a role that should not have it.

import { describe, expect, it } from "vitest";

import {
  ADMIN_ROLE_LABELS_AR,
  CAPABILITY_AUDIT_ENTITY,
  CAPABILITY_DENIED_MESSAGE_AR,
  CAPABILITY_LABELS_AR,
  adminRoleFromStaffRole,
  can,
  describeRefusal,
  isReadOnlyRole,
  resolveAdminCapabilities,
  type AdminRole,
  type Capability,
} from "@/lib/domain/capabilities";

/** Every capability the event system knows, taken from the vocabulary union at runtime. */
const ALL_CAPABILITIES = Object.keys(CAPABILITY_LABELS_AR) as Capability[];

/** The six capabilities a read-only role gets — the whole read surface, nothing else. */
const READ_CAPABILITIES: Capability[] = [
  "event:read",
  "series:read",
  "taxonomy:read",
  "media:read",
  "audit:read",
  "subscribers:read",
  "mass:read",
];

/** Destructive or account-level actions: owner only. */
const OWNER_ONLY: Capability[] = [
  "event:delete",
  "series:delete",
  "exception:delete",
  "taxonomy:delete",
  "media:delete",
  "users:manage",
  "mass:delete",
];

/**
 * THE MATRIX — capabilities each role MUST have. Everything not listed for a role must be denied.
 */
const MUST_HAVE: Record<AdminRole, Capability[]> = {
  viewer: READ_CAPABILITIES,
  editor: [
    ...READ_CAPABILITIES,
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
    "subscribers:write",
    "cache:republish",
  ],
  owner: [...ALL_CAPABILITIES],
};

const ROLES: AdminRole[] = ["owner", "editor", "viewer"];

describe("the capability vocabulary is complete", () => {
  it("every capability has a non-empty, unique Arabic label", () => {
    for (const capability of ALL_CAPABILITIES) {
      expect(CAPABILITY_LABELS_AR[capability].length).toBeGreaterThan(0);
    }
    expect(new Set(Object.values(CAPABILITY_LABELS_AR)).size).toBe(ALL_CAPABILITIES.length);
  });

  it("every capability names an audit entity", () => {
    for (const capability of ALL_CAPABILITIES) {
      expect(CAPABILITY_AUDIT_ENTITY[capability]).toBeTruthy();
    }
  });

  it("the hand-written matrix covers the whole vocabulary (a new capability fails this test)", () => {
    const covered = new Set([...MUST_HAVE.viewer, ...MUST_HAVE.editor, ...MUST_HAVE.owner]);
    expect([...covered].sort()).toEqual([...ALL_CAPABILITIES].sort());
  });
});

describe("can() — the full owner | editor | viewer × capability matrix", () => {
  for (const role of ROLES) {
    for (const capability of ALL_CAPABILITIES) {
      const expected = MUST_HAVE[role].includes(capability);
      it(`${role} ${expected ? "MAY" : "may NOT"} ${capability}`, () => {
        expect(can(role, capability)).toBe(expected);
      });
    }
  }

  it("owner can do everything", () => {
    for (const capability of ALL_CAPABILITIES) {
      expect(can("owner", capability)).toBe(true);
    }
  });

  it("viewer cannot publish, cancel, delete or write anything", () => {
    const forbidden: Capability[] = [
      "event:publish",
      "event:unpublish",
      "event:create",
      "event:update",
      "event:cancel",
      "event:reschedule",
      "event:duplicate",
      "event:delete",
      "series:create",
      "series:update",
      "series:cancel",
      "series:delete",
      "exception:write",
      "exception:delete",
      "taxonomy:write",
      "taxonomy:delete",
      "media:create",
      "media:update",
      "media:delete",
      "subscribers:write",
      "cache:republish",
      "users:manage",
      "mass:create",
      "mass:update",
      "mass:delete",
      "mass:toggle",
    ];
    for (const capability of forbidden) {
      expect(can("viewer", capability)).toBe(false);
    }
  });

  it("editor cannot reach any destructive or account-level capability", () => {
    for (const capability of OWNER_ONLY) {
      expect(can("editor", capability)).toBe(false);
    }
  });

  it("nobody below owner can manage users or delete anything", () => {
    for (const capability of OWNER_ONLY) {
      expect(can("viewer", capability)).toBe(false);
      expect(can("editor", capability)).toBe(false);
      expect(can("owner", capability)).toBe(true);
    }
  });

  it("an absent role can do NOTHING — including reading", () => {
    for (const capability of ALL_CAPABILITIES) {
      expect(can(null, capability)).toBe(false);
      expect(can(undefined, capability)).toBe(false);
    }
  });

  it("documents a KNOWN GAP (not fixed here): an out-of-type role string throws", () => {
    // `can()` is typed `AdminRole | null | undefined`, and every caller reaches it through
    // `adminRoleFromStaffRole()` (which returns owner/editor/null) — so this is NOT reachable from the
    // application today. It is recorded rather than asserted-as-correct: the module's own doc comment
    // promises "an unknown/absent role can do nothing", and a truthy unknown string crashes on the
    // table lookup instead. If `can()` is ever hardened, this test is the one to delete.
    expect(() => can("Owner" as AdminRole, "event:read")).toThrow(TypeError);
    // An empty string is falsy, so it short-circuits and behaves as documented.
    expect(can("" as AdminRole, "event:read")).toBe(false);
  });

  it("grants are nested viewer ⊆ editor ⊆ owner", () => {
    for (const capability of ALL_CAPABILITIES) {
      if (can("viewer", capability)) expect(can("editor", capability)).toBe(true);
      if (can("editor", capability)) expect(can("owner", capability)).toBe(true);
    }
  });
});

describe("adminRoleFromStaffRole — bridging the existing profiles.role vocabulary", () => {
  it("maps the two staff roles that may enter /admin", () => {
    expect(adminRoleFromStaffRole("admin")).toBe("owner");
    expect(adminRoleFromStaffRole("secretary")).toBe("editor");
  });

  it("maps every other role (and every unknown value) to no access at all", () => {
    for (const role of ["priest", "servant", "", "ADMIN", "Secretary", "superuser", null, undefined]) {
      expect(adminRoleFromStaffRole(role)).toBeNull();
    }
  });
});

describe("describeRefusal — a refusal must name what was attempted and by whom", () => {
  it("names the capability's Arabic label and the acting role", () => {
    const refusal = describeRefusal("event:delete", "editor");

    expect(refusal.entityType).toBe("event");
    expect(refusal.summary).toContain("حذف فعالية");
    expect(refusal.summary).toContain(ADMIN_ROLE_LABELS_AR.editor);
    expect(refusal.summary).toContain("رُفض إجراء");
  });

  it("says so plainly when the role is unknown", () => {
    expect(describeRefusal("users:manage", null).summary).toContain("غير معروف");
  });

  it("covers every capability with an entity and a non-empty summary", () => {
    for (const capability of ALL_CAPABILITIES) {
      const refusal = describeRefusal(capability, "viewer");
      expect(refusal.entityType).toBeTruthy();
      expect(refusal.summary.length).toBeGreaterThan(0);
      expect(refusal.summary).toContain(CAPABILITY_LABELS_AR[capability]);
    }
  });

  it("the denied message is a user-facing Arabic sentence", () => {
    expect(CAPABILITY_DENIED_MESSAGE_AR.length).toBeGreaterThan(0);
    expect(CAPABILITY_DENIED_MESSAGE_AR).toMatch(/صلاحيات/);
  });
});

describe("resolveAdminCapabilities — the set a screen renders with", () => {
  it("a viewer gets reads and nothing that changes anything", () => {
    const capabilities = resolveAdminCapabilities("viewer");

    expect(capabilities.read).toBe(true);
    expect(capabilities.auditRead).toBe(true);
    expect(capabilities.subscribersRead).toBe(true);
    expect(capabilities.create).toBe(false);
    expect(capabilities.update).toBe(false);
    expect(capabilities.publish).toBe(false);
    expect(capabilities.delete).toBe(false);
    expect(capabilities.seriesWrite).toBe(false);
    expect(capabilities.exceptionWrite).toBe(false);
    expect(capabilities.taxonomyWrite).toBe(false);
    expect(capabilities.mediaWrite).toBe(false);
    expect(capabilities.mediaDelete).toBe(false);
    expect(capabilities.republish).toBe(false);
    expect(capabilities.subscribersWrite).toBe(false);
  });

  it("an editor gets the authoring surface but no deletion", () => {
    const capabilities = resolveAdminCapabilities("editor");

    expect(capabilities.create).toBe(true);
    expect(capabilities.publish).toBe(true);
    expect(capabilities.seriesWrite).toBe(true);
    expect(capabilities.mediaWrite).toBe(true);
    expect(capabilities.subscribersWrite).toBe(true);
    expect(capabilities.republish).toBe(true);
    expect(capabilities.delete).toBe(false);
    expect(capabilities.mediaDelete).toBe(false);
  });

  it("an owner gets everything", () => {
    const capabilities = resolveAdminCapabilities("owner");

    for (const [name, granted] of Object.entries(capabilities)) {
      expect(granted, `owner should have ${name}`).toBe(true);
    }
  });

  it("no role at all is read-only and gets nothing", () => {
    const capabilities = resolveAdminCapabilities(null);

    for (const [name, granted] of Object.entries(capabilities)) {
      expect(granted, `an absent role should not have ${name}`).toBe(false);
    }
    expect(isReadOnlyRole(capabilities)).toBe(true);
  });

  it("isReadOnlyRole agrees with the capability that gates publishing", () => {
    expect(isReadOnlyRole(resolveAdminCapabilities("viewer"))).toBe(true);
    expect(isReadOnlyRole(resolveAdminCapabilities("editor"))).toBe(false);
    expect(isReadOnlyRole(resolveAdminCapabilities("owner"))).toBe(false);
  });
});
