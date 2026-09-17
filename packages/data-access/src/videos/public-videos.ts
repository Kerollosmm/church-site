// packages/data-access/src/videos/public-videos.ts
//
// Public reader for parish videos.
// Strict INV-01 compliance:
// - Fetches only rows where `is_public = true` AND `is_active = true`.
// - Strips away all staff/audit tracking fields (createdBy, updatedBy, createdAt, updatedAt, sourceUrl).
// - Returns a safe, minimal PublicParishVideo model.

import type { PublicParishVideo } from "@church-site/domain";
import { getParishVideoRepository } from "../store";

/**
 * Retrieves the public parish videos for display on public website surfaces (e.g. /about).
 * Never leaks unpublished, inactive, or internal staff metadata.
 */
export async function getPublicParishVideos(): Promise<PublicParishVideo[]> {
  const repository = getParishVideoRepository();
  const videos = await repository.listVideos({ isPublic: true, isActive: true });

  return videos.map((v) => ({
    id: v.id,
    titleAr: v.titleAr,
    titleEn: v.titleEn,
    descriptionAr: v.descriptionAr,
    descriptionEn: v.descriptionEn,
    provider: v.provider,
    embedUrl: v.embedUrl,
    thumbnailUrl: v.thumbnailUrl,
    sortOrder: v.sortOrder,
  }));
}
