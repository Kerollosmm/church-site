// packages/data-access/src/validations/media-schemas.ts
// Strict MIME validation and magic byte verification for uploaded media.
// Disallows image/svg+xml to eliminate stored XSS vectors (C.4#5).

import { isAllowedMediaMimeType } from "@church-site/domain";

/**
 * Sniffs the MIME type from the magic bytes (file signature) of a buffer or Uint8Array.
 * Supports: image/jpeg, image/png, image/webp, image/gif, video/mp4, application/pdf.
 * Returns null if buffer is too short or unrecognized.
 */
export function detectMimeTypeFromMagicBytes(bytes: Uint8Array | Buffer): string | null {
  if (!bytes || bytes.byteLength < 4) return null;

  // JPEG: FF D8 FF
  if (bytes.byteLength >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.byteLength >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  // GIF: GIF87a or GIF89a
  if (
    bytes.byteLength >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return "image/gif";
  }

  // WEBP: RIFF (4 bytes) + file size (4 bytes) + WEBP (4 bytes)
  if (
    bytes.byteLength >= 12 &&
    bytes[0] === 0x52 && // R
    bytes[1] === 0x49 && // I
    bytes[2] === 0x46 && // F
    bytes[3] === 0x46 && // F
    bytes[8] === 0x57 && // W
    bytes[9] === 0x45 && // E
    bytes[10] === 0x42 && // B
    bytes[11] === 0x50 // P
  ) {
    return "image/webp";
  }

  // PDF: %PDF- (0x25 0x50 0x44 0x46 0x2D)
  if (
    bytes.byteLength >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  ) {
    return "application/pdf";
  }

  // MP4: ....ftyp at bytes 4..7
  if (
    bytes.byteLength >= 8 &&
    bytes[4] === 0x66 && // f
    bytes[5] === 0x74 && // t
    bytes[6] === 0x79 && // y
    bytes[7] === 0x70 // p
  ) {
    return "video/mp4";
  }

  return null;
}

/**
 * Verifies that the uploaded buffer matches the declared MIME type using magic byte sniffing.
 * Disallows image/svg+xml to prevent stored XSS.
 * Throws an Error if verification fails.
 */
export function verifyMediaMagicBytes(mimeType: string, bytes: Uint8Array | Buffer): void {
  const normalizedMime = mimeType.toLowerCase().trim();
  if (normalizedMime === "image/svg+xml") {
    throw new Error("نوع الملف غير مسموح به (image/svg+xml). يُحظر رفع ملفات SVG لدواعي الأمان.");
  }

  if (!isAllowedMediaMimeType(normalizedMime)) {
    throw new Error(`نوع الملف غير مسموح به (${mimeType}).`);
  }

  const detected = detectMimeTypeFromMagicBytes(bytes);
  if (!detected || detected !== normalizedMime) {
    throw new Error(
      `محتوى الملف لا يطابق نوع MIME المعلن (${mimeType}).`
    );
  }
}
