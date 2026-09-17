// src/components/events/flag-styles.ts
// The SINGLE place where a taxonomy term's stored colour token and its dimension become Tailwind
// classes. PURE DATA: no JSX, no I/O, importable from anywhere.
//
// WHY IT IS CENTRALISED:
//
//  * A term's `color` column holds a palette token ("copticNavy") or nothing. The UI owns the
//    interpretation, and it must be the same interpretation on every surface (cards, filter chips,
//    browse links), so the token → class mapping lives here and nowhere else.
//  * Every class below is a LITERAL string: Tailwind's JIT scans source text, so a class assembled
//    from a prefix and a token at runtime would simply not exist in the stylesheet.
//  * The palette's contrast rules are honoured: gold appears only as a DARK shade (700/800) behind
//    white text or as small text, never as `copticGold-500` text and never as a light background
//    under small text.
//
// DIMENSIONS GET DISTINCTLY DIFFERENT TREATMENTS (fill + border style + weight), so two chips that
// happen to share a colour are still tellable apart by dimension alone:
//
//   event_type  solid fill, solid border, semibold   (the most prominent classification)
//   ministry    soft fill, solid border
//   audience    soft fill, dashed border
//   language    soft fill, dotted border, wide tracking
//   venue       soft fill, thick double border
//   tag         soft fill, thick dashed border

import type { TaxonomyDimension } from "@/lib/domain/types";
import type { MessageKey } from "@/lib/i18n/messages";

export interface FlagColorStyle {
  /** Low-emphasis fill: tinted background, dark text, visible border. */
  soft: string;
  /** High-emphasis fill: saturated background with white text. */
  solid: string;
}

/**
 * The neutral token every unknown colour resolves to: navy is the parish's primary colour and reads
 * as "unclassified", never as an error.
 */
const DEFAULT_FLAG_COLOR_STYLE: FlagColorStyle = {
  soft: "bg-copticNavy-50 text-copticNavy-700 border-copticNavy-200",
  solid: "bg-copticNavy-600 text-white border-transparent",
};

/**
 * Palette token → chip classes. The keys are the tokens `taxonomy_terms.color` is allowed to carry;
 * a hex value or a typo is not silently mapped to an approximate colour, it gets the default.
 */
export const FLAG_COLOR_STYLES: Record<string, FlagColorStyle> = {
  copticNavy: DEFAULT_FLAG_COLOR_STYLE,
  copticGold: {
    soft: "bg-copticGold-100 text-copticGold-800 border-copticGold-300",
    solid: "bg-copticGold-700 text-white border-transparent",
  },
  presentGreen: {
    soft: "bg-emerald-50 text-emerald-800 border-emerald-200",
    solid: "bg-emerald-700 text-white border-transparent",
  },
  absentRed: {
    soft: "bg-red-50 text-red-800 border-red-200",
    solid: "bg-red-700 text-white border-transparent",
  },
  pendingYellow: {
    soft: "bg-amber-50 text-amber-900 border-amber-200",
    solid: "bg-amber-700 text-white border-transparent",
  },
};

/** The chip classes for a stored colour token; unknown, hex or null → the navy default. */
export function flagColorStyle(color: string | null | undefined): FlagColorStyle {
  if (typeof color !== "string") return DEFAULT_FLAG_COLOR_STYLE;
  const token = color.trim();
  return FLAG_COLOR_STYLES[token] ?? DEFAULT_FLAG_COLOR_STYLE;
}

/**
 * Per-dimension additions layered on top of a colour style. `event_type` carries "solid fill" in its
 * own comment: it is rendered with the SOLID colour style (see `FlagBadge`), which is why it only
 * needs the weight/shadow extras here.
 */
export const DIMENSION_CHIP_STYLES: Record<TaxonomyDimension, string> = {
  event_type: "border-solid font-semibold shadow-xs",
  ministry: "border-solid",
  audience: "border-dashed",
  language: "border-dotted tracking-wide",
  venue: "border-double border-2",
  tag: "border-dashed border-2",
};

/** The dictionary key holding a dimension's human name ("نوع الفعالية" …). */
export const DIMENSION_LABEL_KEY: Record<TaxonomyDimension, MessageKey> = {
  event_type: "taxonomy.event_type",
  ministry: "taxonomy.ministry",
  audience: "taxonomy.audience",
  language: "taxonomy.language",
  venue: "taxonomy.venue",
  tag: "taxonomy.tag",
};

/**
 * A small colour accent per dimension, applied to the GROUP LABEL (the filter panel's section
 * heading) so the six groups stay visually distinct even when their chips share a colour. Text
 * shades only — every one of them is readable as small text on the light panel background, and none
 * of them is `copticGold-500`.
 */
export const DIMENSION_ACCENT: Record<TaxonomyDimension, string> = {
  event_type: "text-copticNavy-700",
  ministry: "text-copticGold-800",
  audience: "text-emerald-800",
  language: "text-amber-900",
  venue: "text-red-800",
  tag: "text-slateText-secondary",
};
