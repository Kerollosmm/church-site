// packages/data-access/src/validations/__tests__/dynamic-validator.test.ts
// Unit tests for dynamic schema validator generator and HTML sanitizer.

import { describe, expect, it } from "vitest";
import {
  sanitizeHtml,
  buildFieldValidator,
  buildZodSchema,
} from "../dynamic-validator";
import type { ContentField } from "@church-site/domain";

describe("sanitizeHtml", () => {
  it("preserves safe formatting tags and attributes", () => {
    const input = `<p>مرحباً <strong>بالجميع</strong> في <a href="https://coptic.org">كنيسة القديسين</a></p>`;
    const output = sanitizeHtml(input);
    expect(output).toContain("<strong>بالجميع</strong>");
    expect(output).toContain(`<a href="https://coptic.org">`);
  });

  it("strips script tags and malicious attributes completely", () => {
    const malicious = `<p>نص عادي</p><script>alert('xss')</script><b onclick="alert(1)">نص عريض</b>`;
    const output = sanitizeHtml(malicious);
    expect(output).not.toContain("<script>");
    expect(output).not.toContain("onclick");
    expect(output).toContain("<p>نص عادي</p>");
    expect(output).toContain("<b>نص عريض</b>");
  });

  it("removes iframe and style tags", () => {
    const input = `<iframe src="https://evil.com"></iframe><style>body{color:red}</style><p>آمن</p>`;
    const output = sanitizeHtml(input);
    expect(output).not.toContain("<iframe");
    expect(output).not.toContain("<style");
    expect(output).toContain("<p>آمن</p>");
  });

  it("rejects javascript: URLs in links", () => {
    const input = `<a href="javascript:alert(1)">رابط خطير</a>`;
    const output = sanitizeHtml(input);
    expect(output).not.toContain("javascript:");
    expect(output).toContain("<a>رابط خطير</a>");
  });

  // --- Regression guard for the four confirmed bypasses of the previous regex sanitizer ---

  it("rejects a scheme hidden behind a character reference (bypass A)", () => {
    expect(sanitizeHtml(`<a href="&#106;avascript:alert(1)">x</a>`)).toBe("<a>x</a>");
    expect(sanitizeHtml(`<a href="&#106avascript:alert(1)">x</a>`)).toBe("<a>x</a>");
    expect(sanitizeHtml(`<a href="javascript&#58;alert(1)">x</a>`)).toBe("<a>x</a>");
    expect(sanitizeHtml(`<a href="&#x6a;avascript:alert(1)">x</a>`)).toBe("<a>x</a>");
  });

  it("rejects a scheme broken up by whitespace or control characters (bypass B)", () => {
    const hostile = [
      `<a href="java\tscript:alert(1)">x</a>`,
      `<a href="java\nscript:alert(1)">x</a>`,
      `<a href="java\rscript:alert(1)">x</a>`,
      `<a href=" javascript:alert(1)">x</a>`,
      `<a href="JaVaScRiPt:alert(1)">x</a>`,
    ];
    for (const input of hostile) {
      expect(sanitizeHtml(input)).toBe("<a>x</a>");
    }
  });

  it("adds rel=noopener noreferrer to every target=_blank link (bypass C)", () => {
    const output = sanitizeHtml(`<a href="https://evil.example" target="_blank">x</a>`);
    expect(output).toContain('rel="noopener noreferrer"');
    expect(output).toContain('target="_blank"');
  });

  it("overrides an author-supplied rel on a target=_blank link", () => {
    const output = sanitizeHtml('<a href="https://evil.example" target="_blank" rel="opener">x</a>');
    expect(output).toContain('rel="noopener noreferrer"');
    expect(output).not.toContain('rel="opener"');
  });

  it("rejects data: URLs and keeps only safe schemes (bypass D)", () => {
    expect(sanitizeHtml(`<a href="data:text/html,<b>x</b>">y</a>`)).toBe("<a>y</a>");
    expect(sanitizeHtml(`<a href="vbscript:msgbox(1)">y</a>`)).toBe("<a>y</a>");
    expect(sanitizeHtml(`<img src="javascript:alert(1)" alt="a">`)).toBe('<img alt="a">');
    expect(sanitizeHtml(`<img src="data:image/svg+xml,<svg/>" alt="a">`)).toBe('<img alt="a">');
  });

  it("keeps safe absolute, relative, mailto and tel links", () => {
    expect(sanitizeHtml('<a href="https://coptic.org">x</a>')).toBe('<a href="https://coptic.org">x</a>');
    expect(sanitizeHtml('<a href="/masses">x</a>')).toBe('<a href="/masses">x</a>');
    expect(sanitizeHtml('<a href="#top">x</a>')).toBe('<a href="#top">x</a>');
    expect(sanitizeHtml('<a href="mailto:info@coptic.org">x</a>')).toBe('<a href="mailto:info@coptic.org">x</a>');
    expect(sanitizeHtml('<a href="tel:+201234567">x</a>')).toBe('<a href="tel:+201234567">x</a>');
  });

  it("removes disallowed elements together with their content", () => {
    const output = sanitizeHtml('<p>قبل</p><script>alert(1)</script><style>p{}</style><p>بعد</p>');
    expect(output).toBe("<p>قبل</p><p>بعد</p>");
    expect(output).not.toContain("alert(1)");
  });

  it("drops event handlers, style and every attribute outside the allowlist", () => {
    const output = sanitizeHtml('<p class="prose" style="color:red" onclick="alert(1)" data-x="1">نص</p>');
    expect(output).toBe('<p class="prose">نص</p>');
  });

  it("drops an unterminated comment rather than exposing its body", () => {
    expect(sanitizeHtml("<p>أ</p><!-- <script>alert(1)</script> -->ب")).toBe("<p>أ</p>ب");
  });

  it("keeps a bare `<` in prose visible instead of mangling the text", () => {
    expect(sanitizeHtml("<p>5 < 6</p>")).toBe("<p>5 &lt; 6</p>");
  });
});

