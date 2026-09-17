// packages/data-access/src/store/__tests__/content-repository.test.ts
// Unit and integration tests for JsonContentTypeRepository against a throwaway directory.

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { JsonContentTypeRepository } from "../content-json-driver";
import type { Actor } from "@church-site/domain";

const STAFF: Actor = { id: "staff-1", name: "مستخدم تجريبي" };

describe("JsonContentTypeRepository (file-backed engine)", () => {
  let dataDir: string;
  let repo: JsonContentTypeRepository;

  beforeEach(async () => {
    dataDir = await mkdtemp(path.join(tmpdir(), "content-store-"));
    process.env.CHURCH_DATA_DIR = dataDir;
    repo = new JsonContentTypeRepository();
  });

  afterEach(async () => {
    delete process.env.CHURCH_DATA_DIR;
    await rm(dataDir, { recursive: true, force: true });
  });

  it("seeds built-in content types (article, announcement, sermon) on first list", async () => {
    const types = await repo.listContentTypes();
    expect(types.length).toBeGreaterThanOrEqual(3);

    const slugs = types.map((t) => t.slug);
    expect(slugs).toContain("article");
    expect(slugs).toContain("announcement");
    expect(slugs).toContain("sermon");

    const articleType = await repo.getContentTypeBySlug("article");
    expect(articleType).not.toBeNull();
    expect(articleType?.nameAr).toBe("مقالات وأخبار");

    const fields = await repo.listContentFields(articleType!.id);
    expect(fields.length).toBeGreaterThan(0);
    expect(fields.some((f) => f.slug === "title")).toBe(true);
    expect(fields.some((f) => f.slug === "body")).toBe(true);
  });

  it("creates, updates, and deletes a custom content type", async () => {
    const created = await repo.createContentType(
      {
        slug: "books",
        nameAr: "مكتبة الكتب",
        nameEn: "Book Library",
        template: "default",
        isActive: true,
      },
      STAFF
    );

    expect(created.id).toBeDefined();
    expect(created.slug).toBe("books");
    expect(created.nameAr).toBe("مكتبة الكتب");

    // Read back by slug and by id
    const bySlug = await repo.getContentTypeBySlug("books");
    expect(bySlug).not.toBeNull();
    expect(bySlug?.id).toBe(created.id);

    const byId = await repo.getContentTypeById(created.id);
    expect(byId).not.toBeNull();
    expect(byId?.slug).toBe("books");

    // Update
    const updated = await repo.updateContentType(
      created.id,
      { nameAr: "مكتبة الكنيسة العامة", template: "article" },
      STAFF
    );
    expect(updated.nameAr).toBe("مكتبة الكنيسة العامة");
    expect(updated.template).toBe("article");

    // Delete
    await repo.deleteContentType(created.id, STAFF);
    const afterDelete = await repo.getContentTypeById(created.id);
    expect(afterDelete).toBeNull();
  });

  it("manages fields for a content type in correct sort order", async () => {
    const type = await repo.createContentType(
      { slug: "news", nameAr: "أخبار الإيبارشية" },
      STAFF
    );

    const f1 = await repo.createContentField(
      {
        contentTypeId: type.id,
        slug: "headline",
        labelAr: "المانشيت",
        fieldType: "text",
        isRequired: true,
        sortOrder: 10,
      },
      STAFF
    );

    const f2 = await repo.createContentField(
      {
        contentTypeId: type.id,
        slug: "details",
        labelAr: "التفاصيل",
        fieldType: "richtext",
        isRequired: false,
        sortOrder: 20,
      },
      STAFF
    );

    const fields = await repo.listContentFields(type.id);
    expect(fields).toHaveLength(2);
    expect(fields[0].slug).toBe("headline");
    expect(fields[1].slug).toBe("details");

    // Update field
    const updatedField = await repo.updateContentField(
      f1.id,
      { labelAr: "العنوان الرئيسي" },
      STAFF
    );
    expect(updatedField.labelAr).toBe("العنوان الرئيسي");

    // Delete field
    await repo.deleteContentField(f2.id, STAFF);
    const fieldsAfterDelete = await repo.listContentFields(type.id);
    expect(fieldsAfterDelete).toHaveLength(1);
    expect(fieldsAfterDelete[0].slug).toBe("headline");
  });

  it("handles entry lifecycle: draft -> published -> archived, respecting public visibility", async () => {
    const type = await repo.createContentType(
      { slug: "spiritual-notes", nameAr: "خواطر روحية" },
      STAFF
    );

    // 1. Create entry as draft
    const entry = await repo.createContentEntry(
      {
        contentTypeId: type.id,
        slug: "faith-and-hope",
        status: "draft",
        data: {
          title: "الإيمان والرجاء",
          text: "كلمة منفعة للمؤمنين",
        },
      },
      STAFF
    );

    expect(entry.status).toBe("draft");
    expect(entry.slug).toBe("faith-and-hope");

    // Draft is NOT returned by getPublishedEntry
    const publicDraft = await repo.getPublishedEntry(type.slug, entry.slug);
    expect(publicDraft).toBeNull();

    // 2. Publish entry
    const published = await repo.setEntryStatus(entry.id, "published", STAFF);
    expect(published.status).toBe("published");
    expect(published.publishedAt).not.toBeNull();

    // Now getPublishedEntry finds it!
    const publicEntry = await repo.getPublishedEntry(type.slug, entry.slug);
    expect(publicEntry).not.toBeNull();
    expect(publicEntry?.id).toBe(entry.id);
    expect(publicEntry?.data.title).toBe("الإيمان والرجاء");

    // 3. Update entry data
    const updated = await repo.updateContentEntry(
      entry.id,
      { data: { title: "الإيمان والرجاء والمحبة", text: "تحديث الكلمة" } },
      STAFF
    );
    expect(updated.data.title).toBe("الإيمان والرجاء والمحبة");

    // 4. Archive entry
    const archived = await repo.setEntryStatus(entry.id, "archived", STAFF);
    expect(archived.status).toBe("archived");

    // Archived is NOT returned by getPublishedEntry
    const publicArchived = await repo.getPublishedEntry(type.slug, entry.slug);
    expect(publicArchived).toBeNull();

    // 5. Delete entry
    await repo.deleteContentEntry(entry.id, STAFF);
    const afterDelete = await repo.getContentEntry(type.slug, entry.slug);
    expect(afterDelete).toBeNull();
  });
});
