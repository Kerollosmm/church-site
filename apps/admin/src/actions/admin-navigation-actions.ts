"use server";

// apps/admin/src/actions/admin-navigation-actions.ts
// Staff-authenticated server actions for Parish Navigation Menu CMS.
// Enforces granular capability: navigation:write.

declare const window: unknown;
if (typeof window !== "undefined") {
  throw new Error("This module can only be executed on the server.");
}

import { requireStaff } from "../lib/auth/require-staff";
import {
  CAPABILITY_DENIED_MESSAGE_AR,
  adminRoleFromStaffRole,
  can,
  type Actor,
  type NavigationMenuItem,
  type NavSection,
} from "@church-site/domain";
import {
  getParishNavigationRepository,
  revalidateNavigationSurfaces,
} from "@church-site/data-access";
import {
  NavigationItemInputSchema,
  ReorderNavItemsSchema,
  type NavigationItemFormInput,
  type AdminNavActionResult,
} from "./admin-navigation-actions.shared";

export type { NavigationItemFormInput, AdminNavActionResult };

export async function upsertNavItemAction(
  input: NavigationItemFormInput
): Promise<AdminNavActionResult<NavigationMenuItem>> {
  const staff = await requireStaff();
  const role = adminRoleFromStaffRole(staff.role);

  if (!role || !can(role, "navigation:write")) {
    return { success: false, message: CAPABILITY_DENIED_MESSAGE_AR };
  }

  const parsed = NavigationItemInputSchema.safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return { success: false, message: "بيانات الإدخال غير صالحة.", errors };
  }

  const data = parsed.data;
  const actor: Actor = {
    id: staff.userId,
    name: staff.fullNameAr,
  };

  const repository = getParishNavigationRepository();

  try {
    let item: NavigationMenuItem;
    let message: string;

    if (data.id) {
      item = await repository.updateItem(
        data.id,
        {
          key: data.key,
          labelAr: data.label_ar,
          labelEn: data.label_en,
          href: data.href,
          section: data.section as NavSection,
          parentId: data.parent_id,
          sortOrder: data.sort_order,
          isActive: data.is_active,
          isPublic: data.is_public,
        },
        actor
      );
      message = "تم تعديل عنصر التنقل بنجاح.";
    } else {
      item = await repository.createItem(
        {
          key: data.key,
          labelAr: data.label_ar,
          labelEn: data.label_en,
          href: data.href,
          section: data.section as NavSection,
          parentId: data.parent_id,
          sortOrder: data.sort_order,
          isActive: data.is_active,
          isPublic: data.is_public,
        },
        actor
      );
      message = "تمت إضافة عنصر التنقل بنجاح.";
    }

    revalidateNavigationSurfaces();
    return { success: true, message, data: item };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء حفظ عنصر التنقل.",
    };
  }
}

export async function deleteNavItemAction(id: string): Promise<AdminNavActionResult> {
  const staff = await requireStaff();
  const role = adminRoleFromStaffRole(staff.role);

  if (!role || !can(role, "navigation:write")) {
    return { success: false, message: CAPABILITY_DENIED_MESSAGE_AR };
  }

  const actor: Actor = {
    id: staff.userId,
    name: staff.fullNameAr,
  };

  const repository = getParishNavigationRepository();

  try {
    await repository.deleteItem(id, actor);
    revalidateNavigationSurfaces();
    return { success: true, message: "تم حذف عنصر التنقل بنجاح." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "فشل حذف عنصر التنقل.",
    };
  }
}

export async function toggleNavItemAction(
  id: string,
  isActive: boolean
): Promise<AdminNavActionResult<NavigationMenuItem>> {
  const staff = await requireStaff();
  const role = adminRoleFromStaffRole(staff.role);

  if (!role || !can(role, "navigation:write")) {
    return { success: false, message: CAPABILITY_DENIED_MESSAGE_AR };
  }

  const actor: Actor = {
    id: staff.userId,
    name: staff.fullNameAr,
  };

  const repository = getParishNavigationRepository();

  try {
    const item = await repository.toggleActive(id, isActive, actor);
    revalidateNavigationSurfaces();
    return {
      success: true,
      message: isActive ? "تم تفعيل عنصر التنقل بنجاح." : "تم تعطيل عنصر التنقل وإخفاؤه من شريط التنقل.",
      data: item,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "فشل تغيير حالة عنصر التنقل.",
    };
  }
}

export async function reorderNavItemsAction(
  input: { items: { id: string; sort_order: number }[] }
): Promise<AdminNavActionResult<NavigationMenuItem[]>> {
  const staff = await requireStaff();
  const role = adminRoleFromStaffRole(staff.role);

  if (!role || !can(role, "navigation:write")) {
    return { success: false, message: CAPABILITY_DENIED_MESSAGE_AR };
  }

  const parsed = ReorderNavItemsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "بيانات الترتيب غير صالحة." };
  }

  const actor: Actor = {
    id: staff.userId,
    name: staff.fullNameAr,
  };

  const repository = getParishNavigationRepository();

  try {
    const reordered = await repository.reorderItems(
      {
        items: parsed.data.items.map((i) => ({ id: i.id, sortOrder: i.sort_order })),
      },
      actor
    );
    revalidateNavigationSurfaces();
    return {
      success: true,
      message: "تم تحديث ترتيب شريط التنقل بنجاح.",
      data: reordered,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "فشل إعادة ترتيب شريط التنقل.",
    };
  }
}
