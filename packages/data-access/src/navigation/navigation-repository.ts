// packages/data-access/src/navigation/navigation-repository.ts
//
// Contract for Navigation Menu Items repository.
// Dual-driver design: JsonParishNavigationRepository (file-backed, zero-env fallback)
// and SupabaseParishNavigationRepository (production).

import type {
  Actor,
  CreateNavItemInput,
  NavigationMenuItem,
  NavSection,
  ReorderNavItemsInput,
  UpdateNavItemInput,
} from "@church-site/domain";
import type { RepositoryDriverName } from "../store/repository";

export interface NavItemListFilter {
  section?: NavSection;
  parentId?: string | null;
  isActive?: boolean;
  isPublic?: boolean;
}

export interface ParishNavigationRepository {
  readonly driver: RepositoryDriverName;

  /** Lists navigation menu items ordered by sortOrder ascending, createdAt ascending */
  listItems(filter?: NavItemListFilter): Promise<NavigationMenuItem[]>;

  /** Retrieves a single navigation menu item by id */
  getItemById(id: string): Promise<NavigationMenuItem | null>;

  /** Retrieves a single navigation menu item by key */
  getItemByKey(key: string): Promise<NavigationMenuItem | null>;

  /** Creates a navigation item and logs an audit entry */
  createItem(input: CreateNavItemInput, actor: Actor): Promise<NavigationMenuItem>;

  /** Updates an existing navigation item and logs an audit entry */
  updateItem(id: string, input: UpdateNavItemInput, actor: Actor): Promise<NavigationMenuItem>;

  /** Reorders a list of items and logs an audit entry */
  reorderItems(input: ReorderNavItemsInput, actor: Actor): Promise<NavigationMenuItem[]>;

  /** Deletes a navigation item and logs an audit entry */
  deleteItem(id: string, actor: Actor): Promise<void>;

  /** Toggles is_active status */
  toggleActive(id: string, isActive: boolean, actor: Actor): Promise<NavigationMenuItem>;
}
