// apps/admin/src/lib/auth/require-staff.ts
// Defense-in-depth authorization for the administrative application.

import { redirect } from "next/navigation";
import { createSupabaseServerClient, hasSupabaseEnv } from "@church-site/data-access";
import { isAdminPortalRole, type AdminPortalRole } from "./roles";

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
    redirect("/login");
  }
  return session;
}
