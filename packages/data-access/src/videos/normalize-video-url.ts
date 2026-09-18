// packages/data-access/src/videos/normalize-video-url.ts
//
// Server-side video URL normalizer and security validator.
// Built strictly on top of trusted-embeds security gate.
// Converts arbitrary valid YouTube / Facebook / Direct links into safe embed URLs.

import type { VideoProvider } from "@church-site/domain";
import { TRUSTED_EMBED_HOSTS } from "./trusted-embeds";

export interface NormalizedVideoUrl {
  provider: VideoProvider;
  embedUrl: string;
  thumbnailUrl?: string;
}

// Regex matching standard YouTube 11-char video IDs (alphanumeric, -, _)
const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Validates and normalizes an external video URL.
 *
 * Enforces:
 * - Must be a non-empty string.
 * - Must be https: protocol (rejects http:, javascript:, data:, etc.).
 * - Must resolve to an approved host in TRUSTED_EMBED_HOSTS (or *.supabase.co for direct media).
 * - Extracts and normalizes YouTube videos (watch, shorts, embed, youtu.be) into privacy-enhanced youtube-nocookie embed URLs.
 * - Wraps Facebook videos into Facebook's official video plugin embed URL.
 * - Validates direct streams/mp4s on approved hosts (*.supabase.co).
 *
 * Returns `{ provider, embedUrl, thumbnailUrl? }` if valid, or `null` if rejected.
 */
export function normalizeVideoUrl(raw: string | null | undefined): NormalizedVideoUrl | null {
  if (typeof raw !== "string") return null;

  const candidate = raw.trim();
  if (candidate.length === 0) return null;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  // Reject anything that is not HTTPS
  if (parsed.protocol !== "https:") return null;

  const host = parsed.hostname.toLowerCase();

  // Validate that hostname is trusted or matches *.supabase.co
  const isTrustedHost =
    TRUSTED_EMBED_HOSTS.includes(host) ||
    host.endsWith(".supabase.co");

  if (!isTrustedHost) return null;

  // 1. YouTube normalization
  if (
    host === "youtu.be" ||
    host === "youtube.com" ||
    host === "www.youtube.com" ||
    host === "m.youtube.com" ||
    host === "youtube-nocookie.com" ||
    host === "www.youtube-nocookie.com"
  ) {
    let videoId: string | null = null;

    if (host === "youtu.be") {
      // Format: https://youtu.be/<id>
      const cleanPath = parsed.pathname.replace(/^\/+/, "");
      const segment = cleanPath.split("/")[0]?.split("?")[0];
      if (segment && YOUTUBE_ID_REGEX.test(segment)) {
        videoId = segment;
      }
    } else if (parsed.pathname === "/watch") {
      // Format: https://www.youtube.com/watch?v=<id>
      const vParam = parsed.searchParams.get("v");
      if (vParam && YOUTUBE_ID_REGEX.test(vParam)) {
        videoId = vParam;
      }
    } else if (parsed.pathname.startsWith("/shorts/")) {
      // Format: https://www.youtube.com/shorts/<id>
      const cleanShorts = parsed.pathname.replace(/^\/shorts\/+/, "");
      const segment = cleanShorts.split("/")[0]?.split("?")[0];
      if (segment && YOUTUBE_ID_REGEX.test(segment)) {
        videoId = segment;
      }
    } else if (parsed.pathname.startsWith("/embed/")) {
      // Format: https://www.youtube.com/embed/<id>
      const cleanEmbed = parsed.pathname.replace(/^\/embed\/+/, "");
      const segment = cleanEmbed.split("/")[0]?.split("?")[0];
      if (segment && YOUTUBE_ID_REGEX.test(segment)) {
        videoId = segment;
      }
    }

    if (!videoId) {
      return null;
    }

    return {
      provider: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  }

  // 2. Facebook normalization
  if (
    host === "facebook.com" ||
    host === "www.facebook.com" ||
    host === "web.facebook.com" ||
    host === "m.facebook.com" ||
    host === "fb.watch"
  ) {
    // Must have a meaningful path
    if (parsed.pathname.length <= 1) {
      return null;
    }

    const encodedHref = encodeURIComponent(parsed.toString());
    return {
      provider: "facebook",
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodedHref}&show_text=0`,
    };
  }

  // 3. Direct stream / media URL on approved hosts (*.supabase.co)
  if (
    host.endsWith(".supabase.co") ||
    parsed.pathname.endsWith(".mp4") ||
    parsed.pathname.endsWith(".webm") ||
    parsed.pathname.endsWith(".m3u8")
  ) {
    return {
      provider: "direct",
      embedUrl: parsed.toString(),
    };
  }

  return null;
}
