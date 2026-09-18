// packages/data-access/src/navigation/__tests__/navigation-repository.test.ts
// Unit tests for JsonParishNavigationRepository in an isolated temp environment.

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { JsonParishNavigationRepository } from "../navigation-json-adapter";
import { buildPublicNavHierarchy } from "../seed-nav";
import type { Actor, CreateNavItemInput } from "@church-site/domain";

const STAFF: Actor = { id: "staff-nav", name: "خادم الموقع" };

describe("JsonParishNavigationRepository", () => {
  let dataDir: string;
  let repo: JsonParishNavigationRepository;

  beforeEach(async () => {
    dataDir = await mkdtemp(path.join(tmpdir(), "nav-store-"));
    process.env.CHURCH_DATA_DIR = dataDir;
    repo = new JsonParishNavigationRepository();
  });

  afterEach(async () => {
    delete process.env.CHURCH_DATA_DIR;
    await rm(dataDir, { recursive: true, force: true });
  });

  it("seeds baseline navigation items preserving parity", async () => {
    const items = await repo.listItems();
    expect(items.length).toBeGreaterThanOrEqual(17);
    const home = items.find((i) => i.key === "home");
    expect(home).toBeDefined();
    expect(home?.href).toBe("/");
    expect(home?.labelAr).toBe("الرئيسية");

    const hierarchy = buildPublicNavHierarchy(items);
    expect(hierarchy.main.length).toBeGreaterThan(0);
    expect(hierarchy.secondary.length).toBeGreaterThan(0);
    const about = hierarchy.main.find((m) => m.key === "about");
    expect(about).toBeDefined();
    expect(about?.children?.length).toBeGreaterThanOrEqual(4);
  });

  it("creates a new nav item and retrieves it", async () => {
    const input: CreateNavItemInput = {
      key: "new-initiatives",
      labelAr: "مبادرات الكنيسة",
      labelEn: "Parish Initiatives",
      href: "/initiatives",
      section: "main",
      sortOrder: 10,
      isActive: true,
      isPublic: true,
    };

    const created = await repo.createItem(input, STAFF);
    expect(created.id).toBeDefined();
    expect(created.key).toBe("new-initiatives");
    expect(created.createdBy).toBe(STAFF.id);

    const fetched = await repo.getItemById(created.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.labelAr).toBe(input.labelAr);
  });

  it("rejects duplicate key", async () => {
    const input: CreateNavItemInput = {
      key: "home",
      labelAr: "رئيسية مكررة",
      href: "/home2",
      section: "main",
    };

    await expect(repo.createItem(input, STAFF)).rejects.toThrow(/موجود بالفعل/);
  });

  it("reorders navigation items in batch", async () => {
    const items = await repo.listItems({ section: "secondary" });
    expect(items.length).toBeGreaterThanOrEqual(2);

    const reorderPayload = items.map((item, index) => ({
      id: item.id,
      sortOrder: (items.length - index) * 10,
    }));

    const reordered = await repo.reorderItems({ items: reorderPayload }, STAFF);
    expect(reordered.length).toBe(reorderPayload.length);

    const first = await repo.getItemById(items[0].id);
    expect(first?.sortOrder).toBe(reorderPayload[0].sortOrder);
  });

  it("updates and toggles active state", async () => {
    const created = await repo.createItem(
      {
        key: "temporary-link",
        labelAr: "رابط مؤقت",
        href: "/temp",
        section: "main",
        isActive: true,
        isPublic: true,
      },
      STAFF
    );

    await repo.toggleActive(created.id, false, STAFF);

    const inactive = await repo.getItemById(created.id);
    expect(inactive?.isActive).toBe(false);

    const activeOnly = await repo.listItems({ isActive: true });
    expect(activeOnly.some((i) => i.id === created.id)).toBe(false);
  });

  it("deletes a nav item and safely reparents child items", async () => {
    const parent = await repo.createItem(
      {
        key: "parent-test",
        labelAr: "أب",
        href: "/parent",
        section: "main",
      },
      STAFF
    );

    const child = await repo.createItem(
      {
        key: "child-test",
        labelAr: "ابن",
        href: "/parent/child",
        section: "main",
        parentId: parent.id,
      },
      STAFF
    );

    expect(child.parentId).toBe(parent.id);

    await repo.deleteItem(parent.id, STAFF);

    const deletedParent = await repo.getItemById(parent.id);
    expect(deletedParent).toBeNull();

    const survivingChild = await repo.getItemById(child.id);
    expect(survivingChild).not.toBeNull();
    expect(survivingChild?.parentId).toBeNull(); // reparented
  });
});
