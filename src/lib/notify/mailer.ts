// src/lib/notify/mailer.ts
// The mail seam: ONE interface, and the selection rule that picks an implementation.
//
// ─────────────────────────────────────────────────────────────────────────────
// THERE IS NO MAIL PROVIDER IN THIS DEPLOYMENT. NOTHING IS EMAILED. ───────────
// ─────────────────────────────────────────────────────────────────────────────
//
// The portal stores event subscriptions and shows them to the parish office, but no message has ever
// left the building: the only implementation selected today is the no-op mailer
// (`src/lib/notify/noop-mailer.ts`), which records what it WOULD have sent as an audit entry. Every
// result object therefore carries `delivered: false` and `provider: "noop"`, and no caller may claim
// otherwise — the public confirmation message says so in plain words.
//
// ADDING A REAL PROVIDER LATER (the marked place is `MAILER_FACTORIES` below):
//   1. add its credentials to the environment (server-side only — never `NEXT_PUBLIC_`);
//   2. implement `Mailer` in a new module beside `noop-mailer.ts` (the interface is the whole
//      contract: one `send()` that reports honestly whether the message left the building);
//   3. register it in `MAILER_FACTORIES` and select it with `MAIL_PROVIDER=<name>`.
// Nothing else in the codebase changes: callers ask `getMailer()` and read `deliverEmails`.

import type { Locale } from "@/lib/i18n/locales";

/**
 * Unset, or set to a name that is not registered, selects `noop`.
 * Operator-facing variable, read at call time like every other value in this codebase.
 */
export const MAIL_PROVIDER_ENV_VAR = "MAIL_PROVIDER";

/** The kind of message being sent. Closed vocabulary so an audit note can name it unambiguously. */
export type MailKind = "subscription-welcome";

export interface MailMessage {
  /** Recipient address (already normalised by the caller). */
  to: string;
  /** Display name, when the subscriber gave one. */
  toName?: string | null;
  /** The language the message should be written in. */
  locale: Locale;
  kind: MailKind;
  subject: string;
  bodyText: string;
}

export interface MailSendResult {
  provider: string;
  /** TRUE only when a provider accepted the message for delivery. Always false for the no-op. */
  delivered: boolean;
  /** True when the attempt was written to the audit trail (successfully). */
  recorded: boolean;
  /** Human-readable note shown in logs and used as the audit summary. */
  note: string;
}

export interface Mailer {
  /** Stable provider id, e.g. "noop". */
  readonly provider: string;
  /**
   * Whether this mailer actually reaches a mail server. A caller that renders a confirmation to a
   * visitor MUST branch on this: it is the difference between "we emailed you" and "we wrote you down".
   */
  readonly deliverEmails: boolean;
  send(message: MailMessage): Promise<MailSendResult>;
}

/**
 * The registry of mail implementations.
 *
 * `noop` is deliberately the only entry: adding a real provider means adding a factory here, and the
 * comment above says exactly what that takes. A name that is absent — including a typo — falls back
 * to the no-op, and `getMailer()` logs that fallback loudly rather than pretending to send.
 */
const MAILER_FACTORIES: Record<string, () => Mailer> = {
  // TODO(provider): "resend": () => new ResendMailer(...) — see the header of this file.
};

/** The provider name a deployment asked for, or "noop". */
export function requestedMailProvider(): string {
  const raw = process.env[MAIL_PROVIDER_ENV_VAR];
  const trimmed = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return trimmed.length > 0 ? trimmed : "noop";
}

/**
 * The mailer this environment resolves to.
 *
 * Resolution is lazy (never at import time, like everything else that reads the environment) and it
 * NEVER returns a mailer that claims to deliver when it does not: an unregistered `MAIL_PROVIDER`
 * value produces an explicit error line plus the no-op mailer.
 */
export async function getMailer(): Promise<Mailer> {
  const requested = requestedMailProvider();

  if (requested === "noop") {
    const { noopMailer } = await import("@/lib/notify/noop-mailer");
    return noopMailer;
  }

  const factory = MAILER_FACTORIES[requested];
  if (!factory) {
    console.error("[notify] MAIL_PROVIDER names no implemented mailer; NOTHING will be sent", {
      requested,
      implemented: ["noop"],
    });
    const { noopMailer } = await import("@/lib/notify/noop-mailer");
    return noopMailer;
  }

  return factory();
}
