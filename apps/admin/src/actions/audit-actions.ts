"use server";

// apps/admin/src/actions/audit-actions.ts
// Server action for exporting audit trail records to RFC-4180 UTF-8 BOM CSV (Phase 5 - Step C).

import { requireStaff } from "../lib/auth/require-staff";
import {
  CAPABILITY_DENIED_MESSAGE_AR,
  adminRoleFromStaffRole,
  can,
} from "@church-site/domain";
import {
  listAdminAudit,
  exportAuditCsv,
  type AuditListFilter,
} from "@church-site/data-access";

export type ExportAuditCsvResult =
  | { success: true; csv: string; filename: string }
  | { success: false; message: string };

/**
 * Server action to export audit records to CSV.
 * Gated behind requireStaff() and audit:read or event:read capabilities.
 */
export async function exportAuditCsvAction(
  filter: AuditListFilter = {}
): Promise<ExportAuditCsvResult> {
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);

  if (!can(role, "audit:read") && !can(role, "event:read")) {
    return {
      success: false,
      message: CAPABILITY_DENIED_MESSAGE_AR,
    };
  }

  try {
    const entries = await listAdminAudit(filter);
    const csv = exportAuditCsv(entries);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const filename = `audit-log-${dateStamp}.csv`;

    return {
      success: true,
      csv,
      filename,
    };
  } catch (error) {
    console.error("[admin] exportAuditCsvAction failed", {
      reason: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      message: "تعذّر تصدير سجل التدقيق. يرجى المحاولة مرة أخرى.",
    };
  }
}
