// src/validations/dynamic-validator.ts
// Dynamic runtime Zod schema generator for custom content types.
// Maps ContentField definitions directly to strongly-typed Zod validators with Arabic error messages.

import { z } from "zod";
import type { ContentField, FieldType } from "@church-site/domain";

/**
 * Minimal, zero-dependency HTML sanitizer using an allowlist approach.
 * Removes dangerous tags and attributes (script, iframe, on* handlers, javascript: protocols).
 */
export function sanitizeHtml(raw: string): string {
  if (!raw || typeof raw !== "string") return "";

  // 1. Remove dangerous script and style tags and their contents
  let clean = raw
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*>/gi, "");

  // 2. Remove inline on* event handlers (e.g. onclick, onerror, onload)
  clean = clean.replace(/\s*on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  // 3. Neutralize javascript: and vbscript: URLs in href or src
  clean = clean.replace(/\s*(href|src)\s*=\s*["']?\s*(?:javascript|vbscript):[^"'>\s]*["']?/gi, "");

  return clean.trim();
}

/**
 * Validates whether a value represents a valid date string (ISO timestamp or YYYY-MM-DD).
 */
export function isValidDateString(val: string): boolean {
  if (!val || typeof val !== "string") return false;
  const parsed = Date.parse(val);
  return !Number.isNaN(parsed);
}

/**
 * Builds a single Zod validator for an individual ContentField.
 */
