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
export * from "./content-repository";
export * from "./content-json-driver";
export * from "./content-supabase-driver";
export * from "./parish-video-repository";
export * from "./parish-video-json-driver";
export * from "./parish-video-supabase-driver";

/** The driver this environment resolves to, without constructing it. */
export function selectRepositoryDriver(): RepositoryDriverName {
  return hasSupabaseAdminEnv() ? "supabase" : "json";
}

let cachedRepository: EventRepository | null = null;
let cachedDriver: RepositoryDriverName | null = null;

let cachedContentRepository: import("./content-repository").ContentTypeRepository | null = null;
let cachedContentDriver: RepositoryDriverName | null = null;

let cachedVideoRepository: import("./parish-video-repository").ParishVideoRepository | null = null;
let cachedVideoDriver: RepositoryDriverName | null = null;

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

import { JsonContentTypeRepository } from "./content-json-driver";
import { SupabaseContentTypeRepository } from "./content-supabase-driver";
import type { ContentTypeRepository } from "./content-repository";

/**
 * The process-wide ContentTypeRepository.
 * Follows identical engine selection: Supabase if admin env configured, otherwise file-store.
 */
export function getContentTypeRepository(): ContentTypeRepository {
  const driver = selectRepositoryDriver();
  if (cachedContentRepository && cachedContentDriver === driver) return cachedContentRepository;

  cachedContentRepository =
    driver === "supabase" ? new SupabaseContentTypeRepository() : new JsonContentTypeRepository();
  cachedContentDriver = driver;
  return cachedContentRepository;
}

import { JsonParishVideoRepository } from "./parish-video-json-driver";
import { SupabaseParishVideoRepository } from "./parish-video-supabase-driver";
import type { ParishVideoRepository } from "./parish-video-repository";

/**
 * The process-wide ParishVideoRepository.
 * Follows identical engine selection: Supabase if admin env configured, otherwise file-store.
 */
export function getParishVideoRepository(): ParishVideoRepository {
  const driver = selectRepositoryDriver();
  if (cachedVideoRepository && cachedVideoDriver === driver) return cachedVideoRepository;

  cachedVideoRepository =
    driver === "supabase" ? new SupabaseParishVideoRepository() : new JsonParishVideoRepository();
  cachedVideoDriver = driver;
  return cachedVideoRepository;
}

