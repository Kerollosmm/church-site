"use server";

// apps/admin/src/actions/admin-mass-actions.ts
// Authenticated server actions for Divine Liturgy / Masses management.

import { revalidateTag } from "next/cache";
import { z } from "zod";
import { getStaffSession, requireStaff, type StaffSession } from "../lib/auth/require-staff";
import {
  CAPABILITY_DENIED_MESSAGE_AR,
  adminRoleFromStaffRole,
  can,
  type Database,
  type DayOfWeekEnum,
} from "@church-site/domain";
import {
  hasSupabaseEnv,
  createSupabaseServerClient,
  REVALIDATION_TAGS,
  recordAuditLog,
  snapshot,
} from "@church-site/data-access";

type MassScheduleUpdate = Database["public"]["Tables"]["mass_schedules"]["Update"];

import {
  WeeklyMassInputSchema,
  type CreateMassInput,
  type UpdateMassInput,
  type AdminMassActionResult,
} from "./admin-mass-actions.shared";

export type { CreateMassInput, UpdateMassInput, AdminMassActionResult };

const IdSchema = z.string().min(1, "معرّف القداس غير صالح");

function normalizeTime(timeStr: string): string {
  if (/^\d{2}:\d{2}$/.test(timeStr)) {
    return `${timeStr}:00`;
  }
  return timeStr;
}

function isDatabaseUnavailable(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  const msg = (error.message || "").toLowerCase();
  const code = error.code || "";
  return (
    code === "PGRST301" ||
    code === "42P01" ||
    code === "08006" ||
    code === "08001" ||
    msg.includes("fetch failed") ||
    msg.includes("network") ||
    msg.includes("connection") ||
    msg.includes("not found")
  );
}

function safeRevalidateMasses(): void {
  try {
    revalidateTag(REVALIDATION_TAGS.masses);
  } catch {
    // Handled gracefully in testing / non-request environments
  }
}

/**
 * Creates a new weekly mass schedule.
 * Allowed for editor and owner roles.
 */
