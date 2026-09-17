// packages/data-access/src/store/parish-video-json-driver.ts
//
// File-store driver for ParishVideoRepository.
// Provides zero-env fallback, local testing, and full parity with Supabase driver.

import type {
  Actor,
  CreateParishVideoInput,
  ParishVideo,
  UpdateParishVideoInput,
} from "@church-site/domain";
import { buildAuditEntry, newId, nowIso, snapshot } from "./audit";
import { mutateStoreDocument, readStoreDocument } from "./json-store";
import { StoreError, type RepositoryDriverName } from "./repository";
import type {
  ParishVideoListFilter,
  ParishVideoRepository,
} from "./parish-video-repository";
import type { StoreDocument } from "./document";

function cloneVideo(video: ParishVideo): ParishVideo {
  return { ...video };
}

export class JsonParishVideoRepository implements ParishVideoRepository {
  readonly driver: RepositoryDriverName = "json";

  async listVideos(filter?: ParishVideoListFilter): Promise<ParishVideo[]> {
    const doc = await readStoreDocument();
    let rows = (doc.parishVideos || []).map(cloneVideo);

    if (filter?.isPublic !== undefined) {
      rows = rows.filter((v) => v.isPublic === filter.isPublic);
    }
    if (filter?.isActive !== undefined) {
      rows = rows.filter((v) => v.isActive === filter.isActive);
    }

    // Sort: sortOrder ascending, then createdAt descending
    rows.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return b.createdAt.localeCompare(a.createdAt);
    });

    if (filter?.offset !== undefined) {
      rows = rows.slice(filter.offset);
    }
    if (filter?.limit !== undefined) {
      rows = rows.slice(0, filter.limit);
    }

    return rows;
  }

  async getVideoById(id: string): Promise<ParishVideo | null> {
    const doc = await readStoreDocument();
    const found = (doc.parishVideos || []).find((v) => v.id === id);
    return found ? cloneVideo(found) : null;
  }

  async createVideo(input: CreateParishVideoInput, actor: Actor): Promise<ParishVideo> {
    const now = nowIso();
    const created = await mutateStoreDocument("videos.create", (doc: StoreDocument) => {
      if (!doc.parishVideos) {
        doc.parishVideos = [];
      }

      const video: ParishVideo = {
        id: newId(),
        titleAr: input.titleAr.trim(),
        titleEn: input.titleEn?.trim() || null,
        descriptionAr: input.descriptionAr?.trim() || null,
        descriptionEn: input.descriptionEn?.trim() || null,
        provider: input.provider,
        sourceUrl: input.sourceUrl.trim(),
        embedUrl: input.embedUrl.trim(),
        thumbnailUrl: input.thumbnailUrl?.trim() || null,
        sortOrder: input.sortOrder ?? 0,
        isPublic: input.isPublic ?? true,
        isActive: input.isActive ?? true,
        createdBy: actor.id,
        updatedBy: actor.id,
        createdAt: now,
        updatedAt: now,
      };

      doc.parishVideos.push(video);

      const audit = buildAuditEntry({
        actor,
        action: "create",
        entityType: "video",
        entityId: video.id,
        before: null,
        after: snapshot(video as unknown as Record<string, unknown>),
        summary: `إضافة فيديو: «${video.titleAr}»`,
      });
      doc.audit.push(audit);

      return video;
    });

    return cloneVideo(created);
  }

  async updateVideo(
    id: string,
    input: UpdateParishVideoInput,
    actor: Actor
  ): Promise<ParishVideo> {
    const updated = await mutateStoreDocument("videos.update", (doc: StoreDocument) => {
      if (!doc.parishVideos) {
        doc.parishVideos = [];
      }

      const index = doc.parishVideos.findIndex((v: ParishVideo) => v.id === id);
      if (index === -1) {
        throw new StoreError("not_found", "videos.update", `فيديو برقم ${id} غير موجود.`);
      }

      const existing = doc.parishVideos[index]!;
      const before = snapshot(existing as unknown as Record<string, unknown>);
      const now = nowIso();

      const next: ParishVideo = {
        ...existing,
        titleAr: input.titleAr !== undefined ? input.titleAr.trim() : existing.titleAr,
        titleEn:
          input.titleEn !== undefined
            ? input.titleEn?.trim() || null
            : existing.titleEn,
        descriptionAr:
          input.descriptionAr !== undefined
            ? input.descriptionAr?.trim() || null
            : existing.descriptionAr,
        descriptionEn:
          input.descriptionEn !== undefined
            ? input.descriptionEn?.trim() || null
            : existing.descriptionEn,
        provider: input.provider ?? existing.provider,
        sourceUrl:
          input.sourceUrl !== undefined
            ? input.sourceUrl.trim()
            : existing.sourceUrl,
        embedUrl:
          input.embedUrl !== undefined
            ? input.embedUrl.trim()
            : existing.embedUrl,
        thumbnailUrl:
          input.thumbnailUrl !== undefined
            ? input.thumbnailUrl?.trim() || null
            : existing.thumbnailUrl,
        sortOrder: input.sortOrder !== undefined ? input.sortOrder : existing.sortOrder,
        isPublic: input.isPublic !== undefined ? input.isPublic : existing.isPublic,
        isActive: input.isActive !== undefined ? input.isActive : existing.isActive,
        updatedBy: actor.id,
        updatedAt: now,
      };

      doc.parishVideos[index] = next;

      const audit = buildAuditEntry({
        actor,
        action: "update",
        entityType: "video",
        entityId: next.id,
        before,
        after: snapshot(next as unknown as Record<string, unknown>),
        summary: `تعديل فيديو: «${next.titleAr}»`,
      });
      doc.audit.push(audit);

      return next;
    });

    return cloneVideo(updated);
  }

  async deleteVideo(id: string, actor: Actor): Promise<void> {
    await mutateStoreDocument("videos.delete", (doc: StoreDocument) => {
      if (!doc.parishVideos) {
        doc.parishVideos = [];
      }

      const index = doc.parishVideos.findIndex((v: ParishVideo) => v.id === id);
      if (index === -1) {
        throw new StoreError("not_found", "videos.delete", `فيديو برقم ${id} غير موجود.`);
      }

      const existing = doc.parishVideos[index]!;
      const before = snapshot(existing as unknown as Record<string, unknown>);

      doc.parishVideos.splice(index, 1);

      const audit = buildAuditEntry({
        actor,
        action: "delete",
        entityType: "video",
        entityId: id,
        before,
        after: null,
        summary: `حذف فيديو: «${existing.titleAr}»`,
      });
      doc.audit.push(audit);
    });
  }

  async toggleActive(id: string, isActive: boolean, actor: Actor): Promise<ParishVideo> {
    return this.updateVideo(id, { isActive }, actor);
  }

  async togglePublic(id: string, isPublic: boolean, actor: Actor): Promise<ParishVideo> {
    return this.updateVideo(id, { isPublic }, actor);
  }
}
