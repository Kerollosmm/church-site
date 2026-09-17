// packages/data-access/src/storage/index.ts
// Data-Access Storage Adapter: Supabase Storage + Local File Fallback.

// Server-only guard: this module must never be bundled into the browser
declare const window: unknown;
if (typeof window !== "undefined") {
  throw new Error("This module can only be executed on the server.");
}

import { createHash, randomUUID } from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { isAllowedMediaMimeType, MAX_MEDIA_SIZE_BYTES } from "@church-site/domain";
import { getSupabaseUrl, hasSupabaseAdminEnv } from "../env";
import { createAdminClient } from "../supabase/admin";

export interface UploadMediaInput {
  filename: string;
  mimeType: string;
  bytes: Uint8Array | Buffer;
  isPublic?: boolean;
}

export interface UploadMediaResult {
  storagePath: string;
  publicUrl: string;
  checksum: string;
  sizeBytes: number;
}

export interface MediaStorage {
  upload(input: UploadMediaInput): Promise<UploadMediaResult>;
  delete(storagePath: string): Promise<void>;
  getPublicUrl(storagePath: string): string;
}

/**
 * Extracts a sanitized file extension from a filename or falls back to MIME mapping.
 */
export function extractExtension(filename: string, mimeType: string): string {
  const parts = filename.split(".");
  if (parts.length > 1) {
    const rawExt = parts.pop()?.toLowerCase().trim() || "";
    const cleanExt = rawExt.replace(/[^a-z0-9]/g, "");
    if (cleanExt.length > 0) {
      return cleanExt;
    }
  }

  // Fallback map based on common media MIME types
  switch (mimeType.toLowerCase()) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/svg+xml":
      return "svg";
    case "video/mp4":
      return "mp4";
    case "application/pdf":
      return "pdf";
    default:
      return "bin";
  }
}

/**
 * Key scheme helper: generates `YYYY/MM/<uuid>.<ext>`
 */
export function generateStorageKey(filename: string, mimeType: string): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const ext = extractExtension(filename, mimeType);
  const uuid = randomUUID();
  return `${year}/${month}/${uuid}.${ext}`;
}

/**
 * Checksum helper: computes sha256 hex string.
 */
export function computeSha256(bytes: Uint8Array | Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function validateMedia(mimeType: string, bytes: Uint8Array | Buffer): void {
  if (!isAllowedMediaMimeType(mimeType)) {
    throw new Error(
      `نوع الملف غير مسموح به (${mimeType}). الأنواع المسموح بها: الصور، مقاطع الفيديو MP4، ومستندات PDF.`
    );
  }

  if (bytes.byteLength > MAX_MEDIA_SIZE_BYTES) {
    const maxMb = Math.round(MAX_MEDIA_SIZE_BYTES / (1024 * 1024));
    throw new Error(`حجم الملف يتجاوز الحد الأقصى المسموح به (${maxMb} ميجابايت).`);
  }
}

/**
 * Supabase Storage adapter using the service-role client (server-only).
 */
export class SupabaseMediaStorage implements MediaStorage {
  readonly bucket = "media";

  async upload(input: UploadMediaInput): Promise<UploadMediaResult> {
    validateMedia(input.mimeType, input.bytes);

    const storagePath = generateStorageKey(input.filename, input.mimeType);
    const checksum = computeSha256(input.bytes);
    const sizeBytes = input.bytes.byteLength;

    const client = createAdminClient();
    const { error } = await client.storage.from(this.bucket).upload(storagePath, input.bytes, {
      contentType: input.mimeType,
      upsert: false,
    });

    if (error) {
      throw new Error(`فشل رفع الملف إلى التخزين: ${error.message}`);
    }

    const publicUrl = this.getPublicUrl(storagePath);

    return {
      storagePath,
      publicUrl,
      checksum,
      sizeBytes,
    };
  }

  async delete(storagePath: string): Promise<void> {
    const client = createAdminClient();
    const { error } = await client.storage.from(this.bucket).remove([storagePath]);
    if (error) {
      throw new Error(`فشل حذف الملف من التخزين: ${error.message}`);
    }
  }

  getPublicUrl(storagePath: string): string {
    const baseUrl = getSupabaseUrl().replace(/\/+$/, "");
    return `${baseUrl}/storage/v1/object/public/${this.bucket}/${storagePath}`;
  }
}

/**
 * Local filesystem fallback for dev, zero-env builds, and unit tests.
 */
export class FileMediaStorage implements MediaStorage {
  constructor(private readonly customBaseDir?: string) {}

  private getMediaDir(): string {
    if (this.customBaseDir) {
      return path.resolve(this.customBaseDir);
    }
    const churchDataDir = process.env.CHURCH_DATA_DIR?.trim();
    const base =
      churchDataDir && churchDataDir.length > 0
        ? path.resolve(churchDataDir)
        : path.join(process.cwd(), ".data");
    return path.join(base, "media");
  }

  async upload(input: UploadMediaInput): Promise<UploadMediaResult> {
    validateMedia(input.mimeType, input.bytes);

    const storagePath = generateStorageKey(input.filename, input.mimeType);
    const checksum = computeSha256(input.bytes);
    const sizeBytes = input.bytes.byteLength;

    const mediaDir = this.getMediaDir();
    const targetFilePath = path.join(mediaDir, ...storagePath.split("/"));

    await fs.mkdir(path.dirname(targetFilePath), { recursive: true });
    await fs.writeFile(targetFilePath, input.bytes);

    const publicUrl = this.getPublicUrl(storagePath);

    return {
      storagePath,
      publicUrl,
      checksum,
      sizeBytes,
    };
  }

  async delete(storagePath: string): Promise<void> {
    const mediaDir = this.getMediaDir();
    const targetFilePath = path.join(mediaDir, ...storagePath.split("/"));

    try {
      await fs.unlink(targetFilePath);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }
    }
  }

  getPublicUrl(storagePath: string): string {
    return `/media-mock/${storagePath}`;
  }
}

/**
 * Selects the active MediaStorage instance based on environment variables.
 */
export function getMediaStorage(): MediaStorage {
  if (hasSupabaseAdminEnv()) {
    return new SupabaseMediaStorage();
  }
  return new FileMediaStorage();
}

/** Helper function to upload media via active storage adapter */
export async function uploadMedia(input: UploadMediaInput): Promise<UploadMediaResult> {
  return getMediaStorage().upload(input);
}

/** Helper function to delete media object via active storage adapter */
export async function deleteMediaObject(storagePath: string): Promise<void> {
  return getMediaStorage().delete(storagePath);
}

/** Helper function to get public URL via active storage adapter */
export function getMediaPublicUrl(storagePath: string): string {
  return getMediaStorage().getPublicUrl(storagePath);
}
