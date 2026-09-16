"use server";

// src/actions/admin-booking-actions.ts
// Authenticated mutations for the condolence-hall bookings inbox.
//
// These actions are called from the client component of `/admin/bookings`, but THEY fetch nothing
// on trust: every one of them re-runs `requireStaff()` (redirecting to the sign-in page when the
// session is missing or not an allowed role) and then writes through the SESSION client, so the
// `is_staff()` RLS policy is the second, database-enforced gate. The `/admin` middleware is never
// the only check.
//
// Writes FAIL CLOSED: a success result is only returned when PostgREST confirms the row it
// updated (`.select()` + `maybeSingle()`), so the UI can never report a decision that was not
// persisted.

import { revalidateTag } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/require-staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { REVALIDATION_TAGS } from "@/lib/tags";

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
 * Applies a status decision to a PENDING booking and confirms it was persisted.
 * The `.eq("status", "pending")` guard makes the update idempotent: two secretaries acting on the
 * same request cannot overwrite each other's decision, and a stale screen gets a clear message
 * instead of a false success.
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

/** Approves a pending condolence-hall booking. Staff-only. */
export async function approveCondolenceBooking(bookingId: string): Promise<AdminBookingActionResult> {
  await requireStaff();

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

/** Rejects a pending condolence-hall booking WITH a reason. Staff-only. */
export async function rejectCondolenceBooking(
  bookingId: string,
  reason: string
): Promise<AdminBookingActionResult> {
  await requireStaff();

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
