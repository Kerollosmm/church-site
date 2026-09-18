// apps/admin/src/actions/__tests__/audit-actions.test.ts
// Unit tests for audit export action and route handler (Phase 5 - Step C).

import { beforeEach, describe, expect, it, vi } from "vitest";
import { exportAuditCsvAction } from "../audit-actions";
import { GET as exportRouteGet } from "../../app/api/audit/export/route";
import * as requireStaffModule from "../../lib/auth/require-staff";
import * as dataAccessModule from "@church-site/data-access";
import { NextRequest } from "next/server";
import type { AuditLogEntry } from "@church-site/domain";

describe("Audit Export Actions and Route Handler", () => {
  const mockStaffSession = {
    userId: "staff-1",
    fullNameAr: "خادم مسؤول",
    email: "staff@church.org",
    role: "admin" as const,
  };

  const sampleEntries: AuditLogEntry[] = [
    {
      id: "entry-1",
      at: "2026-09-18T10:00:00.000Z",
      actorId: "actor-1",
      actorName: "مينا بطرس",
      action: "create",
      entityType: "event",
      entityId: "evt-1",
      before: null,
      after: { titleAr: "قداس إلهي" },
      summary: "إنشاء قداس إلهي",
    },
    {
      id: "entry-2",
      at: "2026-09-18T11:00:00.000Z",
      actorId: "actor-2",
      actorName: "كيرلس",
      action: "denied",
      entityType: "media",
      entityId: "med-1",
      before: null,
      after: null,
      summary: "محاولة غير مصرح بها",
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("exportAuditCsvAction", () => {
    it("delegates to listAdminAudit with actor filter and returns CSV result", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockResolvedValue(mockStaffSession);
      const listAuditSpy = vi
        .spyOn(dataAccessModule, "listAdminAudit")
        .mockResolvedValue(sampleEntries);

      const result = await exportAuditCsvAction({
        actor: "مينا",
        entityType: "event",
        action: "create",
      });

      expect(listAuditSpy).toHaveBeenCalledWith({
        actor: "مينا",
        entityType: "event",
        action: "create",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.csv.charCodeAt(0)).toBe(0xfeff); // BOM
        expect(result.csv).toContain("مينا بطرس");
        expect(result.filename).toMatch(/^audit-log-\d{4}-\d{2}-\d{2}\.csv$/);
      }
    });

    it("rejects when staff session is not authenticated", async () => {
      vi.spyOn(requireStaffModule, "requireStaff").mockRejectedValue(
        new Error("NEXT_REDIRECT: /login")
      );

      await expect(exportAuditCsvAction({})).rejects.toThrow("NEXT_REDIRECT: /login");
    });
  });

  describe("GET /api/audit/export route handler", () => {
    it("returns 401 Unauthorized when no staff session exists", async () => {
      vi.spyOn(requireStaffModule, "getStaffSession").mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/audit/export");
      const response = await exportRouteGet(request);

      expect(response.status).toBe(401);
    });

    it("returns 200 with CSV payload and attachment headers when authenticated", async () => {
      vi.spyOn(requireStaffModule, "getStaffSession").mockResolvedValue(mockStaffSession);
      const listAuditSpy = vi
        .spyOn(dataAccessModule, "listAdminAudit")
        .mockResolvedValue(sampleEntries);

      const request = new NextRequest(
        "http://localhost:3000/api/audit/export?actor=مينا&entity=event&action=create"
      );
      const response = await exportRouteGet(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
      expect(response.headers.get("Content-Disposition")).toMatch(
        /^attachment; filename="audit-log-\d{4}-\d{2}-\d{2}\.csv"$/
      );

      expect(listAuditSpy).toHaveBeenCalledWith({
        entityType: "event",
        action: "create",
        actor: "مينا",
        limit: 500,
      });

      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      // UTF-8 BOM bytes: 0xEF, 0xBB, 0xBF
      expect(bytes[0]).toBe(0xef);
      expect(bytes[1]).toBe(0xbb);
      expect(bytes[2]).toBe(0xbf);

      const text = new TextDecoder("utf-8").decode(bytes);
      expect(text).toContain("مينا بطرس");
    });
  });
});
