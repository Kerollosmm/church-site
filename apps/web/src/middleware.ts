import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminPortalRole } from "@/lib/auth/roles";

const ADMIN_LOGIN_PATH = "/admin/login";

/**
 * Guards the `/admin` management area.
 *
 * Follows the official `@supabase/ssr` middleware pattern: build a server client from the
 * request/response cookies, refresh the session (the cookie writes must be returned on the
 * response) and verify the user with `supabase.auth.getUser()`. The gate then re-reads
 * `profiles.role` and allows only `admin` / `secretary` (see `src/lib/auth/roles.ts`).
 *
 * FAILS CLOSED: if the Supabase environment is missing, the user is unresolvable, or the role
 * lookup errors, the request is redirected to the sign-in page instead of being granted access.
 *
 * WHY THE REDIRECT CARRIES `?reason=`: a bounce to the sign-in page is the moment a staff member
 * most needs to understand what happened. "The session ended" and "this account may not enter" are
 * different answers with different fixes, so the reason travels in the query string and the sign-in
 * page renders it (see `SignInNotice.tsx`).
 *
 * The public portal (INV-01) is never touched by this middleware — the matcher below is
 * restricted to `/admin`, keeping every public route static and zero-auth.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The sign-in page must stay reachable, otherwise nobody could ever authenticate.
  if (pathname === ADMIN_LOGIN_PATH) {
    return NextResponse.next({ request });
  }

  /**
   * `session` — no verifiable session (missing environment, expired cookie, auth error).
   * `role`    — the session is valid but the account is not allowed into `/admin`.
   */
  const deny = (reason: "session" | "role") => {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = ADMIN_LOGIN_PATH;
    loginUrl.search = "";
    loginUrl.searchParams.set("reason", reason);
    return NextResponse.redirect(loginUrl);
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || supabaseUrl.trim().length === 0 || !supabaseAnonKey || supabaseAnonKey.trim().length === 0) {
    // No environment → identity cannot be verified → deny.
    console.error("Admin route denied: Supabase environment is not configured.");
    return deny("session");
  }

  try {
    let response = NextResponse.next({ request });

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return deny("session");
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile || !profile.is_active || !isAdminPortalRole(profile.role)) {
      return deny("role");
    }

    return response;
  } catch (err) {
    console.error("Admin middleware authorization failed:", err);
    return deny("session");
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
