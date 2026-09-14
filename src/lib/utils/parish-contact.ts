// src/lib/utils/parish-contact.ts
// Contact-channel and schedule-period helpers shared across parish pages.
/** Egypt country code as used by wa.me links (no leading "+"). */
export const EGYPT_COUNTRY_CODE = "20";

/**
 * Builds a wa.me URL from a locally formatted Egyptian mobile number.
 * Strips separators and replaces the national trunk prefix "0" with "20"
 * so seed values such as "01220000004" resolve to "https://wa.me/201220000004".
 */
export function toWhatsAppUrl(phoneNumber: string): string {
  const digits = phoneNumber.replace(/[^0-9]/g, "");
  const international = digits.startsWith("0")
    ? `${EGYPT_COUNTRY_CODE}${digits.slice(1)}`
    : digits;
  return `https://wa.me/${international}`;
}

export type MassPeriod = "morning" | "evening";

/**
 * Derives the liturgical period from a "HH:MM:SS" time string.
 * Hours before 12:00 are morning (صباحي); 12:00 and later are evening (مسائي).
 */
export function getMassPeriodFromTime(time: string): MassPeriod {
  const hour = parseInt(time.slice(0, 2), 10);
  return hour < 12 ? "morning" : "evening";
}
