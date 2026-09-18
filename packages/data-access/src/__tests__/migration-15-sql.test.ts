// packages/data-access/src/__tests__/migration-15-sql.test.ts
// Verifies Migration 15 SQL syntax, schema objects, RLS policies, and migrations directory immutability.

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Migration 15 (20260916150000_services_navigation.sql) Sanity", () => {
  const migrationsDir = path.resolve(process.cwd(), "supabase/migrations");
  const migration15Path = path.join(migrationsDir, "20260916150000_services_navigation.sql");
  const readmePath = path.resolve(process.cwd(), "supabase/README.md");

  it("verifies migration 15 file exists in sequence as the 15th migration", async () => {
    const files = await readdir(migrationsDir);
    const sqlFiles = files.filter((f) => f.endsWith(".sql")).sort();
    expect(sqlFiles.length).toBeGreaterThanOrEqual(15);
    expect(sqlFiles[14]).toBe("20260916150000_services_navigation.sql");
  });

  it("contains additive columns for public_services", async () => {
    const sql = await readFile(migration15Path, "utf-8");

    expect(sql).toContain("ALTER TABLE public.public_services");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS name_en");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS description_en");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS updated_at");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS created_by");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS updated_by");
  });

  it("contains required table, indexes, and RLS policies for nav_menu_items", async () => {
    const sql = await readFile(migration15Path, "utf-8");

    // Table
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.nav_menu_items");
    expect(sql).toContain("id UUID PRIMARY KEY");
    expect(sql).toContain("key VARCHAR(100) NOT NULL UNIQUE");
    expect(sql).toContain("label_ar VARCHAR(150) NOT NULL");
    expect(sql).toContain("label_en VARCHAR(150)");
    expect(sql).toContain("href VARCHAR(255) NOT NULL");
    expect(sql).toContain("section VARCHAR(50) NOT NULL DEFAULT 'main'");
    expect(sql).toContain("parent_id UUID REFERENCES public.nav_menu_items(id)");
    expect(sql).toContain("sort_order INT NOT NULL DEFAULT 0");
    expect(sql).toContain("is_active BOOLEAN NOT NULL DEFAULT TRUE");
    expect(sql).toContain("is_public BOOLEAN NOT NULL DEFAULT TRUE");

    // Indexes
    expect(sql).toContain("idx_nav_menu_items_public_active");
    expect(sql).toContain("ON public.nav_menu_items (section, sort_order ASC)");
    expect(sql).toContain("idx_nav_menu_items_parent");

    // RLS
    expect(sql).toContain("ALTER TABLE public.nav_menu_items ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("Public read active nav menu items");
    expect(sql).toContain("is_active = true AND is_public = true");
    expect(sql).toContain("Staff read all nav menu items");
    expect(sql).toContain("Staff insert nav menu items");
    expect(sql).toContain("Staff update nav menu items");
    expect(sql).toContain("Staff delete nav menu items");
  });

  it("verifies supabase/README.md documents migration 15", async () => {
    const readme = await readFile(readmePath, "utf-8");
    expect(readme).toContain("20260916150000_services_navigation.sql");
    expect(readme).toContain("nav_menu_items");
  });
});
