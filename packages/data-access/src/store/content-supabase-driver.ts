// src/lib/store/content-supabase-driver.ts
// Supabase PostgREST driver for ContentTypeRepository.
// Implements the same contract as JsonContentTypeRepository with live Postgres RLS policies.

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { createPublicSupabaseClient } from "../supabase/public";
import type { Database, Json, Tables, TablesInsert } from "@church-site/domain";
import type {
  Actor,
  AuditAction,
  AuditEntityType,
  ContentEntry,
  ContentField,
  ContentStatus,
  ContentType,
  CreateContentEntryInput,
  CreateContentFieldInput,
  CreateContentTypeInput,
  FieldType,
  JsonValue,
  UpdateContentEntryInput,
  UpdateContentFieldInput,
  UpdateContentTypeInput,
} from "@church-site/domain";
import { buildAuditEntry, newId, nowIso, snapshot } from "./audit";
import { StoreError, type RepositoryDriverName } from "./repository";
import type { ContentEntryListFilter, ContentTypeRepository } from "./content-repository";
import { SEED_CONTENT_FIELDS, SEED_CONTENT_TYPES } from "./seed";

type StoreClient = SupabaseClient<Database>;
type ContentTypeRow = Tables<"content_types">;
type ContentFieldRow = Tables<"content_fields">;
type ContentEntryRow = Tables<"content_entries">;

const ERROR_CODE_MAP: Record<string, "not_found" | "conflict" | "invalid"> = {
  PGRST116: "not_found",
  "23505": "conflict",
  "23503": "invalid",
  "23514": "invalid",
  "22P02": "invalid",
};

interface PostgrestErrorLike {
  code?: string | null;
  message: string;
  details?: string | null;
}

function toStoreError(error: PostgrestErrorLike, operation: string, detail: Record<string, unknown> = {}): StoreError {
  const mapped = ERROR_CODE_MAP[error.code ?? ""] ?? "unavailable";
  return new StoreError(mapped, operation, error.message, { ...detail, code: error.code ?? null });
}

function toTypeRecord(row: ContentTypeRow, fields?: ContentField[]): ContentType {
  return {
    id: row.id,
    slug: row.slug,
    nameAr: row.name_ar,
    nameEn: row.name_en,
    icon: row.icon,
    template: row.template,
    isActive: row.is_active,
    createdAt: new Date(row.created_at).toISOString(),
    fields,
  };
}

function toFieldRecord(row: ContentFieldRow): ContentField {
  return {
    id: row.id,
    contentTypeId: row.content_type_id,
    slug: row.slug,
    labelAr: row.label_ar,
    labelEn: row.label_en,
    fieldType: row.field_type as FieldType,
    isRequired: row.is_required,
    isTranslatable: row.is_translatable,
    validationRules: row.validation_rules as Record<string, any> | null,
    options: row.options as any,
    sortOrder: row.sort_order,
  };
}

