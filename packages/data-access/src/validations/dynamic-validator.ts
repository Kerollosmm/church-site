// src/validations/dynamic-validator.ts
// Dynamic runtime Zod schema generator for custom content types.
// Maps ContentField definitions directly to strongly-typed Zod validators with Arabic error messages.

import { z } from "zod";
import type { ContentField, ContentFieldOption, ContentFieldOptions, FieldType } from "@church-site/domain";

/**
 * The complete tag allowlist. Everything outside it is dropped — this is an allowlist, never a
 * denylist, because a denylist can only ever be as complete as the attacker's imagination.
 */
export const ALLOWED_TAGS: readonly string[] = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "br", "hr", "blockquote", "pre", "code",
  "b", "i", "strong", "em", "u", "s",
  "ul", "ol", "li",
  "a", "img",
  "table", "thead", "tbody", "tr", "th", "td",
];

/** Attributes allowed on each tag. `*` applies to every allowed tag. Nothing else survives. */
const ALLOWED_ATTRIBUTES: Record<string, readonly string[]> = {
  "*": ["class"],
  a: ["href", "title", "target"],
  img: ["src", "alt", "title"],
};

/** URL schemes a link or image may use. `data:`, `javascript:`, `vbscript:` … are all excluded. */
const ALLOWED_URL_SCHEMES: readonly string[] = ["http", "https", "mailto", "tel"];

/**
 * Elements whose CONTENT is removed together with the tag. Dropping only the tag would leave the
 * body of a `<script>` behind as visible text.
 */
const CONTENT_REMOVING_TAGS: readonly string[] = [
  "script", "style", "iframe", "object", "embed", "noscript", "template",
  "svg", "math", "form", "textarea", "select", "button", "title", "base", "link", "meta",
];

/** Elements that never have closing tags. */
const VOID_TAGS: readonly string[] = ["br", "hr", "img"];

/** The handful of entities that matter for scheme smuggling (`&#106;` → `j`, `&colon;` → `:`). */
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  colon: ":",
  tab: "\t",
  newline: "\n",
  sol: "/",
  nbsp: "\u00a0",
};

/**
 * Decodes numeric and the few security-relevant named character references. A reference without a
 * trailing `;` is decoded too: browsers consume it in attribute values, so `&#106avascript:` is
 * just as executable as `&#106;avascript:` and must be judged on its decoded form.
 */
