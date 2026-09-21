"use server";

import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { MissingEnvVarError } from "@/lib/env";
import {
  ProgramApplicationSchema,
  JobApplicationSchema,
} from "@/lib/validations/church-schemas";
import { REVALIDATION_TAGS } from "@/lib/tags";
import { verifyTurnstile } from "@/lib/security/turnstile";
import {
  RATE_LIMIT_MESSAGE_AR,
  checkPublicWriteRateLimit,
  getClientIp,
} from "@/lib/security/rate-limit";

export async function submitProgramApplication(rawInput: unknown) {
  const headerList = await headers();
  const ip = getClientIp(headerList);

  // Best-effort per-instance rate limit with 15s burst protection — see src/lib/security/rate-limit.ts.
  if (!checkPublicWriteRateLimit("enrollment", ip).allowed) {
    return { success: false as const, message: RATE_LIMIT_MESSAGE_AR };
  }

  const result = ProgramApplicationSchema.safeParse(rawInput);
  if (!result.success) {
    return {
      success: false as const,
      errors: result.error.flatten().fieldErrors,
      message: "بيانات الاستمارة غير مكتملة، يرجى مراجعة البيانات",
    };
  }

  if (!(await verifyTurnstile(result.data.turnstileToken, ip))) {
    return { success: false as const, message: "فشل التحقق من الروبوتات، يرجى إعادة المحاولة" };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("program_applications").insert({
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
      // FAIL CLOSED: no acknowledgement without a persisted row, and no cache invalidation.
      return {
        success: false as const,
        message: "تعذر استلام طلب التسجيل حالياً، يرجى المحاولة مرة أخرى أو مراجعة إدارة الخدمة هاتفياً",
      };
    }

    revalidateTag(REVALIDATION_TAGS.education);
  } catch (err) {
    console.error("Error submitting program application:", err);
    return {
      success: false as const,
      message:
        err instanceof MissingEnvVarError
          ? "خدمة التسجيل الإلكتروني غير مفعّلة على هذا الموقع حالياً، يرجى مراجعة إدارة الخدمة هاتفياً"
          : "تعذر استلام طلب التسجيل حالياً، يرجى المحاولة مرة أخرى أو مراجعة إدارة الخدمة هاتفياً",
    };
  }

  return {
    success: true as const,
    message: "تم استلام طلب التسجيل بنجاح، وسيتم التواصل معك هاتفياً من إدارة الخدمة قريباً",
  };
}

export async function submitJobApplication(rawInput: unknown) {
  const headerList = await headers();
  const ip = getClientIp(headerList);

  // Best-effort per-instance rate limit with 15s burst protection — see src/lib/security/rate-limit.ts.
  if (!checkPublicWriteRateLimit("job", ip).allowed) {
    return { success: false as const, message: RATE_LIMIT_MESSAGE_AR };
  }

  const result = JobApplicationSchema.safeParse(rawInput);
  if (!result.success) {
    return {
      success: false as const,
      errors: result.error.flatten().fieldErrors,
      message: "بيانات طلب التوظيف غير مكتملة",
    };
  }

  if (!(await verifyTurnstile(result.data.turnstileToken, ip))) {
    return { success: false as const, message: "فشل التحقق من الروبوتات، يرجى إعادة المحاولة" };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("job_applications").insert({
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
      // FAIL CLOSED: no acknowledgement without a persisted row.
      return {
        success: false as const,
        message: "تعذر استلام طلب التوظيف حالياً، يرجى المحاولة مرة أخرى أو الاتصال بمكتب التوظيف هاتفياً",
      };
    }
  } catch (err) {
    console.error("Error submitting job application:", err);
    return {
      success: false as const,
      message:
        err instanceof MissingEnvVarError
          ? "خدمة التوظيف الإلكترونية غير مفعّلة على هذا الموقع حالياً، يرجى الاتصال بمكتب التوظيف هاتفياً"
          : "تعذر استلام طلب التوظيف حالياً، يرجى المحاولة مرة أخرى أو الاتصال بمكتب التوظيف هاتفياً",
    };
  }

  return {
    success: true as const,
    message: "تم استلام سيرتك الذاتية في مكتب التوظيف بنجاح، وسيتم التنسيق معك عند توفر فرصة عمل مناسبة",
  };
}
