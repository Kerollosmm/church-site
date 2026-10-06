"use server";

import { headers } from "next/headers";
import { createAdminClient, hasSupabaseAdminEnv, MissingEnvVarError } from "@church-site/data-access";
import { ContactMessageSchema } from "@/lib/validations/church-schemas";
import { verifyTurnstile } from "@/lib/security/turnstile";
import {
  RATE_LIMIT_MESSAGE_AR,
  checkPublicWriteRateLimit,
  getClientIp,
} from "@/lib/security/rate-limit";

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
  const ip = getClientIp(headerList);

  if (!(await verifyTurnstile(result.data.turnstileToken, ip))) {
    return { success: false as const, message: "فشل التحقق من الأمان، يرجى إعادة المحاولة" };
  }

  // Best-effort per-instance rate limit with 15s burst protection — see src/lib/security/rate-limit.ts.
  if (!checkPublicWriteRateLimit("contact", ip).allowed) {
    return { success: false as const, message: RATE_LIMIT_MESSAGE_AR };
  }

  if (process.env.NODE_ENV === "production" && !hasSupabaseAdminEnv()) {
    return {
      success: false as const,
      message: "خدمة الرسائل الإلكترونية غير مفعّلة على هذا الموقع حالياً، يرجى الاتصال هاتفياً بسكرتارية الكنيسة",
    };
  }

  try {
    if (!hasSupabaseAdminEnv()) {
      return {
        success: false as const,
        message: "خدمة الرسائل الإلكترونية غير مفعّلة على هذا الموقع حالياً، يرجى الاتصال هاتفياً بسكرتارية الكنيسة",
      };
    }

    const admin = createAdminClient();

    const { data: rpcId, error: rpcError } = await admin.rpc("submit_contact_message_atomic", {
      p_sender_name: result.data.senderName,
      p_sender_phone: result.data.senderPhone,
      p_sender_email: result.data.senderEmail || null,
      p_urgency: result.data.urgency,
      p_assigned_priest_id: result.data.assignedPriestId || null,
      p_message_content: result.data.messageContent,
    });

    if (rpcError || !rpcId) {
      console.error("Atomic contact submission RPC failed:", rpcError);
      return {
        success: false as const,
        message: "تعذر إرسال الرسالة حالياً، يرجى المحاولة مرة أخرى أو الاتصال هاتفياً بسكرتارية الكنيسة",
      };
    }
  } catch (err) {
    console.error("Error sending contact message:", err);
    return {
      success: false as const,
      message:
        err instanceof MissingEnvVarError
          ? "خدمة الرسائل الإلكترونية غير مفعّلة على هذا الموقع حالياً، يرجى الاتصال هاتفياً بسكرتارية الكنيسة"
          : "تعذر إرسال الرسالة حالياً، يرجى المحاولة مرة أخرى أو الاتصال هاتفياً بسكرتارية الكنيسة",
    };
  }

  return {
    success: true as const,
    message: "تم إرسال رسالتك بنجاح وسيتواصل معك الأب الكاهن أو السكرتارية في أقرب وقت بمشيئة الرب",
  };
}
