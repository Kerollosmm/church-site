# Tech Context — المكدس التقني والقيود

## المكدس المعتمد (v1.1)
| الطبقة | التقنية |
| :--- | :--- |
| الإطار | Next.js 15 (App Router, RSC, ISR) — TypeScript 5 strict |
| الواجهة | Tailwind CSS + Shadcn/ui، RTL أولاً، أيقونات Lucide + رسم قبطي مخصص |
| الخلفية | Supabase (PostgreSQL 15+) عبر **`@supabase/ssr`** (ممنوع `auth-helpers`) |
| النماذج | React Hook Form + Zod (مخططات BACKEND §7.1) |
| الاستضافة | Vercel Edge + Supabase |

## متغيرات البيئة (BACKEND §9.1)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (خادم فقط), `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`, `YOUTUBE_API_KEY` (اختياري).

## قيود معروفة
- استهداف الأداء: FCP < 800ms، LCP < 1.2s على شبكات 3G/4G المصرية.
- إرسال واتساب آلي خارج النطاق (Phase 2) — الاشتراكات تُخزن فقط.
- نص الكتاب المقدس (فان دايك + أسفار ثانية) يُحمّل كبيانات بذر ضخمة — خطوة نشر مستقلة.
