// src/components/events/term-icons.tsx
// THE registry that turns a taxonomy term's stored `icon` name (a lucide name such as "Church") into
// an actual icon component.
//
// WHY A STATIC REGISTRY AND NOT `import * as LucideIcons`: the star import (and any dynamic lookup by
// name) forces the bundler to keep the whole icon set — over a thousand modules — in the client
// bundle. Every icon the parish vocabulary can use is therefore imported explicitly below and a term
// that names an icon which is NOT in the registry renders the neutral `Tag` instead of breaking.
//
// ADDING A NEW TERM ICON NAME IS A TWO-LINE CODE CHANGE: import the lucide component and add it to
// `TERM_ICONS` under its stored name. There is deliberately NO dynamic resolution.

import React from "react";
import {
  Baby,
  BookOpen,
  CalendarDays,
  Church,
  HeartHandshake,
  Languages,
  Laptop,
  Library,
  MapPin,
  Palette,
  Radio,
  Shirt,
  Sparkles,
  Sun,
  Tag,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Stored name → icon. Keys are the names staff pick in the admin vocabulary, i.e. exactly what
 * `taxonomy_terms.icon` holds; an unknown or missing name resolves to `Tag` in `termIcon()`.
 *
 * `Languages` (lucide's plural export) is registered under both spellings, because the vocabulary is
 * typed by hand and "Language" / "Languages" are both natural names for the dimension's icon.
 */
const TERM_ICONS: Record<string, LucideIcon> = {
  Church,
  Users,
  MapPin,
  CalendarDays,
  Languages,
  Language: Languages,
  Baby,
  Trophy,
  BookOpen,
  Library,
  HeartHandshake,
  Shirt,
  Sparkles,
  Radio,
  Palette,
  Laptop,
  Sun,
  Tag,
};

/** The icon a stored term name resolves to; unknown or missing names fall back to `Tag`. */
export function termIcon(name: string | null | undefined): LucideIcon {
  if (typeof name !== "string") return Tag;
  return TERM_ICONS[name.trim()] ?? Tag;
}

/**
 * The term's icon as a decorative element: it is always `aria-hidden`, because the term NAME carries
 * the meaning and the icon only makes a chip scannable.
 */
export function TermIcon({
  name,
  className,
}: {
  name: string | null | undefined;
  className?: string;
}): React.ReactElement {
  const Icon = termIcon(name);
  return <Icon aria-hidden="true" className={className} />;
}
