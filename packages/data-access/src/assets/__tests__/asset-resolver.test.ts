// packages/data-access/src/assets/__tests__/asset-resolver.test.ts
// Unit tests for external asset resolution and security controls

import { describe, expect, it } from "vitest";
import {
  ASSET_ALLOWED_HOSTS,
  isHostAllowed,
  isResolvedAsset,
  resolveExternalImageUrl,
} from "../index";

describe("isHostAllowed", () => {
  it("allows exact pinned hostnames", () => {
    expect(isHostAllowed("i.ytimg.com")).toBe(true);
    expect(isHostAllowed("img.youtube.com")).toBe(true);
    expect(isHostAllowed("drive.usercontent.google.com")).toBe(true);
    expect(isHostAllowed("ytimg.com")).toBe(true);
    expect(isHostAllowed("googleusercontent.com")).toBe(true);
  });

  it("allows wildcard subdomains", () => {
    expect(isHostAllowed("i1.ytimg.com")).toBe(true);
    expect(isHostAllowed("i2.ytimg.com")).toBe(true);
    expect(isHostAllowed("i4.ytimg.com")).toBe(true);
    expect(isHostAllowed("lh3.googleusercontent.com")).toBe(true);
    expect(isHostAllowed("images.googleusercontent.com")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isHostAllowed("I.YTIMG.COM")).toBe(true);
    expect(isHostAllowed("Drive.UserContent.Google.Com")).toBe(true);
  });

  it("rejects unauthorized and hostile domains", () => {
    expect(isHostAllowed("evil.com")).toBe(false);
    expect(isHostAllowed("attacker-ytimg.com")).toBe(false);
    expect(isHostAllowed("fakeytimg.com")).toBe(false);
    expect(isHostAllowed("ytimg.com.attacker.com")).toBe(false);
    expect(isHostAllowed("notgoogleusercontent.com")).toBe(false);
    expect(isHostAllowed("googleusercontent.com.attacker.com")).toBe(false);
    expect(isHostAllowed("youtube.com")).toBe(false);
    expect(isHostAllowed("drive.google.com")).toBe(false);
  });

  it("handles null, empty, or non-string gracefully", () => {
    expect(isHostAllowed("")).toBe(false);
    expect(isHostAllowed(null as unknown as string)).toBe(false);
    expect(isHostAllowed(undefined as unknown as string)).toBe(false);
  });
});

