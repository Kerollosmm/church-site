// packages/data-access/src/navigation/navigation-json-adapter.ts
//
// File-store driver for ParishNavigationRepository.
// Provides zero-env fallback, local testing, and full parity with Supabase driver.

import type {
  Actor,
  CreateNavItemInput,
  NavigationMenuItem,
  ReorderNavItemsInput,
  UpdateNavItemInput,
} from "@church-site/domain";
import { buildAuditEntry, newId, nowIso, snapshot } from "../store/audit";
import { mutateStoreDocument, readStoreDocument } from "../store/json-store";
import { StoreError, type RepositoryDriverName } from "../store/repository";
import type {
  NavItemListFilter,
  ParishNavigationRepository,
} from "./navigation-repository";
import type { StoreDocument } from "../store/document";

function cloneItem(item: NavigationMenuItem): NavigationMenuItem {
  return { ...item };
}

export class JsonParishNavigationRepository implements ParishNavigationRepository {
  readonly driver: RepositoryDriverName = "json";

  async listItems(filter?: NavItemListFilter): Promise<NavigationMenuItem[]> {
    const doc = await readStoreDocument();
    let rows = (doc.navItems || []).map(cloneItem);

    if (filter?.section !== undefined) {
      rows = rows.filter((i) => i.section === filter.section);
    }
    if (filter?.parentId !== undefined) {
      rows = rows.filter((i) => i.parentId === filter.parentId);
    }
    if (filter?.isActive !== undefined) {
      rows = rows.filter((i) => i.isActive === filter.isActive);
    }
    if (filter?.isPublic !== undefined) {
      rows = rows.filter((i) => i.isPublic === filter.isPublic);
    }

    // Sort: sortOrder ascending, then createdAt ascending
    rows.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return a.createdAt.localeCompare(b.createdAt);
    });

    return rows;
  }

  async getItemById(id: string): Promise<NavigationMenuItem | null> {
    const doc = await readStoreDocument();
    const found = (doc.navItems || []).find((i) => i.id === id);
    return found ? cloneItem(found) : null;
  }

  async getItemByKey(key: string): Promise<NavigationMenuItem | null> {
    const doc = await readStoreDocument();
    const found = (doc.navItems || []).find((i) => i.key === key);
    return found ? cloneItem(found) : null;
  }

  async createItem(
    input: CreateNavItemInput,
    actor: Actor
  ): Promise<NavigationMenuItem> {
    const now = nowIso();
    const created = await mutateStoreDocument(
      "navigation.create",
      (doc: StoreDocument) => {
        if (!doc.navItems) {
          doc.navItems = [];
        }

        const trimmedKey = input.key.trim();
        const conflict = doc.navItems.some((i) => i.key === trimmedKey);
        if (conflict) {
          throw new StoreError(
            "conflict",
            "navigation.create",
            `عنصر تنقل بالمفتاح «${trimmedKey}» موجود بالفعل.`
          );
        }

        if (input.parentId) {
          const parentExists = doc.navItems.some((i) => i.id === input.parentId);
          if (!parentExists) {
            throw new StoreError(
              "invalid",
              "navigation.create",
              `العنصر الرئيسي برقم ${input.parentId} غير موجود.`
            );
          }
        }

        let sortOrder = input.sortOrder;
        if (sortOrder === undefined) {
          const siblings = doc.navItems.filter(
            (i) => i.section === input.section && i.parentId === (input.parentId || null)
          );
          sortOrder = siblings.length > 0
            ? Math.max(...siblings.map((s) => s.sortOrder)) + 1
            : 1;
        }

        const item: NavigationMenuItem = {
          id: newId(),
          key: trimmedKey,
          labelAr: input.labelAr.trim(),
          labelEn: input.labelEn?.trim() || null,
          href: input.href.trim(),
          section: input.section,
          parentId: input.parentId || null,
          sortOrder,
          isActive: input.isActive ?? true,
          isPublic: input.isPublic ?? true,
          createdBy: actor.id,
          updatedBy: actor.id,
          createdAt: now,
          updatedAt: now,
        };

        doc.navItems.push(item);

        const audit = buildAuditEntry({
          actor,
          action: "create",
          entityType: "navigation",
          entityId: item.id,
          before: null,
          after: snapshot(item as unknown as Record<string, unknown>),
          summary: `إضافة عنصر تنقل: «${item.labelAr}»`,
        });
        doc.audit.push(audit);

        return item;
      }
    );

    return cloneItem(created);
  }

  async updateItem(
    id: string,
    input: UpdateNavItemInput,
    actor: Actor
  ): Promise<NavigationMenuItem> {
    const updated = await mutateStoreDocument(
      "navigation.update",
      (doc: StoreDocument) => {
        if (!doc.navItems) {
          doc.navItems = [];
        }

        const index = doc.navItems.findIndex((i) => i.id === id);
        if (index === -1) {
          throw new StoreError(
            "not_found",
            "navigation.update",
            `عنصر تنقل برقم ${id} غير موجود.`
          );
        }

        const existing = doc.navItems[index]!;

        if (input.key !== undefined) {
          const nextKey = input.key.trim();
          if (nextKey !== existing.key) {
            const conflict = doc.navItems.some(
              (i) => i.id !== id && i.key === nextKey
            );
            if (conflict) {
              throw new StoreError(
                "conflict",
                "navigation.update",
                `عنصر تنقل بالمفتاح «${nextKey}» موجود بالفعل.`
              );
            }
          }
        }

        if (input.parentId !== undefined && input.parentId !== null) {
          if (input.parentId === id) {
            throw new StoreError(
              "invalid",
              "navigation.update",
              "لا يمكن للعنصر أن يكون أباً لنفسه."
            );
          }
          const parentExists = doc.navItems.some((i) => i.id === input.parentId);
          if (!parentExists) {
            throw new StoreError(
              "invalid",
              "navigation.update",
              `العنصر الرئيسي برقم ${input.parentId} غير موجود.`
            );
          }
        }

        const before = snapshot(existing as unknown as Record<string, unknown>);
        const now = nowIso();

        const next: NavigationMenuItem = {
          ...existing,
          key: input.key !== undefined ? input.key.trim() : existing.key,
          labelAr:
            input.labelAr !== undefined ? input.labelAr.trim() : existing.labelAr,
          labelEn:
            input.labelEn !== undefined
              ? input.labelEn?.trim() || null
              : existing.labelEn,
          href: input.href !== undefined ? input.href.trim() : existing.href,
          section: input.section ?? existing.section,
          parentId:
            input.parentId !== undefined ? input.parentId : existing.parentId,
          sortOrder:
            input.sortOrder !== undefined ? input.sortOrder : existing.sortOrder,
          isActive:
            input.isActive !== undefined ? input.isActive : existing.isActive,
          isPublic:
            input.isPublic !== undefined ? input.isPublic : existing.isPublic,
          updatedBy: actor.id,
          updatedAt: now,
        };

        doc.navItems[index] = next;

        const audit = buildAuditEntry({
          actor,
          action: "update",
          entityType: "navigation",
          entityId: next.id,
          before,
          after: snapshot(next as unknown as Record<string, unknown>),
          summary: `تعديل عنصر تنقل: «${next.labelAr}»`,
        });
        doc.audit.push(audit);

        return next;
      }
    );

    return cloneItem(updated);
  }

  async reorderItems(
    input: ReorderNavItemsInput,
    actor: Actor
  ): Promise<NavigationMenuItem[]> {
    const updated = await mutateStoreDocument(
      "navigation.reorder",
      (doc: StoreDocument) => {
        if (!doc.navItems) {
          doc.navItems = [];
        }

        const now = nowIso();
        const results: NavigationMenuItem[] = [];

        for (const order of input.items) {
          const item = doc.navItems.find((i) => i.id === order.id);
          if (item) {
            item.sortOrder = order.sortOrder;
            item.updatedBy = actor.id;
            item.updatedAt = now;
            results.push(cloneItem(item));
          }
        }

        const audit = buildAuditEntry({
          actor,
          action: "update",
          entityType: "navigation",
          entityId: "batch-reorder",
          before: null,
          after: snapshot({ reordered: input.items } as Record<string, unknown>),
          summary: `إعادة ترتيب عناصر شريط التنقل (${input.items.length} عنصر)`,
        });
        doc.audit.push(audit);

        return results;
      }
    );

    return updated;
  }

  async deleteItem(id: string, actor: Actor): Promise<void> {
    await mutateStoreDocument(
      "navigation.delete",
      (doc: StoreDocument) => {
        if (!doc.navItems) {
          doc.navItems = [];
        }

        const index = doc.navItems.findIndex((i) => i.id === id);
        if (index === -1) {
          throw new StoreError(
            "not_found",
            "navigation.delete",
            `عنصر تنقل برقم ${id} غير موجود.`
          );
        }

        const existing = doc.navItems[index]!;
        const before = snapshot(existing as unknown as Record<string, unknown>);

        // Re-parent children to existing parentId to prevent orphaned tree breaks
        for (const child of doc.navItems) {
          if (child.parentId === id) {
            child.parentId = existing.parentId;
          }
        }

        doc.navItems.splice(index, 1);

        const audit = buildAuditEntry({
          actor,
          action: "delete",
          entityType: "navigation",
          entityId: id,
          before,
          after: null,
          summary: `حذف عنصر تنقل: «${existing.labelAr}»`,
        });
        doc.audit.push(audit);
      }
    );
  }

  async toggleActive(
    id: string,
    isActive: boolean,
    actor: Actor
  ): Promise<NavigationMenuItem> {
    return this.updateItem(id, { isActive }, actor);
  }
}