describe("buildFieldValidator", () => {
  it("builds a required text field validator", () => {
    const field: ContentField = {
      id: "f1",
      contentTypeId: "t1",
      slug: "title",
      labelAr: "عنوان المقال",
      labelEn: "Title",
      fieldType: "text",
      isRequired: true,
      isTranslatable: false,
      validationRules: { min: 3, max: 50 },
      options: null,
      sortOrder: 1,
    };

    const validator = buildFieldValidator(field);

    // Valid
    expect(validator.safeParse("مقال روحي جديد").success).toBe(true);

    // Too short
    const shortResult = validator.safeParse("أب");
    expect(shortResult.success).toBe(false);
    if (!shortResult.success) {
      expect(shortResult.error.issues[0].message).toContain("3 أحرف");
    }

    // Too long
    const longResult = validator.safeParse("أ".repeat(60));
    expect(longResult.success).toBe(false);

    // Empty / Missing
    expect(validator.safeParse("").success).toBe(false);
    expect(validator.safeParse(null).success).toBe(false);
  });

  it("builds an optional number field validator", () => {
    const field: ContentField = {
      id: "f2",
      contentTypeId: "t1",
      slug: "priority",
      labelAr: "الأولوية",
      labelEn: "Priority",
      fieldType: "number",
      isRequired: false,
      isTranslatable: false,
      validationRules: { min: 1, max: 10 },
      options: null,
      sortOrder: 2,
    };

    const validator = buildFieldValidator(field);

    // Valid number
    expect(validator.safeParse(5).success).toBe(true);

    // Null or undefined is accepted when optional
    expect(validator.safeParse(null).success).toBe(true);
    expect(validator.safeParse(undefined).success).toBe(true);

    // Number out of range
    const outOfRange = validator.safeParse(15);
    expect(outOfRange.success).toBe(false);
    if (!outOfRange.success) {
      expect(outOfRange.error.issues[0].message).toContain("10");
    }
  });

  it("builds a select field validator with restricted options", () => {
    const field: ContentField = {
      id: "f3",
      contentTypeId: "t1",
      slug: "category",
      labelAr: "التصنيف",
      labelEn: "Category",
      fieldType: "select",
      isRequired: true,
      isTranslatable: false,
      validationRules: null,
      options: ["spiritual", "liturgical", "social"],
      sortOrder: 3,
    };

    const validator = buildFieldValidator(field);

    expect(validator.safeParse("spiritual").success).toBe(true);
    expect(validator.safeParse("liturgical").success).toBe(true);

    const invalidOpt = validator.safeParse("unknown_option");
    expect(invalidOpt.success).toBe(false);
    if (!invalidOpt.success) {
      expect(invalidOpt.error.issues[0].message).toContain("خيارات «التصنيف»");
    }
  });

  it("builds a boolean field validator with default false", () => {
    const field: ContentField = {
      id: "f4",
      contentTypeId: "t1",
      slug: "is_featured",
      labelAr: "مميز",
      labelEn: "Featured",
      fieldType: "boolean",
      isRequired: false,
      isTranslatable: false,
      validationRules: null,
      options: null,
      sortOrder: 4,
    };

    const validator = buildFieldValidator(field);

    expect(validator.safeParse(true).data).toBe(true);
    expect(validator.safeParse(false).data).toBe(false);
    expect(validator.safeParse(null).data).toBe(false);
    expect(validator.safeParse(undefined).data).toBe(false);
  });

  it("builds a media field validator checking file payload or URL", () => {
    const field: ContentField = {
      id: "f5",
      contentTypeId: "t1",
      slug: "cover_url",
      labelAr: "صورة الغلاف",
      labelEn: "Cover",
      fieldType: "media",
      isRequired: true,
      isTranslatable: false,
      validationRules: null,
      options: null,
      sortOrder: 5,
    };

    const validator = buildFieldValidator(field);

    expect(validator.safeParse("https://storage.coptic.org/uploads/cover.jpg").success).toBe(true);
    expect(validator.safeParse("/uploads/cover.jpg").success).toBe(true);

    // Empty string rejected when required
    expect(validator.safeParse("").success).toBe(false);
    expect(validator.safeParse(null).success).toBe(false);
  });
});