export function buildFieldValidator(field: ContentField): z.ZodTypeAny {
  const rules = field.validationRules || {};
  const isReq = field.isRequired;
  const label = field.labelAr || field.slug;

  let schema: z.ZodTypeAny;

  switch (field.fieldType) {
    case "text": {
      let s = z.string({
        invalid_type_error: `يجب أن يكون حقل «${label}» نصاً.`,
        required_error: `حقل «${label}» مطلوب.`,
      }).trim();

      if (typeof rules.min === "number") {
        s = s.min(rules.min, `يجب أن لا يقل «${label}» عن ${rules.min} أحرف.`);
      } else if (isReq) {
        s = s.min(1, `حقل «${label}» مطلوب.`);
      }

      if (typeof rules.max === "number") {
        s = s.max(rules.max, `يجب أن لا يتجاوز «${label}» ${rules.max} حرفاً.`);
      }

      if (typeof rules.pattern === "string" && rules.pattern.trim().length > 0) {
        try {
          const regex = new RegExp(rules.pattern);
          s = s.regex(regex, `قيمة «${label}» غير مطابقة للشكل المطلوب.`);
        } catch {
          // Invalid regex ignored safely
        }
      }

      schema = isReq ? s : s.optional().nullable().or(z.literal(""));
      break;
    }

    case "richtext": {
      let s = z.string({
        invalid_type_error: `يجب أن يكون محتوى «${label}» نصاً منسقاً.`,
        required_error: `حقل «${label}» مطلوب.`,
      }).trim();

      if (isReq) {
        s = s.min(1, `حقل «${label}» مطلوب ولا يمكن أن يكون فارغاً.`);
      }

      // Automatically sanitize rich text content
      const transformed = s.transform((val) => sanitizeHtml(val));
      schema = isReq ? transformed : transformed.optional().nullable().or(z.literal(""));
      break;
    }

    case "number": {
      let s = z.coerce.number({
        invalid_type_error: `يجب إدخال قيمة عددية في حقل «${label}».`,
        required_error: `حقل «${label}» مطلوب.`,
      });

      if (typeof rules.min === "number") {
        s = s.min(rules.min, `يجب أن تكون قيمة «${label}» أكبر من أو تساوي ${rules.min}.`);
      }
      if (typeof rules.max === "number") {
        s = s.max(rules.max, `يجب أن تكون قيمة «${label}» أصغر من أو تساوي ${rules.max}.`);
      }

      schema = isReq
        ? s
        : z.preprocess((val) => (val === "" || val === null || val === undefined ? null : val), s.nullable().optional());
      break;
    }

    case "date": {
      const s = z.string({
        invalid_type_error: `تاريخ «${label}» غير صالح.`,
        required_error: `حقل «${label}» مطلوب.`,
      })
        .trim()
        .refine(
          (val) => !val || isValidDateString(val),
          `تاريخ «${label}» غير صالح.`
        );

      if (isReq) {
        schema = s.refine((val) => val.length > 0, `حقل تاريخ «${label}» مطلوب.`);
      } else {
        schema = s.optional().nullable().or(z.literal(""));
      }
      break;
    }

    case "media": {
      // Accepts a media URL string, media ID, or structured object
      const stringValidator = z.string().trim();
      const objectValidator = z.object({
        url: z.string().trim(),
        storagePath: z.string().nullable().optional(),
        checksum: z.string().nullable().optional(),
      });

      const unionValidator = z.union([stringValidator, objectValidator]);

      if (isReq) {
        schema = unionValidator.refine(
          (val) => {
            if (typeof val === "string") return val.length > 0;
            if (typeof val === "object" && val !== null) return typeof val.url === "string" && val.url.length > 0;
            return false;
          },
          `يرجى اختيار أو رفع ملف في «${label}».`
        );
      } else {
        schema = unionValidator.optional().nullable().or(z.literal(""));
      }
      break;
    }

    case "select": {
      // Extract allowed option values
      let allowedValues: string[] = [];
      if (Array.isArray(field.options)) {
        allowedValues = field.options
          .map((opt: any) => (typeof opt === "string" ? opt : opt?.value))
          .filter((v: any) => typeof v === "string");
      }

      let strSchema = z.string({
        invalid_type_error: `يرجى اختيار قيمة صالحة في «${label}».`,
        required_error: `حقل «${label}» مطلوب.`,
      }).trim();

      let baseSchema: z.ZodTypeAny = isReq
        ? strSchema.min(1, `يرجى اختيار إحدى الخيارات في «${label}».`)
        : strSchema.optional().nullable().or(z.literal(""));

      if (allowedValues.length > 0) {
        baseSchema = baseSchema.refine(
          (val) => !val || allowedValues.includes(val),
          `القيمة المختارة غير موجودة في خيارات «${label}».`
        );
      }

      schema = baseSchema;
      break;
    }

    case "relation": {
      // Expects UUID / slug of target content entry
      let s = z.string({
        invalid_type_error: `يجب تحديد العنصر المرتبط في «${label}».`,
        required_error: `حقل «${label}» مطلوب.`,
      }).trim();

      if (isReq) {
        s = s.min(1, `يجب تحديد العنصر المرتبط في «${label}».`);
      }
      schema = isReq ? s : s.optional().nullable().or(z.literal(""));
      break;
    }

    case "boolean": {
      schema = z.preprocess(
        (val) => (val === "true" || val === true || val === 1 || val === "1" ? true : false),
        z.boolean()
      );
      if (!isReq) {
        schema = schema.default(false);
      }
      break;
    }

    default: {
      const fallback = z.any();
      schema = isReq ? fallback.refine((v) => v !== undefined && v !== null, `حقل «${label}» مطلوب.`) : fallback.optional();
      break;
    }
  }

  return schema;
}

/**
 * Generates a complete runtime Zod Object schema from a list of ContentFields.
 * Validates the `data` record of a ContentEntry at the server-action boundary.
 */
export function buildZodSchema(fields: ContentField[]): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  // Sort fields by sortOrder ascending before processing
  const sorted = [...fields].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  for (const field of sorted) {
    if (!field.slug) continue;
    shape[field.slug] = buildFieldValidator(field);
  }

  return z.object(shape);
}

/**
 * Metadata descriptor for client-side form rendering.
 */
export interface FieldFormMetadata {
  slug: string;
  labelAr: string;
  labelEn: string | null;
  fieldType: FieldType;
  isRequired: boolean;
  isTranslatable: boolean;
  validationRules: Record<string, any> | null;
  options: Array<{ labelAr: string; labelEn?: string | null; value: string }> | string[] | null;
  sortOrder: number;
}

/**
 * Extracts metadata for dynamic form UI rendering.
 */
export function extractFormMetadata(fields: ContentField[]): FieldFormMetadata[] {
  return [...fields]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((field) => ({
      slug: field.slug,
      labelAr: field.labelAr,
      labelEn: field.labelEn,
      fieldType: field.fieldType,
      isRequired: field.isRequired,
      isTranslatable: field.isTranslatable,
      validationRules: field.validationRules,
      options: field.options,
      sortOrder: field.sortOrder,
    }));
}
