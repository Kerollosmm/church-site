import { createSupabaseServerClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";
import type { WeeklyMassRow } from "./data/seed-data";

/**
 * Direct database reader for the admin console.
 * NEVER falls back to in-memory SEED_MASS_SCHEDULES, ensuring admin counters
 * reflect the authentic physical database row count.
 */
export async function listAdminWeeklyMasses(): Promise<WeeklyMassRow[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("mass_schedules")
      .select("*, altar:altars(id, name_ar, name_en), celebrant:clergy(id, clerical_name_ar, rank_title_ar)")
      .order("day_of_week")
      .order("start_time");

    if (error) {
      console.warn("[mass-admin] session query failed; falling back to service-role client", error.message);
      const admin = createAdminClient();
      const fallback = await admin
        .from("mass_schedules")
        .select("*, altar:altars(id, name_ar, name_en), celebrant:clergy(id, clerical_name_ar, rank_title_ar)")
        .order("day_of_week")
        .order("start_time");
      return (fallback.data as WeeklyMassRow[]) || [];
    }

    return (data as WeeklyMassRow[]) || [];
  } catch (err) {
    console.error("[mass-admin] query error:", err);
    try {
      const admin = createAdminClient();
      const fallback = await admin
        .from("mass_schedules")
        .select("*, altar:altars(id, name_ar, name_en), celebrant:clergy(id, clerical_name_ar, rank_title_ar)")
        .order("day_of_week")
        .order("start_time");
      return (fallback.data as WeeklyMassRow[]) || [];
    } catch {
      return [];
    }
  }
}
