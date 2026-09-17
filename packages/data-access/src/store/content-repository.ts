// src/lib/store/content-repository.ts
// Contract for the Content Types Engine repository.
// Supported by both JsonContentTypeRepository (zero-env fallback) and SupabaseContentTypeRepository.

import type {
  Actor,
  ContentEntry,
  ContentField,
  ContentStatus,
  ContentType,
  CreateContentEntryInput,
  CreateContentFieldInput,
  CreateContentTypeInput,
  UpdateContentEntryInput,
  UpdateContentFieldInput,
  UpdateContentTypeInput,
} from "@church-site/domain";
import type { RepositoryDriverName } from "./repository";

export interface ContentEntryListFilter {
  status?: ContentStatus;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ContentTypeRepository {
  readonly driver: RepositoryDriverName;

  // --- Content Types ---
  listContentTypes(options?: { includeInactive?: boolean }): Promise<ContentType[]>;
  getContentTypeBySlug(slug: string, options?: { includeFields?: boolean }): Promise<ContentType | null>;
  getContentTypeById(id: string, options?: { includeFields?: boolean }): Promise<ContentType | null>;
  createContentType(input: CreateContentTypeInput, actor: Actor): Promise<ContentType>;
  updateContentType(id: string, input: UpdateContentTypeInput, actor: Actor): Promise<ContentType>;
  deleteContentType(id: string, actor: Actor): Promise<void>;

  // --- Content Fields ---
  listContentFields(contentTypeId: string): Promise<ContentField[]>;
  getContentFieldById(id: string): Promise<ContentField | null>;
  createContentField(input: CreateContentFieldInput, actor: Actor): Promise<ContentField>;
  updateContentField(id: string, input: UpdateContentFieldInput, actor: Actor): Promise<ContentField>;
  deleteContentField(id: string, actor: Actor): Promise<void>;

  // --- Content Entries ---
  listContentEntries(typeSlug: string, filter?: ContentEntryListFilter): Promise<ContentEntry[]>;
  getContentEntry(typeSlug: string, entrySlug: string): Promise<ContentEntry | null>;
  getContentEntryById(id: string): Promise<ContentEntry | null>;
  getPublishedEntry(typeSlug: string, entrySlug: string): Promise<ContentEntry | null>;
  createContentEntry(input: CreateContentEntryInput, actor: Actor): Promise<ContentEntry>;
  updateContentEntry(id: string, input: UpdateContentEntryInput, actor: Actor): Promise<ContentEntry>;
  deleteContentEntry(id: string, actor: Actor): Promise<void>;
  setEntryStatus(id: string, status: ContentStatus, actor: Actor): Promise<ContentEntry>;

  // --- Seed Initialization ---
  seedBuiltInTypes(): Promise<void>;
}
