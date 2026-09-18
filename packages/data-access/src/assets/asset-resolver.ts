// packages/data-access/src/assets/asset-resolver.ts
// External image asset resolver and security validator

import {
  ASSET_ALLOWED_HOSTS,
  isHostAllowed,
  type ResolveResult,
} from "./asset-allowlist";

// YouTube video ID: exactly 11 characters (alphanumeric, -, _)
const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

// Google Drive file ID: at least 20 characters (alphanumeric, -, _)
const DRIVE_ID_REGEX = /^[a-zA-Z0-9_-]{20,}$/;

/**
 * Validates and resolves external image and asset URLs.
 *
 * Rules:
 * - Empty, non-string, or completely unparseable input returns null.
 * - Whitespace or control characters in the URL reject with kind 'unsupported'.
 * - Non-https protocols reject with kind 'unsupported'.
 * - Userinfo (username:password@) in URL rejects with kind 'unsupported'.
 * - Non-standard ports reject with kind 'unsupported'.
 * - YouTube URLs (watch, youtu.be, shorts, embed, /vi/) resolve to official CDN thumbnail.
 * - Google Drive URLs (/file/d/ID, /uc?id=ID, /open?id=ID) resolve to direct export endpoint.
 * - Google Photos album links reject with honest explanation.
 * - Direct allowlisted image hosts pass through with kind 'direct-image'.
 * - Any other unknown or unauthorized host rejects with kind 'unsupported'.
 */
