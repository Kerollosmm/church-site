// src/lib/store/revalidate.ts
// Cache invalidation for every events surface â€” the "no rebuild required" half of the design.
//
// Kept OUT of the drivers on purpose: this module imports `next/cache`, which only works inside a
// request/action scope. A plain script (or the verification test) can therefore import the
// repository without pulling Next's request machinery in.
//
// Tag names come from `src/lib/tags.ts` â€” the repository's tag registry â€” never from a literal
// written here (see systemPatterns Â§1).

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
 * Public paths that render events. The home page, the events list/calendar, the event detail route
 * and the ministries index are all live; `/events/[slug]` is listed as the dynamic-route PATTERN,
 * which is what `revalidatePath(path, "page")` expands over every generated slug. A new public
 * surface must be added HERE, which is what keeps a mutation from forgetting one.
 */
export const EVENT_SURFACE_PATHS = ["/", "/events", "/events/[slug]", "/ministries"] as const;

/** Invalidates the events tags (and any extra paths); returns what was invalidated. */
export function revalidateEventSurfaces(paths: readonly string[] = EVENT_SURFACE_PATHS): string[] {
  for (const tag of EVENT_SURFACE_TAGS) {
    revalidateTag(tag);
  }
  for (const path of paths) {
    // The `"page"` type is what invalidates a whole dynamic route pattern such as `/events/[slug]`;
    // it is equally valid (and equivalent) for the plain paths alongside it.
    revalidatePath(path, "page");
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
 * every events cache entry, so the public pages pick up the store's current content immediately.
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


