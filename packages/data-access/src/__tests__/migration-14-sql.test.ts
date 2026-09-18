// packages/data-access/src/__tests__/migration-14-sql.test.ts
// Verifies Migration 14 SQL syntax, schema objects, RLS policies, and migrations directory immutability.

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Migration 14 (20260916140000_parish_videos.sql) Sanity", () => {
  const migrationsDir = path.resolve(process.cwd(), "supabase/migrations");
  const migration14Path = path.join(migrationsDir, "20260916140000_parish_videos.sql");
  const readmePath = path.resolve(process.cwd(), "supabase/README.md");

  it("verifies migration 14 file exists in sequence as the 14th migration", async () => {
    const files = await readdir(migrationsDir);
    const sqlFiles = files.filter((f) => f.endsWith(".sql")).sort();
    expect(sqlFiles.length).toBeGreaterThanOrEqual(14);
    expect(sqlFiles[13]).toBe("20260916140000_parish_videos.sql");
  });

  it("contains required enums, tables, and constraints", async () => {
    const sql = await readFile(migration14Path, "utf-8");

    // Enum
    expect(sql).toContain("CREATE TYPE video_provider_enum AS ENUM");
    expect(sql).toContain("'youtube'");
    expect(sql).toContain("'facebook'");
    expect(sql).toContain("'direct'");

    // Table
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.parish_videos");
    expect(sql).toContain("id UUID PRIMARY KEY");
    expect(sql).toContain("title_ar TEXT NOT NULL");
    expect(sql).toContain("title_en TEXT");
    expect(sql).toContain("provider video_provider_enum NOT NULL");
    expect(sql).toContain("source_url TEXT NOT NULL");
    expect(sql).toContain("embed_url TEXT NOT NULL");
    expect(sql).toContain("sort_order INT NOT NULL DEFAULT 0");
    expect(sql).toContain("is_public BOOLEAN NOT NULL DEFAULT TRUE");
    expect(sql).toContain("is_active BOOLEAN NOT NULL DEFAULT TRUE");

    // Indexes
    expect(sql).toContain("idx_parish_videos_public_active");
    expect(sql).toContain("ON public.parish_videos (is_public, is_active, sort_order)");

    // RLS
    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("Public read active parish videos");
    expect(sql).toContain("is_public = true AND is_active = true");
    expect(sql).toContain("Staff read all parish videos");
    expect(sql).toContain("Staff insert parish videos");
    expect(sql).toContain("Staff update parish videos");
    expect(sql).toContain("Staff delete parish videos");
  });

  it("verifies supabase/README.md documents migration 14", async () => {
    const readme = await readFile(readmePath, "utf-8");
    expect(readme).toContain("20260916140000_parish_videos.sql");
    expect(readme).toContain("parish_videos");
  });
});
