"use server";

import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ProgramApplicationSchema,
  JobApplicationSchema,
} from "@/lib/validations/church-schemas";
import { REVALIDATION_TAGS } from "@/lib/tags";
import { verifyTurnstile } from "@/lib/security/turnstile";

export async function submitProgramApplication(rawInput: unknown) {
  const result = ProgramApplicationSchema.safeParse(rawInput);
  if (!result.success) {
    return {
      success: false as const,
      errors: result.error.flatten().fieldErrors,
      message: "بيانات الاستمارة غير مكتملة، يرجى مراجعة البيانات",
    };
  }

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") ?? undefined;
  if (!(await verifyTurnstile(result.data.turnstileToken, ip))) {
    return { success: false as const, message: "فشل التحقق من الروبوتات، يرجى إعادة المحاولة" };
  }

  try {
    const admin = createAdminClient();
    const { error } = await (admin.from("program_applications") as any).insert({
      program_slug: result.data.programSlug,
      applicant_name: result.data.applicantName,
      applicant_birth_date: result.data.applicantBirthDate || null,
      applicant_stage_ar: result.data.applicantStage || null,
      guardian_name: result.data.guardianName || null,
      guardian_phone: result.data.guardianPhone,
      confession_father_ar: result.data.confessionFather || null,
      requested_level_ar: result.data.requestedLevel || null,
      notes_ar: result.data.notes || null,
      status: "pending",
    });

    if (error) {
      console.error("Error inserting program application:", error);
    }
    revalidateTag(REVALIDATION_TAGS.education);
  } catch (err) {
    console.error("Error submitting program application:", err);
  }

  return {
    success: true as const,
    message: "تم استلام طلب التسجيل بنجاح، وسيتم التواصل معك هاتفياً من إدارة الخدمة قريباً",
  };
}

export async function submitJobApplication(rawInput: unknown) {
  const result = JobApplicationSchema.safeParse(rawInput);
  if (!result.success) {
    return {
      success: false as const,
      errors: result.error.flatten().fieldErrors,
      message: "بيانات طلب التوظيف غير مكتملة",
    };
  }

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") ?? undefined;
  if (!(await verifyTurnstile(result.data.turnstileToken, ip))) {
    return { success: false as const, message: "فشل التحقق من الروبوتات، يرجى إعادة المحاولة" };
  }

  try {
    const admin = createAdminClient();
    const { error } = await (admin.from("job_applications") as any).insert({
      full_name: result.data.fullName,
      phone: result.data.phone,
      email: result.data.email || null,
      profession_ar: result.data.profession,
      experience_years: result.data.experienceYears ?? null,
      cv_url: result.data.cvUrl || null,
      notes_ar: result.data.notes || null,
      status: "pending",
    });

    if (error) {
      console.error("Error inserting job application:", error);
    }
  } catch (err) {
    console.error("Error submitting job application:", err);
  }

  return {
    success: true as const,
    message: "تم استلام سيرتك الذاتية في مكتب التوظيف بنجاح، وسيتم التنسيق معك عند توفر فرصة عمل مناسبة",
  };
}
