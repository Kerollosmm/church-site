// packages/data-access/src/__tests__/read-or-seed.test.ts
// Unit tests for readOrSeed production database integrity (Phase 5 - Step B).

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readOrSeed } from "../queries";

describe("readOrSeed - Production Integrity & Seed Fallback", () => {
  const originalEnv = { ...process.env };
  const mockSeed = Object.freeze([{ id: "seed_1", name: "كنيسة تجريبية" }]);

  beforeEach(() => {
    vi.restoreAllMocks();
    // Start with a clean env state
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("Zero-environment mode (SSG / offline build)", () => {
    it("returns a mutable copy of seed data without calling read function", async () => {
      const readSpy = vi.fn();

      const result = await readOrSeed("getMockData", mockSeed, readSpy);

      expect(readSpy).not.toHaveBeenCalled();
      expect(result).toEqual(mockSeed);
      expect(result).not.toBe(mockSeed); // Defensive copy

      // Ensure mutating returned array does not corrupt original seed
      result.push({ id: "seed_2", name: "مذبح إضافي" });
      expect(mockSeed).toHaveLength(1);
    });
  });

  describe("Development / Test mode with Supabase configured", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
      process.env.NODE_ENV = "test";
    });

    it("returns live query data when query succeeds with rows", async () => {
      const liveData = [{ id: "live_1", name: "بيانات حية" }];
      const readOutcome = async () => ({
        data: liveData,
        error: null,
      });

      const result = await readOrSeed("getMockData", mockSeed, readOutcome);
      expect(result).toEqual(liveData);
    });

    it("falls back to seed data when live query returns PostgREST error", async () => {
      const readOutcome = async () => ({
        data: null,
        error: { message: "relation does not exist", code: "42P01" },
      });

      const result = await readOrSeed("getMockData", mockSeed, readOutcome);
      expect(result).toEqual(mockSeed);
      expect(result).not.toBe(mockSeed);
    });

    it("falls back to seed data when live query returns empty rows", async () => {
      const readOutcome = async () => ({
        data: [],
        error: null,
      });

      const result = await readOrSeed("getMockData", mockSeed, readOutcome);
      expect(result).toEqual(mockSeed);
      expect(result).not.toBe(mockSeed);
    });

    it("falls back to seed data when read callback throws an unexpected error", async () => {
      const readOutcome = async () => {
        throw new Error("Network socket hangup");
      };

      const result = await readOrSeed("getMockData", mockSeed, readOutcome);
      expect(result).toEqual(mockSeed);
      expect(result).not.toBe(mockSeed);
    });
  });

  describe("Production mode (NODE_ENV=production) with Supabase configured", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://prod.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "prod-anon-key";
      process.env.NODE_ENV = "production";
    });

    it("returns live query data when query succeeds", async () => {
      const liveData = [{ id: "prod_live_1", name: "مواعيد قداسات مؤكدة" }];
      const readOutcome = async () => ({
        data: liveData,
        error: null,
      });

      const result = await readOrSeed("getMassSchedules", mockSeed, readOutcome);
      expect(result).toEqual(liveData);
    });

    it("throws immediately on PostgREST error instead of silently serving seed data", async () => {
      const readOutcome = async () => ({
        data: null,
        error: { message: "database connection terminated", code: "57P01" },
      });

      await expect(
        readOrSeed("getMassSchedules", mockSeed, readOutcome)
      ).rejects.toThrow(
        "[data-access] getMassSchedules: live query failed or returned no rows in production — refusing to serve seed data; check DB connectivity."
      );
    });

    it("throws immediately on empty result set in production", async () => {
      const readOutcome = async () => ({
        data: [],
        error: null,
      });

      await expect(
        readOrSeed("getNewsArticles", mockSeed, readOutcome)
      ).rejects.toThrow(
        "[data-access] getNewsArticles: live query failed or returned no rows in production — refusing to serve seed data; check DB connectivity."
      );
    });

    it("throws immediately when read callback throws an unexpected exception", async () => {
      const readOutcome = async () => {
        throw new Error("Fetch failed: ETIMEDOUT");
      };

      await expect(
        readOrSeed("getClergy", mockSeed, readOutcome)
      ).rejects.toThrow(
        "[data-access] getClergy: live query failed or returned no rows in production — refusing to serve seed data; check DB connectivity."
      );
    });

    it("still permits seed data in production if NO Supabase environment is configured (static zero-env build)", async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const readSpy = vi.fn();
      const result = await readOrSeed("getPublicServices", mockSeed, readSpy);

      expect(readSpy).not.toHaveBeenCalled();
      expect(result).toEqual(mockSeed);
    });
  });
});
