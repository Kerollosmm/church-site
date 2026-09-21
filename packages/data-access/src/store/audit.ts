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

/**
 * Universal audit logger that persists an audit entry to Supabase (if admin env present)
 * or to the local file-store document. Never throws — fails safe so business flows continue.
 */
export async function recordAuditLog(params: BuildAuditEntryParams): Promise<AuditLogEntry> {
  const entry = buildAuditEntry(params);
  try {
    const { hasSupabaseAdminEnv } = await import("../env");
    if (hasSupabaseAdminEnv()) {
      const { createAdminClient } = await import("../supabase/admin");
      const client = createAdminClient();
      const { error } = await client.from("audit_log").insert({
        id: entry.id,
        at: entry.at,
        actor_id: entry.actorId === "anonymous" ? null : entry.actorId,
        actor_name: entry.actorName,
        action: entry.action,
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        before: entry.before as any,
        after: entry.after as any,
        summary: entry.summary,
      });
      if (error) {
        console.error("[audit] failed to insert to supabase audit_log:", error.message);
      }
    } else {
      const { mutateStoreDocument } = await import("./json-store");
      await mutateStoreDocument("audit.append", (doc) => {
        if (!doc.audit) doc.audit = [];
        doc.audit.push(entry);
      });
    }
  } catch (err) {
    console.error("[audit] recording exception:", err);
  }
  return entry;
}
