// packages/data-access/src/store/parish-video-supabase-driver.ts
//
// Supabase PostgREST driver for ParishVideoRepository.
// Implements the same contract as JsonParishVideoRepository with Postgres RLS policies.

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { createPublicSupabaseClient } from "../supabase/public";
import type { Database, Json, Tables, TablesInsert, TablesUpdate } from "@church-site/domain";
import type {
  Actor,
  CreateParishVideoInput,
  JsonValue,
  ParishVideo,
  UpdateParishVideoInput,
} from "@church-site/domain";
import { buildAuditEntry, nowIso, snapshot } from "./audit";
import { StoreError, type RepositoryDriverName } from "./repository";
import type {
  ParishVideoListFilter,
  ParishVideoRepository,
} from "./parish-video-repository";

type StoreClient = SupabaseClient<Database>;
type ParishVideoRow = Tables<"parish_videos">;

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

function toParishVideo(row: ParishVideoRow): ParishVideo {
  return {
    id: row.id,
    titleAr: row.title_ar,
    titleEn: row.title_en,
    descriptionAr: row.description_ar,
    descriptionEn: row.description_en,
    provider: row.provider,
    sourceUrl: row.source_url,
    embedUrl: row.embed_url,
    thumbnailUrl: row.thumbnail_url,
    sortOrder: row.sort_order,
    isPublic: row.is_public,
    isActive: row.is_active,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export class SupabaseParishVideoRepository implements ParishVideoRepository {
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

  async listVideos(filter?: ParishVideoListFilter): Promise<ParishVideo[]> {
    const client = await this.readClient();
    let query = client
      .from("parish_videos")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (filter?.isPublic !== undefined) {
      query = query.eq("is_public", filter.isPublic);
    }
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
      throw toStoreError(error, "videos.list");
    }

    return (data || []).map(toParishVideo);
  }

  async getVideoById(id: string): Promise<ParishVideo | null> {
    const client = await this.readClient();
    const { data, error } = await client
      .from("parish_videos")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw toStoreError(error, "videos.get", { id });
    }

    return data ? toParishVideo(data) : null;
  }

  async createVideo(input: CreateParishVideoInput, actor: Actor): Promise<ParishVideo> {
    const client = await this.writeClient();

    const insertData: TablesInsert<"parish_videos"> = {
      title_ar: input.titleAr.trim(),
      title_en: input.titleEn?.trim() || null,
      description_ar: input.descriptionAr?.trim() || null,
      description_en: input.descriptionEn?.trim() || null,
      provider: input.provider,
      source_url: input.sourceUrl.trim(),
      embed_url: input.embedUrl.trim(),
      thumbnail_url: input.thumbnailUrl?.trim() || null,
      sort_order: input.sortOrder ?? 0,
      is_public: input.isPublic ?? true,
      is_active: input.isActive ?? true,
      created_by: actor.id,
      updated_by: actor.id,
    };

    const { data, error } = await client
      .from("parish_videos")
      .insert(insertData)
      .select()
      .single();

    if (error || !data) {
      throw toStoreError(error ?? { message: "فشل إنشاء الفيديو" }, "videos.create");
    }

    const video = toParishVideo(data);

    await this.appendAudit(client, {
      actor,
      action: "create",
      entityType: "video",
      entityId: video.id,
      before: null,
      after: snapshot(video as unknown as Record<string, unknown>),
      summary: `إضافة فيديو: «${video.titleAr}»`,
    });

    return video;
  }

  async updateVideo(
    id: string,
    input: UpdateParishVideoInput,
    actor: Actor
  ): Promise<ParishVideo> {
    const client = await this.writeClient();

    const existing = await this.getVideoById(id);
    if (!existing) {
      throw new StoreError("not_found", "videos.update", `فيديو برقم ${id} غير موجود.`);
    }

    const updateData: TablesUpdate<"parish_videos"> = {
      updated_by: actor.id,
      updated_at: nowIso(),
    };

    if (input.titleAr !== undefined) updateData.title_ar = input.titleAr.trim();
    if (input.titleEn !== undefined) updateData.title_en = input.titleEn?.trim() || null;
    if (input.descriptionAr !== undefined)
      updateData.description_ar = input.descriptionAr?.trim() || null;
    if (input.descriptionEn !== undefined)
      updateData.description_en = input.descriptionEn?.trim() || null;
    if (input.provider !== undefined) updateData.provider = input.provider;
    if (input.sourceUrl !== undefined) updateData.source_url = input.sourceUrl.trim();
    if (input.embedUrl !== undefined) updateData.embed_url = input.embedUrl.trim();
    if (input.thumbnailUrl !== undefined)
      updateData.thumbnail_url = input.thumbnailUrl?.trim() || null;
    if (input.sortOrder !== undefined) updateData.sort_order = input.sortOrder;
    if (input.isPublic !== undefined) updateData.is_public = input.isPublic;
    if (input.isActive !== undefined) updateData.is_active = input.isActive;

    const { data, error } = await client
      .from("parish_videos")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      throw toStoreError(error ?? { message: "فشل تعديل الفيديو" }, "videos.update", { id });
    }

    const video = toParishVideo(data);

    await this.appendAudit(client, {
      actor,
      action: "update",
      entityType: "video",
      entityId: video.id,
      before: snapshot(existing as unknown as Record<string, unknown>),
      after: snapshot(video as unknown as Record<string, unknown>),
      summary: `تعديل فيديو: «${video.titleAr}»`,
    });

    return video;
  }

  async deleteVideo(id: string, actor: Actor): Promise<void> {
    const client = await this.writeClient();

    const existing = await this.getVideoById(id);
    if (!existing) {
      throw new StoreError("not_found", "videos.delete", `فيديو برقم ${id} غير موجود.`);
    }

    const { error } = await client.from("parish_videos").delete().eq("id", id);
    if (error) {
      throw toStoreError(error, "videos.delete", { id });
    }

    await this.appendAudit(client, {
      actor,
      action: "delete",
      entityType: "video",
      entityId: id,
      before: snapshot(existing as unknown as Record<string, unknown>),
      after: null,
      summary: `حذف فيديو: «${existing.titleAr}»`,
    });
  }

  async toggleActive(id: string, isActive: boolean, actor: Actor): Promise<ParishVideo> {
    return this.updateVideo(id, { isActive }, actor);
  }

  async togglePublic(id: string, isPublic: boolean, actor: Actor): Promise<ParishVideo> {
    return this.updateVideo(id, { isPublic }, actor);
  }
}
