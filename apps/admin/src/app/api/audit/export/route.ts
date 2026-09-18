// apps/admin/src/app/api/audit/export/route.ts
// HTTP route handler for streaming audit CSV export with proper MIME and disposition headers (Phase 5 - Step C).

import { NextRequest, NextResponse } from "next/server";
import { getStaffSession } from "../../../../lib/auth/require-staff";
import {
  adminRoleFromStaffRole,
  can,
  type AuditAction,
  type AuditEntityType,
} from "@church-site/domain";
import { listAdminAudit, exportAuditCsv } from "@church-site/data-access";

export async function GET(request: NextRequest): Promise<Response> {
  const session = await getStaffSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const role = adminRoleFromStaffRole(session.role);
  if (!can(role, "audit:read") && !can(role, "event:read")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const entity = (searchParams.get("entity") as AuditEntityType) || undefined;
  const action = (searchParams.get("action") as AuditAction) || undefined;
  const actor = searchParams.get("actor")?.trim() || undefined;
  const rawLimit = searchParams.get("limit");
  const limit = rawLimit ? Number.parseInt(rawLimit, 10) : undefined;

  try {
    const entries = await listAdminAudit({
      entityType: entity,
      action,
      actor,
      limit: limit && !Number.isNaN(limit) ? limit : 500,
    });

    const csv = exportAuditCsv(entries);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const filename = `audit-log-${dateStamp}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("[admin] GET /api/audit/export failed", {
      reason: error instanceof Error ? error.message : String(error),
    });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
