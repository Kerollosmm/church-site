"use server";

// apps/admin/src/actions/admin-booking-actions.ts
// Authenticated mutations for the condolence-hall bookings inbox.
//
// These obey the same single contract as every other admin action module:
//   requireStaff() → can(role, "bookings:write") → zod → repository.

import { revalidateTag } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/require-staff";
import { createSupabaseServerClient, REVALIDATION_TAGS } from "@church-site/data-access";
import { CAPABILITY_DENIED_MESSAGE_AR, adminRoleFromStaffRole, can } from "@church-site/domain";

/** Partial unique index from BACKEND_AND_DATA_SPEC.md §4: one live booking per calendar day. */
const ACTIVE_DATE_CONSTRAINT = "uq_condolence_active_date";

const BookingIdSchema = z.string().uuid("معرّف الحجز غير صالح");

/** A rejection is only meaningful with a reason — it is what the family is told. */
const RejectionReasonSchema = z
  .string()
  .trim()
  .min(5, "يرجى كتابة سبب الاعتذار (5 أحرف على الأقل)")
  .max(500, "سبب الاعتذار أطول من الحد المسموح");

export interface AdminBookingActionResult {
  success: boolean;
  message: string;
}

interface PostgresErrorLike {
  code?: string | null;
  message?: string | null;
  details?: string | null;
}

/** Detects a UNIQUE violation (SQLSTATE 23505) raised by a specific constraint. */
function isUniqueViolation(error: PostgresErrorLike, constraintName: string): boolean {
  if (error.code !== "23505") return false;
  return `${error.message ?? ""} ${error.details ?? ""}`.includes(constraintName);
}

/**
 * The identity + capability gate. Returns a refusal message when the signed-in staff member may not
 * decide bookings, or null when they may. `requireStaff()` fails closed to /login; `can()` narrows
 * further, so a future role change cannot silently keep booking decisions open.
 */
async function bookingWriteRefusal(): Promise<string | null> {
  const staff = await requireStaff();
  const role = adminRoleFromStaffRole(staff.role);
  return role && can(role, "bookings:write") ? null : CAPABILITY_DENIED_MESSAGE_AR;
}

/**
 * Applies a status decision to a PENDING booking and confirms it was persisted.
 */
async function decideBooking(
  bookingId: string,
  decision: "approved" | "rejected",
  rejectionReason: string | null,
  failureMessageAr: string
): Promise<AdminBookingActionResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("condolence_bookings")
      .update({
        status: decision,
        rejection_reason: rejectionReason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId)
      .eq("status", "pending")
      .select("id, status")
      .maybeSingle();

    if (error) {
      console.error("[admin-bookings] booking decision failed", {
        bookingId,
        decision,
        code: error.code ?? null,
        message: error.message,
      });

      if (isUniqueViolation(error, ACTIVE_DATE_CONSTRAINT)) {
        return {
          success: false,
          message: "يوجد حجز آخر قيد المراجعة أو معتمد في نفس التاريخ، يرجى البتّ فيه أولاً.",
        };
      }

      return { success: false, message: failureMessageAr };
    }

    if (!data) {
      return {
        success: false,
        message: "لم يُعثر على حجز قيد المراجعة بهذا المعرّف، قد تكون حالته تغيّرت من جهاز آخر.",
      };
    }

    revalidateTag(REVALIDATION_TAGS.condolenceBookings);

    return {
      success: true,
      message:
        decision === "approved"
          ? "تم اعتماد الحجز، ويمكن إخطار الأسرة هاتفياً."
          : "تم تسجيل الاعتذار عن الحجز مع بيان السبب.",
    };
  } catch (err) {
    console.error("[admin-bookings] booking decision threw", {
      bookingId,
      decision,
      message: err instanceof Error ? err.message : String(err),
    });
    return { success: false, message: failureMessageAr };
  }
}

/** Approves a pending condolence-hall booking. Staff-only, needs `bookings:write`. */
export async function approveCondolenceBooking(bookingId: string): Promise<AdminBookingActionResult> {
  const refusal = await bookingWriteRefusal();
  if (refusal) return { success: false, message: refusal };

  const parsed = BookingIdSchema.safeParse(bookingId);
  if (!parsed.success) {
    return { success: false, message: "معرّف الحجز غير صالح" };
  }

  return decideBooking(
    parsed.data,
    "approved",
    null,
    "تعذّر اعتماد الحجز حالياً، يرجى إعادة المحاولة أو مراجعة الاتصال بقاعدة البيانات."
  );
}

/** Rejects a pending condolence-hall booking WITH a reason. Staff-only, needs `bookings:write`. */
export async function rejectCondolenceBooking(
  bookingId: string,
  reason: string
): Promise<AdminBookingActionResult> {
  const refusal = await bookingWriteRefusal();
  if (refusal) return { success: false, message: refusal };

  const parsedId = BookingIdSchema.safeParse(bookingId);
  if (!parsedId.success) {
    return { success: false, message: "معرّف الحجز غير صالح" };
  }

  const parsedReason = RejectionReasonSchema.safeParse(reason);
  if (!parsedReason.success) {
    return {
      success: false,
      message: parsedReason.error.issues[0]?.message ?? "يرجى كتابة سبب الاعتذار",
    };
  }

  return decideBooking(
    parsedId.data,
    "rejected",
    parsedReason.data,
    "تعذّر تسجيل الاعتذار عن الحجز حالياً، يرجى إعادة المحاولة."
  );
}
