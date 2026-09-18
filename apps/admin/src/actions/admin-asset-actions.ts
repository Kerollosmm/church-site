"use server";

// apps/admin/src/actions/admin-asset-actions.ts
// Server action for linking external allowlisted image assets (YouTube thumbnails, Google Drive, direct images)
// and registering them in the parish event repository.

declare const window: unknown;
if (typeof window !== "undefined") {
  throw new Error("This module can only be executed on the server.");
}

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireStaff } from "../lib/auth/require-staff";
import {
  CAPABILITY_DENIED_MESSAGE_AR,
  adminRoleFromStaffRole,
  can,
  type Actor,
  type MediaRecord,
} from "@church-site/domain";
import {
  REVALIDATION_TAGS,
  getEventRepository,
  resolveExternalImageUrl,
} from "@church-site/data-access";

export type LinkExternalAssetActionResult =
  | { success: true; message: string; data: MediaRecord }
  | { success: false; message: string };

const LinkExternalAssetSchema = z.object({
  url: z.string({ required_error: "رابط الأصل مطلوب." }).min(1, "رابط الأصل مطلوب."),
  altAr: z.string().optional().nullable(),
  altEn: z.string().optional().nullable(),
  isPublic: z.boolean().optional().default(true),
  targetEventId: z.string().optional().nullable(),
});

export async function linkExternalAssetAction(
  payload: unknown
): Promise<LinkExternalAssetActionResult> {
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);

  if (role === null || !can(role, "assets:link")) {
    console.warn("[admin-asset-actions] capability denied", {
      role,
      userId: session.userId,
    });
    return { success: false, message: CAPABILITY_DENIED_MESSAGE_AR };
  }

  const actor: Actor = {
    id: session.userId,
    name: session.fullNameAr,
  };

  const parsed = LinkExternalAssetSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || "بيانات الرابط المدخل غير صالحة.",
    };
  }

  const { url, altAr, altEn, isPublic, targetEventId } = parsed.data;

  const resolved = resolveExternalImageUrl(url);
  if (!resolved || resolved.kind === "unsupported") {
    return {
      success: false,
      message:
        resolved?.reason ||
        "الرابط المدخل غير صالح أو غير مدرج في قائمة النطاقات المعتمدة (ASSET_ALLOWED_HOSTS).",
    };
  }

  try {
    const filename = `asset-${resolved.kind}-${Date.now()}.jpg`;
    const repo = getEventRepository();

    const media = await repo.createMedia(
      {
        filename,
        mimeType: "image/jpeg",
        sizeBytes: 0,
        url: resolved.resolvedUrl,
        sourceUrl: resolved.sourceUrl,
        resolvedUrl: resolved.resolvedUrl,
        host: resolved.host,
        kind: resolved.kind,
        altAr: altAr || null,
        altEn: altEn || null,
        isPublic: isPublic ?? true,
      },
      actor
    );

    if (targetEventId && targetEventId.trim().length > 0) {
      try {
        await repo.updateEvent(targetEventId.trim(), { imageUrl: resolved.resolvedUrl }, actor);
      } catch (linkError) {
        console.warn("[admin-asset-actions] failed to link image to target event", linkError);
      }
    }

    revalidateTag(REVALIDATION_TAGS.media);
    revalidateTag(REVALIDATION_TAGS.events);
    revalidatePath("/admin/media");
    revalidatePath("/events");

    return {
      success: true,
      data: media,
      message: "تم التحقق من الرابط وإضافته بنجاح كأصل معتمد.",
    };
  } catch (error) {
    console.error("[admin-asset-actions] link external asset failed", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء ربط الأصل الخارجي.",
    };
  }
}
