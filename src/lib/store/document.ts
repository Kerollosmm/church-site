// src/lib/store/document.ts
// The shape of the file-backed store, shared by the seed builder and the JSON driver.
//
// ONE document = ONE atomic write. Keeping every collection in a single JSON document is what makes
// "mutation + its audit entry" a single rename on disk, so a crash can never leave a change
// recorded without its audit line (or the other way round). At parish scale the document is tiny
// (a few hundred KB at most), so the simplicity is free.

import type {
  AuditLogEntry,
  EventExceptionRecord,
  EventRecord,
  EventSeriesRecord,
  EventTermLink,
  MediaRecord,
  TaxonomyTermRecord,
} from "@/lib/domain/types";

/** Bumped when the document shape changes; the driver refuses to guess at an older layout. */
export const STORE_SCHEMA_VERSION = 1;

export const STORE_FILE_NAME = "church-store.json";

/** Directory used when `CHURCH_DATA_DIR` is not set, relative to the process working directory. */
export const DEFAULT_STORE_DIR_NAME = ".data";

export interface StoreDocument {
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
  events: EventRecord[];
  series: EventSeriesRecord[];
  exceptions: EventExceptionRecord[];
  terms: TaxonomyTermRecord[];
  eventTerms: EventTermLink[];
  media: MediaRecord[];
  /** Append-only, oldest first. */
  audit: AuditLogEntry[];
}

/**
 * Structural check for a document read back from disk. Deliberately strict: a corrupt or unexpected
 * file must FAIL LOUDLY rather than be silently replaced by the seed, which would look like the
 * parish's content had vanished overnight.
 */
export function assertStoreDocument(value: unknown): asserts value is StoreDocument {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Store document is not an object.");
  }
  const document = value as Record<string, unknown>;
  if (document.schemaVersion !== STORE_SCHEMA_VERSION) {
    throw new Error(
      `Store document schemaVersion ${String(document.schemaVersion)} is not supported (expected ${STORE_SCHEMA_VERSION}).`
    );
  }
  for (const collection of ["events", "series", "exceptions", "terms", "eventTerms", "media", "audit"] as const) {
    if (!Array.isArray(document[collection])) {
      throw new Error(`Store document is missing the "${collection}" collection.`);
    }
  }
  if (typeof document.updatedAt !== "string") {
    throw new Error("Store document is missing its updatedAt timestamp.");
  }
}
