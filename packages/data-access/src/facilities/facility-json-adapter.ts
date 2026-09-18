// packages/data-access/src/facilities/facility-json-adapter.ts
//
// File-store driver for ParishFacilityRepository.
// Provides zero-env fallback, local testing, and full parity with Supabase driver.

import type {
  Actor,
  CreateParishFacilityInput,
  ParishFacility,
  UpdateParishFacilityInput,
} from "@church-site/domain";
import { buildAuditEntry, newId, nowIso, snapshot } from "../store/audit";
import { mutateStoreDocument, readStoreDocument } from "../store/json-store";
import { StoreError, type RepositoryDriverName } from "../store/repository";
import type {
  ParishFacilityListFilter,
  ParishFacilityRepository,
} from "./facility-repository";
import type { StoreDocument } from "../store/document";

function cloneFacility(facility: ParishFacility): ParishFacility {
  return { ...facility };
}

export class JsonParishFacilityRepository implements ParishFacilityRepository {
  readonly driver: RepositoryDriverName = "json";

  async listFacilities(filter?: ParishFacilityListFilter): Promise<ParishFacility[]> {
    const doc = await readStoreDocument();
    let rows = (doc.facilities || []).map(cloneFacility);

    if (filter?.isActive !== undefined) {
      rows = rows.filter((f) => f.isActive === filter.isActive);
    }

    // Sort: displayOrder ascending, then createdAt ascending
    rows.sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }
      return a.createdAt.localeCompare(b.createdAt);
    });

    if (filter?.offset !== undefined) {
      rows = rows.slice(filter.offset);
    }
    if (filter?.limit !== undefined) {
      rows = rows.slice(0, filter.limit);
    }

    return rows;
  }

  async getFacilityById(id: string): Promise<ParishFacility | null> {
    const doc = await readStoreDocument();
    const found = (doc.facilities || []).find((f) => f.id === id);
    return found ? cloneFacility(found) : null;
  }

  async getFacilityBySlug(slug: string): Promise<ParishFacility | null> {
    const doc = await readStoreDocument();
    const found = (doc.facilities || []).find((f) => f.slug === slug);
    return found ? cloneFacility(found) : null;
  }

  async createFacility(
    input: CreateParishFacilityInput,
    actor: Actor
  ): Promise<ParishFacility> {
    const now = nowIso();
    const created = await mutateStoreDocument(
      "facilities.create",
      (doc: StoreDocument) => {
        if (!doc.facilities) {
          doc.facilities = [];
        }

        const trimmedSlug = input.slug.trim();
        const conflict = doc.facilities.some((f) => f.slug === trimmedSlug);
        if (conflict) {
          throw new StoreError(
            "conflict",
            "facilities.create",
            `خدمة بالرابط التعريفي «${trimmedSlug}» موجودة بالفعل.`
          );
        }

        const facility: ParishFacility = {
          id: newId(),
          nameAr: input.nameAr.trim(),
          nameEn: input.nameEn?.trim() || null,
          slug: trimmedSlug,
          serviceType: input.serviceType.trim(),
          descriptionAr: input.descriptionAr.trim(),
          descriptionEn: input.descriptionEn?.trim() || null,
          workingHoursAr: input.workingHoursAr.trim(),
          locationAr: input.locationAr.trim(),
          contactPhone: input.contactPhone?.trim() || null,
          contactWhatsapp: input.contactWhatsapp?.trim() || null,
          guidelinesAr: input.guidelinesAr?.trim() || null,
          displayOrder: input.displayOrder ?? 0,
          isActive: input.isActive ?? true,
          createdBy: actor.id,
          updatedBy: actor.id,
          createdAt: now,
          updatedAt: now,
        };

        doc.facilities.push(facility);

        const audit = buildAuditEntry({
          actor,
          action: "create",
          entityType: "service",
          entityId: facility.id,
          before: null,
          after: snapshot(facility as unknown as Record<string, unknown>),
          summary: `إضافة خدمة كنسية: «${facility.nameAr}»`,
        });
        doc.audit.push(audit);

        return facility;
      }
    );

    return cloneFacility(created);
  }

  async updateFacility(
    id: string,
    input: UpdateParishFacilityInput,
    actor: Actor
  ): Promise<ParishFacility> {
    const updated = await mutateStoreDocument(
      "facilities.update",
      (doc: StoreDocument) => {
        if (!doc.facilities) {
          doc.facilities = [];
        }

        const index = doc.facilities.findIndex((f) => f.id === id);
        if (index === -1) {
          throw new StoreError(
            "not_found",
            "facilities.update",
            `خدمة برقم ${id} غير موجودة.`
          );
        }

        const existing = doc.facilities[index]!;

        if (input.slug !== undefined) {
          const nextSlug = input.slug.trim();
          if (nextSlug !== existing.slug) {
            const conflict = doc.facilities.some(
              (f) => f.id !== id && f.slug === nextSlug
            );
            if (conflict) {
              throw new StoreError(
                "conflict",
                "facilities.update",
                `خدمة بالرابط التعريفي «${nextSlug}» موجودة بالفعل.`
              );
            }
          }
        }

        const before = snapshot(existing as unknown as Record<string, unknown>);
        const now = nowIso();

        const next: ParishFacility = {
          ...existing,
          nameAr:
            input.nameAr !== undefined ? input.nameAr.trim() : existing.nameAr,
          nameEn:
            input.nameEn !== undefined
              ? input.nameEn?.trim() || null
              : existing.nameEn,
          slug:
            input.slug !== undefined ? input.slug.trim() : existing.slug,
          serviceType:
            input.serviceType !== undefined
              ? input.serviceType.trim()
              : existing.serviceType,
          descriptionAr:
            input.descriptionAr !== undefined
              ? input.descriptionAr.trim()
              : existing.descriptionAr,
          descriptionEn:
            input.descriptionEn !== undefined
              ? input.descriptionEn?.trim() || null
              : existing.descriptionEn,
          workingHoursAr:
            input.workingHoursAr !== undefined
              ? input.workingHoursAr.trim()
              : existing.workingHoursAr,
          locationAr:
            input.locationAr !== undefined
              ? input.locationAr.trim()
              : existing.locationAr,
          contactPhone:
            input.contactPhone !== undefined
              ? input.contactPhone?.trim() || null
              : existing.contactPhone,
          contactWhatsapp:
            input.contactWhatsapp !== undefined
              ? input.contactWhatsapp?.trim() || null
              : existing.contactWhatsapp,
          guidelinesAr:
            input.guidelinesAr !== undefined
              ? input.guidelinesAr?.trim() || null
              : existing.guidelinesAr,
          displayOrder:
            input.displayOrder !== undefined
              ? input.displayOrder
              : existing.displayOrder,
          isActive:
            input.isActive !== undefined ? input.isActive : existing.isActive,
          updatedBy: actor.id,
          updatedAt: now,
        };

        doc.facilities[index] = next;

        const audit = buildAuditEntry({
          actor,
          action: "update",
          entityType: "service",
          entityId: next.id,
          before,
          after: snapshot(next as unknown as Record<string, unknown>),
          summary: `تعديل خدمة كنسية: «${next.nameAr}»`,
        });
        doc.audit.push(audit);

        return next;
      }
    );

    return cloneFacility(updated);
  }

  async deleteFacility(id: string, actor: Actor): Promise<void> {
    await mutateStoreDocument(
      "facilities.delete",
      (doc: StoreDocument) => {
        if (!doc.facilities) {
          doc.facilities = [];
        }

        const index = doc.facilities.findIndex((f) => f.id === id);
        if (index === -1) {
          throw new StoreError(
            "not_found",
            "facilities.delete",
            `خدمة برقم ${id} غير موجودة.`
          );
        }

        const existing = doc.facilities[index]!;
        const before = snapshot(existing as unknown as Record<string, unknown>);

        doc.facilities.splice(index, 1);

        const audit = buildAuditEntry({
          actor,
          action: "delete",
          entityType: "service",
          entityId: id,
          before,
          after: null,
          summary: `حذف خدمة كنسية: «${existing.nameAr}»`,
        });
        doc.audit.push(audit);
      }
    );
  }

  async toggleActive(
    id: string,
    isActive: boolean,
    actor: Actor
  ): Promise<ParishFacility> {
    return this.updateFacility(id, { isActive }, actor);
  }
}
