// src/lib/constants.ts
// Fixed parish facts that are not part of the seeded database rows.

/** Nominal charitable consultation fee range, in Egyptian pounds. */
export const CLINIC_CONSULTATION_FEE_MIN_EGP = 30;
export const CLINIC_CONSULTATION_FEE_MAX_EGP = 35;

/** Compact label, e.g. "30 - 35 ج.م". */
export const CLINIC_CONSULTATION_FEE_LABEL = `${CLINIC_CONSULTATION_FEE_MIN_EGP} - ${CLINIC_CONSULTATION_FEE_MAX_EGP} ج.م`;

/** Compact label with the "رسم الكشف" prefix, e.g. "رسم الكشف: 30-35 ج.م". */
export const CLINIC_CONSULTATION_FEE_SHORT_LABEL = `رسم الكشف: ${CLINIC_CONSULTATION_FEE_MIN_EGP}-${CLINIC_CONSULTATION_FEE_MAX_EGP} ج.م`;
