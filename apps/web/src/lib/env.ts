// src/lib/env.ts
// Lazy, fail-closed access to the environment variables required by the portal (BACKEND §9.1).
//
// Two hard rules govern this module:
//   1. It is SERVER-ONLY. Client code must reference public variables literally
//      (`process.env.NEXT_PUBLIC_*`) so Next.js can inline them at build time.
//   2. Nothing here may run at module import time. The portal is static-first and must
//      still build and serve seed data when the environment is empty (no-env build),
//      so every value is read at CALL time and a missing variable throws a descriptive
//      error only for the caller that actually needs it. The query layer catches that
//      error and falls back to the seeded dataset.

/** Name of an environment variable declared in BACKEND_AND_DATA_SPEC.md §9.1. */
export type ServerEnvVar =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "TURNSTILE_SECRET_KEY"
  | "NEXT_PUBLIC_TURNSTILE_SITE_KEY"
  | "NEXT_PUBLIC_YOUTUBE_CHANNEL_URL"
  | "NEXT_PUBLIC_SITE_URL";

export class MissingEnvVarError extends Error {
  readonly variable: string;

  constructor(variable: ServerEnvVar) {
    super(
      `Missing required environment variable "${variable}". ` +
        `Set it in the deployment environment (see BACKEND_AND_DATA_SPEC.md §9.1) before using this feature.`
    );
    this.name = "MissingEnvVarError";
    this.variable = variable;
  }
}

/** Reads a variable, treating empty/whitespace-only values as absent. */
function readEnv(variable: ServerEnvVar): string | null {
  const value = process.env[variable];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requireEnv(variable: ServerEnvVar): string {
  const value = readEnv(variable);
  if (value === null) {
    throw new MissingEnvVarError(variable);
  }
  return value;
}

/** Supabase project URL. Throws when unset — never returns a placeholder. */
export function getSupabaseUrl(): string {
  return requireEnv("NEXT_PUBLIC_SUPABASE_URL");
}

/** Supabase anon key (RLS-constrained). Throws when unset. */
export function getSupabaseAnonKey(): string {
  return requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

/** Service-role key. Server-only; used exclusively by the write path in `src/lib/supabase/admin.ts`. */
export function getSupabaseServiceRoleKey(): string {
  return requireEnv("SUPABASE_SERVICE_ROLE_KEY");
}

/** True when the public Supabase pair needed to establish a session is configured. */
export function hasSupabaseEnv(): boolean {
  return readEnv("NEXT_PUBLIC_SUPABASE_URL") !== null && readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") !== null;
}

/**
 * True when the URL + service-role pair is configured — the condition that selects the Supabase
 * store driver (`src/lib/store/index.ts`). Distinct from `hasSupabaseEnv()` on purpose: the anon key
 * is what the public read path needs, whereas a provisioned deployment is what the write-capable
 * repository needs. With either half missing, the portal keeps running on the file-backed driver.
 */
export function hasSupabaseAdminEnv(): boolean {
  return readEnv("NEXT_PUBLIC_SUPABASE_URL") !== null && readEnv("SUPABASE_SERVICE_ROLE_KEY") !== null;
}

/**
 * Turnstile secret key, or null when the deployment has no Turnstile configured.
 * Callers must FAIL CLOSED on null in production (see `src/lib/security/turnstile.ts`).
 */
export function getTurnstileSecretKey(): string | null {
  return readEnv("TURNSTILE_SECRET_KEY");
}

/**
 * Public Turnstile site key, read on the server (e.g. to decide whether the token is mandatory).
 * Client components must read `process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY` directly instead,
 * so the value is inlined into the browser bundle.
 */
export function getTurnstileSiteKey(): string | null {
  return readEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY");
}

/**
 * Public URL of the parish's official broadcast channel, or null when none has been approved yet.
 *
 * The parish channel is NOT hard-coded anywhere: `/live` renders its link blocks only when this is
 * set, and otherwise shows an explicit "not configured yet" state. Setting it is a deployment
 * decision (see BACKEND_AND_DATA_SPEC.md §9.1) — never infer or invent a channel URL in code.
 */
export function getYoutubeChannelUrl(): string | null {
  return readEnv("NEXT_PUBLIC_YOUTUBE_CHANNEL_URL");
}

/** Canonical public origin, without a trailing slash. Falls back to localhost so the sitemap/robots routes still build with no environment. */
export const DEFAULT_SITE_URL = "http://localhost:3000";

/**
 * The site's canonical origin, e.g. `https://stmaximus.example` — the base of every absolute URL the
 * portal publishes (sitemap entries, `robots.txt`, JSON-LD `url`/`@id`).
 *
 * Read lazily like every other variable here: with no environment at all the portal still builds and
 * serves, so the fallback is a working local origin rather than a thrown error. A trailing slash is
 * stripped so callers can always concatenate a path beginning with "/".
 */
export function getSiteUrl(): string {
  return readEnv("NEXT_PUBLIC_SITE_URL")?.replace(/\/+$/, "") ?? DEFAULT_SITE_URL;
}

/**
 * Operational switch for the PUBLIC event-subscription feature (the "subscribe to updates" form and
 * the server action behind it). Not a secret and not a `NEXT_PUBLIC_` value: the guard is enforced
 * on the SERVER (the action refuses, and the page renders a "switched off" state), never by hiding a
 * button in the browser.
 *
 *   unset / empty / any other value → ENABLED (the parish feature is on by default)
 *   "0" | "false" | "off" | "no"    → DISABLED
 *
 * Its name and default are documented in `docs/runbook.md`; `CHURCH_DATA_DIR` is read the same way
 * (directly, at call time) because it is an operational variable rather than a required credential.
 */
export function isEventSubscriptionsEnabled(): boolean {
  const raw = process.env.EVENTS_SUBSCRIPTIONS_ENABLED;
  if (typeof raw !== "string") return true;
  const normalized = raw.trim().toLowerCase();
  if (normalized.length === 0) return true;
  return !["0", "false", "off", "no"].includes(normalized);
}
