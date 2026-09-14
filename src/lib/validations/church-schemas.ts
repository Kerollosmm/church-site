import { z } from "zod";

export const egyptianPhone = z
  .string()
  .regex(/^01[0125][0-9]{8}$/, "يرجى إدخال رقم هاتف محمول مصري صحيح مكون من 11 رقماً");

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
  turnstileToken: z.string().optional(),
});

// 2. رسالة تواصل واستفسار
export const ContactMessageSchema = z.object({
  senderName: z.string().min(3, "الاسم مطلوب"),
  senderPhone: egyptianPhone,
  senderEmail: z.string().email("البريد الإلكتروني غير صالح").optional().or(z.literal("")),
  urgency: z.enum(["normal", "spiritual_urgent", "confession_request", "emergency"]),
  assignedPriestId: z.string().uuid().optional().or(z.literal("")),
  messageContent: z.string().min(10, "نص الرسالة يجب ألا يقل عن 10 أحرف"),
  turnstileToken: z.string().optional(),
});

// 3. استفسار عيادة / حجز كشف استرشادي
export const ClinicInquirySchema = z.object({
  patientName: z.string().min(3, "اسم المريض مطلوب"),
  patientPhone: egyptianPhone,
  specialtySlug: z.string().min(2, "التخصص مطلوب"),
  notes: z.string().max(500).optional(),
});

// 4. طلب تسجيل في برنامج كنسي
export const ProgramApplicationSchema = z.object({
  programSlug: z.enum([
    "deacon-school",
    "karouz-academy",
    "children-bible",
    "cithara-choir",
    "summer-club",
    "educational-center",
  ]),
  applicantName: z.string().min(3, "اسم المتقدم مطلوب"),
  applicantBirthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  applicantStage: z.string().max(150).optional(),
  guardianName: z.string().min(3).optional(),
  guardianPhone: egyptianPhone,
  confessionFather: z.string().max(255).optional(),
  requestedLevel: z.string().max(150).optional(),
  notes: z.string().max(500).optional(),
  turnstileToken: z.string().optional(),
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
  turnstileToken: z.string().optional(),
});

export type CondolenceBookingInput = z.infer<typeof CondolenceBookingSchema>;
export type ContactMessageInput = z.infer<typeof ContactMessageSchema>;
export type ClinicInquiryInput = z.infer<typeof ClinicInquirySchema>;
export type ProgramApplicationInput = z.infer<typeof ProgramApplicationSchema>;
export type JobApplicationInput = z.infer<typeof JobApplicationSchema>;
