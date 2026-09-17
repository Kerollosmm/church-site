"use client";

// src/components/i18n/LocaleSwitcher.tsx
// The client half of the locale system: writes the locale cookie and refreshes the server render.
//
// The cookie is written through `serializeLocaleCookie()` — the same helper the server side of the
// i18n layer describes — so the cookie name, path and lifetime cannot drift between writers. There
// is no server action here on purpose: a language choice must work on a statically served page too,
// and it changes nothing but the visitor's own cookie.
//
// NOTE ON MOUNTING: this component is mounted in the site header (`src/components/layout/Header.tsx`),
// top bar, immediately before the font-size switcher — so it is reachable on every viewport. The header
// owns the `locale` prop, which it resolves from the same cookie on mount (see `@/lib/i18n/dom`); this
// component applies that value to `document.documentElement` too, so a page whose server render has not
// yet caught up still has the right `lang`/`dir` while the refresh is in flight.

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { applyDocumentLocale } from "@/lib/i18n/dom";
import {
  LOCALES,
  LOCALE_FLAGS,
  LOCALE_NATIVE_LABEL,
  serializeLocaleCookie,
  type Locale,
} from "@/lib/i18n/locales";
import { t } from "@/lib/i18n/messages";

export interface LocaleSwitcherProps {
  /** The locale currently being rendered by the server. */
  locale: Locale;
  className?: string;
}

export function LocaleSwitcher({ locale, className }: LocaleSwitcherProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState<Locale>(locale);

  // The header resolves the cookie on mount and passes the result down; applying it here keeps the
  // document element's `lang`/`dir`/`data-locale` in agreement with what the server rendered.
  useEffect(() => {
    applyDocumentLocale(locale);
  }, [locale]);

  const choose = (next: Locale) => {
    if (next === current) return;
    document.cookie = serializeLocaleCookie(next);
    // Apply immediately: a visitor who picked English must not keep reading an RTL document while
    // the server re-render is in flight.
    applyDocumentLocale(next);
    setCurrent(next);
    // Re-render the server components so the new locale is applied to the page in place.
    startTransition(() => router.refresh());
  };

  return (
    <div
      role="group"
      aria-label={t(locale, "locale.switcherLabel")}
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-copticGold-200/80 bg-copticGold-50 p-1 shadow-xs",
        pending && "opacity-70",
        className
      )}
    >
      {LOCALES.map((option) => {
        const flag = LOCALE_FLAGS[option];
        const isActive = option === current;
        return (
          <button
            key={option}
            type="button"
            lang={option}
            title={`${LOCALE_NATIVE_LABEL[option]} — ${flag.label}`}
            aria-pressed={isActive}
            onClick={() => choose(option)}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg px-2 py-0.5 font-heading text-xs font-semibold transition-all select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copticNavy-500",
              isActive
                ? "bg-copticNavy-500 text-white shadow-xs"
                : "text-copticGold-800 hover:bg-copticGold-100 hover:text-copticNavy-700"
            )}
          >
            <span aria-hidden="true">{flag.emoji}</span>
            <span>{LOCALE_NATIVE_LABEL[option]}</span>
          </button>
        );
      })}
    </div>
  );
}
