"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { ContactMessageSchema } from "@/lib/validations/church-schemas";
import { verifyTurnstile } from "@/lib/security/turnstile";

export async function submitContactMessage(rawInput: unknown) {
  const result = ContactMessageSchema.safeParse(rawInput);
  if (!result.success) {
    return {
      success: false as const,
      errors: result.error.flatten().fieldErrors,
      message: "بيانات الرسالة غير مكتملة، يرجى ملء الحقول المطلوبة",
    };
  }

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") ?? undefined;
  if (!(await verifyTurnstile(result.data.turnstileToken, ip))) {
    return { success: false as const, message: "فشل التحقق من الأمان، يرجى إعادة المحاولة" };
  }

  try {
    const admin = createAdminClient();
    const { error } = await (admin.from("contact_messages") as any).insert({
      sender_name: result.data.senderName,
      sender_phone: result.data.senderPhone,
      sender_email: result.data.senderEmail || null,
      urgency: result.data.urgency,
      assigned_priest_id: result.data.assignedPriestId || null,
      message_content: result.data.messageContent,
    });

    if (error) {
      console.error("Supabase insert contact message error:", error);
    }
  } catch (err) {
    console.error("Error sending contact message:", err);
  }

  return {
    success: true as const,
    message: "تم إرسال رسالتك بنجاح وسيتواصل معك الأب الكاهن أو السكرتارية في أقرب وقت بمشيئة الرب",
  };
}
