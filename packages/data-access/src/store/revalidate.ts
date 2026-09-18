// packages/data-access/src/store/revalidate.ts
// Cache invalidation for every events, content, and video surface.
//
// Kept OUT of the drivers on purpose: this module imports `next/cache`, which only works inside a
// request/action scope. A plain script (or the verification test) can therefore import the
// repository without pulling Next's request machinery in.

import { revalidatePath, revalidateTag } from "next/cache";
import { REVALIDATION_TAGS } from "../tags";
import { getEventRepository, type RepositoryDriverName } from "./index";

/** Every tag an events mutation can invalidate. */
export const EVENT_SURFACE_TAGS = [
  REVALIDATION_TAGS.events,
  REVALIDATION_TAGS.eventTaxonomy,
  REVALIDATION_TAGS.eventMedia,
] as const;

/**
 * Public paths that render events.
 */
export const EVENT_SURFACE_PATHS = ["/", "/events", "/events/[slug]", "/ministries"] as const;

/** Invalidates the events tags (and any extra paths); returns what was invalidated. */
export function revalidateEventSurfaces(paths: readonly string[] = EVENT_SURFACE_PATHS): string[] {
  for (const tag of EVENT_SURFACE_TAGS) {
    try {
      revalidateTag(tag);
    } catch {
      // Safe fallback outside Next.js request lifecycle
    }
  }
  for (const path of paths) {
    try {
      revalidatePath(path, "page");
    } catch {
      // Safe fallback outside Next.js request lifecycle
    }
  }
  return [...EVENT_SURFACE_TAGS, ...paths];
}

export interface RepublishResult {
  /** When the manual republish ran. */
  revalidatedAt: string;
  /** Last mutation instant known to the store (the "last updated" timestamp shown in the UI). */
  lastUpdatedAt: string | null;
  driver: RepositoryDriverName;
  tags: string[];
  paths: string[];
}

/**
 * Manual cache clear: asks the repository for its status (the driver's no-op hook) and then drops
 * every events cache entry.
 */
export async function republishEventSurfaces(paths: readonly string[] = EVENT_SURFACE_PATHS): Promise<RepublishResult> {
  const repository = getEventRepository();
  const status = await repository.republish();
  const invalidated = revalidateEventSurfaces(paths);

  return {
    revalidatedAt: new Date().toISOString(),
    lastUpdatedAt: status.lastUpdatedAt,
    driver: status.driver,
    tags: invalidated.slice(0, EVENT_SURFACE_TAGS.length),
    paths: [...paths],
  };
}

/** Invalidate cache tags and routes for dynamic content types */
export function revalidateContentSurfaces(typeSlug?: string, entrySlug?: string): string[] {
  try {
    revalidateTag(REVALIDATION_TAGS.content);
  } catch {
    // Safe fallback outside Next.js request lifecycle
  }
  const paths: string[] = ["/content"];
  if (typeSlug) {
    paths.push(`/content/${typeSlug}`);
    if (entrySlug) {
      paths.push(`/content/${typeSlug}/${entrySlug}`);
    }
  }
  for (const path of paths) {
    try {
      revalidatePath(path, "page");
    } catch {
      // Safe fallback outside Next.js request lifecycle
    }
  }
  return [REVALIDATION_TAGS.content, ...paths];
}

/** Invalidate cache tags and routes for parish videos */
export function revalidateVideoSurfaces(): string[] {
  try {
    revalidateTag(REVALIDATION_TAGS.parishVideos);
  } catch {
    // Safe fallback outside Next.js request lifecycle
  }
  const paths: string[] = ["/about", "/"];
  for (const path of paths) {
    try {
      revalidatePath(path, "page");
    } catch {
      // Safe fallback outside Next.js request lifecycle
    }
  }
  return [REVALIDATION_TAGS.parishVideos, ...paths];
}

/** Invalidate cache tags and routes for parish facilities and services */
export function revalidateServiceSurfaces(): string[] {
  try {
    revalidateTag(REVALIDATION_TAGS.services);
  } catch {
    // Safe fallback outside Next.js request lifecycle
  }
  const paths: string[] = ["/services", "/"];
  for (const path of paths) {
    try {
      revalidatePath(path, "page");
    } catch {
      // Safe fallback outside Next.js request lifecycle
    }
  }
  return [REVALIDATION_TAGS.services, ...paths];
}

/** Invalidate cache tags and routes for parish navigation menu */
export function revalidateNavigationSurfaces(): string[] {
  try {
    revalidateTag(REVALIDATION_TAGS.navigation);
  } catch {
    // Safe fallback outside Next.js request lifecycle
  }
  const paths: string[] = ["/"];
  for (const path of paths) {
    try {
      revalidatePath(path, "layout");
    } catch {
      // Safe fallback outside Next.js request lifecycle
    }
  }
  return [REVALIDATION_TAGS.navigation, ...paths];
}

