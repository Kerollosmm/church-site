// packages/data-access/src/assets/asset-allowlist.ts
// Domain allowlist and type definitions for external asset resolution

export const ASSET_ALLOWED_HOSTS = [
  // YouTube video thumbnail CDN pinned host
  "i.ytimg.com",
  // YouTube image CDN regional subdomains (i1.ytimg.com .. i4.ytimg.com)
  "*.ytimg.com",
  // YouTube image CDN apex domain
  "ytimg.com",
  // YouTube legacy thumbnail domain
  "img.youtube.com",
  // Official Google Drive direct download and image render endpoint
  "drive.usercontent.google.com",
  // Google user content CDN (direct Google Photos, Drive user content)
  "*.googleusercontent.com",
  // Google user content apex domain
  "googleusercontent.com",
] as const;

export type AssetAllowedHost = (typeof ASSET_ALLOWED_HOSTS)[number];

export type AssetKind = "youtube-thumb" | "drive" | "direct-image" | "unsupported";

export interface ResolveResult {
  sourceUrl: string;
  resolvedUrl: string;
  host: string;
  kind: AssetKind;
  reason?: string;
}

export function isHostAllowed(hostname: string): boolean {
  if (!hostname || typeof hostname !== "string") return false;
  const host = hostname.toLowerCase();

  for (const pattern of ASSET_ALLOWED_HOSTS) {
    if (pattern === host) return true;
    if (pattern.startsWith("*.")) {
      const suffix = pattern.slice(2);
      if (host.endsWith("." + suffix)) return true;
    }
  }

  return false;
}
