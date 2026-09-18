// packages/data-access/src/navigation/navigation-supabase-adapter.ts
//
// Supabase PostgREST driver for ParishNavigationRepository.
// Implements the same contract as JsonParishNavigationRepository with Postgres RLS policies.

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { createPublicSupabaseClient } from "../supabase/public";
import type { Database, Json, Tables, TablesInsert, TablesUpdate } from "@church-site/domain";
import type {
  Actor,
  CreateNavItemInput,
  JsonValue,
  NavigationMenuItem,
  NavSection,
  ReorderNavItemsInput,
  UpdateNavItemInput,
} from "@church-site/domain";
import { buildAuditEntry, nowIso, snapshot } from "../store/audit";
import { StoreError, type RepositoryDriverName } from "../store/repository";
import type {
  NavItemListFilter,
  ParishNavigationRepository,
} from "./navigation-repository";

type StoreClient = SupabaseClient<Database>;
type NavRow = Tables<"nav_menu_items">;

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

function toNavigationMenuItem(row: NavRow): NavigationMenuItem {
  return {
    id: row.id,
    key: row.key,
    labelAr: row.label_ar,
    labelEn: row.label_en,
    href: row.href,
    section: row.section as NavSection,
    parentId: row.parent_id,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    isPublic: row.is_public,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

export class SupabaseParishNavigationRepository implements ParishNavigationRepository {
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

  async listItems(filter?: NavItemListFilter): Promise<NavigationMenuItem[]> {
    const client = await this.readClient();
    let query = client
      .from("nav_menu_items")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (filter?.section !== undefined) {
      query = query.eq("section", filter.section);
    }
    if (filter?.parentId !== undefined) {
      if (filter.parentId === null) {
        query = query.is("parent_id", null);
      } else {
        query = query.eq("parent_id", filter.parentId);
      }
    }
    if (filter?.isActive !== undefined) {
      query = query.eq("is_active", filter.isActive);
    }
    if (filter?.isPublic !== undefined) {
      query = query.eq("is_public", filter.isPublic);
    }

    const { data, error } = await query;
    if (error) {
      throw toStoreError(error, "navigation.list");
    }

    return (data || []).map(toNavigationMenuItem);
  }

  async getItemById(id: string): Promise<NavigationMenuItem | null> {
    const client = await this.readClient();
    const { data, error } = await client
      .from("nav_menu_items")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw toStoreError(error, "navigation.get", { id });
    }

    return data ? toNavigationMenuItem(data) : null;
  }

  async getItemByKey(key: string): Promise<NavigationMenuItem | null> {
    const client = await this.readClient();
    const { data, error } = await client
      .from("nav_menu_items")
      .select("*")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      throw toStoreError(error, "navigation.getByKey", { key });
    }

    return data ? toNavigationMenuItem(data) : null;
  }

  async createItem(
    input: CreateNavItemInput,
    actor: Actor
  ): Promise<NavigationMenuItem> {
    const client = await this.writeClient();

    let sortOrder = input.sortOrder;
    if (sortOrder === undefined) {
      const existing = await this.listItems({
        section: input.section,
        parentId: input.parentId || null,
      });
      sortOrder = existing.length > 0
        ? Math.max(...existing.map((e) => e.sortOrder)) + 1
        : 1;
    }

    const insertData: TablesInsert<"nav_menu_items"> = {
      key: input.key.trim(),
      label_ar: input.labelAr.trim(),
      label_en: input.labelEn?.trim() || null,
      href: input.href.trim(),
      section: input.section,
      parent_id: input.parentId || null,
      sort_order: sortOrder,
      is_active: input.isActive ?? true,
      is_public: input.isPublic ?? true,
      created_by: actor.id,
      updated_by: actor.id,
    };

    const { data, error } = await client
      .from("nav_menu_items")
      .insert(insertData)
      .select()
      .single();

    if (error || !data) {
      throw toStoreError(error ?? { message: "فشل إنشاء عنصر التنقل" }, "navigation.create");
    }

    const item = toNavigationMenuItem(data);

    await this.appendAudit(client, {
      actor,
      action: "create",
      entityType: "navigation",
      entityId: item.id,
      before: null,
      after: snapshot(item as unknown as Record<string, unknown>),
      summary: `إضافة عنصر تنقل: «${item.labelAr}»`,
    });

    return item;
  }

  async updateItem(
    id: string,
    input: UpdateNavItemInput,
    actor: Actor
  ): Promise<NavigationMenuItem> {
    const client = await this.writeClient();

    const existing = await this.getItemById(id);
    if (!existing) {
      throw new StoreError("not_found", "navigation.update", `عنصر تنقل برقم ${id} غير موجود.`);
    }

    const updateData: TablesUpdate<"nav_menu_items"> = {
      updated_by: actor.id,
      updated_at: nowIso(),
    };

    if (input.key !== undefined) updateData.key = input.key.trim();
    if (input.labelAr !== undefined) updateData.label_ar = input.labelAr.trim();
    if (input.labelEn !== undefined) updateData.label_en = input.labelEn?.trim() || null;
    if (input.href !== undefined) updateData.href = input.href.trim();
    if (input.section !== undefined) updateData.section = input.section;
    if (input.parentId !== undefined) updateData.parent_id = input.parentId;
    if (input.sortOrder !== undefined) updateData.sort_order = input.sortOrder;
    if (input.isActive !== undefined) updateData.is_active = input.isActive;
    if (input.isPublic !== undefined) updateData.is_public = input.isPublic;

    const { data, error } = await client
      .from("nav_menu_items")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      throw toStoreError(error ?? { message: "فشل تعديل عنصر التنقل" }, "navigation.update", { id });
    }

    const item = toNavigationMenuItem(data);

    await this.appendAudit(client, {
      actor,
      action: "update",
      entityType: "navigation",
      entityId: item.id,
      before: snapshot(existing as unknown as Record<string, unknown>),
      after: snapshot(item as unknown as Record<string, unknown>),
      summary: `تعديل عنصر تنقل: «${item.labelAr}»`,
    });

    return item;
  }

  async reorderItems(
    input: ReorderNavItemsInput,
    actor: Actor
  ): Promise<NavigationMenuItem[]> {
    const client = await this.writeClient();
    const now = nowIso();
    const results: NavigationMenuItem[] = [];

    for (const order of input.items) {
      const { data, error } = await client
        .from("nav_menu_items")
        .update({
          sort_order: order.sortOrder,
          updated_by: actor.id,
          updated_at: now,
        })
        .eq("id", order.id)
        .select()
        .single();

      if (error) {
        throw toStoreError(error, "navigation.reorder", { id: order.id });
      }
      if (data) {
        results.push(toNavigationMenuItem(data));
      }
    }

    await this.appendAudit(client, {
      actor,
      action: "update",
      entityType: "navigation",
      entityId: "batch-reorder",
      before: null,
      after: snapshot({ reordered: input.items } as Record<string, unknown>),
      summary: `إعادة ترتيب عناصر شريط التنقل (${input.items.length} عنصر)`,
    });

    return results;
  }

  async deleteItem(id: string, actor: Actor): Promise<void> {
    const client = await this.writeClient();

    const existing = await this.getItemById(id);
    if (!existing) {
      throw new StoreError("not_found", "navigation.delete", `عنصر تنقل برقم ${id} غير موجود.`);
    }

    // Re-parent children
    await client
      .from("nav_menu_items")
      .update({
        parent_id: existing.parentId,
        updated_by: actor.id,
        updated_at: nowIso(),
      })
      .eq("parent_id", id);

    const { error } = await client.from("nav_menu_items").delete().eq("id", id);
    if (error) {
      throw toStoreError(error, "navigation.delete", { id });
    }

    await this.appendAudit(client, {
      actor,
      action: "delete",
      entityType: "navigation",
      entityId: id,
      before: snapshot(existing as unknown as Record<string, unknown>),
      after: null,
      summary: `حذف عنصر تنقل: «${existing.labelAr}»`,
    });
  }

  async toggleActive(
    id: string,
    isActive: boolean,
    actor: Actor
  ): Promise<NavigationMenuItem> {
    return this.updateItem(id, { isActive }, actor);
  }
}
