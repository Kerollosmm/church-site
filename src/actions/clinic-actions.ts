"use server";

import { headers } from "next/headers";
import { ClinicInquirySchema } from "@/lib/validations/church-schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import { MissingEnvVarError } from "@/lib/env";
import { verifyTurnstile } from "@/lib/security/turnstile";
import {
  PUBLIC_FORM_LIMIT,
  PUBLIC_FORM_WINDOW_MS,
  RATE_LIMIT_MESSAGE_AR,
  checkRateLimit,
  getClientIp,
} from "@/lib/security/rate-limit";

/**
 * Records a clinic consultation inquiry as a normal-urgency contact message.
 *
 * NOTE: no page or component currently calls this action — the clinics directory is a static
 * reference (specialties, rooms, fees) and mounts no form. It is kept on the same security
 * contract as the other public write actions (rate limit → schema → Turnstile → fail closed)
 * so it cannot become an unguarded write endpoint if a form is added later.
 */
export async function submitClinicInquiry(rawInput: unknown) {
  const headerList = await headers();
  const ip = getClientIp(headerList);

  // Best-effort per-instance rate limit — see src/lib/security/rate-limit.ts.
  if (!checkRateLimit(`clinic:${ip}`, { limit: PUBLIC_FORM_LIMIT, windowMs: PUBLIC_FORM_WINDOW_MS }).allowed) {
    return { success: false as const, message: RATE_LIMIT_MESSAGE_AR };
  }

  const result = ClinicInquirySchema.safeParse(rawInput);
  if (!result.success) {
    return {
      success: false as const,
      errors: result.error.flatten().fieldErrors,
      message: "بيانات الاستفسار غير مكتملة، يرجى التأكد من البيانات المطلوبة",
    };
  }

  if (!(await verifyTurnstile(result.data.turnstileToken, ip))) {
    return { success: false as const, message: "فشل التحقق من الروبوتات، يرجى إعادة المحاولة" };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("contact_messages").insert({
      sender_name: result.data.patientName,
      sender_phone: result.data.patientPhone,
      sender_email: null,
      urgency: "normal",
      message_content: `استفسار كشف عيادة: تخصص [${result.data.specialtySlug}]. ملاحظات: ${result.data.notes || "لا توجد"}`,
    });

    if (error) {
      console.error("Supabase insert clinic inquiry error:", error);
      // FAIL CLOSED: an inquiry that was not persisted must never be acknowledged as received.
      return {
        success: false as const,
        message:
          "تعذر إرسال الاستفسار حالياً، يرجى المحاولة مرة أخرى أو الاتصال هاتفياً بمكتب استقبال المستوصف",
      };
    }
  } catch (err) {
    console.error("Error submitting clinic inquiry:", err);
    return {
      success: false as const,
      message:
        err instanceof MissingEnvVarError
          ? "خدمة الاستفسار الطبي الإلكترونية غير مفعّلة على هذا الموقع حالياً، يرجى الاتصال هاتفياً بمكتب استقبال المستوصف"
          : "تعذر إرسال الاستفسار حالياً، يرجى المحاولة مرة أخرى أو الاتصال هاتفياً بمكتب استقبال المستوصف",
    };
  }

  return {
    success: true as const,
    message: "تم استلام استفسارك الطبي بنجاح، وستتواصل سكرتارية المستوصف معك هاتفياً أو عبر واتساب",
  };
}
