// packages/data-access/src/facilities/facility-repository.ts
//
// Contract for Parish Facilities (Public Services) repository.
// Dual-driver design: JsonParishFacilityRepository (file-backed, zero-env fallback)
// and SupabaseParishFacilityRepository (production).

import type {
  Actor,
  CreateParishFacilityInput,
  ParishFacility,
  UpdateParishFacilityInput,
} from "@church-site/domain";
import type { RepositoryDriverName } from "../store/repository";

export interface ParishFacilityListFilter {
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface ParishFacilityRepository {
  readonly driver: RepositoryDriverName;

  /** Lists parish facilities, ordered by displayOrder ascending, createdAt ascending */
  listFacilities(filter?: ParishFacilityListFilter): Promise<ParishFacility[]>;

  /** Retrieves a single facility by its ID */
  getFacilityById(id: string): Promise<ParishFacility | null>;

  /** Retrieves a single facility by its unique slug */
  getFacilityBySlug(slug: string): Promise<ParishFacility | null>;

  /** Creates a new parish facility and logs an audit entry */
  createFacility(input: CreateParishFacilityInput, actor: Actor): Promise<ParishFacility>;

  /** Updates an existing parish facility and logs an audit entry */
  updateFacility(id: string, input: UpdateParishFacilityInput, actor: Actor): Promise<ParishFacility>;

  /** Deletes a parish facility record (owner only) and logs an audit entry */
  deleteFacility(id: string, actor: Actor): Promise<void>;

  /** Toggles is_active status of a facility */
  toggleActive(id: string, isActive: boolean, actor: Actor): Promise<ParishFacility>;
}
