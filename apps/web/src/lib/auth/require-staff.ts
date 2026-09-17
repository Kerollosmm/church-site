// src/lib/auth/require-staff.ts
// Defense-in-depth authorization for the /admin area.
//
// The middleware (src/middleware.ts) is the first gate, but MIDDLEWARE ALONE IS NEVER ENOUGH:
// Server Actions, Route Handlers and Server Components can be reached by paths the matcher does
// not cover, and a misconfigured matcher fails open silently. Every administrative read/write and
// every admin page therefore re-runs `requireStaff()` server-side.

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { isAdminPortalRole, type AdminPortalRole } from "@/lib/auth/roles";

export interface StaffSession {
  userId: string;
  email: string | null;
  fullNameAr: string;
  role: AdminPortalRole;
}

/**
 * Resolves the current staff session, or null when access must be denied.
 * FAILS CLOSED: no Supabase environment, no user, no profile, an inactive profile,
 * an unknown profile or any thrown error all resolve to null (denied).
 */
export async function getStaffSession(): Promise<StaffSession | null> {
  if (!hasSupabaseEnv()) {
    // Identity cannot be verified → regardless of role, deny.
    console.error("Staff session check denied: Supabase environment is not configured.");
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData?.user;
    if (userError || !user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, full_name_ar, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile || !profile.is_active) {
      return null;
    }

    if (!isAdminPortalRole(profile.role)) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email ?? null,
      fullNameAr: profile.full_name_ar,
      role: profile.role,
    };
  } catch (err) {
    console.error("Staff session check failed:", err);
    return null;
  }
}

/**
 * Guard for administrative pages and Server Actions.
 * Redirects to the staff sign-in page when the session is missing or not permitted.
 */
export async function requireStaff(): Promise<StaffSession> {
  const session = await getStaffSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}
