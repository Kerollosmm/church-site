// src/lib/domain/booking-reference.ts
// Single source for the public condolence-hall booking reference (`COND-XXXXXX`).
//
// The reference is the only handle a parishioner has after submitting a booking, so its shape is
// defined exactly once here and reused by the generator, the tracking form and the admin screens.
//
// Note on the brand: the generated Supabase types describe `condolence_bookings
// .booking_reference_code` as a plain `string` (as generated types must), so the brand is applied
// at the *creation* and *input-normalisation* boundaries only — display and query sites keep
// accepting plain strings from the database.

declare const bookingReferenceBrand: unique symbol;

/** A booking reference that was produced (or normalised) by this module, e.g. `COND-AB12CD`. */
export type BookingReference = string & { readonly [bookingReferenceBrand]: true };

/** Human-facing prefix of every reference. Kept separate because the UI prints it on its own. */
export const BOOKING_REFERENCE_PREFIX = "COND";

/** Number of random characters after the prefix (`nanoid` body length). */
export const BOOKING_REFERENCE_BODY_LENGTH = 6;

/** Canonical example shown in the tracking input, derived so it can never drift from the shape. */
export const BOOKING_REFERENCE_PLACEHOLDER = `${BOOKING_REFERENCE_PREFIX}-${"X".repeat(
  BOOKING_REFERENCE_BODY_LENGTH
)}`;

/**
 * Builds a reference from a random body (the caller owns the randomness so this module stays
 * dependency-free and pure). The body is upper-cased: `nanoid`'s default alphabet includes
 * `_` and `-`, so the result is not strictly alphanumeric — do not tighten this without checking
 * the generator.
 */
export function makeBookingReference(shortId: string): BookingReference {
  return `${BOOKING_REFERENCE_PREFIX}-${shortId.toUpperCase()}` as BookingReference;
}

/**
 * Normalises a reference typed or pasted by a human (or read from a URL query string) to the
 * canonical upper-case form. It deliberately does NOT reject unknown shapes: an unrecognised code
 * is simply not found by the lookup, which produces the correct message anyway, whereas rejecting
 * here would also reject rows inserted by hand into the database.
 */
export function normalizeBookingReference(value: string): string {
  return value.trim().toUpperCase();
}
