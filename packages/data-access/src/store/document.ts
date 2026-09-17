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
  SubscriberRecord,
  TaxonomyTermRecord,
} from "@church-site/domain";

/**
 * Version 2 added the `subscribers` collection (event notifications).
 *
 * A version-1 document is NOT rejected: it is upgraded in memory on read (`parseStoreDocument`) and
 * written back at version 2 by the next mutation. A collection added later is the one shape change
 * that loses nothing by being tolerated, and refusing to read a parish's existing store would lose
 * every event it holds. Anything else — an older version, a newer version, a missing collection —
 * still fails loudly.
 */
export const STORE_SCHEMA_VERSION = 2;

/** The only older layout this build can still read (see the note above). */
export const STORE_SCHEMA_VERSION_LEGACY = 1;

export const STORE_FILE_NAME = "church-store.json";

/** Directory used when `CHURCH_DATA_DIR` is not set, relative to the process working directory. */
export const DEFAULT_STORE_DIR_NAME = ".data";

/** Every collection a CURRENT document must carry. */
export const STORE_COLLECTIONS = [
  "events",
  "series",
  "exceptions",
  "terms",
  "eventTerms",
  "media",
  "subscribers",
  "audit",
] as const;

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
  /** Event-notification subscriptions (see `SubscriberRecord`). Added in schema version 2. */
  subscribers: SubscriberRecord[];
  /** Append-only, oldest first. */
  audit: AuditLogEntry[];
}

export interface ParsedStoreDocument {
  document: StoreDocument;
  /** The version it was read at when it is older than the current one, otherwise null. */
  upgradedFrom: number | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Validates a document read back from disk, upgrading an older-but-readable layout in place.
 *
 * It is deliberately STRICT: a corrupt or unexpected file must FAIL LOUDLY rather than be silently
 * replaced by the seed, which would look like the parish's content had vanished overnight.
 */
export function parseStoreDocument(value: unknown): ParsedStoreDocument {
  if (!isRecord(value)) {
    throw new Error("Store document is not an object.");
  }

  const version = value.schemaVersion;
  if (typeof version !== "number" || (version !== STORE_SCHEMA_VERSION && version !== STORE_SCHEMA_VERSION_LEGACY)) {
    throw new Error(
      `Store document schemaVersion ${String(version)} is not supported (expected ${STORE_SCHEMA_VERSION}, or ${STORE_SCHEMA_VERSION_LEGACY} for an upgrade).`
    );
  }

  let upgradedFrom: number | null = null;
  if (version === STORE_SCHEMA_VERSION_LEGACY) {
    // Version 1 predates subscribers entirely: an existing subscription could not have been stored,
    // so an empty collection is the only faithful value — nothing is invented and nothing is lost.
    if (!Array.isArray(value.subscribers)) value.subscribers = [];
    value.schemaVersion = STORE_SCHEMA_VERSION;
    upgradedFrom = version;
  }

  for (const collection of STORE_COLLECTIONS) {
    if (!Array.isArray(value[collection])) {
      throw new Error(`Store document is missing the "${collection}" collection.`);
    }
  }

  if (typeof value.updatedAt !== "string") {
    throw new Error("Store document is missing its updatedAt timestamp.");
  }

  return { document: value as unknown as StoreDocument, upgradedFrom };
}
