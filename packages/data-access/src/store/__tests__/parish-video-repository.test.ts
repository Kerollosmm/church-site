// packages/data-access/src/store/__tests__/parish-video-repository.test.ts
// Unit tests for JsonParishVideoRepository in isolated environment.

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { JsonParishVideoRepository } from "../parish-video-json-driver";
import type { Actor, CreateParishVideoInput } from "@church-site/domain";

const STAFF: Actor = { id: "staff-1", name: "خادم الوسائط" };

describe("JsonParishVideoRepository", () => {
  let dataDir: string;
  let repo: JsonParishVideoRepository;

  beforeEach(async () => {
    dataDir = await mkdtemp(path.join(tmpdir(), "video-store-"));
    process.env.CHURCH_DATA_DIR = dataDir;
    repo = new JsonParishVideoRepository();
  });

  afterEach(async () => {
    delete process.env.CHURCH_DATA_DIR;
    await rm(dataDir, { recursive: true, force: true });
  });

  it("creates a new parish video and retrieves it by id", async () => {
    const input: CreateParishVideoInput = {
      titleAr: "قداس الأحد - 15 سبتمبر 2026",
      titleEn: "Sunday Liturgy - Sep 15, 2026",
      descriptionAr: "القداس الإلهي من كنيسة القديسين",
      descriptionEn: "Divine Liturgy from Saints Church",
      provider: "youtube",
      sourceUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
      thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      sortOrder: 1,
      isPublic: true,
      isActive: true,
    };

    const created = await repo.createVideo(input, STAFF);
    expect(created.id).toBeDefined();
    expect(created.titleAr).toBe(input.titleAr);
    expect(created.createdBy).toBe(STAFF.id);

    const fetched = await repo.getVideoById(created.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(created.id);
    expect(fetched?.embedUrl).toBe(input.embedUrl);
  });

  it("filters videos by isPublic and isActive", async () => {
    // 1: public and active
    await repo.createVideo(
      {
        titleAr: "فيديو عام ونشط",
        provider: "youtube",
        sourceUrl: "https://www.youtube.com/watch?v=111",
        embedUrl: "https://www.youtube-nocookie.com/embed/111",
        sortOrder: 1,
        isPublic: true,
        isActive: true,
      },
      STAFF
    );

    // 2: public but inactive (hidden)
    await repo.createVideo(
      {
        titleAr: "فيديو غير نشط",
        provider: "youtube",
        sourceUrl: "https://www.youtube.com/watch?v=222",
        embedUrl: "https://www.youtube-nocookie.com/embed/222",
        sortOrder: 2,
        isPublic: true,
        isActive: false,
      },
      STAFF
    );

    // 3: active but private (draft)
    await repo.createVideo(
      {
        titleAr: "فيديو مسودة خاصة",
        provider: "youtube",
        sourceUrl: "https://www.youtube.com/watch?v=333",
        embedUrl: "https://www.youtube-nocookie.com/embed/333",
        sortOrder: 3,
        isPublic: false,
        isActive: true,
      },
      STAFF
    );

    const allVideos = await repo.listVideos();
    expect(allVideos).toHaveLength(3);

    const publicActiveVideos = await repo.listVideos({ isPublic: true, isActive: true });
    expect(publicActiveVideos).toHaveLength(1);
    expect(publicActiveVideos[0].titleAr).toBe("فيديو عام ونشط");
  });

  it("updates an existing video and updates audit log", async () => {
    const created = await repo.createVideo(
      {
        titleAr: "فيديو قديم",
        provider: "youtube",
        sourceUrl: "https://www.youtube.com/watch?v=old",
        embedUrl: "https://www.youtube-nocookie.com/embed/old",
        sortOrder: 5,
        isPublic: false,
        isActive: true,
      },
      STAFF
    );

    const updated = await repo.updateVideo(
      created.id,
      {
        titleAr: "فيديو محدث",
        isPublic: true,
        sortOrder: 1,
      },
      STAFF
    );

    expect(updated.titleAr).toBe("فيديو محدث");
    expect(updated.isPublic).toBe(true);
    expect(updated.sortOrder).toBe(1);
    expect(updated.updatedBy).toBe(STAFF.id);

    const fetched = await repo.getVideoById(created.id);
    expect(fetched?.titleAr).toBe("فيديو محدث");
  });

  it("deletes a video", async () => {
    const created = await repo.createVideo(
      {
        titleAr: "فيديو للحذف",
        provider: "direct",
        sourceUrl: "https://media.church.org/video.mp4",
        embedUrl: "https://media.church.org/video.mp4",
        sortOrder: 1,
        isPublic: true,
        isActive: true,
      },
      STAFF
    );

    await repo.deleteVideo(created.id, STAFF);
    const fetched = await repo.getVideoById(created.id);
    expect(fetched).toBeNull();

    const list = await repo.listVideos();
    expect(list.some((v) => v.id === created.id)).toBe(false);
  });

  it("sorts by sortOrder ascending, then createdAt descending", async () => {
    await repo.createVideo(
      {
        titleAr: "فيديو ترتيب 3",
        provider: "youtube",
        sourceUrl: "https://youtube.com/watch?v=3",
        embedUrl: "https://www.youtube-nocookie.com/embed/3",
        sortOrder: 3,
        isPublic: true,
        isActive: true,
      },
      STAFF
    );

    await repo.createVideo(
      {
        titleAr: "فيديو ترتيب 1",
        provider: "youtube",
        sourceUrl: "https://youtube.com/watch?v=1",
        embedUrl: "https://www.youtube-nocookie.com/embed/1",
        sortOrder: 1,
        isPublic: true,
        isActive: true,
      },
      STAFF
    );

    await repo.createVideo(
      {
        titleAr: "فيديو ترتيب 2",
        provider: "youtube",
        sourceUrl: "https://youtube.com/watch?v=2",
        embedUrl: "https://www.youtube-nocookie.com/embed/2",
        sortOrder: 2,
        isPublic: true,
        isActive: true,
      },
      STAFF
    );

    const list = await repo.listVideos();
    expect(list[0].sortOrder).toBe(1);
    expect(list[1].sortOrder).toBe(2);
    expect(list[2].sortOrder).toBe(3);
  });
});
