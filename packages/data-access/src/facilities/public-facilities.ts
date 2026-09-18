// packages/data-access/src/facilities/public-facilities.ts
//
// Public reader for parish facilities (public services).
// Strict INV-01 compliance:
// - Fetches only rows where `is_active = true`.
// - Strips away all staff/audit tracking fields (createdBy, updatedBy, createdAt, updatedAt).
// - Returns safe, minimal PublicParishFacility models.

import { unstable_cache } from "next/cache";
import type { PublicParishFacility } from "@church-site/domain";
import { getParishFacilityRepository } from "../store";
import { REVALIDATION_TAGS } from "../tags";
import { SEED_PUBLIC_PARISH_FACILITIES, toPublicParishFacility } from "./seed-facilities";

async function fetchPublicServices(): Promise<PublicParishFacility[]> {
  try {
    const repository = getParishFacilityRepository();
    const facilities = await repository.listFacilities({ isActive: true });
    if (facilities.length === 0) {
      return SEED_PUBLIC_PARISH_FACILITIES;
    }
    return facilities.map(toPublicParishFacility);
  } catch (err) {
    console.warn("[facilities] Failed to list facilities, serving seed fallback:", err);
    return SEED_PUBLIC_PARISH_FACILITIES;
  }
}

/**
 * Retrieves public parish facilities for display on website surfaces (/services, /services/[slug]).
 * Cached with Next.js ISR tag for instant revalidation.
 */
export const getPublicServices = typeof unstable_cache === "function"
  ? unstable_cache(fetchPublicServices, ["public-services"], {
      tags: [REVALIDATION_TAGS.services],
      revalidate: 3600,
    })
  : fetchPublicServices;

/**
 * Retrieves a single public parish facility by slug.
 */
export async function getServiceBySlug(slug: string): Promise<PublicParishFacility | null> {
  const services = await getPublicServices();
  return services.find((s) => s.slug === slug) ?? null;
}
