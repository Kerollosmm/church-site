// packages/data-access/src/events/audit-csv.ts
// UTF-8 BOM RFC-4180 CSV export for parish audit trail records (Phase 5 - Step C).

import {
  AUDIT_ACTION_LABELS_AR,
  AUDIT_ENTITY_TYPE_LABELS_AR,
  type AuditLogEntry,
} from "@church-site/domain";
import { formatCairoDateTime } from "../utils/cairo-time";

export const AUDIT_CSV_BOM = "\uFEFF";

export const AUDIT_CSV_HEADERS: readonly string[] = [
  "وقت التسجيل (بتوقيت القاهرة)",
  "المنفذ",
  "الإجراء",
  "الكيان",
  "معرف السجل",
  "الملخص",
  "مرفوض",
];

/**
 * Escapes a cell according to RFC 4180.
 * If the value contains comma, double-quote, or newline characters,
 * it is enclosed in double quotes and internal double quotes are escaped as `""`.
 */
export function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (
    str.includes(",") ||
    str.includes("،") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Exports an array of audit log entries as an RFC-4180 compliant CSV string with a UTF-8 BOM.
 *
 * The leading BOM (\uFEFF) ensures spreadsheet programs (like Microsoft Excel) recognize
 * and display the Arabic text encoding correctly without character corruption.
 */
export function exportAuditCsv(entries: readonly AuditLogEntry[]): string {
  const headerLine = AUDIT_CSV_HEADERS.map(escapeCsvCell).join(",");
  const rows = entries.map((entry) => {
    const formattedTime = formatCairoDateTime(entry.at) ?? entry.at;
    const actor = entry.actorName?.trim() || entry.actorId?.trim() || "غير محدد";
    const actionLabel = AUDIT_ACTION_LABELS_AR[entry.action] ?? entry.action;
    const entityLabel = AUDIT_ENTITY_TYPE_LABELS_AR[entry.entityType] ?? entry.entityType;
    const entityId = entry.entityId ?? "";
    const summary = entry.summary ?? "";
    const isDenied = entry.action === "denied" ? "نعم" : "لا";

    return [
      escapeCsvCell(formattedTime),
      escapeCsvCell(actor),
      escapeCsvCell(actionLabel),
      escapeCsvCell(entityLabel),
      escapeCsvCell(entityId),
      escapeCsvCell(summary),
      escapeCsvCell(isDenied),
    ].join(",");
  });

  return `${AUDIT_CSV_BOM}${[headerLine, ...rows].join("\r\n")}\r\n`;
}
