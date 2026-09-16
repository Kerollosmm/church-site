import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/env";

/**
 * Service-role Supabase client (server-only, bypasses RLS).
 *
 * Used exclusively by the public write path (contact / enrollment / condolence bookings),
 * per BACKEND_AND_DATA_SPEC.md §7. Validation is LAZY — it runs at call time so the module
 * can be imported by a no-env build without throwing.
 */
export function createAdminClient() {
  return createClient<Database>(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
