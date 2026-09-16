"use client";

// src/components/i18n/LocaleSwitcher.tsx
// The client half of the locale system: writes the locale cookie and refreshes the server render.
//
// The cookie is written through `serializeLocaleCookie()` — the same helper the server side of the
// i18n layer describes — so the cookie name, path and lifetime cannot drift between writers. There
// is no server action here on purpose: a language choice must work on a statically served page too,
// and it changes nothing but the visitor's own cookie.
//
// NOTE: this component is not mounted anywhere yet (the localized pages land in the next step).
// It is part of the i18n core delivered here and is ready to drop into the header.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
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

  const choose = (next: Locale) => {
    if (next === current) return;
    document.cookie = serializeLocaleCookie(next);
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
              "inline-flex items-center gap-1 rounded-lg px-2 py-0.5 font-heading text-xs font-semibold transition-all select-none",
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
