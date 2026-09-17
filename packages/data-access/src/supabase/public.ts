// src/lib/supabase/public.ts
// Cookie-independent Supabase client for PUBLIC reads.

import { createClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "../env";

/**
 * Anonymous, session-less Supabase client for the public read path (`src/lib/queries.ts`).
 *
 * WHY THIS EXISTS: `unstable_cache` callbacks run OUTSIDE the request scope, so they must not
 * touch dynamic APIs. The session-aware client in `src/lib/supabase/server.ts` starts with
 * `await cookies()`, which threw inside the cache scope of every cached query — the throw was
 * swallowed by the query's try/catch and the seeded dataset was cached in its place, so the
 * cache never actually held database data and the failure was invisible.
 *
 * Public content (altars, schedules, meetings, donations, …) is readable with the anon key under
 * the public RLS policies of BACKEND_AND_DATA_SPEC.md §5.2, so the query layer uses this client:
 * no cookies, no session, no dynamic API, fully cacheable. Staff-scoped reads that DO depend on
 * the session (e.g. `getCondolenceBookings()`) must keep using `createSupabaseServerClient()`.
 *
 * Environment validation is LAZY (it happens here, at call time), so importing this module never
 * throws and a no-env build still succeeds.
 */
export function createPublicSupabaseClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
