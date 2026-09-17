// apps/admin/src/components/events/flag-styles.ts

import type { TaxonomyDimension } from "@church-site/domain";

export interface FlagColorStyle {
  soft: string;
  solid: string;
}

const DEFAULT_FLAG_COLOR_STYLE: FlagColorStyle = {
  soft: "bg-copticNavy-50 text-copticNavy-700 border-copticNavy-200",
  solid: "bg-copticNavy-600 text-white border-transparent",
};

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
    soft: "bg-amber-50 text-amber-900 border-amber-300",
    solid: "bg-amber-700 text-white border-transparent",
  },
  purple: {
    soft: "bg-purple-50 text-purple-800 border-purple-200",
    solid: "bg-purple-700 text-white border-transparent",
  },
  slate: {
    soft: "bg-slate-100 text-slate-700 border-slate-300",
    solid: "bg-slate-700 text-white border-transparent",
  },
};

export function flagColorStyle(colorToken: string | null | undefined): FlagColorStyle {
  if (!colorToken) return DEFAULT_FLAG_COLOR_STYLE;
  return FLAG_COLOR_STYLES[colorToken.trim()] ?? DEFAULT_FLAG_COLOR_STYLE;
}

export const DIMENSION_CHIP_STYLES: Record<TaxonomyDimension, string> = {
  event_type: "border-solid font-semibold shadow-xs",
  ministry: "border-solid font-medium",
  audience: "border-dashed font-medium",
  language: "border-dotted font-medium tracking-wide",
  venue: "border-double border-2 font-medium",
  tag: "border-dashed border-2 font-medium",
};
