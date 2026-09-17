// apps/admin/src/components/events/term-icons.tsx

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

export function termIcon(name: string | null | undefined): LucideIcon {
  if (typeof name !== "string") return Tag;
  return TERM_ICONS[name.trim()] ?? Tag;
}

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
