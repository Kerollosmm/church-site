import { z } from "zod";
import { SEED_PROGRAM_SLUGS } from "@/lib/data/seed-data";

export const egyptianPhone = z
  .string()
  .regex(/^01[0125][0-9]{8}$/, "يرجى إدخال رقم هاتف محمول مصري صحيح مكون من 11 رقماً");

/**
 * Cloudflare Turnstile token.
 *
 * The token is REQUIRED whenever a public site key is configured (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`),
 * because that is exactly when the widget is rendered and a real token must reach the server.
 * With no site key (local dev / no-env build) the field stays optional so the forms keep working.
 * The server-side gate itself is `verifyTurnstile()` in `src/lib/security/turnstile.ts`.
 */
const turnstileToken = z
  .string()
  .optional()
  .superRefine((token, ctx) => {
    if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return;
    if (!token || token.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "يرجى إكمال التحقق الأمني (Cloudflare Turnstile) قبل الإرسال",
      });
    }
  });

// 1. حجز قاعة العزاء
export const CondolenceBookingSchema = z.object({
  deceasedFullName: z.string().min(5, "اسم المتوفى الثلاثي مطلوب على الأقل").max(200),
  applicantName: z.string().min(3, "اسم مقدم الطلب مطلوب"),
  applicantPhone: egyptianPhone,
  relationshipToDeceased: z.string().min(2, "يرجى تحديد صلة القرابة بالمتوفى"),
  eventDate: z.string().refine(
    (date) => {
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return parsed >= today;
    },
    { message: "لا يمكن حجز موعد في تاريخ ماضٍ" }
  ),
  slotTime: z.string().default("مسائي من 6:00 م إلى 10:00 م").optional(),
  hallName: z.string().default("قاعة العزاء الرئيسية المجهزة").optional(),
  specialRequests: z.string().max(500).optional(),
  turnstileToken,
});

// 2. رسالة تواصل واستفسار
export const ContactMessageSchema = z.object({
  senderName: z.string().min(3, "الاسم مطلوب"),
  senderPhone: egyptianPhone,
  senderEmail: z.string().email("البريد الإلكتروني غير صالح").optional().or(z.literal("")),
  urgency: z.enum(["normal", "spiritual_urgent", "confession_request", "emergency"]),
  assignedPriestId: z.string().uuid().optional().or(z.literal("")),
  messageContent: z.string().min(10, "نص الرسالة يجب ألا يقل عن 10 أحرف"),
  turnstileToken,
});

// 3. استفسار عيادة / حجز كشف استرشادي
export const ClinicInquirySchema = z.object({
  patientName: z.string().min(3, "اسم المريض مطلوب"),
  patientPhone: egyptianPhone,
  specialtySlug: z.string().min(2, "التخصص مطلوب"),
  notes: z.string().max(500).optional(),
  // Kept on the same contract as the other public forms even though no clinic form is mounted
  // yet; `submitClinicInquiry` verifies it server-side.
  turnstileToken,
});

/**
 * Canonical allow-list of programmes that accept online enrolment, derived from the seeded
 * programmes (`SEED_PROGRAM_SLUGS` in `src/lib/data/seed-data.ts`) so the two cannot drift:
 * the seed rows are typed with that tuple, and the schema below uses it as its enum.
 */
export const PROGRAM_SLUGS = SEED_PROGRAM_SLUGS;

/** Runtime guard for callers that hold a plain slug (e.g. a database row or a route param). */
export function isProgramSlug(value: string): value is ProgramSlug {
  return (PROGRAM_SLUGS as readonly string[]).includes(value);
}

// 4. طلب تسجيل في برنامج كنسي
export const ProgramApplicationSchema = z.object({
  programSlug: z.enum(PROGRAM_SLUGS),
  applicantName: z.string().min(3, "اسم المتقدم مطلوب"),
  applicantBirthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  applicantStage: z.string().max(150).optional(),
  guardianName: z.string().min(3).optional(),
  guardianPhone: egyptianPhone,
  confessionFather: z.string().max(255).optional(),
  requestedLevel: z.string().max(150).optional(),
  notes: z.string().max(500).optional(),
  turnstileToken,
});

// 5. طلب توظيف
export const JobApplicationSchema = z.object({
  fullName: z.string().min(3, "الاسم مطلوب"),
  phone: egyptianPhone,
  email: z.string().email("البريد الإلكتروني غير صالح").optional().or(z.literal("")),
  profession: z.string().min(2, "المهنة/التخصص مطلوب"),
  experienceYears: z.coerce.number().int().min(0).max(60).optional(),
  cvUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().max(500).optional(),
  turnstileToken,
});

// 6. تسجيل دخول الطاقم الإداري (سكرتارية الكنيسة)
export const StaffSignInSchema = z.object({
  email: z.string().email("يرجى إدخال بريد إلكتروني صحيح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export type CondolenceBookingInput = z.infer<typeof CondolenceBookingSchema>;
export type ContactMessageInput = z.infer<typeof ContactMessageSchema>;
export type ClinicInquiryInput = z.infer<typeof ClinicInquirySchema>;
export type ProgramApplicationInput = z.infer<typeof ProgramApplicationSchema>;
export type JobApplicationInput = z.infer<typeof JobApplicationSchema>;
export type StaffSignInInput = z.infer<typeof StaffSignInSchema>;
export type ProgramSlug = ProgramApplicationInput["programSlug"];