function toEntryRecord(row: ContentEntryRow): ContentEntry {
  return {
    id: row.id,
    contentTypeId: row.content_type_id,
    slug: row.slug,
    status: row.status as ContentStatus,
    data: (row.data as Record<string, any>) || {},
    publishedAt: row.published_at ? new Date(row.published_at).toISOString() : null,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export class SupabaseContentTypeRepository implements ContentTypeRepository {
  readonly driver: RepositoryDriverName = "supabase";

  private async client(): Promise<StoreClient> {
    try {
      return await createSupabaseServerClient();
    } catch (error) {
      console.warn("[store] session Supabase client unavailable; falling back to service-role", {
        reason: error instanceof Error ? error.message : String(error),
      });
      return createAdminClient();
    }
  }

  private async publicClient(): Promise<StoreClient> {
    try {
      return createPublicSupabaseClient();
    } catch {
      return createAdminClient();
    }
  }

  private async appendAudit(
    client: StoreClient,
    params: {
      actor: Actor;
      action: AuditAction;
      entityType: AuditEntityType;
      entityId: string;
      before: JsonValue | null;
      after: JsonValue | null;
      summary?: string;
    }
  ): Promise<void> {
    const entry = buildAuditEntry(params);
    const { error } = await client.from("audit_log").insert({
      id: entry.id,
      at: entry.at,
      actor_id: entry.actorId,
      actor_name: entry.actorName,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      before: entry.before as Json,
      after: entry.after as Json,
      summary: entry.summary,
    });
    if (error) {
      console.error("[store] failed to append audit row in Supabase", {
        error: error.message,
        entityId: params.entityId,
        action: params.action,
      });
    }
  }

  // ============================================================================
  // Content Types
  // ============================================================================

  async listContentTypes(options?: { includeInactive?: boolean }): Promise<ContentType[]> {
    const client = await this.client();
    let query = client.from("content_types").select("*").order("created_at", { ascending: true });

    if (!options?.includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data: typeRows, error: typeError } = await query;
    if (typeError) throw toStoreError(typeError, "contentTypes.list");
    if (!typeRows) return [];

    const { data: fieldRows, error: fieldError } = await client
      .from("content_fields")
      .select("*")
      .order("sort_order", { ascending: true });

    if (fieldError) throw toStoreError(fieldError, "contentFields.list");

    const allFields = (fieldRows || []).map(toFieldRecord);

    return typeRows.map((row) => {
      const fields = allFields.filter((f) => f.contentTypeId === row.id);
      return toTypeRecord(row, fields);
    });
  }

  async getContentTypeBySlug(slug: string, options?: { includeFields?: boolean }): Promise<ContentType | null> {
    const client = await this.client();
    const { data: row, error } = await client
      .from("content_types")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw toStoreError(error, "contentTypes.getBySlug");
    if (!row) return null;

    let fields: ContentField[] | undefined;
    if (options?.includeFields !== false) {
      fields = await this.listContentFields(row.id);
    }

    return toTypeRecord(row, fields);
  }

  async getContentTypeById(id: string, options?: { includeFields?: boolean }): Promise<ContentType | null> {
    const client = await this.client();
    const { data: row, error } = await client
      .from("content_types")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw toStoreError(error, "contentTypes.getById");
    if (!row) return null;

    let fields: ContentField[] | undefined;
    if (options?.includeFields !== false) {
      fields = await this.listContentFields(row.id);
    }

    return toTypeRecord(row, fields);
  }

  async createContentType(input: CreateContentTypeInput, actor: Actor): Promise<ContentType> {
    const client = await this.client();
    const id = newId();
    const insertPayload: TablesInsert<"content_types"> = {
      id,
      slug: input.slug.trim().toLowerCase(),
      name_ar: input.nameAr.trim(),
      name_en: input.nameEn?.trim() || null,
      icon: input.icon?.trim() || null,
      template: input.template?.trim() || "default",
      is_active: input.isActive ?? true,
      created_at: nowIso(),
    };

    const { data: row, error } = await client
      .from("content_types")
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw toStoreError(error, "contentTypes.create");

    const record = toTypeRecord(row, []);
    await this.appendAudit(client, {
      actor,
      action: "create",
      entityType: "content_type",
      entityId: id,
      before: null,
      after: snapshot(record),
    });

    return record;
  }

  async updateContentType(id: string, input: UpdateContentTypeInput, actor: Actor): Promise<ContentType> {
    const client = await this.client();
    const existing = await this.getContentTypeById(id, { includeFields: false });
    if (!existing) {
      throw new StoreError("not_found", "contentTypes.update", "نوع المحتوى المطلوب غير موجود.");
    }

    const updatePayload: Partial<TablesInsert<"content_types">> = {};
    if (input.slug !== undefined) updatePayload.slug = input.slug.trim().toLowerCase();
    if (input.nameAr !== undefined) updatePayload.name_ar = input.nameAr.trim();
    if (input.nameEn !== undefined) updatePayload.name_en = input.nameEn?.trim() || null;
    if (input.icon !== undefined) updatePayload.icon = input.icon?.trim() || null;
    if (input.template !== undefined) updatePayload.template = input.template?.trim() || "default";
    if (input.isActive !== undefined) updatePayload.is_active = input.isActive;

    const { data: row, error } = await client
      .from("content_types")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw toStoreError(error, "contentTypes.update");

    const fields = await this.listContentFields(id);
    const updated = toTypeRecord(row, fields);

    await this.appendAudit(client, {
      actor,
      action: "update",
      entityType: "content_type",
      entityId: id,
      before: snapshot(existing),
      after: snapshot(updated),
    });

    return updated;
  }

  async deleteContentType(id: string, actor: Actor): Promise<void> {
    const client = await this.client();
    const existing = await this.getContentTypeById(id);
    if (!existing) {
      throw new StoreError("not_found", "contentTypes.delete", "نوع المحتوى المطلوب غير موجود.");
    }

    // Guard: check if any entries exist
    const { count, error: countError } = await client
      .from("content_entries")
      .select("id", { count: "exact", head: true })
      .eq("content_type_id", id);

    if (countError) throw toStoreError(countError, "contentTypes.delete");
    if ((count ?? 0) > 0) {
      throw new StoreError(
        "conflict",
        "contentTypes.delete",
        "لا يمكن حذف هذا النوع لوجود عناصر محتوى تابعة له. قم بحذف العناصر أولاً أو تعطيل النوع."
      );
    }

    const { error: deleteError } = await client.from("content_types").delete().eq("id", id);
    if (deleteError) throw toStoreError(deleteError, "contentTypes.delete");

    await this.appendAudit(client, {
      actor,
      action: "delete",
      entityType: "content_type",
      entityId: id,
      before: snapshot(existing),
      after: null,
    });
  }

  // ============================================================================
  // Content Fields
  // ============================================================================

  async listContentFields(contentTypeId: string): Promise<ContentField[]> {
    const client = await this.client();
    const { data: rows, error } = await client
      .from("content_fields")
      .select("*")
      .eq("content_type_id", contentTypeId)
      .order("sort_order", { ascending: true });

    if (error) throw toStoreError(error, "contentFields.list");
    return (rows || []).map(toFieldRecord);
  }

  async getContentFieldById(id: string): Promise<ContentField | null> {
    const client = await this.client();
    const { data: row, error } = await client
      .from("content_fields")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw toStoreError(error, "contentFields.getById");
    return row ? toFieldRecord(row) : null;
  }

  async createContentField(input: CreateContentFieldInput, actor: Actor): Promise<ContentField> {
    const client = await this.client();
    const targetTypeId = input.contentTypeId;
    if (!targetTypeId) {
      throw new StoreError("invalid", "contentFields.create", "معرف نوع المحتوى غير محدد.");
    }

    const id = newId();
    const insertPayload: TablesInsert<"content_fields"> = {
      id,
      content_type_id: targetTypeId,
      slug: input.slug.trim().toLowerCase(),
      label_ar: input.labelAr.trim(),
      label_en: input.labelEn?.trim() || null,
      field_type: input.fieldType,
      is_required: input.isRequired ?? false,
      is_translatable: input.isTranslatable ?? true,
      validation_rules: input.validationRules ? (input.validationRules as Json) : null,
      options: input.options ? (input.options as Json) : null,
      sort_order: input.sortOrder ?? 0,
    };

    const { data: row, error } = await client
      .from("content_fields")
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw toStoreError(error, "contentFields.create");

    const record = toFieldRecord(row);
    await this.appendAudit(client, {
      actor,
      action: "create",
      entityType: "content_field",
      entityId: id,
      before: null,
      after: snapshot(record),
    });

    return record;
  }

  async updateContentField(id: string, input: UpdateContentFieldInput, actor: Actor): Promise<ContentField> {
    const client = await this.client();
    const existing = await this.getContentFieldById(id);
    if (!existing) {
      throw new StoreError("not_found", "contentFields.update", "الحقل المطلوب غير موجود.");
    }

    const updatePayload: Partial<TablesInsert<"content_fields">> = {};
    if (input.slug !== undefined) updatePayload.slug = input.slug.trim().toLowerCase();
    if (input.labelAr !== undefined) updatePayload.label_ar = input.labelAr.trim();
    if (input.labelEn !== undefined) updatePayload.label_en = input.labelEn?.trim() || null;
    if (input.fieldType !== undefined) updatePayload.field_type = input.fieldType;
    if (input.isRequired !== undefined) updatePayload.is_required = input.isRequired;
    if (input.isTranslatable !== undefined) updatePayload.is_translatable = input.isTranslatable;
    if (input.validationRules !== undefined) updatePayload.validation_rules = input.validationRules as Json;
    if (input.options !== undefined) updatePayload.options = input.options as Json;
    if (input.sortOrder !== undefined) updatePayload.sort_order = input.sortOrder;

    const { data: row, error } = await client
      .from("content_fields")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw toStoreError(error, "contentFields.update");

    const updated = toFieldRecord(row);
    await this.appendAudit(client, {
      actor,
      action: "update",
      entityType: "content_field",
      entityId: id,
      before: snapshot(existing),
      after: snapshot(updated),
    });

    return updated;
  }

  async deleteContentField(id: string, actor: Actor): Promise<void> {
    const client = await this.client();
    const existing = await this.getContentFieldById(id);
    if (!existing) {
      throw new StoreError("not_found", "contentFields.delete", "الحقل المطلوب غير موجود.");
    }

    const { error } = await client.from("content_fields").delete().eq("id", id);
    if (error) throw toStoreError(error, "contentFields.delete");

    await this.appendAudit(client, {
      actor,
      action: "delete",
      entityType: "content_field",
      entityId: id,
      before: snapshot(existing),
      after: null,
    });
  }

  // ============================================================================
  // Content Entries
  // ============================================================================

  async listContentEntries(typeSlug: string, filter?: ContentEntryListFilter): Promise<ContentEntry[]> {
    const client = await this.client();
    const type = await this.getContentTypeBySlug(typeSlug, { includeFields: false });
    if (!type) return [];

    let query = client
      .from("content_entries")
      .select("*")
      .eq("content_type_id", type.id)
      .order("created_at", { ascending: false });

    if (filter?.status) {
      query = query.eq("status", filter.status);
    }

    if (filter?.limit && filter.limit > 0) {
      const from = filter.offset ?? 0;
      query = query.range(from, from + filter.limit - 1);
    }

    const { data: rows, error } = await query;
    if (error) throw toStoreError(error, "contentEntries.list");

    let entries = (rows || []).map(toEntryRecord);

    if (filter?.search && filter.search.trim().length > 0) {
      const q = filter.search.trim().toLowerCase();
      entries = entries.filter((e) => {
        if (e.slug.toLowerCase().includes(q)) return true;
        return JSON.stringify(e.data).toLowerCase().includes(q);
      });
    }

    return entries;
  }

  async getContentEntry(typeSlug: string, entrySlug: string): Promise<ContentEntry | null> {
    const client = await this.client();
    const type = await this.getContentTypeBySlug(typeSlug, { includeFields: false });
    if (!type) return null;

    const { data: row, error } = await client
      .from("content_entries")
      .select("*")
      .eq("content_type_id", type.id)
      .eq("slug", entrySlug)
      .maybeSingle();

    if (error) throw toStoreError(error, "contentEntries.get");
    return row ? toEntryRecord(row) : null;
  }

  async getContentEntryById(id: string): Promise<ContentEntry | null> {
    const client = await this.client();
    const { data: row, error } = await client
      .from("content_entries")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw toStoreError(error, "contentEntries.getById");
    return row ? toEntryRecord(row) : null;
  }

  async getPublishedEntry(typeSlug: string, entrySlug: string): Promise<ContentEntry | null> {
    const client = await this.publicClient();
    const { data: typeRow } = await client
      .from("content_types")
      .select("id, is_active")
      .eq("slug", typeSlug)
      .eq("is_active", true)
      .maybeSingle();

    if (!typeRow) return null;

    const { data: row, error } = await client
      .from("content_entries")
      .select("*")
      .eq("content_type_id", typeRow.id)
      .eq("slug", entrySlug)
      .eq("status", "published")
      .maybeSingle();

    if (error) {
      console.warn("[store] public read published content entry error", error);
      return null;
    }

    return row ? toEntryRecord(row) : null;
  }

  async createContentEntry(input: CreateContentEntryInput, actor: Actor): Promise<ContentEntry> {
    const client = await this.client();
    const id = newId();
    const status: ContentStatus = input.status || "draft";
    const now = nowIso();
    const publishedAt = status === "published" ? input.publishedAt || now : null;

    const insertPayload: TablesInsert<"content_entries"> = {
      id,
      content_type_id: input.contentTypeId,
      slug: input.slug.trim().toLowerCase(),
      status,
      data: (input.data as Json) || {},
      published_at: publishedAt,
      created_by: actor.id,
      updated_by: actor.id,
      created_at: now,
      updated_at: now,
    };

    const { data: row, error } = await client
      .from("content_entries")
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw toStoreError(error, "contentEntries.create");

    const record = toEntryRecord(row);
    await this.appendAudit(client, {
      actor,
      action: "create",
      entityType: "content_entry",
      entityId: id,
      before: null,
      after: snapshot(record),
    });

    return record;
  }

  async updateContentEntry(id: string, input: UpdateContentEntryInput, actor: Actor): Promise<ContentEntry> {
    const client = await this.client();
    const existing = await this.getContentEntryById(id);
    if (!existing) {
      throw new StoreError("not_found", "contentEntries.update", "عنصر المحتوى المطلوب غير موجود.");
    }

    const now = nowIso();
    const updatePayload: Partial<TablesInsert<"content_entries">> = {
      updated_at: now,
      updated_by: actor.id,
    };

    if (input.slug !== undefined) updatePayload.slug = input.slug.trim().toLowerCase();
    if (input.status !== undefined) {
      updatePayload.status = input.status;
      if (input.status === "published" && !existing.publishedAt) {
        updatePayload.published_at = input.publishedAt || now;
      }
    }
    if (input.publishedAt !== undefined) updatePayload.published_at = input.publishedAt;
    if (input.data !== undefined) updatePayload.data = input.data as Json;

    const { data: row, error } = await client
      .from("content_entries")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw toStoreError(error, "contentEntries.update");

    const updated = toEntryRecord(row);
    await this.appendAudit(client, {
      actor,
      action: "update",
      entityType: "content_entry",
      entityId: id,
      before: snapshot(existing),
      after: snapshot(updated),
    });

    return updated;
  }

  async deleteContentEntry(id: string, actor: Actor): Promise<void> {
    const client = await this.client();
    const existing = await this.getContentEntryById(id);
    if (!existing) {
      throw new StoreError("not_found", "contentEntries.delete", "عنصر المحتوى المطلوب غير موجود.");
    }

    const { error } = await client.from("content_entries").delete().eq("id", id);
    if (error) throw toStoreError(error, "contentEntries.delete");

    await this.appendAudit(client, {
      actor,
      action: "delete",
      entityType: "content_entry",
      entityId: id,
      before: snapshot(existing),
      after: null,
    });
  }

  async setEntryStatus(id: string, status: ContentStatus, actor: Actor): Promise<ContentEntry> {
    const client = await this.client();
    const existing = await this.getContentEntryById(id);
    if (!existing) {
      throw new StoreError("not_found", "contentEntries.setEntryStatus", "عنصر المحتوى المطلوب غير موجود.");
    }

    const now = nowIso();
    const updatePayload: Partial<TablesInsert<"content_entries">> = {
      status,
      updated_at: now,
      updated_by: actor.id,
    };
    if (status === "published" && !existing.publishedAt) {
      updatePayload.published_at = now;
    }

    const { data: row, error } = await client
      .from("content_entries")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw toStoreError(error, "contentEntries.setEntryStatus");

    const updated = toEntryRecord(row);
    const wasPublished = existing.status === "published";
    const action: AuditAction = status === "published" ? "publish" : wasPublished ? "unpublish" : "update";

    await this.appendAudit(client, {
      actor,
      action,
      entityType: "content_entry",
      entityId: id,
      before: snapshot(existing),
      after: snapshot(updated),
    });

    return updated;
  }

  // ============================================================================
  // Seed Built-In Types
  // ============================================================================

  async seedBuiltInTypes(): Promise<void> {
    const client = await this.client();
    for (const seedType of SEED_CONTENT_TYPES) {
      await client.from("content_types").upsert(
        {
          id: seedType.id,
          slug: seedType.slug,
          name_ar: seedType.nameAr,
          name_en: seedType.nameEn,
          icon: seedType.icon,
          template: seedType.template,
          is_active: seedType.isActive,
        },
        { onConflict: "slug" }
      );
    }

    for (const seedField of SEED_CONTENT_FIELDS) {
      await client.from("content_fields").upsert(
        {
          id: seedField.id,
          content_type_id: seedField.contentTypeId,
          slug: seedField.slug,
          label_ar: seedField.labelAr,
          label_en: seedField.labelEn,
          field_type: seedField.fieldType,
          is_required: seedField.isRequired,
          is_translatable: seedField.isTranslatable,
          validation_rules: seedField.validationRules as Json,
          options: seedField.options as Json,
          sort_order: seedField.sortOrder,
        },
        { onConflict: "content_type_id,slug" }
      );
    }
  }
}
