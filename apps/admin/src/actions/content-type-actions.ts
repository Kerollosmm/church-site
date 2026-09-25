"use server";

// apps/admin/src/actions/content-type-actions.ts
// Staff-authenticated server actions for managing Content Types and their dynamic schema fields.
// Gated by the `content:manage` capability (admin/owner only).

declare const window: unknown;
if (typeof window !== "undefined") {
  throw new Error("This module can only be executed on the server.");
}

import { revalidatePath } from "next/cache";
import { requireStaff } from "../lib/auth/require-staff";
import {
  CAPABILITY_DENIED_MESSAGE_AR,
  adminRoleFromStaffRole,
  can,
  type Actor,
  type ContentType,
  type ContentField,
  type CreateContentTypeInput,
  type UpdateContentTypeInput,
  type CreateContentFieldInput,
  type UpdateContentFieldInput,
} from "@church-site/domain";
import {
  getContentTypeRepository,
  revalidateContentSurfaces,
} from "@church-site/data-access";

export type ContentTypeActionResult<T = unknown> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; errors?: Record<string, string[]> };

export async function createContentTypeAction(
  input: CreateContentTypeInput
): Promise<ContentTypeActionResult<ContentType>> {
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);

  if (role === null || !can(role, "content:manage")) {
    return { success: false, message: CAPABILITY_DENIED_MESSAGE_AR };
  }

  const actor: Actor = {
    id: session.userId,
    name: session.fullNameAr,
  };

  try {
    const repo = getContentTypeRepository();
    const created = await repo.createContentType(input, actor);

    // Auto-seed default title field so newly created templates immediately support content entries
    try {
      await repo.createContentField(
        {
          contentTypeId: created.id,
          labelAr: "العنوان",
          slug: "title",
          fieldType: "text",
          isRequired: true,
          sortOrder: 0,
        },
        actor
      );
    } catch (fieldErr) {
      console.warn("[createContentTypeAction] Failed to auto-seed title field:", fieldErr);
    }

    await revalidateContentSurfaces(created.slug);
    revalidatePath("/content-types");
    return {
      success: true,
      message: `تم إنشاء نموذج المحتوى «${created.nameAr}» بنجاح.`,
      data: created,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل إنشاء نموذج المحتوى.";
    return { success: false, message };
  }
}

export async function duplicateContentTypeAction(
  sourceId: string
): Promise<ContentTypeActionResult<ContentType>> {
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);

  if (role === null || !can(role, "content:manage")) {
    return { success: false, message: CAPABILITY_DENIED_MESSAGE_AR };
  }

  const actor: Actor = {
    id: session.userId,
    name: session.fullNameAr,
  };

  try {
    const repo = getContentTypeRepository();
    const source = await repo.getContentTypeById(sourceId);
    if (!source) {
      return { success: false, message: "نموذج المحتوى المطلوب نسخه غير موجود." };
    }

    const cloned = await repo.createContentType(
      {
        nameAr: `${source.nameAr} (نسخة)`,
        nameEn: source.nameEn ? `${source.nameEn} (Copy)` : null,
        slug: `${source.slug}-copy-${Date.now().toString(36)}`,
        icon: source.icon ?? null,
        template: source.template ?? null,
        isActive: source.isActive,
      },
      actor
    );

    const sourceFields = await repo.listContentFields(sourceId);
    for (const field of sourceFields) {
      await repo.createContentField(
        {
          contentTypeId: cloned.id,
          slug: field.slug,
          labelAr: field.labelAr,
          labelEn: field.labelEn ?? null,
          fieldType: field.fieldType,
          isRequired: field.isRequired,
          isTranslatable: field.isTranslatable,
          validationRules: field.validationRules ?? null,
          options: field.options,
          sortOrder: field.sortOrder,
        },
        actor
      );
    }

    await revalidateContentSurfaces(cloned.slug);
    revalidatePath("/content-types");
    return {
      success: true,
      message: `تم نسخ نموذج المحتوى «${cloned.nameAr}» بنجاح.`,
      data: cloned,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل نسخ نموذج المحتوى.";
    return { success: false, message };
  }
}

