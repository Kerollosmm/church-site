// apps/admin/src/actions/admin-mass-actions.shared.ts
// Shared schemas and types for mass actions without "use server" directive.

import { z } from "zod";

export const WeeklyMassInputSchema = z.object({
  day_of_week: z.enum([
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ]),
  altar_id: z.string().min(1, "يرجى اختيار المذبح"),
  title_ar: z
    .string()
    .trim()
    .min(3, "عنوان القداس يجب ألا يقل عن 3 أحرف")
    .max(150, "عنوان القداس لا يتجاوز 150 حرفاً"),
  start_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "توقيت البدء غير صالح (HH:mm)"),
  end_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "توقيت الانتهاء غير صالح (HH:mm)"),
  target_group_ar: z
    .string()
    .trim()
    .max(150, "الفئة المستهدفة لا تتجاوز 150 حرفاً")
    .optional()
    .nullable(),
  notes_ar: z
    .string()
    .trim()
    .max(500, "الملاحظات لا تتجاوز 500 حرف")
    .optional()
    .nullable(),
  is_active: z.boolean().default(true),
});

export type CreateMassInput = z.infer<typeof WeeklyMassInputSchema>;
export type UpdateMassInput = Partial<CreateMassInput>;

export type AdminMassActionResult =
  | { success: true; message: string; data?: unknown }
  | { success: false; message: string };
