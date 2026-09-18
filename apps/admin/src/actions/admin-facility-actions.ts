"use server";

// apps/admin/src/actions/admin-facility-actions.ts
// Staff-authenticated server actions for Parish Facilities (Public Services) CMS.
// Enforces granular capabilities: services:write, services:delete (owner-only).

declare const window: unknown;
if (typeof window !== "undefined") {
  throw new Error("This module can only be executed on the server.");
}

import { requireStaff } from "../lib/auth/require-staff";
import {
  CAPABILITY_DENIED_MESSAGE_AR,
  adminRoleFromStaffRole,
  can,
  type Actor,
  type ParishFacility,
} from "@church-site/domain";
import {
  getParishFacilityRepository,
  revalidateServiceSurfaces,
} from "@church-site/data-access";
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

export async function upsertServiceAction(
  input: ParishFacilityFormInput
): Promise<AdminFacilityActionResult<ParishFacility>> {
  const staff = await requireStaff();
  const role = adminRoleFromStaffRole(staff.role);

  if (!role || !can(role, "services:write")) {
    return { success: false, message: CAPABILITY_DENIED_MESSAGE_AR };
  }

  const parsed = ParishFacilityInputSchema.safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return { success: false, message: "بيانات الإدخال غير صالحة.", errors };
  }

  const data = parsed.data;
  const actor: Actor = {
    id: staff.userId,
    name: staff.fullNameAr,
  };

  const repository = getParishFacilityRepository();

  try {
    let facility: ParishFacility;
    let message: string;

    if (data.id) {
      facility = await repository.updateFacility(
        data.id,
        {
          nameAr: data.name_ar,
          nameEn: data.name_en,
          slug: data.slug,
          serviceType: data.service_type,
          descriptionAr: data.description_ar,
          descriptionEn: data.description_en,
          workingHoursAr: data.working_hours_ar,
          locationAr: data.location_ar,
          contactPhone: data.contact_phone,
          contactWhatsapp: data.contact_whatsapp,
          guidelinesAr: data.guidelines_ar,
          displayOrder: data.display_order,
          isActive: data.is_active,
        },
        actor
      );
      message = "تم تعديل بيانات الخدمة بنجاح.";
    } else {
      facility = await repository.createFacility(
        {
          nameAr: data.name_ar,
          nameEn: data.name_en,
          slug: data.slug,
          serviceType: data.service_type,
          descriptionAr: data.description_ar,
          descriptionEn: data.description_en,
          workingHoursAr: data.working_hours_ar,
          locationAr: data.location_ar,
          contactPhone: data.contact_phone,
          contactWhatsapp: data.contact_whatsapp,
          guidelinesAr: data.guidelines_ar,
          displayOrder: data.display_order,
          isActive: data.is_active,
        },
        actor
      );
      message = "تمت إضافة الخدمة الجديدة بنجاح.";
    }

    revalidateServiceSurfaces();
    return { success: true, message, data: facility };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء حفظ الخدمة.",
    };
  }
}

export async function deleteServiceAction(id: string): Promise<AdminFacilityActionResult> {
  const staff = await requireStaff();
  const role = adminRoleFromStaffRole(staff.role);

  // Destructive delete is restricted to owner only
  if (!role || !can(role, "services:delete")) {
    return { success: false, message: CAPABILITY_DENIED_MESSAGE_AR };
  }

  const actor: Actor = {
    id: staff.userId,
    name: staff.fullNameAr,
  };

  const repository = getParishFacilityRepository();

  try {
    await repository.deleteFacility(id, actor);
    revalidateServiceSurfaces();
    return { success: true, message: "تم حذف الخدمة بنجاح." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "فشل حذف الخدمة.",
    };
  }
}

export async function toggleServiceActiveAction(
  id: string,
  isActive: boolean
): Promise<AdminFacilityActionResult<ParishFacility>> {
  const staff = await requireStaff();
  const role = adminRoleFromStaffRole(staff.role);

  if (!role || !can(role, "services:write")) {
    return { success: false, message: CAPABILITY_DENIED_MESSAGE_AR };
  }

  const actor: Actor = {
    id: staff.userId,
    name: staff.fullNameAr,
  };

  const repository = getParishFacilityRepository();

  try {
    const facility = await repository.toggleActive(id, isActive, actor);
    revalidateServiceSurfaces();
    return {
      success: true,
      message: isActive ? "تم تفعيل الخدمة بنجاح." : "تم تعطيل الخدمة وإخفاؤها عن الموقع.",
      data: facility,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "فشل تغيير حالة الخدمة.",
    };
  }
}
