// packages/data-access/src/__tests__/migration-17-sql.test.ts
// Verifies Migration 17 narrows the staff role model: new signups start inactive, is_staff() /
// is_editor() cover exactly admin + secretary, and no write policy is left on is_staff().

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION_FILE = "20260919100000_staff_role_narrowing.sql";

describe("Migration 17 (20260919100000_staff_role_narrowing.sql) Sanity", () => {
  const migrationsDir = path.resolve(process.cwd(), "supabase/migrations");
  const migrationPath = path.join(migrationsDir, MIGRATION_FILE);
  const readmePath = path.resolve(process.cwd(), "supabase/README.md");

  it("is the 17th migration in filename order", async () => {
    const files = await readdir(migrationsDir);
    const sqlFiles = files.filter((f) => f.endsWith(".sql")).sort();
    expect(sqlFiles[16]).toBe(MIGRATION_FILE);
  });

  it("creates every new profile INACTIVE so a stray signup grants nothing", async () => {
    const sql = await readFile(migrationPath, "utf-8");

    expect(sql).toContain("CREATE OR REPLACE FUNCTION handle_new_user()");
    expect(sql).toContain("INSERT INTO profiles (id, full_name_ar, role, is_active)");
    expect(sql).toMatch(/'servant',\s*FALSE\s*\)/);
  });

  it("narrows is_staff() and defines is_editor() over exactly admin + secretary", async () => {
    const sql = await readFile(migrationPath, "utf-8");

    expect(sql).toContain("CREATE OR REPLACE FUNCTION is_staff()");
    expect(sql).toContain("CREATE OR REPLACE FUNCTION is_editor()");

    // Neither predicate may list a role beyond the two the admin app admits. Comment lines are
    // stripped first, so prose inside the migration cannot satisfy (or trip) this check.
    const code = sql
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("--"))
      .join("\n");
    const roleLists = code.match(/role IN \([^)]*\)/g) ?? [];
    expect(roleLists).toHaveLength(2);
    for (const list of roleLists) {
      expect(list).toContain("'admin', 'secretary'");
      expect(list).not.toContain("servant");
      expect(list).not.toContain("priest");
    }
  });

  it("leaves no write policy on is_staff() — writes are is_editor() only", async () => {
    const sql = await readFile(migrationPath, "utf-8");

    expect(sql).not.toContain("WITH CHECK (is_staff())");
    expect(sql).toContain("WITH CHECK (is_editor())");
    // Reads keep the read predicate, on the two staff-readable tables re-written here.
    expect(sql).toContain('CREATE POLICY "Staff read audit log" ON audit_log FOR SELECT TO authenticated USING (is_staff());');
    expect(sql).toContain('CREATE POLICY "Staff read subscribers" ON subscribers FOR SELECT TO authenticated USING (is_staff());');
  });

  it("re-points the full set of 'Staff manage' write policies", async () => {
    const sql = await readFile(migrationPath, "utf-8");
    const recreated = sql.match(/CREATE POLICY "Staff manage [^"]+"/g) ?? [];

    expect(recreated).toHaveLength(24);
    expect(sql).toContain('"Staff manage condolence_bookings"');
    expect(sql).toContain('"Staff manage contact_messages"');
    expect(sql).toContain('"Staff manage media"');
    expect(sql).toContain('"Staff manage events"');
  });

  it("documents migration 17 in supabase/README.md", async () => {
    const readme = await readFile(readmePath, "utf-8");
    expect(readme).toContain(MIGRATION_FILE);
    expect(readme).toContain("is_editor()");
    expect(readme).toContain("is_active = TRUE WHERE id = '<uuid-of-first-admin>'");
  });
});
