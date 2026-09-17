// packages/data-access/src/validations/__tests__/media-schemas.test.ts
// Comprehensive unit tests covering MediaUploadSchema, MediaSchema, and isAllowedMediaMimeType.

import { describe, expect, it } from "vitest";
import {
  isAllowedMediaMimeType,
  MAX_MEDIA_SIZE_BYTES,
} from "@church-site/domain";
import {
  MediaUploadSchema,
  MediaSchema,
  firstIssueMessage,
} from "../event-schemas";

describe("isAllowedMediaMimeType", () => {
  it("returns true for image/* MIME types (jpeg, png, webp, gif, svg, avif)", () => {
    expect(isAllowedMediaMimeType("image/jpeg")).toBe(true);
    expect(isAllowedMediaMimeType("image/png")).toBe(true);
    expect(isAllowedMediaMimeType("image/webp")).toBe(true);
    expect(isAllowedMediaMimeType("image/gif")).toBe(true);
    expect(isAllowedMediaMimeType("image/svg+xml")).toBe(true);
    expect(isAllowedMediaMimeType("image/avif")).toBe(true);
  });

  it("returns true for video/mp4 and application/pdf", () => {
    expect(isAllowedMediaMimeType("video/mp4")).toBe(true);
    expect(isAllowedMediaMimeType("application/pdf")).toBe(true);
  });

  it("returns false for disallowed types (zip, exe, text/html, octet-stream, json, webm, mp3)", () => {
    expect(isAllowedMediaMimeType("application/zip")).toBe(false);
    expect(isAllowedMediaMimeType("application/x-msdownload")).toBe(false);
    expect(isAllowedMediaMimeType("text/html")).toBe(false);
    expect(isAllowedMediaMimeType("application/octet-stream")).toBe(false);
    expect(isAllowedMediaMimeType("application/json")).toBe(false);
    expect(isAllowedMediaMimeType("video/webm")).toBe(false);
    expect(isAllowedMediaMimeType("audio/mpeg")).toBe(false);
    expect(isAllowedMediaMimeType("text/plain")).toBe(false);
  });
});

