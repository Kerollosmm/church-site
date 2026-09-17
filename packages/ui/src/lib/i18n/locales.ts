// packages/ui/src/lib/i18n/locales.ts
// The locale vocabulary — PURE, importable from the server and the browser.
//
// Arabic is the parish's language and therefore the DEFAULT: it is the locale a visitor gets with
// no cookie at all, and the locale every fallback resolves to (see `localized.ts`). English exists
// so the portal can serve the parish's non-Arabic-speaking visitors, not the other way round.

export const LOCALES = ["ar", "en"] as const;

export type Locale = (typeof LOCALES)[number];

/** The parish's locale: also the fallback for every missing translation. */
export const DEFAULT_LOCALE: Locale = "ar";

export type TextDirection = "rtl" | "ltr";

export const LOCALE_DIRECTION: Record<Locale, TextDirection> = {
  ar: "rtl",
  en: "ltr",
};

/** The locale's own name, shown in the switcher (never translated). */
export const LOCALE_NATIVE_LABEL: Record<Locale, string> = {
  ar: "العربية",
  en: "English",
};

/**
 * Flag metadata for the switcher UI.
 *
 * `svg` is intentionally null for every locale today: the repository ships no flag image assets and
 * the CSP allow-list has no external image host, so the emoji is what renders. A locale that later
 * needs a real flag file gets its path here — the switcher already reads this field.
 */
export interface Flag {
  /** Emoji flag, safe to render in any browser without an asset request. */
  emoji: string;
  /** Short label used for `title` / `aria-label` alongside the native name. */
  label: string;
  /** Path to an SVG flag asset, or null when the emoji is the only representation. */
  svg: string | null;
}

export const LOCALE_FLAGS: Record<Locale, Flag> = {
  ar: { emoji: "🇪🇬", label: "مصر", svg: null },
  en: { emoji: "🇬🇧", label: "United Kingdom", svg: null },
};

/** Cookie that persists the visitor's choice across reloads and server renders. */
export const LOCALE_COOKIE_NAME = "church_locale";

/** One year — the visitor's choice is not ephemeral. */
export const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Turns any cookie/header value into a locale, falling back to the default. */
export function resolveLocale(value: string | null | undefined): Locale {
  if (typeof value !== "string") return DEFAULT_LOCALE;
  const normalized = value.trim().toLowerCase().slice(0, 5);
  if (isLocale(normalized)) return normalized;
  // Regional variants ("en-GB", "ar-EG") resolve to their base language.
  const base = normalized.slice(0, 2);
  return isLocale(base) ? base : DEFAULT_LOCALE;
}

/**
 * A `document.cookie`-ready string for the chosen locale. Shared by the client switcher (and any
 * future server-side writer) so the name, path and lifetime can never diverge between writers.
 */
export function serializeLocaleCookie(
  locale: Locale,
  options: { path?: string; maxAgeSeconds?: number } = {}
): string {
  const path = options.path ?? "/";
  const maxAge = options.maxAgeSeconds ?? LOCALE_COOKIE_MAX_AGE_SECONDS;
  return `${LOCALE_COOKIE_NAME}=${locale}; Path=${path}; Max-Age=${maxAge}; SameSite=Lax`;
}
