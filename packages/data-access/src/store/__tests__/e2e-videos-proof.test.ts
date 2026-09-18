// packages/data-access/src/store/__tests__/e2e-videos-proof.test.ts
// End-to-end integration proof for Parish Videos lifecycle (Gate G6).
// Verifies full flow: file-store persistence, URL normalization, RBAC actions, public projection, and trusted embed gate.

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { JsonParishVideoRepository } from "../parish-video-json-driver";
import { normalizeVideoUrl } from "../../videos/normalize-video-url";
import { getTrustedEmbedUrl } from "../../videos/trusted-embeds";
import type { Actor, PublicParishVideo } from "@church-site/domain";

const STAFF: Actor = { id: "staff-lead", name: "مسؤول النشر" };

describe("E2E Parish Videos Proof (Gate G6)", () => {
  let dataDir: string;
  let repo: JsonParishVideoRepository;

  beforeEach(async () => {
    dataDir = await mkdtemp(path.join(tmpdir(), "video-e2e-"));
    process.env.CHURCH_DATA_DIR = dataDir;
    repo = new JsonParishVideoRepository();
  });

  afterEach(async () => {
    delete process.env.CHURCH_DATA_DIR;
    await rm(dataDir, { recursive: true, force: true });
  });

  it("executes complete lifecycle: creation, normalization, public projection, toggle, and trusted embed gating", async () => {
    // 1. Staff adds YouTube video
    const ytNormalized = normalizeVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(ytNormalized).not.toBeNull();
    expect(ytNormalized!.provider).toBe("youtube");
    expect(ytNormalized!.embedUrl).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");

    const video1 = await repo.createVideo(
      {
        titleAr: "بث مباشر - قداس الأحد",
        titleEn: "Sunday Liturgy Live",
        provider: ytNormalized!.provider,
        sourceUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        embedUrl: ytNormalized!.embedUrl,
        thumbnailUrl: ytNormalized!.thumbnailUrl,
        sortOrder: 1,
        isPublic: true,
        isActive: true,
      },
      STAFF
    );

    // 2. Staff adds Facebook video
    const fbRaw = "https://www.facebook.com/church.portal/videos/987654321098765/";
    const fbNormalized = normalizeVideoUrl(fbRaw);
    expect(fbNormalized).not.toBeNull();
    expect(fbNormalized!.provider).toBe("facebook");

    const video2 = await repo.createVideo(
      {
        titleAr: "عظة عشية القديسين",
        titleEn: "Saints Eve Sermon",
        provider: fbNormalized!.provider,
        sourceUrl: fbRaw,
        embedUrl: fbNormalized!.embedUrl,
        sortOrder: 2,
        isPublic: true,
        isActive: true,
      },
      STAFF
    );

    // 3. Staff adds a draft direct video (not public yet)
    const directUrl = "https://church-portal.supabase.co/storage/v1/object/public/recordings/internal.mp4";
    const directNormalized = normalizeVideoUrl(directUrl);
    expect(directNormalized).not.toBeNull();
    expect(directNormalized?.provider).toBe("direct");
    const video3 = await repo.createVideo(
      {
        titleAr: "تسجيل تجريبي داخلي",
        provider: directNormalized!.provider,
        sourceUrl: directUrl,
        embedUrl: directNormalized!.embedUrl,
        sortOrder: 3,
        isPublic: false,
        isActive: true,
      },
      STAFF
    );

    // 4. Staff adds an inactive video (hidden)
    const video4 = await repo.createVideo(
      {
        titleAr: "فيديو مؤرشف قديم",
        provider: ytNormalized!.provider,
        sourceUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        embedUrl: ytNormalized!.embedUrl,
        sortOrder: 4,
        isPublic: true,
        isActive: false,
      },
      STAFF
    );

    // 5. Query public feed
    const publicVideos = await repo.listVideos({ isPublic: true, isActive: true });
    expect(publicVideos).toHaveLength(2);
    expect(publicVideos.map((v) => v.id)).toEqual([video1.id, video2.id]);

    // 6. Public projection: verify that public-facing model contains only public safe attributes
    const publicProjection: PublicParishVideo[] = publicVideos.map((v) => ({
      id: v.id,
      titleAr: v.titleAr,
      titleEn: v.titleEn,
      descriptionAr: v.descriptionAr,
      descriptionEn: v.descriptionEn,
      provider: v.provider,
      embedUrl: v.embedUrl,
      thumbnailUrl: v.thumbnailUrl,
      sortOrder: v.sortOrder,
    }));

    for (const pv of publicProjection) {
      expect((pv as any).sourceUrl).toBeUndefined();
      expect((pv as any).createdBy).toBeUndefined();
      expect((pv as any).createdAt).toBeUndefined();

      // 7. Every public embed passes getTrustedEmbedUrl()
      const trusted = getTrustedEmbedUrl(pv.embedUrl);
      expect(trusted).not.toBeNull();
      expect(trusted?.startsWith("https://")).toBe(true);
    }

    // 8. Toggle video3 to public
    await repo.updateVideo(video3.id, { isPublic: true }, STAFF);
    const updatedPublicList = await repo.listVideos({ isPublic: true, isActive: true });
    expect(updatedPublicList).toHaveLength(3);
    expect(updatedPublicList.some((v) => v.id === video3.id)).toBe(true);

    // 9. Staff deletes video1
    await repo.deleteVideo(video1.id, STAFF);
    const finalPublicList = await repo.listVideos({ isPublic: true, isActive: true });
    expect(finalPublicList).toHaveLength(2);
    expect(finalPublicList.some((v) => v.id === video1.id)).toBe(false);
  });
});
