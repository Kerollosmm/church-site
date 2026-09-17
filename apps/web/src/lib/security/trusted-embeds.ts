// src/lib/security/trusted-embeds.ts
//
// Single source of truth for the third-party hosts the portal may load or embed at runtime.
//
// Two consumers must never drift apart:
//   - `next.config.ts` builds the Content-Security-Policy allowlists from these constants.
//   - `src/app/live/page.tsx` refuses to render `stream_events.stream_url` unless it points at one
//     of these hosts (that column is staff-editable data, not a trusted value).
//
// Keep this module dependency-free (no `@/` aliases, no runtime imports, no side effects): the
// Next.js config loader transpiles and `require`s it while loading `next.config.ts`.

/** Cloudflare Turnstile: the challenge script, its iframe, and the server-side siteverify call. */
export const TURNSTILE_ORIGIN = "https://challenges.cloudflare.com";

/**
 * Hosts accepted as a live-stream embed (`https:` only). `youtube-nocookie.com` is the
 * privacy-preserving YouTube embed domain and is listed alongside the regular one because the
 * secretary chooses which link to paste.
 */
export const TRUSTED_EMBED_HOSTS: readonly string[] = [
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "facebook.com",
  "www.facebook.com",
  "web.facebook.com",
  "m.facebook.com",
];

/** `https://` origins derived from {@link TRUSTED_EMBED_HOSTS} — used verbatim in CSP `frame-src`. */
export const TRUSTED_EMBED_ORIGINS: string[] = TRUSTED_EMBED_HOSTS.map(
  (host) => `https://${host}`
);

/**
 * Returns the normalised URL when `raw` is an `https` URL on a trusted embed host, and `null`
 * otherwise (empty, relative, `http:`, `javascript:`, `data:`, unknown host, unparseable).
 *
 * The caller must render nothing when this returns `null`: the stored value is never trusted.
 */
export function getTrustedEmbedUrl(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;

  const candidate = raw.trim();
  if (candidate.length === 0) return null;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:") return null;
  const host = parsed.hostname.toLowerCase();
  const isTrusted =
    TRUSTED_EMBED_HOSTS.includes(host) ||
    host.endsWith(".supabase.co");

  if (!isTrusted) return null;

  return parsed.toString();
}