function decodeEntities(value: string): string {
  return value.replace(/&(#[xX][0-9a-fA-F]+|#[0-9]+|[a-zA-Z][a-zA-Z0-9]*);?/g, (entity, body: string) => {
    if (body.startsWith("#")) {
      const isHex = body[1] === "x" || body[1] === "X";
      const codePoint = Number.parseInt(isHex ? body.slice(2) : body.slice(1), isHex ? 16 : 10);
      if (!Number.isFinite(codePoint) || codePoint <= 0 || codePoint > 0x10ffff) return entity;
      return String.fromCodePoint(codePoint);
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? entity;
  });
}

/**
 * True when a URL value may be emitted. The value is decoded and stripped of every control
 * character/whitespace before the scheme is read, exactly as the browser will do when it resolves
 * it — so entity encoding, embedded tabs and newlines cannot smuggle a scheme past this check.
 */
function isSafeUrl(rawValue: string, tag: string): boolean {
  const normalized = decodeEntities(rawValue)
    .replace(/[\u0000-\u0020\u007f-\u009f]/g, "")
    .toLowerCase();

  if (normalized.length === 0) return false;

  const schemeMatch = /^([a-z][a-z0-9+.\-]*):/.exec(normalized);
  // No scheme at all ⇒ a relative path, `#anchor`, `?query` or `//host` — all safe to emit.
  if (!schemeMatch) return true;

  const scheme = schemeMatch[1];
  if (!ALLOWED_URL_SCHEMES.includes(scheme)) return false;
  if (tag === "img" && scheme !== "http" && scheme !== "https") return false;
  return true;
}

/** Escapes an attribute value for re-emission inside double quotes (never touches `&`). */
function escapeAttributeValue(value: string): string {
  return value.replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/** Escapes a literal `<`/`>`/`&` that was NOT a tag, so it renders as visible text. */
function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Finds the `>` that closes a tag, ignoring any `>` that sits inside a quoted attribute value. */
function findTagEnd(source: string, start: number): number {
  let quote: string | null = null;
  for (let i = start + 1; i < source.length; i += 1) {
    const char = source[i];
    if (quote) {
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === ">") return i;
  }
  return -1;
}

/** Parses the attributes of a single tag body into name/value pairs (values may be empty). */
function parseAttributes(source: string): Array<{ name: string; value: string }> {
  const attributes: Array<{ name: string; value: string }> = [];
  const pattern = /([a-zA-Z_:][a-zA-Z0-9_.:-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    attributes.push({
      name: match[1].toLowerCase(),
      value: match[2] ?? match[3] ?? match[4] ?? "",
    });
  }

  return attributes;
}

/** Renders the surviving attributes of one allowed tag. */
function renderAttributes(tag: string, source: string): string {
  const allowed = [...(ALLOWED_ATTRIBUTES["*"] ?? []), ...(ALLOWED_ATTRIBUTES[tag] ?? [])];
  const kept: Array<{ name: string; value: string }> = [];
  let opensNewTab = false;

  for (const attribute of parseAttributes(source)) {
    if (!allowed.includes(attribute.name)) continue;

    if (attribute.name === "href" || attribute.name === "src") {
      if (!isSafeUrl(attribute.value, tag)) continue;
    }

    if (attribute.name === "target") {
      if (attribute.value !== "_blank" && attribute.value !== "_self") continue;
      opensNewTab = attribute.value === "_blank";
    }

    kept.push(attribute);
  }

  let rendered = kept
    .map((attribute) => ` ${attribute.name}="${escapeAttributeValue(attribute.value)}"`)
    .join("");

  // Tabnabbing guard: anything that opens a new tab gets `rel="noopener noreferrer"` whatever the
  // author wrote, because the author is not the one who decides the destination.
  if (opensNewTab) rendered += ' rel="noopener noreferrer"';

  return rendered;
}

/**
 * Minimal, zero-dependency HTML sanitizer built on a strict ALLOWLIST.
 *
 * Written because this output goes straight into `dangerouslySetInnerHTML` on the public portal and
 * is the ONLY control between staff-authored HTML and every visitor. It therefore:
 *   - keeps only the tags in `ALLOWED_TAGS`, and only the attributes in `ALLOWED_ATTRIBUTES`;
 *   - removes dangerous elements together with their content (`script`, `style`, `iframe`, …);
 *   - decodes character references and strips control characters before judging a URL scheme, so
 *     `&#106;avascript:`, `java\tscript:` and `data:text/html,…` are all rejected;
 *   - forces `rel="noopener noreferrer"` on every `target="_blank"` link.
 *
 * Not a general-purpose sanitizer (no CSS, no SVG, no MathML) — deliberately so.
 */
export function sanitizeHtml(raw: string): string {
  if (!raw || typeof raw !== "string") return "";

  const allowedTags = new Set(ALLOWED_TAGS);
  const contentRemoving = new Set(CONTENT_REMOVING_TAGS);
  const voidTags = new Set(VOID_TAGS);
  const source = raw;
  const haystack = raw.toLowerCase();

  let output = "";
  let index = 0;

  while (index < source.length) {
    const tagStart = source.indexOf("<", index);
    if (tagStart === -1) {
      output += source.slice(index);
      break;
    }

    output += source.slice(index, tagStart);

    // Comments are dropped whole — their body may contain `>` and would derail tag scanning.
    if (source.startsWith("<!--", tagStart)) {
      const commentEnd = source.indexOf("-->", tagStart + 4);
      index = commentEnd === -1 ? source.length : commentEnd + 3;
      continue;
    }

    const tagEnd = findTagEnd(source, tagStart);
    if (tagEnd === -1) {
      output += escapeText(source.slice(tagStart));
      break;
    }

    const body = source.slice(tagStart + 1, tagEnd);
    const isClosing = body.startsWith("/");
    const nameMatch = /^\/?\s*([a-zA-Z][a-zA-Z0-9-]*)/.exec(body);

    if (!nameMatch) {
      // A doctype or processing instruction: not renderable content, drop the whole thing.
      if (body.startsWith("!") || body.startsWith("?")) {
        index = tagEnd + 1;
        continue;
      }
      // A bare `<` in prose. Escape just that character and rescan from the next position —
      // jumping to `tagEnd` would swallow a real closing tag that happens to follow it.
      output += "&lt;";
      index = tagStart + 1;
      continue;
    }

    const tag = nameMatch[1].toLowerCase();
    const attributesSource = body.slice(nameMatch[0].length);

    if (!allowedTags.has(tag)) {
      if (!isClosing && contentRemoving.has(tag)) {
        // Remove the element AND its body, up to the matching close tag.
        const closeStart = haystack.indexOf(`</${tag}`, tagEnd);
        if (closeStart === -1) {
          index = source.length;
          continue;
        }
        const closeEnd = findTagEnd(source, closeStart);
        index = closeEnd === -1 ? source.length : closeEnd + 1;
        continue;
      }
      // Unknown/disallowed but harmless container: drop the tag, keep the inner content.
      index = tagEnd + 1;
      continue;
    }

    if (isClosing) {
      if (!voidTags.has(tag)) output += `</${tag}>`;
      index = tagEnd + 1;
      continue;
    }

    output += `<${tag}${renderAttributes(tag, attributesSource)}>`;
    index = tagEnd + 1;
  }

  return output.trim();
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
      // Extract allowed option values. Only an array is an option list — a bare string or a
      // relation target object carries no enum, so such a field stays unrestricted (as before).
      let allowedValues: string[] = [];
      if (Array.isArray(field.options)) {
        const list: Array<string | ContentFieldOption> = field.options;
        allowedValues = list
          .map((opt) => (typeof opt === "string" ? opt : opt.value))
          .filter((value) => value.length > 0);
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
  options: ContentFieldOptions;
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
