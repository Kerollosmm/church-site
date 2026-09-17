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
} from "@church-site/data-access";
import { z } from "zod";

export const ParishVideoInputSchema = z.object({
  id: z.string().optional(),
  title_ar: z
    .string()
    .trim()
    .min(3, "عنوان الفيديو بالعربية يجب ألا يقل عن 3 أحرف")
    .max(200, "عنوان الفيديو لا يتجاوز 200 حرف"),
  title_en: z
    .string()
    .trim()
    .max(200, "العنوان بالإنجليزية لا يتجاوز 200 حرف")
    .optional()
    .nullable(),
  description_ar: z
    .string()
    .trim()
    .max(1000, "الوصف بالعربية لا يتجاوز 1000 حرف")
    .optional()
    .nullable(),
  description_en: z
    .string()
    .trim()
    .max(1000, "الوصف بالإنجليزية لا يتجاوز 1000 حرف")
    .optional()
    .nullable(),
  source_url: z
    .string()
    .trim()
    .url("رابط الفيديو يجب أن يكون رابطاً صالحاً (https://...)"),
  sort_order: z.coerce.number().int().default(0),
  is_public: z.boolean().default(true),
  is_active: z.boolean().default(true),
});

export type ParishVideoFormInput = z.infer<typeof ParishVideoInputSchema>;

export type AdminVideoActionResult<T = unknown> =
  | { success: true; message: string; data?: T }
  | { success: false; message: string; errors?: Record<string, string[]> };

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

  // Server-side URL validation & provider normalization — never trust client input
  const normalized = normalizeVideoUrl(data.source_url);
  if (!normalized) {
    return {
      success: false,
      message:
        "رابط الفيديو غير معتمد. يقبل النظام فقط روابط موثوقة وآمنة (HTTPS) من يوتيوب أو فيسبوك أو ملفات وسائط مدعومة.",
    };
  }

  const actor: Actor = {
    id: staff.userId,
    name: staff.fullNameAr,
  };

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