export function resolveExternalImageUrl(
  raw: string | null | undefined
): ResolveResult | null {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return null;
  }

  // Reject whitespace or control characters
  if (/\s|[\x00-\x1F\x7F]/.test(raw)) {
    return {
      sourceUrl: raw,
      resolvedUrl: "",
      host: "",
      kind: "unsupported",
      reason: "الرابط يحتوي على مسافات أو محارف تحكم غير صالحة.",
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }

  // Require https:
  if (parsed.protocol !== "https:") {
    return {
      sourceUrl: raw,
      resolvedUrl: "",
      host: parsed.hostname || "",
      kind: "unsupported",
      reason: "يجب أن يبدأ الرابط ببروتوكول آمن (https://) حصراً.",
    };
  }

  // Reject userinfo
  if (parsed.username || parsed.password) {
    return {
      sourceUrl: raw,
      resolvedUrl: "",
      host: parsed.hostname,
      kind: "unsupported",
      reason: "غير مسموح بوجود بيانات مستخدم أو كلمة مرور (userinfo) في الرابط.",
    };
  }

  // Reject non-standard port
  if (parsed.port && parsed.port !== "" && parsed.port !== "443") {
    return {
      sourceUrl: raw,
      resolvedUrl: "",
      host: parsed.hostname,
      kind: "unsupported",
      reason: "غير مسموح باستخدام منافذ مخصصة في الرابط، يُسمح بالمنفذ القياسي فقط.",
    };
  }

  const host = parsed.hostname.toLowerCase();

  // Honest rejection for Google Photos album sharing links
  if (
    host === "photos.app.goo.gl" ||
    host === "photos.google.com" ||
    host.endsWith(".photos.google.com")
  ) {
    return {
      sourceUrl: raw,
      resolvedUrl: "",
      host,
      kind: "unsupported",
      reason:
        "روابط مشاركة ألبومات صور Google ليست روابط صور مباشرة وتتطلب واجهة برمجة تطبيقات خاصة. يرجى فتح الصورة ونسخ رابط الصورة المباشر.",
    };
  }

  // YouTube resolution
  let youtubeVideoId: string | null = null;
  if (host === "youtu.be") {
    const cleanPath = parsed.pathname.replace(/^\/+/, "");
    const segment = cleanPath.split("/")[0]?.split("?")[0];
    if (segment && YOUTUBE_ID_REGEX.test(segment)) {
      youtubeVideoId = segment;
    }
  } else if (parsed.pathname === "/watch") {
    const vParam = parsed.searchParams.get("v");
    if (vParam && YOUTUBE_ID_REGEX.test(vParam)) {
      youtubeVideoId = vParam;
    }
  } else if (parsed.pathname.startsWith("/shorts/")) {
    const cleanShorts = parsed.pathname.replace(/^\/shorts\/+/, "");
    const segment = cleanShorts.split("/")[0]?.split("?")[0];
    if (segment && YOUTUBE_ID_REGEX.test(segment)) {
      youtubeVideoId = segment;
    }
  } else if (parsed.pathname.startsWith("/embed/")) {
    const cleanEmbed = parsed.pathname.replace(/^\/embed\/+/, "");
    const segment = cleanEmbed.split("/")[0]?.split("?")[0];
    if (segment && YOUTUBE_ID_REGEX.test(segment)) {
      youtubeVideoId = segment;
    }
  } else if (parsed.pathname.startsWith("/vi/")) {
    const cleanVi = parsed.pathname.replace(/^\/vi\/+/, "");
    const segment = cleanVi.split("/")[0]?.split("?")[0];
    if (segment && YOUTUBE_ID_REGEX.test(segment)) {
      youtubeVideoId = segment;
    }
  }

  if (youtubeVideoId) {
    return {
      sourceUrl: raw,
      resolvedUrl: `https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg`,
      host: "i.ytimg.com",
      kind: "youtube-thumb",
    };
  }

  // If on a recognized YouTube domain but without a valid 11-char video ID
  if (
    host === "youtube.com" ||
    host === "www.youtube.com" ||
    host === "m.youtube.com" ||
    host === "youtu.be" ||
    host === "youtube-nocookie.com" ||
    host === "www.youtube-nocookie.com"
  ) {
    return {
      sourceUrl: raw,
      resolvedUrl: "",
      host,
      kind: "unsupported",
      reason:
        "تعذر استخراج معرف فيديو YouTube صالح من الرابط (يجب أن يتكون المعرف من 11 حرفاً).",
    };
  }

  // Google Drive resolution
  let driveId: string | null = null;
  const fileMatch = parsed.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (fileMatch && DRIVE_ID_REGEX.test(fileMatch[1])) {
    driveId = fileMatch[1];
  } else if (
    parsed.pathname === "/uc" ||
    parsed.pathname === "/open" ||
    parsed.pathname === "/download"
  ) {
    const idParam = parsed.searchParams.get("id");
    if (idParam && DRIVE_ID_REGEX.test(idParam)) {
      driveId = idParam;
    }
  }

  if (driveId) {
    return {
      sourceUrl: raw,
      resolvedUrl: `https://drive.usercontent.google.com/download?id=${driveId}&export=view`,
      host: "drive.usercontent.google.com",
      kind: "drive",
    };
  }

  // If on a recognized Google Drive domain but without a valid file ID
  if (
    host === "drive.google.com" ||
    host === "docs.google.com" ||
    host === "drive.usercontent.google.com"
  ) {
    return {
      sourceUrl: raw,
      resolvedUrl: "",
      host,
      kind: "unsupported",
      reason:
        "تعذر استخراج معرف ملف Google Drive صالح من الرابط (يجب أن يكون رابط ملف صالح لا يقل معرفه عن 20 حرفاً).",
    };
  }

  // Allowlisted direct images
  if (isHostAllowed(host)) {
    return {
      sourceUrl: raw,
      resolvedUrl: parsed.toString(),
      host,
      kind: "direct-image",
    };
  }

  // Any other host is rejected
  return {
    sourceUrl: raw,
    resolvedUrl: "",
    host,
    kind: "unsupported",
    reason: `المضيف "${host}" غير مسموح به. قائمة النطاقات المسموح بها: ${ASSET_ALLOWED_HOSTS.join(", ")}`,
  };
}

/**
 * Type guard checking if a resolution result is a successfully resolved asset.
 */
export function isResolvedAsset(
  res: ResolveResult | null | undefined
): res is ResolveResult & {
  kind: "youtube-thumb" | "drive" | "direct-image";
} {
  return res !== null && res !== undefined && res.kind !== "unsupported";
}