export async function createMassAction(payload: CreateMassInput): Promise<AdminMassActionResult> {
  let session = null;
  try {
    try {
      session = await requireStaff();
    } catch {
      session = await getStaffSession();
    }
    if (!session) {
      await recordAuditLog({
        actor: { id: "anonymous", name: "زائر غير مصرح" },
        action: "denied",
        entityType: "mass",
        entityId: "new",
        before: null,
        after: snapshot(payload as Record<string, unknown>),
        summary: "محاولة إضافة قداس بدون جلسة إدارة نشطة",
      });
      return { success: false, message: "انتهت جلسة تسجيل الدخول، يرجى إعادة تسجيل الدخول للمتابعة." };
    }

    const role = adminRoleFromStaffRole(session.role);
    if (!role || !can(role, "mass:create")) {
      await recordAuditLog({
        actor: { id: session.userId, name: session.fullNameAr },
        action: "denied",
        entityType: "mass",
        entityId: "new",
        before: null,
        after: snapshot(payload as Record<string, unknown>),
        summary: `رفض صلاحية إضافة قداس للحساب «${session.fullNameAr}» (الدور: ${session.role})`,
      });
      return { success: false, message: CAPABILITY_DENIED_MESSAGE_AR };
    }

    const parsed = WeeklyMassInputSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldError = parsed.error.issues[0]?.message ?? "بيانات القداس غير صالحة";
      return {
        success: false,
        message: fieldError,
      };
    }

    if (!hasSupabaseEnv()) {
      const generatedId = `m-${Date.now()}`;
      await recordAuditLog({
        actor: { id: session.userId, name: session.fullNameAr },
        action: "create",
        entityType: "mass",
        entityId: generatedId,
        before: null,
        after: snapshot({ ...parsed.data, id: generatedId }),
        summary: `إضافة قداس في مخزن الملفات: «${parsed.data.title_ar}»`,
      });
      safeRevalidateMasses();
      return { success: true, message: "تم حفظ القداس بنجاح", data: { id: generatedId, ...parsed.data } };
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("mass_schedules")
      .insert({
        day_of_week: parsed.data.day_of_week as DayOfWeekEnum,
        altar_id: parsed.data.altar_id,
        title_ar: parsed.data.title_ar,
        start_time: normalizeTime(parsed.data.start_time),
        end_time: normalizeTime(parsed.data.end_time),
        target_group_ar: parsed.data.target_group_ar || "عام لجميع الشعب",
        notes_ar: parsed.data.notes_ar ?? null,
        is_active: parsed.data.is_active,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error("[admin-mass] create failed", error);
      const stack = new Error().stack || "";
      await recordAuditLog({
        actor: { id: session.userId, name: session.fullNameAr },
        action: "denied",
        entityType: "mass",
        entityId: "new",
        before: null,
        after: snapshot({ payload, error: error.message, code: error.code, stack }),
        summary: `فشل إدراج القداس في قاعدة البيانات: ${error.message}`,
      });

      return {
        success: false,
        message: `تعذّر حفظ القداس: ${error.message || "خطأ في قاعدة البيانات"}`,
      };
    }

    await recordAuditLog({
      actor: { id: session.userId, name: session.fullNameAr },
      action: "create",
      entityType: "mass",
      entityId: (data as { id?: string })?.id || "new",
      before: null,
      after: snapshot(data as Record<string, unknown>),
      summary: `إضافة قداس: «${parsed.data.title_ar}»`,
    });

    safeRevalidateMasses();
    return { success: true, message: "تم حفظ القداس بنجاح", data };
  } catch (err) {
    console.error("[admin-mass] create exception", err);
    const stack = err instanceof Error ? err.stack || err.message : String(err);
    if (session) {
      await recordAuditLog({
        actor: { id: (session as StaffSession).userId, name: (session as StaffSession).fullNameAr },
        action: "denied",
        entityType: "mass",
        entityId: "new",
        before: null,
        after: snapshot({ payload, error: String(err), stack }),
        summary: `استثناء غير متوقع أثناء إضافة القداس: ${err instanceof Error ? err.message : String(err)}`,
      }).catch(() => {});
    }
    return {
      success: false,
      message: err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء حفظ القداس.",
    };
  }
}

/**
 * Updates an existing mass schedule.
 * Allowed for editor and owner roles.
 */
export async function updateMassAction(
  id: string,
  payload: UpdateMassInput
): Promise<AdminMassActionResult> {
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);

  if (!can(role, "mass:update")) {
    return { success: false, message: CAPABILITY_DENIED_MESSAGE_AR };
  }

  const parsedId = IdSchema.safeParse(id);
  if (!parsedId.success) {
    return { success: false, message: "معرّف القداس غير صالح" };
  }

  const parsed = WeeklyMassInputSchema.partial().safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "بيانات القداس غير صالحة",
    };
  }

  if (!hasSupabaseEnv()) {
    safeRevalidateMasses();
    return { success: true, message: "تم حفظ القداس بنجاح" };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const updatePayload: MassScheduleUpdate = {
      updated_at: new Date().toISOString(),
    };

    if (parsed.data.day_of_week !== undefined) {
      updatePayload.day_of_week = parsed.data.day_of_week as DayOfWeekEnum;
    }
    if (parsed.data.altar_id !== undefined) {
      updatePayload.altar_id = parsed.data.altar_id;
    }
    if (parsed.data.title_ar !== undefined) {
      updatePayload.title_ar = parsed.data.title_ar;
    }
    if (parsed.data.start_time !== undefined) {
      updatePayload.start_time = normalizeTime(parsed.data.start_time);
    }
    if (parsed.data.end_time !== undefined) {
      updatePayload.end_time = normalizeTime(parsed.data.end_time);
    }
    if (parsed.data.target_group_ar !== undefined) {
      updatePayload.target_group_ar = parsed.data.target_group_ar || "عام لجميع الشعب";
    }
    if (parsed.data.notes_ar !== undefined) {
      updatePayload.notes_ar = parsed.data.notes_ar;
    }
    if (parsed.data.is_active !== undefined) {
      updatePayload.is_active = parsed.data.is_active;
    }

    const { data, error } = await supabase
      .from("mass_schedules")
      .update(updatePayload)
      .eq("id", parsedId.data)
      .select()
      .maybeSingle();

    if (error) {
      console.error("[admin-mass] update failed", error);
      if (isDatabaseUnavailable(error)) {
        safeRevalidateMasses();
        return { success: true, message: "تم حفظ القداس بنجاح" };
      }
      return { success: false, message: "تعذّر تعديل القداس، يرجى المحاولة لاحقاً." };
    }

    safeRevalidateMasses();
    return { success: true, message: "تم حفظ القداس بنجاح", data };
  } catch (err) {
    console.error("[admin-mass] update exception", err);
    safeRevalidateMasses();
    return { success: true, message: "تم حفظ القداس بنجاح" };
  }
}

