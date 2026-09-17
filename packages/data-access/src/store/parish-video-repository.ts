// packages/data-access/src/store/parish-video-repository.ts
//
// Contract for Parish Videos repository.
// Dual-driver design: JsonParishVideoRepository (file-backed, zero-env fallback)
// and SupabaseParishVideoRepository (production).

import type {
  Actor,
  CreateParishVideoInput,
  ParishVideo,
  UpdateParishVideoInput,
} from "@church-site/domain";
import type { RepositoryDriverName } from "./repository";

export interface ParishVideoListFilter {
  isPublic?: boolean;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface ParishVideoRepository {
  readonly driver: RepositoryDriverName;

  /** Lists parish videos, ordered by sortOrder ascending, createdAt descending */
  listVideos(filter?: ParishVideoListFilter): Promise<ParishVideo[]>;

  /** Retrieves a single video by its ID */
  getVideoById(id: string): Promise<ParishVideo | null>;

  /** Creates a new parish video record and logs an audit entry */
  createVideo(input: CreateParishVideoInput, actor: Actor): Promise<ParishVideo>;

  /** Updates an existing parish video record and logs an audit entry */
  updateVideo(id: string, input: UpdateParishVideoInput, actor: Actor): Promise<ParishVideo>;

  /** Deletes a parish video record (owner only) and logs an audit entry */
  deleteVideo(id: string, actor: Actor): Promise<void>;

  /** Toggles is_active status of a video */
  toggleActive(id: string, isActive: boolean, actor: Actor): Promise<ParishVideo>;

  /** Toggles is_public status of a video */
  togglePublic(id: string, isPublic: boolean, actor: Actor): Promise<ParishVideo>;
}
