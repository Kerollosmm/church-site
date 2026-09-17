// src/lib/store/audit.ts
// Audit-entry construction — shared by BOTH drivers so the trail looks identical either way.
//
// Every mutation in the repository funnels through `buildAuditEntry()`. It records the actor, the
// action, the entity, the row BEFORE and the row AFTER, plus a one-line Arabic summary that the
// administrative screen can list verbatim. Snapshots are JSON clones: a later mutation of the live
// object can never rewrite history.

import { randomUUID } from "node:crypto";
import {
  AUDIT_ACTION_LABELS_AR,
  AUDIT_ENTITY_TYPE_LABELS_AR,
  type Actor,
  type AuditAction,
  type AuditEntityType,
  type AuditLogEntry,
  type JsonValue,
} from "@church-site/domain";

/** Current instant as an ISO string (single place that reads the clock for the store). */
export function nowIso(): string {
  return new Date().toISOString();
}

/** New record id. UUID v4 — the same shape the SQL columns expect, so JSON data can be migrated. */
export function newId(): string {
  return randomUUID();
}

/** JSON-safe deep copy, or null. */
export function snapshot<T>(value: T | null | undefined): JsonValue | null {
  if (value === null || value === undefined) return null;
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

/** The human label of a record: its Arabic title, Arabic name, or file name. */
function labelOf(record: JsonValue | null): string | null {
  if (!record || typeof record !== "object" || Array.isArray(record)) return null;
  const fields = record as Record<string, JsonValue>;
  for (const key of ["titleAr", "title_ar", "nameAr", "name_ar", "labelAr", "label_en", "filename", "slug"] as const) {
    const candidate = fields[key];
    if (typeof candidate === "string" && candidate.trim().length > 0) return candidate.trim();
  }
  return null;
}

export interface BuildAuditEntryParams {
  actor: Actor;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  before: JsonValue | null;
  after: JsonValue | null;
  /**
   * Replaces the generated one-liner. Used when the action carries information that has no column
   * of its own — e.g. the reason for cancelling a WHOLE series (only a single-occurrence deviation
   * keeps a reason on the row, see `event_exceptions.reasonAr`).
   */
  summary?: string;
}

/**
 * Builds one audit entry, e.g.
 *   "إنشاء فعالية «بث مباشر: صلوات القداس الإلهي»"
 */
export function buildAuditEntry(params: BuildAuditEntryParams): AuditLogEntry {
  const entityLabel = AUDIT_ENTITY_TYPE_LABELS_AR[params.entityType];
  const actionLabel = AUDIT_ACTION_LABELS_AR[params.action];
  const recordLabel = labelOf(params.after) ?? labelOf(params.before);
  const generated = recordLabel ? `${actionLabel} ${entityLabel} «${recordLabel}»` : `${actionLabel} ${entityLabel}`;
  const summary = params.summary?.trim() ? params.summary.trim() : generated;

  return {
    id: newId(),
    at: nowIso(),
    actorId: params.actor.id,
    actorName: params.actor.name,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    before: params.before,
    after: params.after,
    summary,
  };
}
