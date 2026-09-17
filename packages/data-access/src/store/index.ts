// src/lib/store/index.ts
// The ONE factory that picks a repository driver. Server-only (the Supabase driver reaches for
// request cookies and the JSON driver for the filesystem).
//
// SELECTION RULE (deliberate and single-sourced):
//   NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY present  →  "supabase"
//   anything else (including a completely empty environment)      →  "json"
//
// The JSON driver is therefore the DEFAULT, not a degraded mode: a developer cloning the repository
// gets a working events store with no environment variables at all, and the portal's no-env build
// keeps working.

import { hasSupabaseAdminEnv } from "../env";
import { JsonEventRepository } from "./json-driver";
import { SupabaseEventRepository } from "./supabase-driver";
import { getStoreDataDir } from "./json-store";
import type { EventRepository, RepositoryDriverName } from "./repository";

export * from "./repository";

/** The driver this environment resolves to, without constructing it. */
export function selectRepositoryDriver(): RepositoryDriverName {
  return hasSupabaseAdminEnv() ? "supabase" : "json";
}

let cachedRepository: EventRepository | null = null;
let cachedDriver: RepositoryDriverName | null = null;

/**
 * The process-wide repository. Constructed lazily on first use (never at import time) and rebuilt if
 * the environment changes underneath it — which is exactly what happens when a test script flips
 * `CHURCH_DATA_DIR` or sets the Supabase pair between cases.
 */
export function getEventRepository(): EventRepository {
  const driver = selectRepositoryDriver();
  if (cachedRepository && cachedDriver === driver) return cachedRepository;

  cachedRepository = driver === "supabase" ? new SupabaseEventRepository() : new JsonEventRepository();
  cachedDriver = driver;
  console.info("[store] repository driver selected", {
    driver,
    dataDir: driver === "json" ? getStoreDataDir() : null,
  });
  return cachedRepository;
}
