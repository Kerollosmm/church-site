// apps/admin/src/components/i18n/LocaleSwitcher.tsx

"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  cn,
  applyDocumentLocale,
  LOCALES,
  LOCALE_FLAGS,
  LOCALE_NATIVE_LABEL,
  serializeLocaleCookie,
  type Locale,
  t,
} from "@church-site/ui";

export interface LocaleSwitcherProps {
  /** The locale currently being rendered by the server. */
  locale: Locale;
  className?: string;
}

export function LocaleSwitcher({ locale, className }: LocaleSwitcherProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState<Locale>(locale);

  useEffect(() => {
    applyDocumentLocale(locale);
  }, [locale]);

  const choose = (next: Locale) => {
    if (next === current) return;
    document.cookie = serializeLocaleCookie(next);
    applyDocumentLocale(next);
    setCurrent(next);
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
