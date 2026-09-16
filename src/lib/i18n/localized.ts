// src/lib/i18n/localized.ts
// Picking a localized field with a VISIBLE fallback — PURE, no framework imports.
//
// The parish authors in Arabic; English is secondary and will be incomplete for a long time. Two
// failure modes are unacceptable: showing an empty gap where text should be, and quietly showing
// Arabic as if it were English. So a missing translation returns the Arabic text FOLLOWED BY a
// visible marker, and `isTranslationMissing()` lets any caller render its own treatment (a badge, a
// tooltip) on top of the same decision.

import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";

/** A content field in its two languages. `ar` is the source of truth and is never null. */
export interface LocalizedText {
  ar: string;
  en: string | null;
}

/** Marker appended to a fallback value. Deliberately visible, deliberately not Arabic-only. */
export const TRANSLATION_MISSING_MARKER = "⟦ترجمة مفقودة⟧";

export interface LocalizeOptions {
  /**
   * Append `TRANSLATION_MISSING_MARKER` when the requested language is unavailable.
   * Default `true` — pass `false` only for a surface that conveys the gap some other way
   * (the marker would otherwise be read aloud by a screen reader on every field).
   */
  markMissing?: boolean;
  /** Text used when even the Arabic source is empty. Default: the marker itself. */
  emptyFallback?: string;
}

function isBlank(value: string | null | undefined): boolean {
  return typeof value !== "string" || value.trim().length === 0;
}

/**
 * Returns the field in `locale`, falling back to Arabic when the translation is missing.
 *
 *   localized({ ar: "قداس الأحد", en: null }, "en")        → "قداس الأحد ⟦ترجمة مفقودة⟧"
 *   localized({ ar: "قداس الأحد", en: "Sunday mass" }, "en") → "Sunday mass"
 */
export function localized(
  value: LocalizedText | null | undefined,
  locale: Locale,
  options: LocalizeOptions = {}
): string {
  const { markMissing = true, emptyFallback } = options;
  const marker = markMissing ? TRANSLATION_MISSING_MARKER : "";
  const isEmpty = (text: string | null | undefined) => typeof text !== "string" || text.trim().length === 0;

  const requested = locale === DEFAULT_LOCALE ? value?.ar : value?.en;
  if (!isEmpty(requested)) return (requested as string).trim();

  const source = value?.ar;
  if (!isEmpty(source)) {
    const trimmed = (source as string).trim();
    return marker ? `${trimmed} ${marker}` : trimmed;
  }

  return emptyFallback ?? (marker || "");
}

/**
 * The same decision for rows shaped like the database (`title_ar` / `title_en` columns), so a
 * caller never has to build the `LocalizedText` object by hand.
 */