describe("buildZodSchema", () => {
  it("assembles a full dynamic record schema and validates payload", () => {
    const fields: ContentField[] = [
      {
        id: "f1",
        contentTypeId: "t1",
        slug: "title",
        labelAr: "العنوان",
        labelEn: "Title",
        fieldType: "text",
        isRequired: true,
        isTranslatable: false,
        validationRules: { min: 2 },
        options: null,
        sortOrder: 1,
      },
      {
        id: "f2",
        contentTypeId: "t1",
        slug: "content",
        labelAr: "المحتوى",
        labelEn: "Content",
        fieldType: "richtext",
        isRequired: true,
        isTranslatable: false,
        validationRules: null,
        options: null,
        sortOrder: 2,
      },
      {
        id: "f3",
        contentTypeId: "t1",
        slug: "reads_count",
        labelAr: "عدد القراءات",
        labelEn: null,
        fieldType: "number",
        isRequired: false,
        isTranslatable: false,
        validationRules: { min: 0 },
        options: null,
        sortOrder: 3,
      },
    ];

    const schema = buildZodSchema(fields);

    const validPayload = {
      title: "عظة الأحد",
      content: "<p>محتوى روحي عميق</p>",
      reads_count: 42,
    };

    const parseResult = schema.safeParse(validPayload);
    expect(parseResult.success).toBe(true);

    // Invalid payload missing required title and invalid reads_count
    const invalidPayload = {
      title: "",
      content: "",
      reads_count: -5,
    };

    const invalidResult = schema.safeParse(invalidPayload);
    expect(invalidResult.success).toBe(false);
    if (!invalidResult.success) {
      const flattened = invalidResult.error.flatten().fieldErrors;
      expect(flattened.title).toBeDefined();
      expect(flattened.reads_count).toBeDefined();
    }
  });
});
