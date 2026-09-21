// apps/admin/src/actions/admin-video-actions.shared.ts
// Shared schemas and types for parish video actions without "use server" directive.

import { z } from "zod";

export const ParishVideoInputSchema = z.object({
  id: z.string().optional(),
  title_ar: z
    .string()
    .trim()
    .min(3, "عنوان الفيديو بالعربية يجب ألا يقل عن 3 أحرف")
    .max(200, "عنوان الفيديو لا يتجاوز 200 حرف"),
  title_en: z
    .string()
    .trim()
    .max(200, "العنوان بالإنجليزية لا يتجاوز 200 حرف")
    .optional()
    .nullable(),
  description_ar: z
    .string()
    .trim()
    .max(1000, "الوصف بالعربية لا يتجاوز 1000 حرف")
    .optional()
    .nullable(),
  description_en: z
    .string()
    .trim()
    .max(1000, "الوصف بالإنجليزية لا يتجاوز 1000 حرف")
    .optional()
    .nullable(),
  source_url: z
    .string()
    .trim()
    .url("رابط الفيديو يجب أن يكون رابطاً صالحاً (https://...)"),
  sort_order: z.coerce.number().int().default(0),
  is_public: z.boolean().default(true),
  is_active: z.boolean().default(true),
});

export type ParishVideoFormInput = z.infer<typeof ParishVideoInputSchema>;

export type AdminVideoActionResult<T = unknown> =
  | { success: true; message: string; data?: T }
  | { success: false; message: string; errors?: Record<string, string[]> };
