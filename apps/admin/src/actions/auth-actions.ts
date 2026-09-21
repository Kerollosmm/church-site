"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@church-site/data-access";
import { StaffSignInSchema } from "@/lib/validations/auth-schema";
import { isAdminPortalRole } from "@/lib/auth/roles";

export interface StaffAuthResult {
  success: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
}

/**
 * Signs a staff member in and verifies that the account is allowed into the admin area.
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

/**
 * Ends the staff session and returns to the sign-in page.
 */
export async function signOut(): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Staff sign-out error:", error);
    }
  } catch (err) {
    console.error("Staff sign-out failed:", err);
  }

  redirect("/login?reason=signed-out");
}

/**
 * Confirms an active staff session on the server side, forces full layout revalidation,
 * and yields the target destination URL, eliminating manual page refreshes.
 */
export async function confirmSessionAction(
  targetUrl: string = "/masses"
): Promise<{ success: boolean; targetUrl: string; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        success: false,
        targetUrl,
        error: "تعذر التحقق من جلسة المستخدم",
      };
    }

    revalidatePath("/", "layout");
    return {
      success: true,
      targetUrl,
    };
  } catch (err) {
    console.error("Confirm session failed:", err);
    return {
      success: false,
      targetUrl,
      error: "حدث خطأ أثناء تأكيد الجلسة",
    };
  }
}
