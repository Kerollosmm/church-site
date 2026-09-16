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
 * The public portal (INV-01) is never touched by this middleware — the matcher below is
 * restricted to `/admin`, keeping every public route static and zero-auth.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The sign-in page must stay reachable, otherwise nobody could ever authenticate.
  if (pathname === ADMIN_LOGIN_PATH) {
    return NextResponse.next({ request });
  }

  const deny = () => {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = ADMIN_LOGIN_PATH;
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || supabaseUrl.trim().length === 0 || !supabaseAnonKey || supabaseAnonKey.trim().length === 0) {
    // No environment → identity cannot be verified → deny.
    console.error("Admin route denied: Supabase environment is not configured.");
    return deny();
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
      return deny();
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile || !profile.is_active || !isAdminPortalRole(profile.role)) {
      return deny();
    }

    return response;
  } catch (err) {
    console.error("Admin middleware authorization failed:", err);
    return deny();
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
