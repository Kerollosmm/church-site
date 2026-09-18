// packages/data-access/src/events/__tests__/audit-csv.test.ts
// Unit tests for audit CSV export with UTF-8 BOM and RFC 4180 escaping (Phase 5 - Step C).

import { describe, expect, it } from "vitest";
import { AUDIT_CSV_BOM, AUDIT_CSV_HEADERS, escapeCsvCell, exportAuditCsv } from "../audit-csv";
import type { AuditLogEntry } from "@church-site/domain";

describe("audit-csv export", () => {
  const sampleEntries: AuditLogEntry[] = [
    {
      id: "audit_1",
      at: "2026-09-18T10:00:00.000Z",
      actorId: "actor_uuid_1",
      actorName: "مارك ميخائيل",
      action: "create",
      entityType: "event",
      entityId: "evt_100",
      before: null,
      after: { titleAr: "قداس إلهي" },
      summary: "إنشاء فعالية جديدة: قداس إلهي",
    },
    {
      id: "audit_2",
      at: "2026-09-18T11:00:00.000Z",
      actorId: "actor_uuid_2",
      actorName: "بيتر أنطون",
      action: "denied",
      entityType: "media",
      entityId: "med_200",
      before: null,
      after: null,
      summary: "محاولة رفع وسائط رُفضت بسبب نقص الصلاحيات",
    },
    {
      id: "audit_3",
      at: "2026-09-18T12:00:00.000Z",
      actorId: "system_resend",
      actorName: "نظام إرسال البريد (Resend)",
      action: "notify",
      entityType: "subscriber",
      entityId: "sub_300",
      before: null,
      after: null,
      summary: "تسجيل بريد إلكتروني، مع إرسال رسالة ترحيب عبر \"Resend\"\nتم التسليم بنجاح.",
    },
  ];

  it("prepends UTF-8 BOM (\\uFEFF) at offset 0", () => {
    const csv = exportAuditCsv(sampleEntries);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.startsWith(AUDIT_CSV_BOM)).toBe(true);
  });

  it("includes correct Arabic headers on the first line after BOM", () => {
    const csv = exportAuditCsv([]);
    const content = csv.slice(1); // remove BOM
    const firstLine = content.split("\r\n")[0];
    const expectedHeaders = AUDIT_CSV_HEADERS.join(",");
    expect(firstLine).toBe(expectedHeaders);
  });

  it("preserves Arabic characters intact across rows", () => {
    const csv = exportAuditCsv(sampleEntries);
    expect(csv).toContain("مارك ميخائيل");
    expect(csv).toContain("بيتر أنطون");
    expect(csv).toContain("نظام إرسال البريد (Resend)");
    expect(csv).toContain("إنشاء فعالية جديدة: قداس إلهي");
    expect(csv).toContain("فعالية");
  });

  it("escapes fields with commas, quotes, and newlines per RFC 4180", () => {
    const entryWithSpecialChars: AuditLogEntry = {
      id: "audit_special",
      at: "2026-09-18T13:00:00.000Z",
      actorId: "actor_special",
      actorName: "جون، الخادم",
      action: "update",
      entityType: "event",
      entityId: "evt_special",
      before: null,
      after: null,
      summary: 'تعديل "العنوان"، مع إضافة ملاحظة جديدة\nالسطر الثاني من الملاحظة.',
    };

    const csv = exportAuditCsv([entryWithSpecialChars]);
    // Actor with comma must be quoted
    expect(csv).toContain('"جون، الخادم"');
    // Summary with quotes and newline must double internal quotes and wrap in quotes
    expect(csv).toContain('"تعديل ""العنوان""، مع إضافة ملاحظة جديدة\nالسطر الثاني من الملاحظة."');
  });

  it("correctly maps denied actions to 'نعم' and normal actions to 'لا'", () => {
    const csv = exportAuditCsv(sampleEntries);
    const lines = csv.slice(1).trim().split("\r\n");

    // Line 0 is header
    // Line 1 is sampleEntries[0] (action: create) -> denied is "لا"
    const row1 = lines[1];
    expect(row1.endsWith(",لا")).toBe(true);

    // Line 2 is sampleEntries[1] (action: denied) -> denied is "نعم"
    const row2 = lines[2];
    expect(row2.endsWith(",نعم")).toBe(true);
  });

  it("falls back to actorId or 'غير محدد' when actorName is missing", () => {
    const entryWithoutActorName: AuditLogEntry = {
      id: "audit_no_name",
      at: "2026-09-18T14:00:00.000Z",
      actorId: "actor_uuid_only",
      actorName: "",
      action: "update",
      entityType: "taxonomy_term",
      entityId: "term_1",
      before: null,
      after: null,
      summary: "تحديث تصنيف",
    };

    const entryWithoutAnyActor: AuditLogEntry = {
      id: "audit_no_actor",
      at: "2026-09-18T15:00:00.000Z",
      actorId: null,
      actorName: "",
      action: "delete",
      entityType: "taxonomy_term",
      entityId: "term_2",
      before: null,
      after: null,
      summary: "حذف تصنيف",
    };

    const csv = exportAuditCsv([entryWithoutActorName, entryWithoutAnyActor]);
    expect(csv).toContain("actor_uuid_only");
    expect(csv).toContain("غير محدد");
  });

  describe("escapeCsvCell helper", () => {
    it("returns empty string for null and undefined", () => {
      expect(escapeCsvCell(null)).toBe("");
      expect(escapeCsvCell(undefined)).toBe("");
    });

    it("returns plain string unchanged when no delimiter or special char", () => {
      expect(escapeCsvCell("simple text")).toBe("simple text");
      expect(escapeCsvCell(12345)).toBe("12345");
      expect(escapeCsvCell(true)).toBe("true");
    });

    it("escapes strings with commas, double quotes, and newlines", () => {
      expect(escapeCsvCell("hello, world")).toBe('"hello, world"');
      expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
      expect(escapeCsvCell("line1\nline2")).toBe('"line1\nline2"');
      expect(escapeCsvCell("line1\r\nline2")).toBe('"line1\r\nline2"');
    });
  });
});
