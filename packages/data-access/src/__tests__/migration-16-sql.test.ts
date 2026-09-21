// packages/data-access/src/__tests__/migration-16-sql.test.ts
// Verifies Migration 16 SQL syntax, external assets columns, and documentation.

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION_FILE = "20260916160000_external_assets.sql";

describe("Migration 16 (20260916160000_external_assets.sql) Sanity", () => {
  const migrationsDir = path.resolve(process.cwd(), "supabase/migrations");
  const migration16Path = path.join(migrationsDir, MIGRATION_FILE);
  const readmePath = path.resolve(process.cwd(), "supabase/README.md");

  it("verifies migration 16 file exists and is the 16th SQL migration", async () => {
    const files = await readdir(migrationsDir);
    const sqlFiles = files.filter((f) => f.endsWith(".sql")).sort();
    expect(sqlFiles.length).toBeGreaterThanOrEqual(16);
    expect(sqlFiles[15]).toBe(MIGRATION_FILE);
  });

  it("contains ALTER TABLE public.media with ADD COLUMN IF NOT EXISTS for required fields", async () => {
    const sql = await readFile(migration16Path, "utf-8");

    expect(sql).toContain("ALTER TABLE public.media");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS source_url");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS resolved_url");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS host");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS kind");
  });

  it("verifies supabase/README.md documents migration 16 and external assets", async () => {
    const readme = await readFile(readmePath, "utf-8");
    expect(readme).toContain(MIGRATION_FILE);
    expect(readme).toContain("external assets");
  });
});
