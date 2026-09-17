import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@church-site/domain";
import { getSupabaseAnonKey, getSupabaseUrl } from "../env";

/**
 * Session-aware Supabase client for Server Components and Server Actions.
 *
 * The client is created WITHOUT type arguments and the intended type is declared on this
 * signature instead, because the installed versions disagree on `SupabaseClient`'s generics:
 * `@supabase/ssr@0.5.2` returns `SupabaseClient<Database, SchemaName, Schema>`, while
 * `@supabase/supabase-js@2.116` redefined that class so its THIRD parameter is the schema NAME
 * (a string). Passing `<Database>` therefore lands the schema object in the schema-name slot and
 * collapses the row type to `never`, which is why every query in this repository used to need an
 * `as any` cast. Declaring the type here restores fully typed `.from(table).select(...)` for all
 * callers (`src/lib/queries.ts`, the Server Actions and the `/admin` guards).
 *
 * Environment validation is LAZY: it happens here, at call time, so importing this module
 * never throws and a no-env build/prerender still succeeds. Callers that must survive a
 * missing environment (the query layer in `src/lib/queries.ts`) wrap the call in try/catch
 * and fall back to the seeded dataset.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component context cannot write cookies
        }
      },
    },
  });
}


