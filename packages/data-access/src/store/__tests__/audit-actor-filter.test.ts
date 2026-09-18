// packages/data-access/src/store/__tests__/audit-actor-filter.test.ts
// Unit tests for audit actor filtering in repository (Phase 5 - Step C).

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { JsonEventRepository } from "../json-driver";
import type { Actor } from "@church-site/domain";

describe("Audit actor filter (JsonEventRepository)", () => {
  let dataDir: string;
  let repo: JsonEventRepository;

  const ACTOR_1: Actor = { id: "user-mina-1", name: "مينا بطرس" };
  const ACTOR_2: Actor = { id: "user-kyrollos-2", name: "كيرلس مجدي" };
  const ACTOR_SYSTEM: Actor = { id: "system-resend", name: "نظام إرسال البريد (Resend)" };

  beforeEach(async () => {
    dataDir = await mkdtemp(path.join(tmpdir(), "audit-store-"));
    process.env.CHURCH_DATA_DIR = dataDir;
    repo = new JsonEventRepository();

    // Record sample audit notes with different actors
    await repo.recordAuditNote(
      {
        action: "create",
        entityType: "event",
        entityId: "evt_101",
        summary: "إنشاء فعالية جديدة بواسطة مينا",
      },
      ACTOR_1
    );

    await repo.recordAuditNote(
      {
        action: "update",
        entityType: "event",
        entityId: "evt_101",
        summary: "تعديل فعالية بواسطة كيرلس",
      },
      ACTOR_2
    );

    await repo.recordAuditNote(
      {
        action: "notify",
        entityType: "subscriber",
        entityId: "sub_201",
        summary: "إشعار بريد مسجل بواسطة النظام",
      },
      ACTOR_SYSTEM
    );
  });

  afterEach(async () => {
    delete process.env.CHURCH_DATA_DIR;
    await rm(dataDir, { recursive: true, force: true });
  });

  it("filters audit entries by actor name substring case-insensitively", async () => {
    const minaEntries = await repo.listAudit({ actor: "مينا" });
    expect(minaEntries).toHaveLength(1);
    expect(minaEntries[0].actorName).toBe("مينا بطرس");

    const kyrollosEntries = await repo.listAudit({ actor: "كيرلس" });
    expect(kyrollosEntries).toHaveLength(1);
    expect(kyrollosEntries[0].actorName).toBe("كيرلس مجدي");
  });

  it("filters audit entries by actorId substring case-insensitively", async () => {
    const resendEntries = await repo.listAudit({ actor: "system-resend" });
    expect(resendEntries).toHaveLength(1);
    expect(resendEntries[0].actorId).toBe("system-resend");

    const partialIdEntries = await repo.listAudit({ actor: "mina" });
    expect(partialIdEntries).toHaveLength(1);
    expect(partialIdEntries[0].actorId).toBe("user-mina-1");
  });

  it("returns empty array when actor filter does not match any name or ID", async () => {
    const noEntries = await repo.listAudit({ actor: "شخص_غير_موجود" });
    expect(noEntries).toHaveLength(0);
  });

  it("returns all matching entries when combined with action or entityType filter", async () => {
    const filtered = await repo.listAudit({
      actor: "مينا",
      entityType: "event",
      action: "create",
    });
    expect(filtered).toHaveLength(1);

    const nonMatchingAction = await repo.listAudit({
      actor: "مينا",
      action: "delete",
    });
    expect(nonMatchingAction).toHaveLength(0);
  });

  it("returns all entries when actor filter is undefined or empty string", async () => {
    const all = await repo.listAudit();
    expect(all.length).toBeGreaterThanOrEqual(3);

    const emptyFilter = await repo.listAudit({ actor: "   " });
    expect(emptyFilter.length).toBeGreaterThanOrEqual(3);
  });
});
