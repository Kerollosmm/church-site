// packages/ui/src/lib/i18n/server.ts
// Server-side locale resolution from the cookie — the only module in `src/lib/i18n` that touches a
// dynamic API.
//
// RENDERING CONSEQUENCE, STATED PLAINLY: `cookies()` opts the route that calls it into DYNAMIC
// rendering. The portal is static-first, so reading the locale must be a deliberate choice per
// route — a page that only needs the parish default keeps using `DEFAULT_LOCALE` and stays static,
// while a page that is genuinely localized calls `getLocale()` and becomes dynamic (or passes the
// value down from a dynamic boundary). Nothing here is called at import time.

import { cookies } from "next/headers";
import {
  LOCALE_DIRECTION,
  LOCALE_COOKIE_NAME,
  resolveLocale,
  type Locale,
  type TextDirection,
} from "./locales";

/** The visitor's chosen locale, or Arabic when no (valid) cookie is present. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return resolveLocale(store.get(LOCALE_COOKIE_NAME)?.value);
}

/** Reading direction for the resolved locale. */
export async function getLocaleDirection(): Promise<TextDirection> {
  const locale = await getLocale();
  return LOCALE_DIRECTION[locale];
}
