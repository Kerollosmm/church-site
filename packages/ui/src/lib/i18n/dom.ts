"use client";

// packages/ui/src/lib/i18n/dom.ts
// The CLIENT half of the locale plumbing: reading the locale cookie out of `document.cookie` and
// stamping the resolved locale onto the document element.
//
// WHY IT EXISTS (the reason is an architectural invariant, not a preference): the parish portal is
// STATIC-FIRST, and the root layout must stay prerenderable — so it cannot call `cookies()` to learn
// the visitor's language. The language therefore arrives in two steps: the client resolves the cookie
// here and applies `lang`/`dir` to `<html>` immediately (the header mounts that), while the localized
// pages read the same cookie on the SERVER through `@/lib/i18n/server` and render their content in
// the matching locale. Both sides read one cookie name via `LOCALE_COOKIE_NAME`, so they cannot
// disagree.
//
// The parsing helper is deliberately PURE (it takes a raw cookie string) so it can be unit-tested and
// so a server caller could reuse the same decision without touching `document`.

import {
  DEFAULT_LOCALE,
  LOCALE_DIRECTION,
  LOCALE_COOKIE_NAME,
  isLocale,
  resolveLocale,
  type Locale,
} from "./locales";

/** `decodeURIComponent` throws on malformed input (`"%E0%A4%A"`); a cookie must never do that. */
function decodeCookieValue(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

/**
 * Parses a raw `document.cookie` string and returns the stored locale, or null when absent/invalid.
 *
 * PURE: no DOM access, so it is unit-testable and safe on the server. Handles the real-world shapes:
 *
 *   "church_locale=en; other=1"  → "en"
 *   "church_locale=ar"           → "ar"
 *   "church_locale"              → null   (a value-less segment is not a choice)
 *   "" / null / undefined        → null
 *   "church_locale=de"           → null   (an unknown value is "no choice", NOT the default)
 *
 * An unknown value resolves to null rather than to Arabic on purpose: the caller decides the
 * fallback, and `readLocaleCookie()` is the one place that applies the parish default.
 */
export function parseLocaleCookieValue(raw: string | null | undefined): Locale | null {
  if (typeof raw !== "string" || raw.length === 0) return null;

  for (const segment of raw.split(";")) {
    const separator = segment.indexOf("=");
    if (separator < 0) continue;
    if (segment.slice(0, separator).trim() !== LOCALE_COOKIE_NAME) continue;

    const decoded = decodeCookieValue(segment.slice(separator + 1).trim());
    if (decoded === null) return null;

    const normalized = decoded.trim().toLowerCase();
    // Regional variants ("en-GB", "ar-EG") are accepted exactly as the server accepts them, but a
    // value that names no known language stays "absent".
    const base = normalized.slice(0, 2);
    if (isLocale(normalized)) return normalized;
    if (isLocale(base)) return base;
    return null;
  }

  return null;
}

/**
 * The visitor's locale from the cookie, or the parish default.
 *
 * The fallback goes through `resolveLocale(null)` — the same function `getLocale()` uses on the
 * server — so "no cookie" and "unusable cookie" resolve identically on both sides of the render.
 */
export function readLocaleCookie(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  return parseLocaleCookieValue(document.cookie) ?? resolveLocale(null);
}

/**
 * Applies the locale to the document element: `lang`, `dir` and a `data-locale` attribute (the latter
 * is what a test or a stylesheet can key on). No-ops when there is no `document`, so importing this
 * module during a server render cannot throw.
 */
export function applyDocumentLocale(locale: Locale): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.lang = locale;
  root.dir = LOCALE_DIRECTION[locale];
  root.dataset.locale = locale;
}
