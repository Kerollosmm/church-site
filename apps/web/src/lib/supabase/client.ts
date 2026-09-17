import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Browser Supabase client (anon key, constrained by RLS).
 *
 * The client is created WITHOUT type arguments and the intended type is declared on this
 * signature instead: see the explanation in `src/lib/supabase/server.ts` (the installed
 * `@supabase/ssr` and `@supabase/supabase-js` versions disagree on `SupabaseClient`'s generic
 * parameters, so passing `<Database>` collapses every row type to `never`).
 *
 * Environment validation is LAZY and deferred to call time. In a no-env deployment the
 * client is never created because no component currently mounts a browser session, and
 * every caller must keep this call behind user interaction.
 */
export function createSupabaseBrowserClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || url.trim().length === 0) {
    throw new Error(
      'Missing required environment variable "NEXT_PUBLIC_SUPABASE_URL". Set it before creating a browser Supabase session (see BACKEND_AND_DATA_SPEC.md §9.1).'
    );
  }
  if (!anonKey || anonKey.trim().length === 0) {
    throw new Error(
      'Missing required environment variable "NEXT_PUBLIC_SUPABASE_ANON_KEY". Set it before creating a browser Supabase session (see BACKEND_AND_DATA_SPEC.md §9.1).'
    );
  }

  return createBrowserClient(url, anonKey);
}
