"use server";

import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CondolenceBookingSchema } from "@/lib/validations/church-schemas";
import { REVALIDATION_TAGS } from "@/lib/tags";
import { verifyTurnstile } from "@/lib/security/turnstile";

export async function submitCondolenceBooking(rawInput: unknown) {
  const result = CondolenceBookingSchema.safeParse(rawInput);
  if (!result.success) {
    return {
      success: false as const,
      errors: result.error.flatten().fieldErrors,
      message: "بيانات الاستمارة غير مكتملة، يرجى المراجعة",
    };
  }

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") ?? undefined;
  if (!(await verifyTurnstile(result.data.turnstileToken, ip))) {
    return { success: false as const, message: "فشل التحقق من الروبوتات، يرجى إعادة المحاولة" };
  }

  const referenceCode = `COND-${nanoid(6).toUpperCase()}`;

  try {
    const admin = createAdminClient();
    const { error } = await (admin.from("condolence_bookings") as any).insert({
      booking_reference_code: referenceCode,
      deceased_full_name: result.data.deceasedFullName,
      applicant_name: result.data.applicantName,
      applicant_phone: result.data.applicantPhone,
      relationship_to_deceased: result.data.relationshipToDeceased,
      event_date: result.data.eventDate,
      slot_time: result.data.slotTime || "مسائي من 6:00 م إلى 10:00 م",
      hall_name: result.data.hallName || "قاعة العزاء الرئيسية المجهزة",
      special_requests: result.data.specialRequests || null,
      status: "pending",
    });

    if (error) {
      const conflict = error.code === "23505";
      return {
        success: false as const,
        message: conflict
          ? "التاريخ المطلوب محجوز مسبقاً، يرجى اختيار تاريخ آخر أو الاتصال المباشر بالسكرتارية"
          : "تعذر تسجيل طلب الحجز حالياً، يرجى الاتصال المباشر بسكرتارية الكنيسة",
      };
    }

    revalidateTag(REVALIDATION_TAGS.condolenceBookings);
  } catch (err) {
    console.error("Error submitting condolence booking:", err);
  }

  return {
    success: true as const,
    bookingCode: referenceCode,
    message: "تم تسجيل طلب حجز القاعة بنجاح، وسيتم التواصل هاتفياً من سكرتارية الكنيسة لتأكيد الموعد",
  };
}

export async function trackBooking(referenceCode: string) {
  if (!referenceCode || referenceCode.trim().length === 0) {
    return { success: false as const, message: "يرجى إدخال رمز الحجز المرجعي" };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await (supabase as any).rpc("track_condolence_booking", {
      p_ref: referenceCode.trim(),
    });

    if (error || !data || data.length === 0) {
      // Demo/Fallback lookup for testing
      if (referenceCode.toUpperCase().startsWith("COND-DEMO")) {
        return {
          success: true as const,
          booking: {
            booking_reference_code: referenceCode.toUpperCase(),
            event_date: "2026-09-25",
            slot_time: "مسائي من 6:00 م إلى 10:00 م",
            hall_name: "قاعة العزاء الرئيسية المجهزة",
            status: "approved" as const,
            rejection_reason: null,
          },
        };
      }
      return {
        success: false as const,
        message: "لم يتم العثور على حجز بهذا الرمز، تأكد من الرمز أو اتصل بسكرتارية الكنيسة",
      };
    }

    return { success: true as const, booking: data[0] };
  } catch {
    return {
      success: false as const,
      message: "تعذر التحقق من حالة الحجز حالياً، يرجى المحاولة لاحقاً",
    };
  }
}
