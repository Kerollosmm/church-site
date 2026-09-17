// apps/admin/src/components/admin/TermMultiSelect.tsx
// One taxonomy dimension as a multi-select of its terms — a real `fieldset` of real checkboxes.

"use client";

import React from "react";
import { FlagBadge } from "@/components/events/FlagBadge";
import { ADMIN_ERROR_TEXT, ADMIN_HINT } from "./admin-ui";
import type { AdminTermView } from "@church-site/data-access/client";
import type { Locale } from "@church-site/ui";
import { localized, cn } from "@church-site/ui";

export interface TermMultiSelectProps {
  /** The dimension id, e.g. "event_type" — also the fieldset's DOM id. */
  id: string;
  /** Arabic label of the dimension, taken from the i18n dictionary by the caller. */
  label: string;
  terms: readonly AdminTermView[];
  selected: readonly string[];
  onToggle: (termId: string) => void;
  locale: Locale;
  hint?: string;
  error?: string;
  /** Rendered instead of the checkboxes when the dimension has no terms at all. */
  emptyLabel?: string;
}

export function TermMultiSelect({
  id,
  label,
  terms,
  selected,
  onToggle,
  locale,
  hint,
  error,
  emptyLabel = "لا توجد مصطلحات في هذا البُعد بعد.",
}: TermMultiSelectProps): React.ReactElement {
  const selectedSet = new Set(selected);

  return (
    <fieldset
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={[hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined}
      className={cn(
        "rounded-2xl border p-3.5",
        error ? "border-red-300 bg-red-50/40" : "border-slate-200 bg-slate-50/60"
      )}
    >
      <legend className="px-1 font-heading text-xs font-bold text-copticNavy">{label}</legend>

      {terms.length === 0 ? (
        <p className="text-[11px] text-slate-500">{emptyLabel}</p>
      ) : (
        <ul className="mt-1 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {terms.map((term) => {
            const checkboxId = `${id}-${term.id}`;
            const isSelected = selectedSet.has(term.id);
            const name = localized({ ar: term.nameAr, en: term.nameEn }, locale, { markMissing: false });

            return (
              <li key={term.id} className="flex items-start gap-2">
                <input
                  id={checkboxId}
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(term.id)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-slate-400 text-copticNavy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copticNavy-500"
                />
                <label htmlFor={checkboxId} className="flex flex-wrap items-center gap-1.5 text-xs text-slate-700">
                  <FlagBadge term={term} locale={locale} />
                  {!term.isActive ? (
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                      متوقف — لن يظهر للزوار
                    </span>
                  ) : null}
                  <span className="sr-only">{name}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {hint ? (
        <p id={`${id}-hint`} className={ADMIN_HINT}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className={ADMIN_ERROR_TEXT}>
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
