// src/lib/store/content-json-driver.ts
// JSON file-store driver for ContentTypeRepository.
// Guarantees atomic mutations, audit logs, and parity with Supabase PostgREST driver.

import type {
  Actor,
  AuditAction,
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
import { buildAuditEntry, newId, nowIso, snapshot } from "./audit";
import { mutateStoreDocument, readStoreDocument } from "./json-store";
import { StoreError, type RepositoryDriverName } from "./repository";
import type { ContentEntryListFilter, ContentTypeRepository } from "./content-repository";
import { SEED_CONTENT_FIELDS, SEED_CONTENT_TYPES } from "./seed";
import type { StoreDocument } from "./document";

function cloneType(type: ContentType, fields?: ContentField[]): ContentType {
  return {
    ...type,
    fields: fields ? fields.map((f) => ({ ...f })) : type.fields ? type.fields.map((f) => ({ ...f })) : undefined,
  };
}

function cloneField(field: ContentField): ContentField {
  return {
    ...field,
    validationRules: field.validationRules ? { ...field.validationRules } : null,
    options: field.options ? JSON.parse(JSON.stringify(field.options)) : null,
  };
}

function cloneEntry(entry: ContentEntry): ContentEntry {
  return {
    ...entry,
    data: JSON.parse(JSON.stringify(entry.data || {})),
  };
}

export class JsonContentTypeRepository implements ContentTypeRepository {
  readonly driver: RepositoryDriverName = "json";

  // ============================================================================
  // Content Types
  // ============================================================================

  async listContentTypes(options?: { includeInactive?: boolean }): Promise<ContentType[]> {
    const doc = await readStoreDocument();
    let types = doc.contentTypes || [];
    if (!options?.includeInactive) {
      types = types.filter((t: ContentType) => t.isActive);
    }
    const fields = doc.contentFields || [];
    return types.map((t: ContentType) => {
      const typeFields = fields
        .filter((f: ContentField) => f.contentTypeId === t.id)
        .sort((a: ContentField, b: ContentField) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      return cloneType(t, typeFields);
    });
  }

  async getContentTypeBySlug(slug: string, options?: { includeFields?: boolean }): Promise<ContentType | null> {
    const doc = await readStoreDocument();
    const type = (doc.contentTypes || []).find((t: ContentType) => t.slug === slug);
    if (!type) return null;

    let typeFields: ContentField[] | undefined;
    if (options?.includeFields !== false) {
      typeFields = (doc.contentFields || [])
        .filter((f: ContentField) => f.contentTypeId === type.id)
        .sort((a: ContentField, b: ContentField) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }
    return cloneType(type, typeFields);
  }

  async getContentTypeById(id: string, options?: { includeFields?: boolean }): Promise<ContentType | null> {
    const doc = await readStoreDocument();
    const type = (doc.contentTypes || []).find((t: ContentType) => t.id === id);
    if (!type) return null;

    let typeFields: ContentField[] | undefined;
    if (options?.includeFields !== false) {
      typeFields = (doc.contentFields || [])
        .filter((f: ContentField) => f.contentTypeId === type.id)
        .sort((a: ContentField, b: ContentField) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }
    return cloneType(type, typeFields);
  }

  async createContentType(input: CreateContentTypeInput, actor: Actor): Promise<ContentType> {
    return mutateStoreDocument("contentTypes.create", (doc: StoreDocument) => {
      if (!doc.contentTypes) doc.contentTypes = [];
      const slug = input.slug.trim().toLowerCase();

      if (doc.contentTypes.some((t: ContentType) => t.slug === slug)) {
        throw new StoreError("conflict", "contentTypes.create", `نوع المحتوى بالاسم البرمجي «${slug}» موجود مسبقاً.`);
      }

      const created: ContentType = {
        id: newId(),
        slug,
        nameAr: input.nameAr.trim(),
        nameEn: input.nameEn?.trim() || null,
        icon: input.icon?.trim() || null,
        template: input.template?.trim() || "default",
        isActive: input.isActive ?? true,
        createdAt: nowIso(),
        fields: [],
      };

      doc.contentTypes.push(created);
      doc.audit.push(
        buildAuditEntry({
          actor,
          action: "create",
          entityType: "content_type",
          entityId: created.id,
          before: null,
          after: snapshot(created),
        })
      );

      return cloneType(created, []);
    });
  }

  async updateContentType(id: string, input: UpdateContentTypeInput, actor: Actor): Promise<ContentType> {
    return mutateStoreDocument("contentTypes.update", (doc: StoreDocument) => {
      if (!doc.contentTypes) doc.contentTypes = [];
      const index = doc.contentTypes.findIndex((t: ContentType) => t.id === id);
      if (index === -1) {
        throw new StoreError("not_found", "contentTypes.update", "نوع المحتوى المطلوب غير موجود.");
      }

      const existing = doc.contentTypes[index];
      const before = snapshot(existing);

      if (input.slug !== undefined) {
        const slug = input.slug.trim().toLowerCase();
        if (doc.contentTypes.some((t: ContentType) => t.id !== id && t.slug === slug)) {
          throw new StoreError("conflict", "contentTypes.update", `الاسم البرمجي «${slug}» مستخدم بالفعل في نوع آخر.`);
        }
        existing.slug = slug;
      }

      if (input.nameAr !== undefined) existing.nameAr = input.nameAr.trim();
      if (input.nameEn !== undefined) existing.nameEn = input.nameEn?.trim() || null;
      if (input.icon !== undefined) existing.icon = input.icon?.trim() || null;
      if (input.template !== undefined) existing.template = input.template?.trim() || "default";
      if (input.isActive !== undefined) existing.isActive = input.isActive;

      doc.audit.push(
        buildAuditEntry({
          actor,
          action: "update",
          entityType: "content_type",
          entityId: existing.id,
          before,
          after: snapshot(existing),
        })
      );

      const typeFields = (doc.contentFields || [])
        .filter((f: ContentField) => f.contentTypeId === existing.id)
        .sort((a: ContentField, b: ContentField) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

      return cloneType(existing, typeFields);
    });
  }

  async deleteContentType(id: string, actor: Actor): Promise<void> {
    return mutateStoreDocument("contentTypes.delete", (doc: StoreDocument) => {
      if (!doc.contentTypes) doc.contentTypes = [];
      const index = doc.contentTypes.findIndex((t: ContentType) => t.id === id);
      if (index === -1) {
        throw new StoreError("not_found", "contentTypes.delete", "نوع المحتوى المطلوب غير موجود.");
      }

      const existing = doc.contentTypes[index];
      const hasEntries = (doc.contentEntries || []).some((e: ContentEntry) => e.contentTypeId === id);
      if (hasEntries) {
        throw new StoreError(
          "conflict",
          "contentTypes.delete",
          "لا يمكن حذف هذا النوع لوجود عناصر محتوى تابعة له. قم بحذف العناصر أولاً أو إلغاء تفعيل النوع."
        );
      }

      const before = snapshot(existing);
      // Cascade delete fields
      doc.contentFields = (doc.contentFields || []).filter((f: ContentField) => f.contentTypeId !== id);
      doc.contentTypes.splice(index, 1);

      doc.audit.push(
        buildAuditEntry({
          actor,
          action: "delete",
          entityType: "content_type",
          entityId: id,
          before,
          after: null,
        })
      );
    });
  }

  // ============================================================================
  // Content Fields
  // ============================================================================

  async listContentFields(contentTypeId: string): Promise<ContentField[]> {
    const doc = await readStoreDocument();
    return (doc.contentFields || [])
      .filter((f: ContentField) => f.contentTypeId === contentTypeId)
      .sort((a: ContentField, b: ContentField) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map(cloneField);
  }

  async getContentFieldById(id: string): Promise<ContentField | null> {
    const doc = await readStoreDocument();
    const field = (doc.contentFields || []).find((f: ContentField) => f.id === id);
    return field ? cloneField(field) : null;
  }

  async createContentField(input: CreateContentFieldInput, actor: Actor): Promise<ContentField> {
    return mutateStoreDocument("contentFields.create", (doc: StoreDocument) => {
      if (!doc.contentFields) doc.contentFields = [];
      const targetTypeId = input.contentTypeId;
      if (!targetTypeId || !(doc.contentTypes || []).some((t: ContentType) => t.id === targetTypeId)) {
        throw new StoreError("invalid", "contentFields.create", "نوع المحتوى المحدد غير موجود.");
      }

      const slug = input.slug.trim().toLowerCase();
      if (doc.contentFields.some((f: ContentField) => f.contentTypeId === targetTypeId && f.slug === slug)) {
        throw new StoreError("conflict", "contentFields.create", `الحقل «${slug}» مضاف مسبقاً لهذا النوع.`);
      }

      const created: ContentField = {
        id: newId(),
        contentTypeId: targetTypeId,
        slug,
        labelAr: input.labelAr.trim(),
        labelEn: input.labelEn?.trim() || null,
        fieldType: input.fieldType,
        isRequired: input.isRequired ?? false,
        isTranslatable: input.isTranslatable ?? true,
        validationRules: input.validationRules ? { ...input.validationRules } : null,
        options: input.options || null,
        sortOrder: input.sortOrder ?? doc.contentFields.filter((f: ContentField) => f.contentTypeId === targetTypeId).length + 1,
      };

      doc.contentFields.push(created);
      doc.audit.push(
        buildAuditEntry({
          actor,
          action: "create",
          entityType: "content_field",
          entityId: created.id,
          before: null,
          after: snapshot(created),
        })
      );

      return cloneField(created);
    });
  }

  async updateContentField(id: string, input: UpdateContentFieldInput, actor: Actor): Promise<ContentField> {
    return mutateStoreDocument("contentFields.update", (doc: StoreDocument) => {
      if (!doc.contentFields) doc.contentFields = [];
      const index = doc.contentFields.findIndex((f: ContentField) => f.id === id);
      if (index === -1) {
        throw new StoreError("not_found", "contentFields.update", "الحقل المطلوب تعديله غير موجود.");
      }

      const existing = doc.contentFields[index];
      const before = snapshot(existing);

      if (input.slug !== undefined) {
        const slug = input.slug.trim().toLowerCase();
        if (doc.contentFields.some((f: ContentField) => f.id !== id && f.contentTypeId === existing.contentTypeId && f.slug === slug)) {
          throw new StoreError("conflict", "contentFields.update", `اسم الحقل «${slug}» مكرر في هذا النوع.`);
        }
        existing.slug = slug;
      }

      if (input.labelAr !== undefined) existing.labelAr = input.labelAr.trim();
      if (input.labelEn !== undefined) existing.labelEn = input.labelEn?.trim() || null;
      if (input.fieldType !== undefined) existing.fieldType = input.fieldType;
      if (input.isRequired !== undefined) existing.isRequired = input.isRequired;
      if (input.isTranslatable !== undefined) existing.isTranslatable = input.isTranslatable;
      if (input.validationRules !== undefined) existing.validationRules = input.validationRules;
      if (input.options !== undefined) existing.options = input.options;
      if (input.sortOrder !== undefined) existing.sortOrder = input.sortOrder;

      doc.audit.push(
        buildAuditEntry({
          actor,
          action: "update",
          entityType: "content_field",
          entityId: existing.id,
          before,
          after: snapshot(existing),
        })
      );

      return cloneField(existing);
    });
  }

  async deleteContentField(id: string, actor: Actor): Promise<void> {
    return mutateStoreDocument("contentFields.delete", (doc: StoreDocument) => {
      if (!doc.contentFields) doc.contentFields = [];
      const index = doc.contentFields.findIndex((f: ContentField) => f.id === id);
      if (index === -1) {
        throw new StoreError("not_found", "contentFields.delete", "الحقل المطلوب حذفه غير موجود.");
      }

      const existing = doc.contentFields[index];
      const before = snapshot(existing);

      doc.contentFields.splice(index, 1);
      doc.audit.push(
        buildAuditEntry({
          actor,
          action: "delete",
          entityType: "content_field",
          entityId: id,
          before,
          after: null,
        })
      );
    });
  }

  // ============================================================================
  // Content Entries
  // ============================================================================

  async listContentEntries(typeSlug: string, filter?: ContentEntryListFilter): Promise<ContentEntry[]> {
    const doc = await readStoreDocument();
    const type = (doc.contentTypes || []).find((t: ContentType) => t.slug === typeSlug);
    if (!type) return [];

    let entries = (doc.contentEntries || []).filter((e: ContentEntry) => e.contentTypeId === type.id);

    if (filter?.status) {
      entries = entries.filter((e: ContentEntry) => e.status === filter.status);
    }

    if (filter?.search && filter.search.trim().length > 0) {
      const q = filter.search.trim().toLowerCase();
      entries = entries.filter((e: ContentEntry) => {
        if (e.slug.toLowerCase().includes(q)) return true;
        const stringValues = JSON.stringify(e.data).toLowerCase();
        return stringValues.includes(q);
      });
    }

    // Sort descending by publishedAt or createdAt
    entries.sort((a: ContentEntry, b: ContentEntry) => {
      const timeA = a.publishedAt || a.createdAt;
      const timeB = b.publishedAt || b.createdAt;
      return timeB.localeCompare(timeA);
    });

    if (typeof filter?.offset === "number" && filter.offset > 0) {
      entries = entries.slice(filter.offset);
    }
    if (typeof filter?.limit === "number" && filter.limit > 0) {
      entries = entries.slice(0, filter.limit);
    }

    return entries.map(cloneEntry);
  }

  async getContentEntry(typeSlug: string, entrySlug: string): Promise<ContentEntry | null> {
    const doc = await readStoreDocument();
    const type = (doc.contentTypes || []).find((t: ContentType) => t.slug === typeSlug);
    if (!type) return null;

    const entry = (doc.contentEntries || []).find(
      (e: ContentEntry) => e.contentTypeId === type.id && e.slug === entrySlug
    );
    return entry ? cloneEntry(entry) : null;
  }

  async getContentEntryById(id: string): Promise<ContentEntry | null> {
    const doc = await readStoreDocument();
    const entry = (doc.contentEntries || []).find((e: ContentEntry) => e.id === id);
    return entry ? cloneEntry(entry) : null;
  }

  async getPublishedEntry(typeSlug: string, entrySlug: string): Promise<ContentEntry | null> {
    const doc = await readStoreDocument();
    const type = (doc.contentTypes || []).find((t: ContentType) => t.slug === typeSlug && t.isActive);
    if (!type) return null;

    const entry = (doc.contentEntries || []).find(
      (e: ContentEntry) => e.contentTypeId === type.id && e.slug === entrySlug && e.status === "published"
    );
    return entry ? cloneEntry(entry) : null;
  }

  async createContentEntry(input: CreateContentEntryInput, actor: Actor): Promise<ContentEntry> {
    return mutateStoreDocument("contentEntries.create", (doc: StoreDocument) => {
      if (!doc.contentEntries) doc.contentEntries = [];
      const type = (doc.contentTypes || []).find((t: ContentType) => t.id === input.contentTypeId);
      if (!type) {
        throw new StoreError("invalid", "contentEntries.create", "نوع المحتوى غير صالح.");
      }

      const slug = input.slug.trim().toLowerCase();
      if (doc.contentEntries.some((e: ContentEntry) => e.contentTypeId === type.id && e.slug === slug)) {
        throw new StoreError("conflict", "contentEntries.create", `الاسم البرمجي «${slug}» مستخدم لعنصر آخر في هذا النوع.`);
      }

      const status: ContentStatus = input.status || "draft";
      const now = nowIso();
      const publishedAt = status === "published" ? input.publishedAt || now : null;

      const created: ContentEntry = {
        id: newId(),
        contentTypeId: type.id,
        slug,
        status,
        data: input.data || {},
        publishedAt,
        createdBy: actor.id,
        updatedBy: actor.id,
        createdAt: now,
        updatedAt: now,
      };

      doc.contentEntries.push(created);
      doc.audit.push(
        buildAuditEntry({
          actor,
          action: "create",
          entityType: "content_entry",
          entityId: created.id,
          before: null,
          after: snapshot(created),
        })
      );

      return cloneEntry(created);
    });
  }

  async updateContentEntry(id: string, input: UpdateContentEntryInput, actor: Actor): Promise<ContentEntry> {
    return mutateStoreDocument("contentEntries.update", (doc: StoreDocument) => {
      if (!doc.contentEntries) doc.contentEntries = [];
      const index = doc.contentEntries.findIndex((e: ContentEntry) => e.id === id);
      if (index === -1) {
        throw new StoreError("not_found", "contentEntries.update", "عنصر المحتوى غير موجود.");
      }

      const existing = doc.contentEntries[index];
      const before = snapshot(existing);

      if (input.slug !== undefined) {
        const slug = input.slug.trim().toLowerCase();
        if (doc.contentEntries.some((e: ContentEntry) => e.id !== id && e.contentTypeId === existing.contentTypeId && e.slug === slug)) {
          throw new StoreError("conflict", "contentEntries.update", `الاسم البرمجي «${slug}» مستخدم في عنصر آخر.`);
        }
        existing.slug = slug;
      }

      if (input.status !== undefined) {
        existing.status = input.status;
        if (input.status === "published" && !existing.publishedAt) {
          existing.publishedAt = input.publishedAt || nowIso();
        }
      }

      if (input.publishedAt !== undefined) {
        existing.publishedAt = input.publishedAt;
      }

      if (input.data !== undefined) {
        existing.data = input.data;
      }

      existing.updatedAt = nowIso();
      existing.updatedBy = actor.id;

      doc.audit.push(
        buildAuditEntry({
          actor,
          action: "update",
          entityType: "content_entry",
          entityId: existing.id,
          before,
          after: snapshot(existing),
        })
      );

      return cloneEntry(existing);
    });
  }

  async deleteContentEntry(id: string, actor: Actor): Promise<void> {
    return mutateStoreDocument("contentEntries.delete", (doc: StoreDocument) => {
      if (!doc.contentEntries) doc.contentEntries = [];
      const index = doc.contentEntries.findIndex((e: ContentEntry) => e.id === id);
      if (index === -1) {
        throw new StoreError("not_found", "contentEntries.delete", "عنصر المحتوى غير موجود.");
      }

      const existing = doc.contentEntries[index];
      const before = snapshot(existing);

      doc.contentEntries.splice(index, 1);
      doc.audit.push(
        buildAuditEntry({
          actor,
          action: "delete",
          entityType: "content_entry",
          entityId: id,
          before,
          after: null,
        })
      );
    });
  }

  async setEntryStatus(id: string, status: ContentStatus, actor: Actor): Promise<ContentEntry> {
    return mutateStoreDocument("contentEntries.setEntryStatus", (doc: StoreDocument) => {
      if (!doc.contentEntries) doc.contentEntries = [];
      const index = doc.contentEntries.findIndex((e: ContentEntry) => e.id === id);
      if (index === -1) {
        throw new StoreError("not_found", "contentEntries.setEntryStatus", "عنصر المحتوى غير موجود.");
      }

      const existing = doc.contentEntries[index];
      const before = snapshot(existing);
      const wasPublished = existing.status === "published";

      existing.status = status;
      if (status === "published" && !existing.publishedAt) {
        existing.publishedAt = nowIso();
      }
      existing.updatedAt = nowIso();
      existing.updatedBy = actor.id;

      const action: AuditAction = status === "published" ? "publish" : wasPublished ? "unpublish" : "update";

      doc.audit.push(
        buildAuditEntry({
          actor,
          action,
          entityType: "content_entry",
          entityId: existing.id,
          before,
          after: snapshot(existing),
        })
      );

      return cloneEntry(existing);
    });
  }

  // ============================================================================
  // Built-in Seed Types Initialization
  // ============================================================================

  async seedBuiltInTypes(): Promise<void> {
    return mutateStoreDocument("contentTypes.seedBuiltIn", (doc: StoreDocument) => {
      if (!doc.contentTypes) doc.contentTypes = [];
      if (!doc.contentFields) doc.contentFields = [];

      for (const seedType of SEED_CONTENT_TYPES) {
        if (!doc.contentTypes.some((t: ContentType) => t.slug === seedType.slug)) {
          doc.contentTypes.push({ ...seedType });
        }
      }

      for (const seedField of SEED_CONTENT_FIELDS) {
        if (
          !doc.contentFields.some(
            (f: ContentField) => f.contentTypeId === seedField.contentTypeId && f.slug === seedField.slug
          )
        ) {
          doc.contentFields.push(cloneField(seedField));
        }
      }
    });
  }
}
