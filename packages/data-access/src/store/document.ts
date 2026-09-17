// src/lib/store/document.ts
// The shape of the file-backed store, shared by the seed builder and the JSON driver.
//
// ONE document = ONE atomic write. Keeping every collection in a single JSON document is what makes
// "mutation + its audit entry" a single rename on disk, so a crash can never leave a change
// recorded without its audit line (or the other way round). At parish scale the document is tiny
// (a few hundred KB at most), so the simplicity is free.

import type {
  AuditLogEntry,
  ContentEntry,
  ContentField,
  ContentType,
  EventExceptionRecord,
  EventRecord,
  EventSeriesRecord,
  EventTermLink,
  MediaRecord,
  ParishVideo,
  SubscriberRecord,
  TaxonomyTermRecord,
} from "@church-site/domain";

/**
 * Version 4 added the `parishVideos` collection (Phase 4 Parish Videos).
 *
 * Versions 1, 2, and 3 are upgraded in memory on read (`parseStoreDocument`) and written back at
 * version 4 by the next mutation.
 */
export const STORE_SCHEMA_VERSION = 4;

/** Older layouts this build can still read and upgrade. */
export const STORE_SCHEMA_VERSION_LEGACY = 3;
export const STORE_SCHEMA_VERSION_V2 = 2;
export const STORE_SCHEMA_VERSION_V1 = 1;

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
  "contentTypes",
  "contentFields",
  "contentEntries",
  "parishVideos",
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
  /** Content Types engine (see `ContentType`, `ContentField`, `ContentEntry`). Added in schema version 3. */
  contentTypes: ContentType[];
  contentFields: ContentField[];
  contentEntries: ContentEntry[];
  /** Parish Videos (see `ParishVideo`). Added in schema version 4. */
  parishVideos: ParishVideo[];
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
  if (
    typeof version !== "number" ||
    (version !== STORE_SCHEMA_VERSION &&
      version !== STORE_SCHEMA_VERSION_LEGACY &&
      version !== STORE_SCHEMA_VERSION_V2 &&
      version !== STORE_SCHEMA_VERSION_V1)
  ) {
    throw new Error(
      `Store document schemaVersion ${String(version)} is not supported (expected ${STORE_SCHEMA_VERSION}, or legacy versions for an upgrade).`
    );
  }

  let upgradedFrom: number | null = null;
  if (
    version === STORE_SCHEMA_VERSION_V1 ||
    version === STORE_SCHEMA_VERSION_V2 ||
    version === STORE_SCHEMA_VERSION_LEGACY
  ) {
    if (!Array.isArray(value.subscribers)) value.subscribers = [];
    if (!Array.isArray(value.contentTypes)) value.contentTypes = [];
    if (!Array.isArray(value.contentFields)) value.contentFields = [];
    if (!Array.isArray(value.contentEntries)) value.contentEntries = [];
    if (!Array.isArray(value.parishVideos)) value.parishVideos = [];
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
