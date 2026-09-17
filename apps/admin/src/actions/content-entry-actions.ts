"use server";

// apps/admin/src/actions/content-entry-actions.ts
// Staff-authenticated server actions for managing dynamic Content Entries.
// Validates dynamic field inputs using runtime Zod schemas generated via `buildZodSchema(fields)`.
// Enforces granular capabilities: `content:create`, `content:update`, `content:publish`, `content:delete`.

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
  type ContentEntry,
  type CreateContentEntryInput,
  type UpdateContentEntryInput,
} from "@church-site/domain";
import {
  buildZodSchema,
  getContentTypeRepository,
  revalidateContentSurfaces,
} from "@church-site/data-access";

export type ContentEntryActionResult<T = unknown> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; errors?: Record<string, string[]> };

export async function createContentEntryAction(
  typeIdOrSlug: string,
  input: Omit<CreateContentEntryInput, "contentTypeId">
): Promise<ContentEntryActionResult<ContentEntry>> {
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);

  if (role === null || !can(role, "content:create")) {
    return { success: false, message: CAPABILITY_DENIED_MESSAGE_AR };
  }

  // If initial status is published, user must have content:publish capability
  if (input.status === "published" && !can(role, "content:publish")) {
    return { success: false, message: "لا تملك صلاحية نشر المحتوى." };
  }

  const repo = getContentTypeRepository();
  const contentType =
    (await repo.getContentTypeBySlug(typeIdOrSlug)) ||
    (await repo.getContentTypeById(typeIdOrSlug));

  if (!contentType) {
    return { success: false, message: "نموذج المحتوى المطلوب غير موجود." };
  }

  const fields = await repo.listContentFields(contentType.id);
  const validator = buildZodSchema(fields);
  const parseResult = validator.safeParse(input.data || {});

  if (!parseResult.success) {
    const fieldErrors = parseResult.error.flatten().fieldErrors;
    const firstMessage = parseResult.error.issues[0]?.message || "بيانات الحقول غير صالحة.";
    return {
      success: false,
      message: firstMessage,
      errors: fieldErrors as Record<string, string[]>,
    };
  }

  const actor: Actor = {
    id: session.userId,
    name: session.fullNameAr,
  };

  try {
    const created = await repo.createContentEntry(
      {
        ...input,
        contentTypeId: contentType.id,
        data: parseResult.data,
      },
      actor
    );

    await revalidateContentSurfaces(contentType.slug, created.slug);
    revalidatePath(`/content/${contentType.slug}`);
    revalidatePath("/content-types");

    return {
      success: true,
      message: "تم إنشاء عنصر المحتوى بنجاح.",
      data: created,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل إنشاء عنصر المحتوى.";
    return { success: false, message };
  }
}

export async function updateContentEntryAction(
  entryId: string,
  patch: UpdateContentEntryInput
): Promise<ContentEntryActionResult<ContentEntry>> {
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);

  if (role === null || !can(role, "content:update")) {
    return { success: false, message: CAPABILITY_DENIED_MESSAGE_AR };
  }

  if (patch.status === "published" && !can(role, "content:publish")) {
    return { success: false, message: "لا تملك صلاحية نشر المحتوى." };
  }

  const repo = getContentTypeRepository();
  const existing = await repo.getContentEntryById(entryId);
  if (!existing) {
    return { success: false, message: "عنصر المحتوى غير موجود." };
  }

  const contentType = await repo.getContentTypeById(existing.contentTypeId);
  if (!contentType) {
    return { success: false, message: "نموذج المحتوى غير موجود." };
  }

  let validatedData = patch.data;
  if (patch.data !== undefined) {
    const fields = await repo.listContentFields(contentType.id);
    const validator = buildZodSchema(fields);
    const mergedData = { ...existing.data, ...patch.data };
    const parseResult = validator.safeParse(mergedData);

    if (!parseResult.success) {
      const fieldErrors = parseResult.error.flatten().fieldErrors;
      const firstMessage = parseResult.error.issues[0]?.message || "بيانات الحقول غير صالحة.";
      return {
        success: false,
        message: firstMessage,
        errors: fieldErrors as Record<string, string[]>,
      };
    }
    validatedData = parseResult.data;
  }

  const actor: Actor = {
    id: session.userId,
    name: session.fullNameAr,
  };

  try {
    const updated = await repo.updateContentEntry(
      entryId,
      {
        ...patch,
        ...(validatedData !== undefined ? { data: validatedData } : {}),
      },
      actor
    );

    await revalidateContentSurfaces(contentType.slug, updated.slug);
    revalidatePath(`/content/${contentType.slug}`);
    revalidatePath(`/content/${contentType.slug}/${updated.slug}`);

    return {
      success: true,
      message: "تم تحديث عنصر المحتوى بنجاح.",
      data: updated,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل تحديث عنصر المحتوى.";
    return { success: false, message };
  }
}

