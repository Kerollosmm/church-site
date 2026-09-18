// packages/data-access/src/videos/trusted-embeds.ts
//
// Security gate for trusted video embed hosts.
// Only https protocol on verified video platform hosts is accepted.
// Enforces INV-01: Public app zero-auth, zero-env, no raw iframe injection.

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
  "fb.watch",
];

export const TRUSTED_EMBED_ORIGINS: string[] = TRUSTED_EMBED_HOSTS.map(
  (host) => `https://${host}`
);

/**
 * Returns the normalized URL when `raw` is a valid https URL on a trusted embed host,
 * and null otherwise. Rejects non-https, lookalikes, javascript:, data:, and invalid URLs.
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
