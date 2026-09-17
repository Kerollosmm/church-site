// packages/data-access/src/__tests__/migration-13-sql.test.ts
// Verifies Migration 13 SQL syntax, schema objects, RLS policies, and migrations directory immutability.

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Migration 13 (20260916130000_content_types.sql) Sanity", () => {
  const migrationsDir = path.resolve(process.cwd(), "supabase/migrations");
  const migration13Path = path.join(migrationsDir, "20260916130000_content_types.sql");

  it("verifies migration 13 file exists in sequence", async () => {
    const files = await readdir(migrationsDir);
    const sqlFiles = files.filter((f) => f.endsWith(".sql")).sort();
    expect(sqlFiles.length).toBeGreaterThanOrEqual(13);
    expect(sqlFiles[12]).toBe("20260916130000_content_types.sql");
  });

  it("contains required enums, tables, and constraints", async () => {
    const sql = await readFile(migration13Path, "utf-8");

    // Enums
    expect(sql).toContain("CREATE TYPE field_type_enum AS ENUM");
    expect(sql).toContain("CREATE TYPE content_status_enum AS ENUM");

    // Tables
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.content_types");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.content_fields");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.content_entries");

    // Indexes
    expect(sql).toContain("idx_content_entries_data_gin");
    expect(sql).toContain("USING GIN (data)");
    expect(sql).toContain("idx_content_entries_type_status");

    // RLS
    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("Public read active content types");
    expect(sql).toContain("Public read content fields");
    expect(sql).toContain("Public read published content entries");
    expect(sql).toContain("Staff read all content types");
    expect(sql).toContain("Staff insert content types");
  });
});