export async function publishContentEntryAction(
  entryId: string
): Promise<ContentEntryActionResult<ContentEntry>> {
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);

  if (role === null || !can(role, "content:publish")) {
    return { success: false, message: CAPABILITY_DENIED_MESSAGE_AR };
  }

  const actor: Actor = {
    id: session.userId,
    name: session.fullNameAr,
  };

  const repo = getContentTypeRepository();
  const existing = await repo.getContentEntryById(entryId);
  if (!existing) {
    return { success: false, message: "عنصر المحتوى غير موجود." };
  }

  const contentType = await repo.getContentTypeById(existing.contentTypeId);

  try {
    const published = await repo.setEntryStatus(entryId, "published", actor);
    if (contentType) {
      await revalidateContentSurfaces(contentType.slug, published.slug);
      revalidatePath(`/content/${contentType.slug}`);
      revalidatePath(`/content/${contentType.slug}/${published.slug}`);
    }

    return {
      success: true,
      message: "تم نشر عنصر المحتوى بنجاح.",
      data: published,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل نشر عنصر المحتوى.";
    return { success: false, message };
  }
}

export async function archiveContentEntryAction(
  entryId: string
): Promise<ContentEntryActionResult<ContentEntry>> {
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);

  if (role === null || !can(role, "content:update")) {
    return { success: false, message: CAPABILITY_DENIED_MESSAGE_AR };
  }

  const actor: Actor = {
    id: session.userId,
    name: session.fullNameAr,
  };

  const repo = getContentTypeRepository();
  const existing = await repo.getContentEntryById(entryId);
  if (!existing) {
    return { success: false, message: "عنصر المحتوى غير موجود." };
  }

  const contentType = await repo.getContentTypeById(existing.contentTypeId);

  try {
    const archived = await repo.setEntryStatus(entryId, "archived", actor);
    if (contentType) {
      await revalidateContentSurfaces(contentType.slug, archived.slug);
      revalidatePath(`/content/${contentType.slug}`);
      revalidatePath(`/content/${contentType.slug}/${archived.slug}`);
    }

    return {
      success: true,
      message: "تم نقل عنصر المحتوى إلى الأرشيف.",
      data: archived,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل أرشفة عنصر المحتوى.";
    return { success: false, message };
  }
}

export async function deleteContentEntryAction(
  entryId: string
): Promise<ContentEntryActionResult<null>> {
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);

  if (role === null || !can(role, "content:delete")) {
    return { success: false, message: CAPABILITY_DENIED_MESSAGE_AR };
  }

  const actor: Actor = {
    id: session.userId,
    name: session.fullNameAr,
  };

  const repo = getContentTypeRepository();
  const existing = await repo.getContentEntryById(entryId);
  if (!existing) {
    return { success: false, message: "عنصر المحتوى غير موجود." };
  }

  const contentType = await repo.getContentTypeById(existing.contentTypeId);

  try {
    await repo.deleteContentEntry(entryId, actor);
    if (contentType) {
      await revalidateContentSurfaces(contentType.slug, existing.slug);
      revalidatePath(`/content/${contentType.slug}`);
    }

    return {
      success: true,
      message: "تم حذف عنصر المحتوى بنجاح.",
      data: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل حذف عنصر المحتوى.";
    return { success: false, message };
  }
}
