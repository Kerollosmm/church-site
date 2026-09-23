"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { MissingEnvVarError } from "@/lib/env";
import { ContactMessageSchema } from "@/lib/validations/church-schemas";
import { verifyTurnstile } from "@/lib/security/turnstile";
import {
  RATE_LIMIT_MESSAGE_AR,
  checkPublicWriteRateLimit,
  getClientIp,
} from "@/lib/security/rate-limit";
import { recordAuditLog, snapshot } from "@church-site/data-access";

export async function submitContactMessage(rawInput: unknown) {
  const headerList = await headers();
  const ip = getClientIp(headerList);

  // Best-effort per-instance rate limit with 15s burst protection — see src/lib/security/rate-limit.ts.
  if (!checkPublicWriteRateLimit("contact", ip).allowed) {
    return { success: false as const, message: RATE_LIMIT_MESSAGE_AR };
  }

  const result = ContactMessageSchema.safeParse(rawInput);
  if (!result.success) {
    return {
      success: false as const,
      errors: result.error.flatten().fieldErrors,
      message: "بيانات الرسالة غير مكتملة، يرجى ملء الحقول المطلوبة",
    };
  }

  if (!(await verifyTurnstile(result.data.turnstileToken, ip))) {
    return { success: false as const, message: "فشل التحقق من الأمان، يرجى إعادة المحاولة" };
  }

  try {
    const admin = createAdminClient();

    let messageId: string | null = null;
    const { data: rpcId, error: rpcError } = await admin.rpc("submit_contact_message_atomic", {
      p_sender_name: result.data.senderName,
      p_sender_phone: result.data.senderPhone,
      p_sender_email: result.data.senderEmail || null,
      p_urgency: result.data.urgency,
      p_assigned_priest_id: result.data.assignedPriestId || null,
      p_message_content: result.data.messageContent,
    });

    if (!rpcError && rpcId) {
      messageId = rpcId as string;
    } else {
      if (rpcError) {
        console.warn("Atomic contact submission RPC failed/unavailable, falling back to direct insert:", rpcError);
      }
      const { data: inserted, error: insertError } = await admin
        .from("contact_messages")
        .insert({
          sender_name: result.data.senderName,
          sender_phone: result.data.senderPhone,
          sender_email: result.data.senderEmail || null,
          urgency: result.data.urgency,
          assigned_priest_id: result.data.assignedPriestId || null,
          message_content: result.data.messageContent,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Supabase insert contact message error:", insertError);
        // FAIL CLOSED: a message that was not persisted must never be acknowledged as sent.
        return {
          success: false as const,
          message: "تعذر إرسال الرسالة حالياً، يرجى المحاولة مرة أخرى أو الاتصال هاتفياً بسكرتارية الكنيسة",
        };
      }

      messageId = (inserted as { id: string } | null)?.id ?? `msg-${Date.now()}`;

      // Wrap recordAuditLog in a separate try/catch block so audit failure does not fail the user response
      try {
        await recordAuditLog({
          actor: { id: null, name: `زائر الموقع (نموذج التواصل) — ${result.data.senderName}` },
          action: "create",
          entityType: "contact_message",
          entityId: messageId,
          before: null,
          summary: `رسالة تواصل جديدة من «${result.data.senderName}» (الأهمية: ${result.data.urgency})`,
          after: snapshot({
            senderName: result.data.senderName,
            senderPhone: result.data.senderPhone,
            senderEmail: result.data.senderEmail || null,
            urgency: result.data.urgency,
          }),
        });
      } catch (auditErr) {
        console.error("Audit log recording failed for contact message:", auditErr);
      }
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
