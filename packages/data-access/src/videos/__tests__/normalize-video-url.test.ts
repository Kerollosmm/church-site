// packages/data-access/src/videos/__tests__/normalize-video-url.test.ts
// Comprehensive unit tests for video URL normalization and security validation.

import { describe, expect, it } from "vitest";
import { normalizeVideoUrl } from "../normalize-video-url";
import { getTrustedEmbedUrl, TRUSTED_EMBED_HOSTS } from "../trusted-embeds";

describe("normalizeVideoUrl", () => {
  describe("YouTube URLs", () => {
    it("normalizes standard watch URL to youtube-nocookie embed", () => {
      const result = normalizeVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
      expect(result).not.toBeNull();
      expect(result?.provider).toBe("youtube");
      expect(result?.embedUrl).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
      expect(result?.thumbnailUrl).toBe("https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    });

    it("normalizes youtu.be short link", () => {
      const result = normalizeVideoUrl("https://youtu.be/dQw4w9WgXcQ");
      expect(result).not.toBeNull();
      expect(result?.provider).toBe("youtube");
      expect(result?.embedUrl).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
      expect(result?.thumbnailUrl).toBe("https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    });

    it("normalizes youtube shorts URL", () => {
      const result = normalizeVideoUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ");
      expect(result).not.toBeNull();
      expect(result?.provider).toBe("youtube");
      expect(result?.embedUrl).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    });

    it("normalizes mobile m.youtube.com watch URL", () => {
      const result = normalizeVideoUrl("https://m.youtube.com/watch?v=dQw4w9WgXcQ");
      expect(result).not.toBeNull();
      expect(result?.provider).toBe("youtube");
      expect(result?.embedUrl).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    });

    it("normalizes existing embed URLs to privacy-friendly nocookie", () => {
      const result = normalizeVideoUrl("https://www.youtube.com/embed/dQw4w9WgXcQ");
      expect(result).not.toBeNull();
      expect(result?.provider).toBe("youtube");
      expect(result?.embedUrl).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    });
  });

  describe("Facebook URLs", () => {
    it("normalizes facebook page video link", () => {
      const url = "https://www.facebook.com/church.portal/videos/123456789012345/";
      const result = normalizeVideoUrl(url);
      expect(result).not.toBeNull();
      expect(result?.provider).toBe("facebook");
      expect(result?.embedUrl).toContain("https://www.facebook.com/plugins/video.php?href=");
      expect(result?.embedUrl).toContain(encodeURIComponent(url));
    });

    it("normalizes facebook watch link", () => {
      const url = "https://web.facebook.com/watch/?v=987654321098765";
      const result = normalizeVideoUrl(url);
      expect(result).not.toBeNull();
      expect(result?.provider).toBe("facebook");
      expect(result?.embedUrl).toContain("https://www.facebook.com/plugins/video.php?href=");
    });

    it("normalizes fb.watch short link", () => {
      const url = "https://fb.watch/abcdef123/";
      const result = normalizeVideoUrl(url);
      expect(result).not.toBeNull();
      expect(result?.provider).toBe("facebook");
      expect(result?.embedUrl).toContain("https://www.facebook.com/plugins/video.php?href=");
    });
  });

  describe("Direct Video URLs on Approved Hosts (*.supabase.co)", () => {
    it("accepts direct https mp4 stream on supabase", () => {
      const url = "https://church-portal.supabase.co/storage/v1/object/public/recordings/liturgy-2026-09-17.mp4";
      const result = normalizeVideoUrl(url);
      expect(result).not.toBeNull();
      expect(result?.provider).toBe("direct");
      expect(result?.embedUrl).toBe(url);
    });

    it("accepts direct https m3u8 HLS stream on supabase", () => {
      const url = "https://church-portal.supabase.co/storage/v1/object/public/hls/live.m3u8";
      const result = normalizeVideoUrl(url);
      expect(result).not.toBeNull();
      expect(result?.provider).toBe("direct");
      expect(result?.embedUrl).toBe(url);
    });

    it("accepts direct https webm stream on supabase", () => {
      const url = "https://church-portal.supabase.co/storage/v1/object/public/videos/welcome.webm";
      const result = normalizeVideoUrl(url);
      expect(result).not.toBeNull();
      expect(result?.provider).toBe("direct");
      expect(result?.embedUrl).toBe(url);
    });
  });

  describe("Security Rejections and Edge Cases", () => {
    it("rejects non-https URLs (returns null)", () => {
      expect(normalizeVideoUrl("http://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBeNull();
      expect(normalizeVideoUrl("http://church-portal.supabase.co/video.mp4")).toBeNull();
    });

    it("rejects javascript: protocol injection (returns null)", () => {
      expect(normalizeVideoUrl("javascript:alert(1)")).toBeNull();
      expect(normalizeVideoUrl("javascript://youtube.com/watch?v=123")).toBeNull();
    });

    it("rejects data: URLs (returns null)", () => {
      expect(normalizeVideoUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    });

    it("rejects lookalike / phishing domains (returns null)", () => {
      expect(normalizeVideoUrl("https://youtube.com.attacker.org/watch?v=123")).toBeNull();
      expect(normalizeVideoUrl("https://fakeyoutube.com/watch?v=123")).toBeNull();
      expect(normalizeVideoUrl("https://facebook.com.phish.com/video")).toBeNull();
    });

    it("rejects unapproved external hosts for direct streams (returns null)", () => {
      expect(normalizeVideoUrl("https://malicious-video-host.com/video.mp4")).toBeNull();
      expect(normalizeVideoUrl("https://untrusted-cdn.net/stream.m3u8")).toBeNull();
    });

    it("rejects invalid / empty inputs (returns null)", () => {
      expect(normalizeVideoUrl("")).toBeNull();
      expect(normalizeVideoUrl("   ")).toBeNull();
      expect(normalizeVideoUrl("not a url")).toBeNull();
      expect(normalizeVideoUrl(null)).toBeNull();
      expect(normalizeVideoUrl(undefined)).toBeNull();
    });
  });
});

describe("getTrustedEmbedUrl", () => {
  it("trusts youtube-nocookie.com embeds", () => {
    const trusted = getTrustedEmbedUrl("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(trusted).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  });

  it("trusts facebook plugin embeds", () => {
    const trusted = getTrustedEmbedUrl("https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Ffacebook.com");
    expect(trusted).toContain("https://www.facebook.com/plugins/video.php");
  });

  it("trusts supabase storage stream URLs", () => {
    const trusted = getTrustedEmbedUrl("https://abcdef.supabase.co/storage/v1/object/public/videos/stream.mp4");
    expect(trusted).toBe("https://abcdef.supabase.co/storage/v1/object/public/videos/stream.mp4");
  });

  it("returns null for non-https or untrusted hosts", () => {
    expect(getTrustedEmbedUrl("http://youtube-nocookie.com/embed/123")).toBeNull();
    expect(getTrustedEmbedUrl("https://malicious-site.com/embed/123")).toBeNull();
    expect(getTrustedEmbedUrl("javascript:alert(1)")).toBeNull();
    expect(getTrustedEmbedUrl("")).toBeNull();
    expect(getTrustedEmbedUrl(null)).toBeNull();
    expect(getTrustedEmbedUrl(undefined)).toBeNull();
  });
});
