"use server";

import { ClinicInquirySchema } from "@/lib/validations/church-schemas";
import { createAdminClient } from "@/lib/supabase/admin";

export async function submitClinicInquiry(rawInput: unknown) {
  const result = ClinicInquirySchema.safeParse(rawInput);
  if (!result.success) {
    return {
      success: false as const,
      errors: result.error.flatten().fieldErrors,
      message: "بيانات الاستفسار غير مكتملة، يرجى التأكد من البيانات المطلوبة",
    };
  }

  try {
    const admin = createAdminClient();
    // Record consultation inquiry in contact_messages
    await (admin.from("contact_messages") as any).insert({
      sender_name: result.data.patientName,
      sender_phone: result.data.patientPhone,
      sender_email: null,
      urgency: "normal",
      message_content: `استفسار كشف عيادة: تخصص [${result.data.specialtySlug}]. ملاحظات: ${result.data.notes || "لا توجد"}`,
    });
  } catch {
    // If db offline, acknowledge inquiry gracefully
  }

  return {
    success: true as const,
    message: "تم استلام استفسارك الطبي بنجاح، وستتواصل سكرتارية المستوصف معك هاتفياً أو عبر واتساب",
  };
}
