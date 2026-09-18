// packages/data-access/src/facilities/facility-supabase-adapter.ts
//
// Supabase PostgREST driver for ParishFacilityRepository.
// Implements the same contract as JsonParishFacilityRepository with Postgres RLS policies.

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { createPublicSupabaseClient } from "../supabase/public";
import type { Database, Json, Tables, TablesInsert, TablesUpdate } from "@church-site/domain";
import type {
  Actor,
  CreateParishFacilityInput,
  JsonValue,
  ParishFacility,
  UpdateParishFacilityInput,
} from "@church-site/domain";
import { buildAuditEntry, nowIso, snapshot } from "../store/audit";
import { StoreError, type RepositoryDriverName } from "../store/repository";
import type {
  ParishFacilityListFilter,
  ParishFacilityRepository,
} from "./facility-repository";

type StoreClient = SupabaseClient<Database>;
type FacilityRow = Tables<"public_services">;

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

function toStoreError(
  error: PostgrestErrorLike,
  operation: string,
  detail: Record<string, unknown> = {}
): StoreError {
  const mapped = ERROR_CODE_MAP[error.code ?? ""] ?? "unavailable";
  return new StoreError(mapped, operation, error.message, { ...detail, code: error.code ?? null });
}

function toParishFacility(row: FacilityRow): ParishFacility {
  return {
    id: row.id,
    nameAr: row.name_ar,
    nameEn: row.name_en ?? null,
    slug: row.slug,
    serviceType: row.service_type,
    descriptionAr: row.description_ar,
    descriptionEn: row.description_en ?? null,
    workingHoursAr: row.working_hours_ar,
    locationAr: row.location_ar,
    contactPhone: row.contact_phone ?? null,
    contactWhatsapp: row.contact_whatsapp ?? null,
    guidelinesAr: row.guidelines_ar ?? null,
    displayOrder: row.display_order,
    isActive: row.is_active,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    createdBy: row.created_by ?? null,
    updatedBy: row.updated_by ?? null,
  };
}

export class SupabaseParishFacilityRepository implements ParishFacilityRepository {
  readonly driver: RepositoryDriverName = "supabase";

  constructor(
    private readonly clientFactory?: () => Promise<StoreClient>,
    private readonly adminFactory?: () => Promise<StoreClient>
  ) {}

  private async readClient(): Promise<StoreClient> {
    if (this.clientFactory) return this.clientFactory();
    try {
      return await createSupabaseServerClient();
    } catch {
      return createPublicSupabaseClient();
    }
  }

  private async writeClient(): Promise<StoreClient> {
    if (this.adminFactory) return this.adminFactory();
    try {
      return createAdminClient();
    } catch {
      return await createSupabaseServerClient();
    }
  }

  private async appendAudit(
    client: StoreClient,
    params: {
      actor: Actor;
      action: import("@church-site/domain").AuditAction;
      entityType: import("@church-site/domain").AuditEntityType;
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

  async listFacilities(filter?: ParishFacilityListFilter): Promise<ParishFacility[]> {
    const client = await this.readClient();
    let query = client
      .from("public_services")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (filter?.isActive !== undefined) {
      query = query.eq("is_active", filter.isActive);
    }
    if (filter?.offset !== undefined) {
      const limit = filter?.limit ?? 50;
      query = query.range(filter.offset, filter.offset + limit - 1);
    } else if (filter?.limit !== undefined) {
      query = query.limit(filter.limit);
    }

    const { data, error } = await query;
    if (error) {
      throw toStoreError(error, "facilities.list");
    }

    return (data || []).map(toParishFacility);
  }

  async getFacilityById(id: string): Promise<ParishFacility | null> {
    const client = await this.readClient();
    const { data, error } = await client
      .from("public_services")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw toStoreError(error, "facilities.get", { id });
    }

    return data ? toParishFacility(data) : null;
  }

  async getFacilityBySlug(slug: string): Promise<ParishFacility | null> {
    const client = await this.readClient();
    const { data, error } = await client
      .from("public_services")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw toStoreError(error, "facilities.getBySlug", { slug });
    }

    return data ? toParishFacility(data) : null;
  }

