// packages/data-access/src/storage/__tests__/storage.test.ts
// Unit tests for MediaStorage adapter and FileMediaStorage fallback.

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { createHash } from "node:crypto";
import { MAX_MEDIA_SIZE_BYTES } from "@church-site/domain";
import {
  FileMediaStorage,
  getMediaStorage,
  uploadMedia,
  deleteMediaObject,
  getMediaPublicUrl,
  extractExtension,
  generateStorageKey,
  computeSha256,
} from "../index";

describe("MediaStorage - FileMediaStorage", () => {
  let tempDir: string;
  let originalDataDir: string | undefined;
  let originalSupabaseUrl: string | undefined;
  let originalServiceRoleKey: string | undefined;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "church-storage-test-"));
    originalDataDir = process.env.CHURCH_DATA_DIR;
    originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    originalServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Direct FileMediaStorage to temp directory
    process.env.CHURCH_DATA_DIR = tempDir;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  afterEach(async () => {
    if (originalDataDir !== undefined) {
      process.env.CHURCH_DATA_DIR = originalDataDir;
    } else {
      delete process.env.CHURCH_DATA_DIR;
    }

    if (originalSupabaseUrl !== undefined) {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
    } else {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    }

    if (originalServiceRoleKey !== undefined) {
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRoleKey;
    } else {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    }

    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("successful upload: generates YYYY/MM/<uuid>.<ext> path, accurate sha256 checksum, returns valid publicUrl, writes file", async () => {
    const storage = new FileMediaStorage(tempDir);
    const content = Buffer.from("Coptic Orthodox Liturgy Media Test Bytes");
    const expectedChecksum = createHash("sha256").update(content).digest("hex");

    const result = await storage.upload({
      filename: "altar-photo.PNG",
      mimeType: "image/png",
      bytes: content,
      isPublic: true,
    });

    // Check path scheme: YYYY/MM/<uuid>.<ext>
    const pathParts = result.storagePath.split("/");
    expect(pathParts).toHaveLength(3);
    expect(pathParts[0]).toMatch(/^\d{4}$/);
    expect(pathParts[1]).toMatch(/^\d{2}$/);
    expect(pathParts[2]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/);

    // Check checksum and size
    expect(result.checksum).toBe(expectedChecksum);
    expect(result.sizeBytes).toBe(content.byteLength);

    // Check public URL
    expect(result.publicUrl).toBe(`/media-mock/${result.storagePath}`);

    // Verify written file exists on disk with matching content
    const writtenFilePath = path.join(tempDir, ...pathParts);
    const writtenBytes = await fs.readFile(writtenFilePath);
    expect(writtenBytes).toEqual(content);
  });

  it("rejects disallowed MIME types with descriptive Arabic error", async () => {
    const storage = new FileMediaStorage(tempDir);
    const dummyBytes = Buffer.from("executable content");

    const disallowedTypes = [
      "application/x-msdownload",
      "text/html",
      "application/zip",
      "application/x-sh",
      "application/javascript",
    ];

    for (const mimeType of disallowedTypes) {
      await expect(
        storage.upload({
          filename: "bad-file.exe",
          mimeType,
          bytes: dummyBytes,
        })
      ).rejects.toThrow(/نوع الملف غير مسموح به/);
    }
  });

  it("rejects oversize bytes (> MAX_MEDIA_SIZE_BYTES) with descriptive Arabic error", async () => {
    const storage = new FileMediaStorage(tempDir);
    // Create oversized buffer (50MB + 1024 bytes)
    const oversizedBuffer = Buffer.alloc(MAX_MEDIA_SIZE_BYTES + 1024);

    await expect(
      storage.upload({
        filename: "huge-photo.jpg",
        mimeType: "image/jpeg",
        bytes: oversizedBuffer,
      })
    ).rejects.toThrow(/حجم الملف يتجاوز الحد الأقصى المسموح به/);
  });

  it("delete removes file from disk gracefully", async () => {
    const storage = new FileMediaStorage(tempDir);
    const content = Buffer.from("Temporary file for delete test");

    const uploadResult = await storage.upload({
      filename: "temp-doc.pdf",
      mimeType: "application/pdf",
      bytes: content,
    });

    const filePath = path.join(tempDir, ...uploadResult.storagePath.split("/"));
    // File exists
    await expect(fs.stat(filePath)).resolves.toBeDefined();

    // Delete file
    await storage.delete(uploadResult.storagePath);

    // File no longer exists
    await expect(fs.stat(filePath)).rejects.toThrow();

    // Subsequent delete does not throw (idempotent / graceful ENOENT)
    await expect(storage.delete(uploadResult.storagePath)).resolves.toBeUndefined();
  });

  it("getMediaStorage() returns FileMediaStorage when admin env is unset", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const storage = getMediaStorage();
    expect(storage).toBeInstanceOf(FileMediaStorage);
    expect(storage.getPublicUrl("2026/09/sample.png")).toBe("/media-mock/2026/09/sample.png");
  });

  it("helper functions route through active media storage instance", async () => {
    const content = Buffer.from("Helper function test");
    const uploadResult = await uploadMedia({
      filename: "helper.jpg",
      mimeType: "image/jpeg",
      bytes: content,
    });

    expect(uploadResult.publicUrl).toBe(`/media-mock/${uploadResult.storagePath}`);
    expect(getMediaPublicUrl(uploadResult.storagePath)).toBe(`/media-mock/${uploadResult.storagePath}`);

    await expect(deleteMediaObject(uploadResult.storagePath)).resolves.toBeUndefined();
  });
});

describe("Key scheme and extension helpers", () => {
  it("extractExtension correctly sanitizes extensions and falls back to MIME mapping", () => {
    expect(extractExtension("photo.PNG", "image/png")).toBe("png");
    expect(extractExtension("document.PDF", "application/pdf")).toBe("pdf");
    expect(extractExtension("archive.file!#$.jpg", "image/jpeg")).toBe("jpg");
    expect(extractExtension("no-extension", "image/webp")).toBe("webp");
    expect(extractExtension("video", "video/mp4")).toBe("mp4");
    expect(extractExtension("unknown", "application/octet-stream")).toBe("bin");
  });

  it("generateStorageKey generates valid YYYY/MM/<uuid>.<ext>", () => {
    const key = generateStorageKey("banner.webp", "image/webp");
    const parts = key.split("/");
    expect(parts).toHaveLength(3);
    expect(parts[0]).toMatch(/^\d{4}$/);
    expect(parts[1]).toMatch(/^\d{2}$/);
    expect(parts[2]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/);
  });

  it("computeSha256 produces exact hex digest", () => {
    const data = Buffer.from("Hello Coptic Parish Portal");
    const expected = createHash("sha256").update(data).digest("hex");
    expect(computeSha256(data)).toBe(expected);
  });
});