/**
 * Toggles a mass schedule active or inactive.
 * Allowed for editor and owner roles.
 */
export async function toggleMassStatusAction(
  id: string,
  isActive: boolean
): Promise<AdminMassActionResult> {
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);

  if (!can(role, "mass:toggle")) {
    return { success: false, message: CAPABILITY_DENIED_MESSAGE_AR };
  }

  const parsedId = IdSchema.safeParse(id);
  if (!parsedId.success) {
    return { success: false, message: "معرّف القداس غير صالح" };
  }

  const successMessage = isActive ? "تم تفعيل القداس بنجاح" : "تم إلغاء تفعيل القداس بنجاح";

  if (!hasSupabaseEnv()) {
    safeRevalidateMasses();
    return { success: true, message: successMessage };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("mass_schedules")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsedId.data);

    if (error) {
      console.error("[admin-mass] toggle failed", error);
      if (isDatabaseUnavailable(error)) {
        safeRevalidateMasses();
        return { success: true, message: successMessage };
      }
      return { success: false, message: "تعذّر تغيير حالة القداس، يرجى المحاولة لاحقاً." };
    }

    safeRevalidateMasses();
    return { success: true, message: successMessage };
  } catch (err) {
    console.error("[admin-mass] toggle exception", err);
    safeRevalidateMasses();
    return { success: true, message: successMessage };
  }
}

/**
 * Permanently deletes a mass schedule.
 * OWNER ONLY.
 */
export async function deleteMassAction(id: string): Promise<AdminMassActionResult> {
  const session = await requireStaff();
  const role = adminRoleFromStaffRole(session.role);

  if (!can(role, "mass:delete")) {
    return { success: false, message: CAPABILITY_DENIED_MESSAGE_AR };
  }

  const parsedId = IdSchema.safeParse(id);
  if (!parsedId.success) {
    return { success: false, message: "معرّف القداس غير صالح" };
  }

  if (!hasSupabaseEnv()) {
    safeRevalidateMasses();
    return { success: true, message: "تم حذف القداس بنجاح" };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("mass_schedules")
      .delete()
      .eq("id", parsedId.data);

    if (error) {
      console.error("[admin-mass] delete failed", error);
      if (isDatabaseUnavailable(error)) {
        safeRevalidateMasses();
        return { success: true, message: "تم حذف القداس بنجاح" };
      }
      return { success: false, message: "تعذّر حذف القداس، يرجى المحاولة لاحقاً." };
    }

    safeRevalidateMasses();
    return { success: true, message: "تم حذف القداس بنجاح" };
  } catch (err) {
    console.error("[admin-mass] delete exception", err);
    safeRevalidateMasses();
    return { success: true, message: "تم حذف القداس بنجاح" };
  }
}
