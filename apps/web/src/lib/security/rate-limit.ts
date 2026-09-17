// src/lib/security/rate-limit.ts
//
// Dependency-free sliding-window rate limiter for public Server Actions.
//
// SCOPE / LIMITATION: this limiter is BEST-EFFORT and PER-INSTANCE. Its counters live in the
// memory of a single Node/serverless instance, so a horizontally scaled or cold-started
// deployment gives an attacker up to (instances × limit) attempts, and a restart clears all
// counters. It exists to blunt trivial form-spam and code-guessing, not to guarantee a quota.
// PRODUCTION FOLLOW-UP: replace this with a durable edge/WAF limiter (Cloudflare Rate Limiting
// rules) or a shared store (Upstash Redis / the `rate_limit_hits` table in BACKEND §9.2).

/** Default policy for public forms: 5 submissions per minute per IP (BACKEND_AND_DATA_SPEC.md §9.2). */
export const PUBLIC_FORM_LIMIT = 5;
export const PUBLIC_FORM_WINDOW_MS = 60_000;

/** Booking tracking needs a few more attempts than a form (typos), but still rate-limited to prevent code enumeration. */
export const TRACKING_LIMIT = 10;

interface RateLimitOptions {
  /** Maximum number of hits allowed inside the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Milliseconds until the oldest hit leaves the window (0 when allowed). */
  retryAfterMs: number;
}

/** Sliding-window buckets keyed by `${action}:${ip}`. */
const buckets = new Map<string, number[]>();

/** Hard cap on tracked keys; protects the instance from unbounded memory growth. */
const MAX_TRACKED_KEYS = 10_000;

function pruneExpired(now: number, windowMs: number): void {
  for (const [key, hits] of buckets) {
    const live = hits.filter((timestamp) => now - timestamp < windowMs);
    if (live.length === 0) {
      buckets.delete(key);
    } else if (live.length !== hits.length) {
      buckets.set(key, live);
    }
  }
}

/**
 * Records a hit for `key` and reports whether it is inside the allowed rate.
 * Pure in-memory, synchronous, and safe to call from any Server Action.
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const { limit, windowMs } = options;

  if (buckets.size > MAX_TRACKED_KEYS) {
    pruneExpired(now, windowMs);
    if (buckets.size > MAX_TRACKED_KEYS) {
      buckets.clear();
    }
  }

  const hits = (buckets.get(key) ?? []).filter((timestamp) => now - timestamp < windowMs);

  if (hits.length >= limit) {
    buckets.set(key, hits);
    const retryAfterMs = Math.max(0, windowMs - (now - hits[0]));
    return { allowed: false, retryAfterMs };
  }

  hits.push(now);
  buckets.set(key, hits);
  return { allowed: true, retryAfterMs: 0 };
}

/** Test/ops helper: clears every bucket. */
export function resetRateLimits(): void {
  buckets.clear();
}

/** Minimal shape shared by the Web `Headers` and Next.js `ReadonlyHeaders`. */
export interface HeaderReader {
  get(name: string): string | null | undefined;
}

/**
 * Best-effort client identity: first hop of `x-forwarded-for`, then `x-real-ip`.
 * Headers are client-controllable unless a trusted proxy overwrites them, so the value is
 * only used to bucket traffic — never for authorization decisions.
 */
export function getClientIp(headerList: HeaderReader): string {
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) {
    const firstHop = forwardedFor.split(",")[0]?.trim();
    if (firstHop) return firstHop;
  }

  const realIp = headerList.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

/** Arabic, user-facing message returned when a public form exceeds its quota. */
export const RATE_LIMIT_MESSAGE_AR =
  "تم تجاوز الحد المسموح من المحاولات، يرجى المحاولة مرة أخرى بعد دقيقة أو التواصل مع سكرتارية الكنيسة";
