// apps/admin/src/actions/admin-navigation-actions.shared.ts
// Shared schemas and types for navigation actions without "use server" directive.

import { z } from "zod";

export const NavigationItemInputSchema = z.object({
  id: z.string().optional(),
  key: z
    .string()
    .trim()
    .min(2, "المفتاح التعريفي يجب ألا يقل عن حرفين")
    .max(100, "المفتاح التعريفي لا يتجاوز 100 حرف")
    .regex(/^[a-z0-9-]+$/, "المفتاح التعريفي يقبل فقط الحروف الإنجليزية الصغيرة والأرقام والشرطة (-)"),
  label_ar: z
    .string()
    .trim()
    .min(2, "عنوان الرابط بالعربية يجب ألا يقل عن حرفين")
    .max(100, "عنوان الرابط لا يتجاوز 100 حرف"),
  label_en: z
    .string()
    .trim()
    .max(100, "العنوان بالإنجليزية لا يتجاوز 100 حرف")
    .optional()
    .nullable(),
  href: z
    .string()
    .trim()
    .min(1, "مسار الرابط مطلوب")
    .max(255, "مسار الرابط لا يتجاوز 255 حرفاً"),
  section: z.enum(["main", "secondary"] as const).default("main"),
  parent_id: z.string().optional().nullable(),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
  is_public: z.boolean().default(true),
});

export type NavigationItemFormInput = z.input<typeof NavigationItemInputSchema>;

export const ReorderNavItemsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      sort_order: z.coerce.number().int(),
    })
  ),
});

export type AdminNavActionResult<T = unknown> =
  | { success: true; message: string; data?: T }
  | { success: false; message: string; errors?: Record<string, string[]> };