describe("MediaUploadSchema", () => {
  const validImages = [
    { filename: "photo.jpg", mimeType: "image/jpeg" },
    { filename: "icon.png", mimeType: "image/png" },
    { filename: "banner.webp", mimeType: "image/webp" },
    { filename: "anim.gif", mimeType: "image/gif" },
    { filename: "vector.svg", mimeType: "image/svg+xml" },
  ];

  it.each(validImages)("accepts valid image ($mimeType)", ({ filename, mimeType }) => {
    const parsed = MediaUploadSchema.safeParse({
      filename,
      mimeType,
      sizeBytes: 1024 * 100,
      isPublic: true,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.filename).toBe(filename);
      expect(parsed.data.mimeType).toBe(mimeType);
      expect(parsed.data.isPublic).toBe(true);
    }
  });

  it("accepts pdf document and mp4 video", () => {
    const pdfResult = MediaUploadSchema.safeParse({
      filename: "liturgy-schedule.pdf",
      mimeType: "application/pdf",
      sizeBytes: 250_000,
      altAr: "جدول القداسات",
      altEn: "Liturgy Schedule",
    });
    expect(pdfResult.success).toBe(true);

    const mp4Result = MediaUploadSchema.safeParse({
      filename: "coptic-hymn.mp4",
      mimeType: "video/mp4",
      sizeBytes: 15_000_000,
      isPublic: false,
    });
    expect(mp4Result.success).toBe(true);
    if (mp4Result.success) {
      expect(mp4Result.data.isPublic).toBe(false);
    }
  });

  it.each([
    ["application/zip", "archive.zip"],
    ["application/x-msdownload", "installer.exe"],
    ["text/html", "index.html"],
    ["application/octet-stream", "data.bin"],
    ["application/json", "config.json"],
  ])("rejects disallowed MIME type %s with Arabic error message", (mimeType, filename) => {
    const result = MediaUploadSchema.safeParse({
      filename,
      mimeType,
      sizeBytes: 2048,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = firstIssueMessage(result.error);
      expect(msg).toBe("نوع الملف غير مدعوم.");
    }
  });

  it("enforces minimum size limit (1 byte minimum, rejects 0 bytes and negative values)", () => {
    const oneByteResult = MediaUploadSchema.safeParse({
      filename: "tiny.png",
      mimeType: "image/png",
      sizeBytes: 1,
    });
    expect(oneByteResult.success).toBe(true);

    const zeroByteResult = MediaUploadSchema.safeParse({
      filename: "empty.png",
      mimeType: "image/png",
      sizeBytes: 0,
    });
    expect(zeroByteResult.success).toBe(false);
    if (!zeroByteResult.success) {
      expect(firstIssueMessage(zeroByteResult.error)).toBe("الملف فارغ.");
    }

    const negativeResult = MediaUploadSchema.safeParse({
      filename: "invalid.png",
      mimeType: "image/png",
      sizeBytes: -1,
    });
    expect(negativeResult.success).toBe(false);
    if (!negativeResult.success) {
      expect(firstIssueMessage(negativeResult.error)).toBe("الملف فارغ.");
    }
  });

  it("enforces maximum size limit (MAX_MEDIA_SIZE_BYTES accepts, rejects > 50MB)", () => {
    const maxAllowedResult = MediaUploadSchema.safeParse({
      filename: "large-video.mp4",
      mimeType: "video/mp4",
      sizeBytes: MAX_MEDIA_SIZE_BYTES,
    });
    expect(maxAllowedResult.success).toBe(true);

    const oversizedResult = MediaUploadSchema.safeParse({
      filename: "too-large.mp4",
      mimeType: "video/mp4",
      sizeBytes: MAX_MEDIA_SIZE_BYTES + 1,
    });
    expect(oversizedResult.success).toBe(false);
    if (!oversizedResult.success) {
      expect(firstIssueMessage(oversizedResult.error)).toBe("الحجم الأقصى 50 ميجابايت.");
    }
  });

  it("rejects empty or whitespace filename with Arabic error message", () => {
    const result = MediaUploadSchema.safeParse({
      filename: "   ",
      mimeType: "image/png",
      sizeBytes: 1024,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(firstIssueMessage(result.error)).toBe("اسم الملف مطلوب.");
    }
  });
});

describe("MediaSchema", () => {
  const sha256Hex = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

  it("accepts valid media record with full metadata", () => {
    const result = MediaSchema.safeParse({
      filename: "altar-consecration.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 204800,
      url: "https://example.com/altar-consecration.jpg",
      storagePath: "2026/09/b3f81e3a-4a25-41e9-9a2c-d9c0e27161b2.jpg",
      checksum: sha256Hex,
      altAr: "تدشين المذبح المقدس",
      altEn: "Sanctuary altar consecration",
      isPublic: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filename).toBe("altar-consecration.jpg");
      expect(result.data.storagePath).toBe("2026/09/b3f81e3a-4a25-41e9-9a2c-d9c0e27161b2.jpg");
      expect(result.data.checksum).toBe(sha256Hex);
    }
  });

  it("accepts valid image (jpeg, png, webp, gif, svg), pdf, and mp4 formats", () => {
    const mimes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "application/pdf",
      "video/mp4",
    ];

    for (const mimeType of mimes) {
      const result = MediaSchema.safeParse({
        filename: "file.ext",
        mimeType,
        url: "https://example.com/file.ext",
      });
      expect(result.success).toBe(true);
    }
  });

  it("validates optional and nullable storagePath and checksum (sha256 64-char hex)", () => {
    // Null storagePath & checksum
    const withNulls = MediaSchema.safeParse({
      filename: "external-link.png",
      mimeType: "image/png",
      url: "https://cdn.example.com/img.png",
      storagePath: null,
      checksum: null,
    });
    expect(withNulls.success).toBe(true);

    // Missing optional storagePath & checksum
    const withUndefined = MediaSchema.safeParse({
      filename: "external-link.png",
      mimeType: "image/png",
      url: "https://cdn.example.com/img.png",
    });
    expect(withUndefined.success).toBe(true);

    // Exactly 64 characters hex checksum
    const withValidChecksum = MediaSchema.safeParse({
      filename: "file.pdf",
      mimeType: "application/pdf",
      url: "https://example.com/file.pdf",
      checksum: sha256Hex,
      storagePath: "2026/09/custom-path.pdf",
    });
    expect(withValidChecksum.success).toBe(true);
    if (withValidChecksum.success) {
      expect(withValidChecksum.data.checksum).toHaveLength(64);
    }

    // Checksum > 64 chars fails
    const invalidChecksum = MediaSchema.safeParse({
      filename: "file.pdf",
      mimeType: "application/pdf",
      url: "https://example.com/file.pdf",
      checksum: "a".repeat(65),
    });
    expect(invalidChecksum.success).toBe(false);

    // Storage path > 500 chars fails
    const invalidStoragePath = MediaSchema.safeParse({
      filename: "file.pdf",
      mimeType: "application/pdf",
      url: "https://example.com/file.pdf",
      storagePath: "a".repeat(501),
    });
    expect(invalidStoragePath.success).toBe(false);
  });

  it("enforces size limits (allows 0 bytes, accepts 50MB, rejects > 50MB)", () => {
    const zeroByte = MediaSchema.safeParse({
      filename: "zero.png",
      mimeType: "image/png",
      url: "https://example.com/zero.png",
      sizeBytes: 0,
    });
    expect(zeroByte.success).toBe(true);

    const maxByte = MediaSchema.safeParse({
      filename: "max.png",
      mimeType: "image/png",
      url: "https://example.com/max.png",
      sizeBytes: MAX_MEDIA_SIZE_BYTES,
    });
    expect(maxByte.success).toBe(true);

    const overMax = MediaSchema.safeParse({
      filename: "over.png",
      mimeType: "image/png",
      url: "https://example.com/over.png",
      sizeBytes: MAX_MEDIA_SIZE_BYTES + 1,
    });
    expect(overMax.success).toBe(false);
    if (!overMax.success) {
      expect(firstIssueMessage(overMax.error)).toBe("الحجم الأقصى 50 ميجابايت.");
    }
  });

  it("asserts Arabic validation error messages for missing required fields and invalid MIME format", () => {
    // Missing filename
    const missingFilename = MediaSchema.safeParse({
      filename: "",
      mimeType: "image/jpeg",
      url: "https://example.com/img.jpg",
    });
    expect(missingFilename.success).toBe(false);
    if (!missingFilename.success) {
      expect(firstIssueMessage(missingFilename.error)).toBe("اسم الملف مطلوب.");
    }

    // Missing URL
    const missingUrl = MediaSchema.safeParse({
      filename: "test.jpg",
      mimeType: "image/jpeg",
      url: "   ",
    });
    expect(missingUrl.success).toBe(false);
    if (!missingUrl.success) {
      expect(firstIssueMessage(missingUrl.error)).toBe("رابط الملف مطلوب.");
    }

    // Malformed MIME format (regex check)
    const malformedMime = MediaSchema.safeParse({
      filename: "test.jpg",
      mimeType: "not-a-mime-type",
      url: "https://example.com/img.jpg",
    });
    expect(malformedMime.success).toBe(false);
    if (!malformedMime.success) {
      expect(firstIssueMessage(malformedMime.error)).toBe("نوع الملف غير صالح (مثال: image/jpeg).");
    }
  });
});
