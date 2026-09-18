// packages/data-access/src/navigation/public-navigation.ts
//
// Public reader for dynamic parish navigation menu.
// Strict INV-01 compliance:
// - Fetches only rows where `is_active = true` AND `is_public = true`.
// - Strips away all internal audit/staff tracking fields.
// - Assembles hierarchic structure for main and secondary navigation.
// - Returns SEED_PUBLIC_NAVIGATION fallback on empty or failure.

import { unstable_cache } from "next/cache";
import type { PublicNavItem } from "@church-site/domain";
import { getParishNavigationRepository } from "../store";
import { REVALIDATION_TAGS } from "../tags";
import {
  buildPublicNavHierarchy,
  SEED_PUBLIC_NAVIGATION,
} from "./seed-nav";

export interface PublicNavigationResult {
  main: PublicNavItem[];
  secondary: PublicNavItem[];
}

export async function fetchPublicNavigation(): Promise<PublicNavigationResult> {
  try {
    const repository = getParishNavigationRepository();
    const items = await repository.listItems({ isActive: true, isPublic: true });
    if (items.length === 0) {
      return SEED_PUBLIC_NAVIGATION;
    }
    return buildPublicNavHierarchy(items);
  } catch (err) {
    console.warn("[navigation] Failed to load dynamic navigation, serving seed fallback:", err);
    return SEED_PUBLIC_NAVIGATION;
  }
}

const cachedPublicNavigation = typeof unstable_cache === "function"
  ? unstable_cache(fetchPublicNavigation, ["public-navigation"], {
      tags: [REVALIDATION_TAGS.navigation],
      revalidate: 3600,
    })
  : fetchPublicNavigation;

/**
 * Retrieves the public navigation menu hierarchy for the website Header and Navigation.
 * Guaranteed never to return empty arrays if seed fallback is available.
 * Cached with Next.js ISR tag with automatic standalone fallback for tests/scripts.
 */
export async function getPublicNavigation(): Promise<PublicNavigationResult> {
  try {
    return await cachedPublicNavigation();
  } catch (err: any) {
    if (
      err?.message?.includes("incrementalCache missing") ||
      err?.message?.includes("Invariant")
    ) {
      return fetchPublicNavigation();
    }
    throw err;
  }
}
