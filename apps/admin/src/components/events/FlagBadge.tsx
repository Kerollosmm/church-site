// apps/admin/src/components/events/FlagBadge.tsx

import React from "react";
import Link from "next/link";
import { TermIcon } from "./term-icons";
import { DIMENSION_CHIP_STYLES, flagColorStyle } from "./flag-styles";
import type { EventFeedTermView } from "@church-site/data-access/client";
import type { Locale } from "@church-site/ui";
import { hasLocalizedText, localized } from "@church-site/ui";
import { cn } from "@church-site/ui";

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copticNavy-500";

const SIZE_STYLES: Record<"sm" | "md", string> = {
  sm: "gap-1 px-2 py-0.5 text-[11px]",
  md: "gap-1.5 px-2.5 py-1 text-xs",
};

export interface FlagBadgeProps {
  term: Pick<EventFeedTermView, "slug" | "dimension" | "nameAr" | "nameEn" | "icon" | "color">;
  locale: Locale;
  href?: string;
  active?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function FlagBadge({
  term,
  locale,
  href,
  active = false,
  size = "sm",
  className,
}: FlagBadgeProps): React.ReactElement {
  const text = { ar: term.nameAr, en: term.nameEn };
  const name = localized(text, locale);
  const colorStyle = flagColorStyle(term.color);
  const solid = active || term.dimension === "event_type";
  const palette = solid ? colorStyle.solid : colorStyle.soft;

  const classes = cn(
    "inline-flex items-center rounded-full border font-heading transition-colors",
    palette,
    DIMENSION_CHIP_STYLES[term.dimension],
    SIZE_STYLES[size],
    href ? FOCUS_RING : null,
    href ? (solid ? "hover:opacity-90" : "hover:border-copticNavy-300") : null,
    className
  );

  const content = (
    <>
      <TermIcon name={term.icon} className="w-3.5 h-3.5 shrink-0" />
      <span>{name}</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        title={name}
        aria-current={active ? "true" : undefined}
        data-dimension={term.dimension}
        data-term-slug={term.slug}
        data-translation-missing={hasLocalizedText(text, locale) ? undefined : "true"}
        className={classes}
      >
        {content}
      </Link>
    );
  }

  return (
    <span
      title={name}
      aria-current={active ? "true" : undefined}
      data-dimension={term.dimension}
      data-term-slug={term.slug}
      data-translation-missing={hasLocalizedText(text, locale) ? undefined : "true"}
      className={classes}
    >
      {content}
    </span>
  );
}
