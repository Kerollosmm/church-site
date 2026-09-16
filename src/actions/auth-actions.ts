"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { StaffSignInSchema } from "@/lib/validations/church-schemas";
import { isAdminPortalRole } from "@/lib/auth/roles";

export interface StaffAuthResult {
  success: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
}

/**
 * Signs a staff member in and verifies that the account is allowed into `/admin`.
 *
 * Fails closed: a session for a role outside `ADMIN_PORTAL_ROLES` (or an inactive profile)
 * is signed out again and reported as denied, so holding any valid parish credential is not
 * enough to reach the management area.
 */
export async function signIn(rawInput: unknown): Promise<StaffAuthResult> {
  const result = StaffSignInSchema.safeParse(rawInput);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
      message: "يرجى إدخال البريد الإلكتروني وكلمة المرور بشكل صحيح",
    };
  }

  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: result.data.email,
      password: result.data.password,
    });

    if (error || !data.user) {
      console.error("Staff sign-in rejected:", error?.message);
      return {
        success: false,
        message: "بيانات الدخول غير صحيحة، يرجى التأكد من البريد الإلكتروني وكلمة المرور",
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError || !profile || !profile.is_active || !isAdminPortalRole(profile.role)) {
      await supabase.auth.signOut();
      return {
        success: false,
        message:
          "هذا الحساب لا يملك صلاحية الدخول إلى لوحة الإدارة، يرجى مراجعة مسؤول الطاقم بالكنيسة",
      };
    }

    return { success: true };
  } catch (err) {
    console.error("Staff sign-in failed:", err);
    return {
      success: false,
      message: "خدمة الدخول غير مفعّلة على هذا الموقع حالياً، يرجى التواصل مع مسؤول الطاقم بالكنيسة",
    };
  }
}

/** Ends the staff session and returns to the sign-in page. */
export async function signOut(): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Staff sign-out error:", error);
    }
  } catch (err) {
    // A missing environment means there is no session to end; still send the user to the sign-in page.
    console.error("Staff sign-out failed:", err);
  }

  redirect("/admin/login");
}
