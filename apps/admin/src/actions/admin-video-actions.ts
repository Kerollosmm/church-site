"use server";

// apps/admin/src/actions/admin-video-actions.ts
// Staff-authenticated server actions for Parish Videos manager.
// Validates URLs server-side using normalizeVideoUrl (built on trusted-embeds security gate).
// Enforces granular capabilities: videos:write, videos:delete (owner-only).

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
  type ParishVideo,
} from "@church-site/domain";
import {
  getParishVideoRepository,
  normalizeVideoUrl,
  revalidateVideoSurfaces,
  recordAuditLog,
  snapshot,
} from "@church-site/data-access";
import {
  ParishVideoInputSchema,
  type ParishVideoFormInput,
  type AdminVideoActionResult,
} from "./admin-video-actions.shared";

export type { ParishVideoFormInput, AdminVideoActionResult };

/**
 * Direct CREATE action for parish videos.
 * Sentinel function for test harness and modal submission.
 */
export async function createParishVideoAction(
  input: ParishVideoFormInput
): Promise<AdminVideoActionResult<ParishVideo>> {
  return upsertVideoAction(input);
}

export async function upsertVideoAction(
  input: ParishVideoFormInput
): Promise<AdminVideoActionResult<ParishVideo>> {
  const staff = await requireStaff();
  const role = adminRoleFromStaffRole(staff.role);

  if (!role || !can(role, "videos:write")) {
    return { success: false, message: CAPABILITY_DENIED_MESSAGE_AR };
  }

  const parsed = ParishVideoInputSchema.safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return { success: false, message: "بيانات الإدخال غير صالحة.", errors };
  }

  const data = parsed.data;
  const actor: Actor = {
    id: staff.userId,
    name: staff.fullNameAr,
  };

  // Server-side URL validation & provider normalization — never trust client input
  const normalized = normalizeVideoUrl(data.source_url);
  if (!normalized) {
    let offendingHost = "unknown";
    try {
      offendingHost = new URL(data.source_url).hostname || data.source_url;
    } catch {
      offendingHost = data.source_url;
    }
    const reason = `رفض رابط فيديو غير معتمد أمنياً أو غير موثوق: ${offendingHost}`;
    await recordAuditLog({
      actor,
      action: "denied",
      entityType: "video",
      entityId: data.id || "new",
      before: null,
      after: snapshot({ source_url: data.source_url, offendingHost }),
      summary: reason,
    }).catch(() => {});

    return {
      success: false,
      message: `رابط الفيديو غير معتمد أمنياً (${offendingHost}). يقبل النظام فقط روابط HTTPS موثوقة من YouTube أو Facebook.`,
    };
  }

  const repository = getParishVideoRepository();

  try {
    let video: ParishVideo;
    let message: string;

    if (data.id) {
      video = await repository.updateVideo(
        data.id,
        {
          titleAr: data.title_ar,
          titleEn: data.title_en,
          descriptionAr: data.description_ar,
          descriptionEn: data.description_en,
          provider: normalized.provider,
          sourceUrl: data.source_url,
          embedUrl: normalized.embedUrl,
          thumbnailUrl: normalized.thumbnailUrl,
          sortOrder: data.sort_order,
          isPublic: data.is_public,
          isActive: data.is_active,
        },
        actor
      );
      message = "تم تعديل الفيديو بنجاح.";
    } else {
      video = await repository.createVideo(
        {
          titleAr: data.title_ar,
          titleEn: data.title_en,
          descriptionAr: data.description_ar,
          descriptionEn: data.description_en,
          provider: normalized.provider,
          sourceUrl: data.source_url,
          embedUrl: normalized.embedUrl,
          thumbnailUrl: normalized.thumbnailUrl,
          sortOrder: data.sort_order,
          isPublic: data.is_public,
          isActive: data.is_active,
        },
        actor
      );
      message = "تمت إضافة الفيديو بنجاح.";
    }

    revalidateVideoSurfaces();
    return { success: true, message, data: video };
  } catch (error) {
    const stack = error instanceof Error ? error.stack || error.message : String(error);
    await recordAuditLog({
      actor,
      action: "denied",
      entityType: "video",
      entityId: data.id || "new",
      before: null,
      after: snapshot({ ...data, error: error instanceof Error ? error.message : String(error), stack }),
      summary: `فشل حفظ الفيديو: ${error instanceof Error ? error.message : String(error)}`,
    }).catch(() => {});

    return {
      success: false,
      message: error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء حفظ الفيديو.",
    };
  }
}

export async function deleteVideoAction(id: string): Promise<AdminVideoActionResult> {
  const staff = await requireStaff();
  const role = adminRoleFromStaffRole(staff.role);

  // Destructive delete is restricted to owner only
  if (!role || !can(role, "videos:delete")) {
    return { success: false, message: CAPABILITY_DENIED_MESSAGE_AR };
  }

  const actor: Actor = {
    id: staff.userId,
    name: staff.fullNameAr,
  };

  const repository = getParishVideoRepository();

  try {
    await repository.deleteVideo(id, actor);
    revalidateVideoSurfaces();
    return { success: true, message: "تم حذف الفيديو بنجاح." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "فشل حذف الفيديو.",
    };
  }
}

export async function toggleVideoActiveAction(
  id: string,
  isActive: boolean
): Promise<AdminVideoActionResult<ParishVideo>> {
  const staff = await requireStaff();
  const role = adminRoleFromStaffRole(staff.role);

  if (!role || !can(role, "videos:write")) {
    return { success: false, message: CAPABILITY_DENIED_MESSAGE_AR };
  }

  const actor: Actor = {
    id: staff.userId,
    name: staff.fullNameAr,
  };

  const repository = getParishVideoRepository();

  try {
    const video = await repository.toggleActive(id, isActive, actor);
    revalidateVideoSurfaces();
    return {
      success: true,
      message: isActive ? "تم تفعيل الفيديو بنجاح." : "تم تعطيل الفيديو.",
      data: video,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "فشل تغيير حالة الفيديو.",
    };
  }
}

export async function toggleVideoPublicAction(
  id: string,
  isPublic: boolean
): Promise<AdminVideoActionResult<ParishVideo>> {
  const staff = await requireStaff();
  const role = adminRoleFromStaffRole(staff.role);

  if (!role || !can(role, "videos:write")) {
    return { success: false, message: CAPABILITY_DENIED_MESSAGE_AR };
  }

  const actor: Actor = {
    id: staff.userId,
    name: staff.fullNameAr,
  };

  const repository = getParishVideoRepository();

  try {
    const video = await repository.togglePublic(id, isPublic, actor);
    revalidateVideoSurfaces();
    return {
      success: true,
      message: isPublic ? "تم نشر الفيديو للجمهور على الموقع." : "تم إخفاء الفيديو عن الموقع العام.",
      data: video,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "فشل تغيير حالة النشر.",
    };
  }
}
