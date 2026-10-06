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
import {
  ParishFacilityInputSchema,
  type ParishFacilityFormInput,
  type AdminFacilityActionResult,
} from "./admin-facility-actions.shared";

export type { ParishFacilityFormInput, AdminFacilityActionResult };

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
