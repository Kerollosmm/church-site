// packages/data-access/src/store/__tests__/e2e-content-proof.test.ts
// Gate G6: End-to-end no-code workflow verification against the file-store repository engine.
// Proves: Type Creation -> Field Definitions -> Draft Creation -> Publishing -> Public Read -> Update -> Cleanup.

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { JsonContentTypeRepository } from "../content-json-driver";
import type { Actor } from "@church-site/domain";

describe("Gate G6: End-to-End No-Code Content Engine Verification", () => {
  it("demonstrates complete no-code lifecycle on file-store engine", async () => {
    console.log("================================================================================");
    console.log("PHASE 3: END-TO-END CONTENT TYPES NO-CODE ENGINE VERIFICATION");
    console.log("Engine: File-backed JSON store driver (CHURCH_DATA_DIR throwaway sandbox)");
    console.log("Label: verified on file-store engine; live-DB run pending credentials");
    console.log("================================================================================\n");

    const tempDir = await mkdtemp(path.join(tmpdir(), "g6-content-proof-"));
    process.env.CHURCH_DATA_DIR = tempDir;
    console.log(`[INIT] Sandbox initialized at ${tempDir}`);

    const actor: Actor = { id: "admin-actor-1", name: "أ. مينا (مسؤول النظام)" };
    const repo = new JsonContentTypeRepository();

    try {
      // 1. Create a Content Type
      console.log("\n[STEP 1] Creating new Content Type: 'g6-bulletin' (نشرة الكنيسة الدورية)...");
      const createdType = await repo.createContentType(
        {
          slug: "g6-bulletin",
          nameAr: "نشرة الكنيسة الدورية",
          nameEn: "Parish Weekly Bulletin",
          template: "default",
          isActive: true,
        },
        actor
      );
      expect(createdType.id).toBeDefined();
      expect(createdType.slug).toBe("g6-bulletin");
      console.log(`[SUCCESS] Content Type created with ID: ${createdType.id}`);
      console.log(`          Slug: ${createdType.slug}, NameAr: ${createdType.nameAr}, Active: ${createdType.isActive}`);

      // 2. Add 3 Fields (text, media, select)
      console.log("\n[STEP 2] Adding 3 schema fields to 'g6-bulletin' without code changes...");

      // Field 1: text
      const fieldText = await repo.createContentField(
        {
          contentTypeId: createdType.id,
          slug: "headline",
          labelAr: "المانشيت الإخباري",
          fieldType: "text",
          isRequired: true,
          sortOrder: 10,
        },
        actor
      );
      console.log(`  - Field 1 [text]: slug='${fieldText.slug}', label='${fieldText.labelAr}', required=${fieldText.isRequired}`);

      // Field 2: media
      const fieldMedia = await repo.createContentField(
        {
          contentTypeId: createdType.id,
          slug: "cover_photo",
          labelAr: "صورة الغلاف",
          fieldType: "media",
          isRequired: false,
          sortOrder: 20,
        },
        actor
      );
      console.log(`  - Field 2 [media]: slug='${fieldMedia.slug}', label='${fieldMedia.labelAr}', required=${fieldMedia.isRequired}`);

      // Field 3: select
      const fieldSelect = await repo.createContentField(
        {
          contentTypeId: createdType.id,
          slug: "priority_level",
          labelAr: "درجة الأهمية",
          fieldType: "select",
          isRequired: true,
          options: ["عادي", "هام", "عاجل"],
          sortOrder: 30,
        },
        actor
      );
      console.log(`  - Field 3 [select]: slug='${fieldSelect.slug}', label='${fieldSelect.labelAr}', options=${JSON.stringify(fieldSelect.options)}`);

      const fieldsList = await repo.listContentFields(createdType.id);
      expect(fieldsList).toHaveLength(3);
      console.log(`[SUCCESS] Registered ${fieldsList.length} fields dynamically for type '${createdType.slug}'.`);

      // 3. Create Draft Entry
      console.log("\n[STEP 3] Creating new entry: slug='issue-101' as DRAFT...");
      const draftEntry = await repo.createContentEntry(
        {
          contentTypeId: createdType.id,
          slug: "issue-101",
          status: "draft",
          data: {
            headline: "صدور النشرة الدورية لنهضة السيدة العذراء",
            cover_photo: "/media/2026/09/bulletin-101.jpg",
            priority_level: "عاجل",
          },
        },
        actor
      );
      expect(draftEntry.status).toBe("draft");
      console.log(`[SUCCESS] Entry created with ID: ${draftEntry.id}, status: ${draftEntry.status}`);

      // 4. Verify Public Isolation (Draft must NOT be readable by public reader)
      console.log("\n[STEP 4] Testing INV-01 public isolation (public getPublishedEntry on draft)...");
      const publicBeforePublish = await repo.getPublishedEntry("g6-bulletin", "issue-101");
      expect(publicBeforePublish).toBeNull();
      console.log("[PROVEN] Public reader returned NULL for draft entry (Zero-leakage invariant verified).");

      // 5. Publish Entry
      console.log("\n[STEP 5] Publishing entry: changing status to 'published'...");
      const publishedEntry = await repo.setEntryStatus(draftEntry.id, "published", actor);
      expect(publishedEntry.status).toBe("published");
      expect(publishedEntry.publishedAt).not.toBeNull();
      console.log(`[SUCCESS] Entry status updated to '${publishedEntry.status}' at ${publishedEntry.publishedAt}`);

      // 6. Read through Public Reader
      console.log("\n[STEP 6] Reading published entry through public reader API...");
      const publicEntry = await repo.getPublishedEntry("g6-bulletin", "issue-101");
      expect(publicEntry).not.toBeNull();
      expect(publicEntry?.id).toBe(draftEntry.id);
      expect(publicEntry?.data.headline).toBe("صدور النشرة الدورية لنهضة السيدة العذراء");
      console.log(`[SUCCESS] Public reader returned entry:`);
      console.log(`          ID: ${publicEntry!.id}`);
      console.log(`          Slug: ${publicEntry!.slug}`);
      console.log(`          Status: ${publicEntry!.status}`);
      console.log(`          Headline: ${publicEntry!.data.headline}`);
      console.log(`          Cover: ${publicEntry!.data.cover_photo}`);
      console.log(`          Priority: ${publicEntry!.data.priority_level}`);

      // 7. Update Field and Republish
      console.log("\n[STEP 7] Updating field: editing headline and updating priority...");
      const updatedEntry = await repo.updateContentEntry(
        draftEntry.id,
        {
          data: {
            headline: "صدور النشرة الدورية لنهضة السيدة العذراء — الطبعة النهائية المحدثة",
            cover_photo: "/media/2026/09/bulletin-101-final.jpg",
            priority_level: "هام",
          },
        },
        actor
      );
      expect(updatedEntry.data.headline).toContain("النهائية");
      console.log(`[SUCCESS] Updated data: headline='${updatedEntry.data.headline}'`);

      const publicAfterUpdate = await repo.getPublishedEntry("g6-bulletin", "issue-101");
      expect(publicAfterUpdate?.data.headline).toBe("صدور النشرة الدورية لنهضة السيدة العذراء — الطبعة النهائية المحدثة");
      console.log(`[SUCCESS] Public reader verified updated data:`);
      console.log(`          Updated Headline: ${publicAfterUpdate?.data.headline}`);
      console.log(`          Updated Cover: ${publicAfterUpdate?.data.cover_photo}`);

      // 8. Clean up
      console.log("\n[STEP 8] Performing cleanup...");
      await repo.deleteContentEntry(draftEntry.id, actor);
      await repo.deleteContentType(createdType.id, actor);
      const afterCleanup = await repo.getContentEntry("g6-bulletin", "issue-101");
      expect(afterCleanup).toBeNull();
      console.log("[SUCCESS] Throwaway records removed cleanly.");

      console.log("\n================================================================================");
      console.log("GATE G6 VERIFICATION RESULT: PASS");
      console.log("End-to-end no-code CMS flow demonstrated 100% successfully on file-store engine.");
      console.log("================================================================================");
    } finally {
      delete process.env.CHURCH_DATA_DIR;
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