export async function updateContentTypeAction(
  id: string,
  patch: UpdateContentTypeInput
): Promise<ContentTypeActionResult<ContentType>> {
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);

  if (role === null || !can(role, "content:manage")) {
    return { success: false, message: CAPABILITY_DENIED_MESSAGE_AR };
  }

  const actor: Actor = {
    id: session.userId,
    name: session.fullNameAr,
  };

  try {
    const repo = getContentTypeRepository();
    const updated = await repo.updateContentType(id, patch, actor);
    await revalidateContentSurfaces(updated.slug);
    revalidatePath("/content-types");
    return {
      success: true,
      message: `تم تحديث نموذج المحتوى «${updated.nameAr}» بنجاح.`,
      data: updated,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل تحديث نموذج المحتوى.";
    return { success: false, message };
  }
}

export async function deleteContentTypeAction(
  id: string
): Promise<ContentTypeActionResult<null>> {
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);

  if (role === null || !can(role, "content:manage")) {
    return { success: false, message: CAPABILITY_DENIED_MESSAGE_AR };
  }

  const actor: Actor = {
    id: session.userId,
    name: session.fullNameAr,
  };

  try {
    const repo = getContentTypeRepository();
    const target = await repo.getContentTypeById(id);
    await repo.deleteContentType(id, actor);
    if (target) {
      await revalidateContentSurfaces(target.slug);
    }
    revalidatePath("/content-types");
    return {
      success: true,
      message: "تم حذف نموذج المحتوى بنجاح.",
      data: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل حذف نموذج المحتوى.";
    return { success: false, message };
  }
}

export async function createContentFieldAction(
  contentTypeId: string,
  input: Omit<CreateContentFieldInput, "contentTypeId">
): Promise<ContentTypeActionResult<ContentField>> {
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);

  if (role === null || !can(role, "content:manage")) {
    return { success: false, message: CAPABILITY_DENIED_MESSAGE_AR };
  }

  const actor: Actor = {
    id: session.userId,
    name: session.fullNameAr,
  };

  try {
    const repo = getContentTypeRepository();
    const type = await repo.getContentTypeById(contentTypeId);
    if (!type) {
      return { success: false, message: "نموذج المحتوى غير موجود." };
    }

    const field = await repo.createContentField({ ...input, contentTypeId }, actor);
    await revalidateContentSurfaces(type.slug);
    revalidatePath(`/content-types/${contentTypeId}/fields`);
    revalidatePath("/content-types");
    return {
      success: true,
      message: `تم إضافة الحقل «${field.labelAr}» بنجاح.`,
      data: field,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل إضافة الحقل.";
    return { success: false, message };
  }
}

export async function updateContentFieldAction(
  fieldId: string,
  patch: UpdateContentFieldInput
): Promise<ContentTypeActionResult<ContentField>> {
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);

  if (role === null || !can(role, "content:manage")) {
    return { success: false, message: CAPABILITY_DENIED_MESSAGE_AR };
  }

  const actor: Actor = {
    id: session.userId,
    name: session.fullNameAr,
  };

  try {
    const repo = getContentTypeRepository();
    const field = await repo.getContentFieldById(fieldId);
    if (!field) {
      return { success: false, message: "الحقل غير موجود." };
    }

    const updated = await repo.updateContentField(fieldId, patch, actor);
    const type = await repo.getContentTypeById(field.contentTypeId);
    if (type) {
      await revalidateContentSurfaces(type.slug);
    }
    revalidatePath(`/content-types/${field.contentTypeId}/fields`);
    return {
      success: true,
      message: `تم تحديث الحقل «${updated.labelAr}» بنجاح.`,
      data: updated,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل تحديث الحقل.";
    return { success: false, message };
  }
}

export async function deleteContentFieldAction(
  fieldId: string
): Promise<ContentTypeActionResult<null>> {
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);

  if (role === null || !can(role, "content:manage")) {
    return { success: false, message: CAPABILITY_DENIED_MESSAGE_AR };
  }

  const actor: Actor = {
    id: session.userId,
    name: session.fullNameAr,
  };

  try {
    const repo = getContentTypeRepository();
    const field = await repo.getContentFieldById(fieldId);
    if (!field) {
      return { success: false, message: "الحقل غير موجود." };
    }

    await repo.deleteContentField(fieldId, actor);
    const type = await repo.getContentTypeById(field.contentTypeId);
    if (type) {
      await revalidateContentSurfaces(type.slug);
    }
    revalidatePath(`/content-types/${field.contentTypeId}/fields`);
    return {
      success: true,
      message: "تم حذف الحقل بنجاح.",
      data: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل حذف الحقل.";
    return { success: false, message };
  }
}
