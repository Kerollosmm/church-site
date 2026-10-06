// packages/ui/src/components/events/FlagBadge.tsx
// One taxonomy term as a chip — the atom shared by event cards, the filter panel and the browse-by
// links. SERVER component: no state, no handlers; a chip's interactivity is either a plain `<span>`
// (a label) or a `<Link>` (a URL-driven filter / browse link), so the page works without JavaScript.

import React from "react";
import Link from "next/link";
import { TermIcon } from "./term-icons";
import { DIMENSION_CHIP_STYLES, flagColorStyle } from "./flag-styles";
import type { TaxonomyDimension } from "@church-site/domain";
import type { Locale } from "../../lib/i18n/locales";
import { hasLocalizedText, localized } from "../../lib/i18n/localized";
import { cn } from "../../lib/utils";

/** The project-wide visible focus ring — one string, so every events control focuses identically. */
const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copticNavy-500";

const SIZE_STYLES: Record<"sm" | "md", string> = {
  sm: "gap-1 px-2 py-0.5 text-[11px]",
  md: "gap-1.5 px-2.5 py-1 text-xs",
};

export interface FlagBadgeTerm {
  slug: string;
  dimension: TaxonomyDimension;
  nameAr: string;
  nameEn?: string | null;
  icon?: string | null;
  color?: string | null;
}

export interface FlagBadgeProps {
  term: FlagBadgeTerm;
  locale: Locale;
  /** When set the chip is a `<Link>` to that URL (the URL-driven filter / browse link). */
  href?: string;
  /** Marks the chip as currently selected (aria-current + filled treatment). */
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
  const text = { ar: term.nameAr, en: term.nameEn ?? null };
  const name = localized(text, locale);
  const colorStyle = flagColorStyle(term.color);
  const solid = active || term.dimension === "event_type";
  const palette = solid ? colorStyle.solid : colorStyle.soft;

  const classes = cn(
    "inline-flex items-center rounded-full border font-heading transition-colors",
    palette,
    DIMENSION_CHIP_STYLES[term.dimension],
    SIZE_STYLES[size],
    // A chip that leads somewhere must look and behave like a control; a plain chip is inert.
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