  async createFacility(
    input: CreateParishFacilityInput,
    actor: Actor
  ): Promise<ParishFacility> {
    const client = await this.writeClient();

    const insertData: TablesInsert<"public_services"> = {
      name_ar: input.nameAr.trim(),
      name_en: input.nameEn?.trim() || null,
      slug: input.slug.trim(),
      service_type: input.serviceType.trim(),
      description_ar: input.descriptionAr.trim(),
      description_en: input.descriptionEn?.trim() || null,
      working_hours_ar: input.workingHoursAr.trim(),
      location_ar: input.locationAr.trim(),
      contact_phone: input.contactPhone?.trim() || null,
      contact_whatsapp: input.contactWhatsapp?.trim() || null,
      guidelines_ar: input.guidelinesAr?.trim() || null,
      display_order: input.displayOrder ?? 0,
      is_active: input.isActive ?? true,
      created_by: actor.id,
      updated_by: actor.id,
    };

    const { data, error } = await client
      .from("public_services")
      .insert(insertData)
      .select()
      .single();

    if (error || !data) {
      throw toStoreError(error ?? { message: "فشل إنشاء الخدمة" }, "facilities.create");
    }

    const facility = toParishFacility(data);

    await this.appendAudit(client, {
      actor,
      action: "create",
      entityType: "service",
      entityId: facility.id,
      before: null,
      after: snapshot(facility as unknown as Record<string, unknown>),
      summary: `إضافة خدمة كنسية: «${facility.nameAr}»`,
    });

    return facility;
  }

  async updateFacility(
    id: string,
    input: UpdateParishFacilityInput,
    actor: Actor
  ): Promise<ParishFacility> {
    const client = await this.writeClient();

    const existing = await this.getFacilityById(id);
    if (!existing) {
      throw new StoreError("not_found", "facilities.update", `خدمة برقم ${id} غير موجودة.`);
    }

    const updateData: TablesUpdate<"public_services"> = {
      updated_by: actor.id,
      updated_at: nowIso(),
    };

    if (input.nameAr !== undefined) updateData.name_ar = input.nameAr.trim();
    if (input.nameEn !== undefined) updateData.name_en = input.nameEn?.trim() || null;
    if (input.slug !== undefined) updateData.slug = input.slug.trim();
    if (input.serviceType !== undefined) updateData.service_type = input.serviceType.trim();
    if (input.descriptionAr !== undefined) updateData.description_ar = input.descriptionAr.trim();
    if (input.descriptionEn !== undefined)
      updateData.description_en = input.descriptionEn?.trim() || null;
    if (input.workingHoursAr !== undefined)
      updateData.working_hours_ar = input.workingHoursAr.trim();
    if (input.locationAr !== undefined) updateData.location_ar = input.locationAr.trim();
    if (input.contactPhone !== undefined)
      updateData.contact_phone = input.contactPhone?.trim() || null;
    if (input.contactWhatsapp !== undefined)
      updateData.contact_whatsapp = input.contactWhatsapp?.trim() || null;
    if (input.guidelinesAr !== undefined)
      updateData.guidelines_ar = input.guidelinesAr?.trim() || null;
    if (input.displayOrder !== undefined) updateData.display_order = input.displayOrder;
    if (input.isActive !== undefined) updateData.is_active = input.isActive;

    const { data, error } = await client
      .from("public_services")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      throw toStoreError(error ?? { message: "فشل تعديل الخدمة" }, "facilities.update", { id });
    }

    const facility = toParishFacility(data);

    await this.appendAudit(client, {
      actor,
      action: "update",
      entityType: "service",
      entityId: facility.id,
      before: snapshot(existing as unknown as Record<string, unknown>),
      after: snapshot(facility as unknown as Record<string, unknown>),
      summary: `تعديل خدمة كنسية: «${facility.nameAr}»`,
    });

    return facility;
  }

  async deleteFacility(id: string, actor: Actor): Promise<void> {
    const client = await this.writeClient();

    const existing = await this.getFacilityById(id);
    if (!existing) {
      throw new StoreError("not_found", "facilities.delete", `خدمة برقم ${id} غير موجودة.`);
    }

    const { error } = await client.from("public_services").delete().eq("id", id);
    if (error) {
      throw toStoreError(error, "facilities.delete", { id });
    }

    await this.appendAudit(client, {
      actor,
      action: "delete",
      entityType: "service",
      entityId: id,
      before: snapshot(existing as unknown as Record<string, unknown>),
      after: null,
      summary: `حذف خدمة كنسية: «${existing.nameAr}»`,
    });
  }

  async toggleActive(
    id: string,
    isActive: boolean,
    actor: Actor
  ): Promise<ParishFacility> {
    return this.updateFacility(id, { isActive }, actor);
  }
}
