"use server";

// apps/admin/src/actions/media-upload-actions.ts
// Authenticated server action for uploading media files into active storage (Supabase or file-backed)
// and registering the resulting metadata into the parish event repository.

declare const window: unknown;
if (typeof window !== "undefined") {
  throw new Error("This module can only be executed on the server.");
}

import { revalidatePath, revalidateTag } from "next/cache";
import { requireStaff } from "../lib/auth/require-staff";
import {
  CAPABILITY_DENIED_MESSAGE_AR,
  adminRoleFromStaffRole,
  can,
  type Actor,
  type MediaRecord,
} from "@church-site/domain";
import {
  MediaUploadSchema,
  REVALIDATION_TAGS,
  firstIssueMessage,
  getEventRepository,
  uploadMedia,
} from "@church-site/data-access";

export type MediaUploadActionResult =
  | { success: true; message: string; data: MediaRecord }
  | { success: false; message: string };

/**
 * Server action to upload a file from admin portal.
 * Validates staff capability ('media:create'), checks file payload, validates metadata schema,
 * writes bytes to storage adapter, registers MediaRecord in repository with storagePath & checksum,
 * and purges media caches.
 */
export async function uploadMediaAction(formData: FormData): Promise<MediaUploadActionResult> {
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);

  if (role === null || !can(role, "media:create")) {
    console.warn("[media-upload] capability denied", {
      role,
      userId: session.userId,
    });
    return { success: false, message: CAPABILITY_DENIED_MESSAGE_AR };
  }

  const actor: Actor = {
    id: session.userId,
    name: session.fullNameAr,
  };

  const file = formData.get("file");
  if (!file || typeof file === "string" || !(file instanceof Blob) || file.size === 0) {
    return { success: false, message: "لم يتم تحديد أي ملف للرفع." };
  }

  const rawFilename = formData.get("filename");
  const rawMimeType = formData.get("mimeType");
  const rawAltAr = formData.get("altAr");
  const rawAltEn = formData.get("altEn");
  const rawIsPublic = formData.get("isPublic");

  const filename =
    typeof rawFilename === "string" && rawFilename.trim().length > 0
      ? rawFilename.trim()
      : "name" in file && typeof file.name === "string"
        ? file.name
        : "file";

  const mimeType =
    typeof rawMimeType === "string" && rawMimeType.trim().length > 0
      ? rawMimeType.trim()
      : file.type || "application/octet-stream";

  const altAr = typeof rawAltAr === "string" && rawAltAr.trim().length > 0 ? rawAltAr.trim() : null;
  const altEn = typeof rawAltEn === "string" && rawAltEn.trim().length > 0 ? rawAltEn.trim() : null;
  const isPublic = rawIsPublic === null ? true : rawIsPublic === "true" || rawIsPublic === "on" || rawIsPublic === "1";

  const validation = MediaUploadSchema.safeParse({
    filename,
    mimeType,
    sizeBytes: file.size,
    altAr,
    altEn,
    isPublic,
  });

  if (!validation.success) {
    return { success: false, message: firstIssueMessage(validation.error) };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = Buffer.from(arrayBuffer);

    const uploadResult = await uploadMedia({
      filename: validation.data.filename,
      mimeType: validation.data.mimeType,
      bytes,
      isPublic: validation.data.isPublic,
    });

    const repo = getEventRepository();
    const media = await repo.createMedia(
      {
        filename: validation.data.filename,
        mimeType: validation.data.mimeType,
        sizeBytes: uploadResult.sizeBytes,
        url: uploadResult.publicUrl,
        storagePath: uploadResult.storagePath,
        checksum: uploadResult.checksum,
        altAr: validation.data.altAr ?? null,
        altEn: validation.data.altEn ?? null,
        isPublic: validation.data.isPublic ?? true,
      },
      actor
    );

    const rawTargetEventId = formData.get("targetEventId");
    if (typeof rawTargetEventId === "string" && rawTargetEventId.trim().length > 0) {
      try {
        await repo.updateEvent(rawTargetEventId.trim(), { imageUrl: media.url }, actor);
        revalidatePath("/events");
      } catch (linkError) {
        console.warn("[media-upload] failed to link image to target event", linkError);
      }
    }

    revalidateTag(REVALIDATION_TAGS.eventMedia);
    revalidatePath("/admin/media");
    revalidatePath("/gallery");

    return {
      success: true,
      message: "تم رفع وحفظ الملف بنجاح.",
      data: media,
    };
  } catch (error) {
    console.error("[media-upload] upload failed", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء رفع الملف.",
    };
  }
}
