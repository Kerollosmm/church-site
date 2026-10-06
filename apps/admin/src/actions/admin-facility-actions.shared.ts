// apps/admin/src/actions/admin-facility-actions.shared.ts
// Shared schemas and types for parish facility actions without "use server" directive.

import { z } from "zod";

export const ParishFacilityInputSchema = z.object({
  id: z.string().optional(),
  name_ar: z
    .string()
    .trim()
    .min(3, "اسم الخدمة بالعربية يجب ألا يقل عن 3 أحرف")
    .max(200, "اسم الخدمة لا يتجاوز 200 حرف"),
  name_en: z
    .string()
    .trim()
    .max(200, "الاسم بالإنجليزية لا يتجاوز 200 حرف")
    .optional()
    .nullable(),
  slug: z
    .string()
    .trim()
    .min(2, "الرابط التعريفي يجب ألا يقل عن حرفين")
    .max(100, "الرابط التعريفي لا يتجاوز 100 حرف")
    .regex(/^[a-z0-9-]+$/, "الرابط التعريفي يقبل فقط الحروف الإنجليزية الصغيرة والأرقام والشرطة (-)"),
  service_type: z
    .string()
    .trim()
    .min(2, "نوع الخدمة مطلوب")
    .max(100, "نوع الخدمة لا يتجاوز 100 حرف"),
  description_ar: z
    .string()
    .trim()
    .min(10, "الوصف بالعربية يجب ألا يقل عن 10 أحرف")
    .max(2000, "الوصف بالعربية لا يتجاوز 2000 حرف"),
  description_en: z
    .string()
    .trim()
    .max(2000, "الوصف بالإنجليزية لا يتجاوز 2000 حرف")
    .optional()
    .nullable(),
  working_hours_ar: z
    .string()
    .trim()
    .min(3, "مواعيد وساعات العمل مطلوبة")
    .max(200, "مواعيد العمل لا تتجاوز 200 حرف"),
  location_ar: z
    .string()
    .trim()
    .min(3, "مكان المرفق مطلوب")
    .max(200, "مكان المرفق لا يتجاوز 200 حرف"),
  contact_phone: z
    .string()
    .trim()
    .max(50, "رقم الهاتف لا يتجاوز 50 حرفاً")
    .optional()
    .nullable(),
  contact_whatsapp: z
    .string()
    .trim()
    .max(50, "رقم الواتساب لا يتجاوز 50 حرفاً")
    .optional()
    .nullable(),
  guidelines_ar: z
    .string()
    .trim()
    .max(2000, "التعليمات لا تتجاوز 2000 حرف")
    .optional()
    .nullable(),
  display_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

export type ParishFacilityFormInput = z.input<typeof ParishFacilityInputSchema>;

export type AdminFacilityActionResult<T = unknown> =
  | { success: true; message: string; data?: T }
  | { success: false; message: string; errors?: Record<string, string[]> };