describe("resolveExternalImageUrl — input sanitization & edge cases", () => {
  it("returns null for empty, null, undefined, or whitespace-only inputs", () => {
    expect(resolveExternalImageUrl("")).toBeNull();
    expect(resolveExternalImageUrl("   ")).toBeNull();
    expect(resolveExternalImageUrl("\t\n")).toBeNull();
    expect(resolveExternalImageUrl(null)).toBeNull();
    expect(resolveExternalImageUrl(undefined)).toBeNull();
    expect(resolveExternalImageUrl(123 as unknown as string)).toBeNull();
  });

  it("returns null for unparseable URLs", () => {
    expect(resolveExternalImageUrl("not-a-valid-url")).toBeNull();
    expect(resolveExternalImageUrl(":///invalid")).toBeNull();
  });

  it("rejects URLs with whitespace or control characters", () => {
    const trailingSpace = resolveExternalImageUrl("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg ");
    expect(trailingSpace?.kind).toBe("unsupported");
    expect(trailingSpace?.reason).toContain("مسافات");

    const leadingSpace = resolveExternalImageUrl(" https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    expect(leadingSpace?.kind).toBe("unsupported");

    const spaceInPath = resolveExternalImageUrl("https://i.ytimg.com/vi/foo bar/hqdefault.jpg");
    expect(spaceInPath?.kind).toBe("unsupported");

    const nullByte = resolveExternalImageUrl("https://i.ytimg.com/vi/\x00/hqdefault.jpg");
    expect(nullByte?.kind).toBe("unsupported");

    const newline = resolveExternalImageUrl("https://i.ytimg.com/vi/\n/hqdefault.jpg");
    expect(newline?.kind).toBe("unsupported");
  });

  it("rejects non-https protocols", () => {
    const httpRes = resolveExternalImageUrl("http://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    expect(httpRes?.kind).toBe("unsupported");
    expect(httpRes?.reason).toContain("https://");

    const jsRes = resolveExternalImageUrl("javascript:alert(1)");
    expect(jsRes?.kind).toBe("unsupported");

    const dataRes = resolveExternalImageUrl("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");
    expect(dataRes?.kind).toBe("unsupported");
  });

  it("rejects URLs with userinfo (credentials)", () => {
    const userinfoRes = resolveExternalImageUrl("https://admin:secret@i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    expect(userinfoRes?.kind).toBe("unsupported");
    expect(userinfoRes?.reason).toContain("userinfo");
  });

  it("rejects URLs with non-standard ports", () => {
    const portRes = resolveExternalImageUrl("https://i.ytimg.com:8080/vi/dQw4w9WgXcQ/hqdefault.jpg");
    expect(portRes?.kind).toBe("unsupported");
    expect(portRes?.reason).toContain("منافذ");

    // Standard port 443 is accepted
    const stdPortRes = resolveExternalImageUrl("https://i.ytimg.com:443/vi/dQw4w9WgXcQ/hqdefault.jpg");
    expect(stdPortRes?.kind).toBe("youtube-thumb");
  });
});

describe("resolveExternalImageUrl — YouTube resolution", () => {
  const videoId = "dQw4w9WgXcQ";
  const expectedThumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  it("resolves standard watch?v= URLs", () => {
    const res = resolveExternalImageUrl(`https://www.youtube.com/watch?v=${videoId}`);
    expect(res).toEqual({
      sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
      resolvedUrl: expectedThumb,
      host: "i.ytimg.com",
      kind: "youtube-thumb",
    });
  });

  it("resolves youtu.be short links", () => {
    const res = resolveExternalImageUrl(`https://youtu.be/${videoId}`);
    expect(res?.resolvedUrl).toBe(expectedThumb);
    expect(res?.kind).toBe("youtube-thumb");
    expect(res?.host).toBe("i.ytimg.com");
  });

  it("resolves YouTube shorts URLs", () => {
    const res = resolveExternalImageUrl(`https://www.youtube.com/shorts/${videoId}`);
    expect(res?.resolvedUrl).toBe(expectedThumb);
    expect(res?.kind).toBe("youtube-thumb");
  });

  it("resolves YouTube embed URLs", () => {
    const res = resolveExternalImageUrl(`https://www.youtube.com/embed/${videoId}`);
    expect(res?.resolvedUrl).toBe(expectedThumb);
    expect(res?.kind).toBe("youtube-thumb");
  });

  it("resolves img.youtube.com /vi/ URLs", () => {
    const res = resolveExternalImageUrl(`https://img.youtube.com/vi/${videoId}/0.jpg`);
    expect(res?.resolvedUrl).toBe(expectedThumb);
    expect(res?.kind).toBe("youtube-thumb");
  });

  it("resolves i.ytimg.com /vi/ URLs", () => {
    const res = resolveExternalImageUrl(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`);
    expect(res?.resolvedUrl).toBe(expectedThumb);
    expect(res?.kind).toBe("youtube-thumb");
  });

  it("preserves resolution with extra query parameters", () => {
    const res = resolveExternalImageUrl(`https://www.youtube.com/watch?v=${videoId}&t=42s&feature=shared`);
    expect(res?.resolvedUrl).toBe(expectedThumb);
    expect(res?.kind).toBe("youtube-thumb");
  });

  it("rejects invalid YouTube IDs on YouTube domains", () => {
    const shortId = resolveExternalImageUrl("https://www.youtube.com/watch?v=too_short");
    expect(shortId?.kind).toBe("unsupported");
    expect(shortId?.reason).toContain("11");

    const channelUrl = resolveExternalImageUrl("https://www.youtube.com/c/ParishChannel");
    expect(channelUrl?.kind).toBe("unsupported");
  });
});

describe("resolveExternalImageUrl — Google Drive resolution", () => {
  const driveId = "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms";
  const expectedResolved = `https://drive.usercontent.google.com/download?id=${driveId}&export=view`;

  it("resolves /file/d/<id>/view URLs", () => {
    const res = resolveExternalImageUrl(`https://drive.google.com/file/d/${driveId}/view?usp=sharing`);
    expect(res).toEqual({
      sourceUrl: `https://drive.google.com/file/d/${driveId}/view?usp=sharing`,
      resolvedUrl: expectedResolved,
      host: "drive.usercontent.google.com",
      kind: "drive",
    });
  });

  it("resolves /uc?id=<id> URLs", () => {
    const res = resolveExternalImageUrl(`https://drive.google.com/uc?id=${driveId}&export=download`);
    expect(res?.resolvedUrl).toBe(expectedResolved);
    expect(res?.kind).toBe("drive");
  });

  it("resolves /open?id=<id> URLs", () => {
    const res = resolveExternalImageUrl(`https://drive.google.com/open?id=${driveId}`);
    expect(res?.resolvedUrl).toBe(expectedResolved);
    expect(res?.kind).toBe("drive");
  });

  it("resolves direct download endpoint on drive.usercontent.google.com", () => {
    const res = resolveExternalImageUrl(`https://drive.usercontent.google.com/download?id=${driveId}&export=view`);
    expect(res?.resolvedUrl).toBe(expectedResolved);
    expect(res?.kind).toBe("drive");
  });

  it("rejects invalid Google Drive IDs (< 20 chars)", () => {
    const res = resolveExternalImageUrl("https://drive.google.com/file/d/invalid_short_id/view");
    expect(res?.kind).toBe("unsupported");
    expect(res?.reason).toContain("Google Drive");
  });

  it("rejects Google Drive folder URLs", () => {
    const res = resolveExternalImageUrl("https://drive.google.com/drive/folders/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs");
    expect(res?.kind).toBe("unsupported");
    expect(res?.reason).toContain("Google Drive");
  });
});

describe("resolveExternalImageUrl — Google Photos honest rejection", () => {
  it("rejects photos.app.goo.gl with specific honest Arabic explanation", () => {
    const res = resolveExternalImageUrl("https://photos.app.goo.gl/abcdef123456");
    expect(res?.kind).toBe("unsupported");
    expect(res?.reason).toBe(
      "روابط مشاركة ألبومات صور Google ليست روابط صور مباشرة وتتطلب واجهة برمجة تطبيقات خاصة. يرجى فتح الصورة ونسخ رابط الصورة المباشر."
    );
  });

  it("rejects photos.google.com share links", () => {
    const res = resolveExternalImageUrl("https://photos.google.com/share/AF1QipNxyz?key=123");
    expect(res?.kind).toBe("unsupported");
    expect(res?.reason).toBe(
      "روابط مشاركة ألبومات صور Google ليست روابط صور مباشرة وتتطلب واجهة برمجة تطبيقات خاصة. يرجى فتح الصورة ونسخ رابط الصورة المباشر."
    );
  });
});

describe("resolveExternalImageUrl — Direct allowlisted images", () => {
  it("passes through images on *.googleusercontent.com", () => {
    const url = "https://lh3.googleusercontent.com/pw/AP1GczNx123456=w800-h600";
    const res = resolveExternalImageUrl(url);
    expect(res).toEqual({
      sourceUrl: url,
      resolvedUrl: url,
      host: "lh3.googleusercontent.com",
      kind: "direct-image",
    });
  });

  it("passes through images on ytimg.com non-video paths", () => {
    const url = "https://i1.ytimg.com/custom/banner.jpg";
    const res = resolveExternalImageUrl(url);
    expect(res?.kind).toBe("direct-image");
    expect(res?.resolvedUrl).toBe(url);
    expect(res?.host).toBe("i1.ytimg.com");
  });
});

describe("resolveExternalImageUrl — Unallowlisted hostile hosts", () => {
  it("rejects hostile hosts naming the host and ASSET_ALLOWED_HOSTS", () => {
    const url = "https://malicious-site.example.org/avatar.png";
    const res = resolveExternalImageUrl(url);
    expect(res?.kind).toBe("unsupported");
    expect(res?.host).toBe("malicious-site.example.org");
    expect(res?.reason).toContain("malicious-site.example.org");
    expect(res?.reason).toContain(ASSET_ALLOWED_HOSTS[0]);
  });
});

describe("isResolvedAsset helper", () => {
  it("identifies valid asset resolutions", () => {
    const youtubeRes = resolveExternalImageUrl("https://youtu.be/dQw4w9WgXcQ");
    expect(isResolvedAsset(youtubeRes)).toBe(true);

    const driveRes = resolveExternalImageUrl("https://drive.google.com/open?id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms");
    expect(isResolvedAsset(driveRes)).toBe(true);

    const directRes = resolveExternalImageUrl("https://lh3.googleusercontent.com/pw/abc");
    expect(isResolvedAsset(directRes)).toBe(true);
  });

  it("identifies failed or rejected resolutions", () => {
    expect(isResolvedAsset(null)).toBe(false);
    expect(isResolvedAsset(undefined)).toBe(false);

    const badHost = resolveExternalImageUrl("https://evil.com/pic.png");
    expect(isResolvedAsset(badHost)).toBe(false);

    const badProtocol = resolveExternalImageUrl("http://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    expect(isResolvedAsset(badProtocol)).toBe(false);
  });
});
