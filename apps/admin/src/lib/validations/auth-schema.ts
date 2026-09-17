import { z } from "zod";

export const StaffSignInSchema = z.object({
  email: z.string().email("يرجى إدخال بريد إلكتروني صحيح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export type StaffSignInInput = z.infer<typeof StaffSignInSchema>;
