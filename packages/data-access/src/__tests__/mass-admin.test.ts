import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSelect = vi.fn();
vi.mock("../supabase/server", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    from: () => ({
      select: mockSelect,
    }),
  }),
}));

vi.mock("../supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: mockSelect,
    }),
  }),
}));

describe("listAdminWeeklyMasses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries mass_schedules directly and returns empty array when table has 0 rows without seed fallback", async () => {
    mockSelect.mockReturnValue({
      order: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });

    const { listAdminWeeklyMasses } = await import("../mass-admin");
    const result = await listAdminWeeklyMasses();
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });
});
