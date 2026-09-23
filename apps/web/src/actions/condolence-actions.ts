"use server";

import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MissingEnvVarError } from "@/lib/env";
import { CondolenceBookingSchema } from "@/lib/validations/church-schemas";
import {
  BOOKING_REFERENCE_BODY_LENGTH,
  makeBookingReference,
  normalizeBookingReference,
} from "@/lib/domain/booking-reference";
import { REVALIDATION_TAGS } from "@/lib/tags";
import { recordAuditLog, snapshot } from "@church-site/data-access";
import { verifyTurnstile } from "@/lib/security/turnstile";
import {
  PUBLIC_FORM_LIMIT,
  PUBLIC_FORM_WINDOW_MS,
  RATE_LIMIT_MESSAGE_AR,
  TRACKING_LIMIT,
  checkRateLimit,
  checkPublicWriteRateLimit,
  getClientIp,
} from "@/lib/security/rate-limit";

/** Active-booking uniqueness index (BACKEND §4): one live booking per calendar day. */
const DATE_UNIQUENESS_CONSTRAINT = "uq_condolence_active_date";
/** Inline UNIQUE on condolence_bookings.booking_reference_code (BACKEND §3, table 12). */
const REFERENCE_UNIQUENESS_CONSTRAINT = "condolence_bookings_booking_reference_code_key";

interface PostgresErrorLike {
  code?: string | null;
  message?: string | null;
  details?: string | null;
}

/**
 * Detects a UNIQUE violation (SQLSTATE 23505) targeting a specific constraint.
 * The constraint name is carried in `message` (and echoed in `details`), so a booking-code
 * collision is never mistaken for a date clash.
 */
function isUniqueViolation(error: PostgresErrorLike, constraintName: string): boolean {
  if (error.code !== "23505") return false;
  const haystack = `${error.message ?? ""} ${error.details ?? ""}`;
  return haystack.includes(constraintName);
}

export async function submitCondolenceBooking(rawInput: unknown) {
  const headerList = await headers();
  const ip = getClientIp(headerList);

  // Best-effort per-instance rate limit with 15s burst protection — see src/lib/security/rate-limit.ts.
  if (!checkPublicWriteRateLimit("condolence", ip).allowed) {
    return { success: false as const, message: RATE_LIMIT_MESSAGE_AR };
  }

  const result = CondolenceBookingSchema.safeParse(rawInput);
  if (!result.success) {
    return {
      success: false as const,
      errors: result.error.flatten().fieldErrors,
      message: "بيانات الاستمارة غير مكتملة، يرجى المراجعة",
    };
  }

  if (!(await verifyTurnstile(result.data.turnstileToken, ip))) {
    return { success: false as const, message: "فشل التحقق من الروبوتات، يرجى إعادة المحاولة" };
  }

  const referenceCode = makeBookingReference(nanoid(BOOKING_REFERENCE_BODY_LENGTH));

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("condolence_bookings").insert({
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
      console.error("Error inserting condolence booking:", error);

      if (isUniqueViolation(error, DATE_UNIQUENESS_CONSTRAINT)) {
        return {
          success: false as const,
          message: "هذا الموعد محجوز مسبقاً، يرجى اختيار موعد آخر أو التواصل هاتفياً",
        };
      }

      if (isUniqueViolation(error, REFERENCE_UNIQUENESS_CONSTRAINT)) {
        // The generated reference code collided with an existing row: retrying issues a new code.
        return {
          success: false as const,
          message: "تعذر تسجيل طلب الحجز لخلل مؤقت في توليد الرمز المرجعي، يرجى إعادة المحاولة",
        };
      }

      // FAIL CLOSED: no booking reference is ever shown for a row that was not persisted.
      return {
        success: false as const,
        message: "تعذر تسجيل طلب الحجز حالياً، يرجى المحاولة مرة أخرى أو الاتصال المباشر بسكرتارية الكنيسة",
      };
    }

    revalidateTag(REVALIDATION_TAGS.condolenceBookings);

    await recordAuditLog({
      actor: { id: null, name: `زائر الموقع (نموذج حجز قاعة العزاء) — ${result.data.applicantName}` },
      action: "create",
      entityType: "booking",
      entityId: referenceCode,
      before: null,
      summary: `حجز قاعة العزاء للمتنيح «${result.data.deceasedFullName}» في تاريخ ${result.data.eventDate}`,
      after: snapshot({
        bookingReferenceCode: referenceCode,
        deceasedFullName: result.data.deceasedFullName,
        eventDate: result.data.eventDate,
        applicantName: result.data.applicantName,
      }),
    });
  } catch (err) {
    console.error("Error submitting condolence booking:", err);
    return {
      success: false as const,
      message:
        err instanceof MissingEnvVarError
          ? "خدمة حجز القاعة الإلكترونية غير مفعّلة على هذا الموقع حالياً، يرجى الاتصال المباشر بسكرتارية الكنيسة"
          : "تعذر تسجيل طلب الحجز حالياً، يرجى المحاولة مرة أخرى أو الاتصال المباشر بسكرتارية الكنيسة",
    };
  }

  return {
    success: true as const,
    bookingCode: referenceCode,
    message: "تم تسجيل طلب حجز القاعة بنجاح، وسيتم التواصل هاتفياً من سكرتارية الكنيسة لتأكيد الموعد",
  };
}

export async function trackBooking(referenceCode: string) {
  const normalizedCode = normalizeBookingReference(referenceCode);

  if (normalizedCode.length === 0) {
    return { success: false as const, message: "يرجى إدخال رمز الحجز المرجعي" };
  }

  // Bounds and format validation: max 20 chars, alphanumeric with underscore and hyphen
  if (normalizedCode.length > 20 || !/^[A-Za-z0-9_-]+$/.test(normalizedCode)) {
    return {
      success: false as const,
      message: "لم يتم العثور على حجز بهذا الرمز، تأكد من الرمز أو اتصل بسكرتارية الكنيسة",
    };
  }

  const headerList = await headers();
  const ip = getClientIp(headerList);

  // Best-effort per-instance rate limit (anti-enumeration) — see src/lib/security/rate-limit.ts.
  if (!checkRateLimit(`track-booking:${ip}`, { limit: TRACKING_LIMIT, windowMs: PUBLIC_FORM_WINDOW_MS }).allowed) {
    return { success: false as const, message: RATE_LIMIT_MESSAGE_AR };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("track_condolence_booking", {
      p_ref: normalizedCode,
    });

    if (error || !data || data.length === 0) {
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
