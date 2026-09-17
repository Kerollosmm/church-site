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
