"use client";

// src/components/admin/AdminFields.tsx
// The labelled, error-aware form controls every admin editor is built from.
//
// WHY THEY EXIST: an inline field error is only useful if a screen reader can reach it, so each
// control wires `id`, `aria-invalid`, `aria-describedby` and the visible message together — the
// plumbing that is easy to forget when every input is written by hand. The hint and the error share
// the same described-by list, so the text a sighted user reads under a field is exactly the text
// assistive technology announces for it.

import React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ADMIN_ERROR_TEXT,
  ADMIN_HINT,
  ADMIN_INPUT,
  ADMIN_INPUT_INVALID,
  ADMIN_LABEL,
} from "@/components/admin/admin-ui";

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Marks the field as one of a pair that are read together (Arabic above, English below). */
  lang?: "ar" | "en";
  children: React.ReactNode;
  className?: string;
}

/** Label + control + hint + error, with the ARIA wiring done once. */
export function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  lang,
  children,
  className,
}: FieldShellProps): React.ReactElement {
  return (
    <div className={className}>
      <label htmlFor={id} lang={lang} dir={lang === "en" ? "ltr" : undefined} className={ADMIN_LABEL}>
        {label}
        {required ? (
          <span aria-hidden="true" className="text-red-600">
            {" "}
            *
          </span>
        ) : null}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint ? (
        <p id={`${id}-hint`} className={ADMIN_HINT}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className={ADMIN_ERROR_TEXT}>
          <AlertCircle aria-hidden="true" className="mt-0.5 h-3 w-3 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

/** The described-by list a control announces: its hint, its error, or both. */
export function describedBy(id: string, hint?: string, error?: string): string | undefined {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

export interface AdminTextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  required?: boolean;
  type?: "text" | "url" | "number" | "date" | "time" | "datetime-local";
  placeholder?: string;
  maxLength?: number;
  lang?: "ar" | "en";
  dir?: "rtl" | "ltr";
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
}

export function AdminTextField({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  required,
  type = "text",
  placeholder,
  maxLength,
  lang,
  dir,
  disabled,
  readOnly,
  className,
}: AdminTextFieldProps): React.ReactElement {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} lang={lang} className={className}>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        lang={lang}
        dir={dir ?? (lang === "en" ? "ltr" : undefined)}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(ADMIN_INPUT, error ? ADMIN_INPUT_INVALID : null)}
      />
    </FieldShell>
  );
}

export interface AdminTextAreaProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  rows?: number;
  maxLength?: number;
  lang?: "ar" | "en";
  placeholder?: string;
  className?: string;
}

export function AdminTextArea({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  rows = 3,
  maxLength,
  lang,
  placeholder,
  className,
}: AdminTextAreaProps): React.ReactElement {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} lang={lang} className={className}>
      <textarea
        id={id}
        name={id}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        lang={lang}
        dir={lang === "en" ? "ltr" : undefined}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(ADMIN_INPUT, "resize-y", error ? ADMIN_INPUT_INVALID : null)}
      />
    </FieldShell>
  );
}

export interface AdminSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface AdminSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly AdminSelectOption[];
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function AdminSelect({
  id,
  label,
  value,
  onChange,
  options,
  hint,
  error,
  required,
  disabled,
  className,
}: AdminSelectProps): React.ReactElement {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <select
        id={id}
        name={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(ADMIN_INPUT, "font-heading font-bold", error ? ADMIN_INPUT_INVALID : null)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/** A checkbox with a real label association (not a bare input next to text). */
export function AdminCheckbox({
  id,
  label,
  checked,
  onChange,
  hint,
  disabled,
  className,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
  disabled?: boolean;
  className?: string;
}): React.ReactElement {
  return (
    <div className={cn("flex items-start gap-2", className)}>
      <input
        id={id}
        name={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-400 text-copticNavy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copticNavy-500"
      />
      <label htmlFor={id} className="font-heading text-xs font-bold text-slate-700">
        {label}
        {hint ? (
          <span id={`${id}-hint`} className="mt-0.5 block font-body text-[11px] font-normal text-slate-500">
            {hint}
          </span>
        ) : null}
      </label>
    </div>
  );
}
