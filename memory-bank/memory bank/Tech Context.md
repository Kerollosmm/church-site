---
title: "Tech Context — المكدس التقني والقيود"
aliases: ["Tech Context", "Technology Stack", "Tooling & Runtimes"]
tags:
  - "#memory-bank"
  - "#tech"
  - "#dependencies"
  - "#status/current"
version: "2.0"
last_updated: 2026-09-26
---

# Tech Context — المكدس التقني والقيود

> [!info] Monorepo & Tooling Baseline
> Built on **Node.js 22 LTS**, **pnpm 10 workspaces**, **Next.js 15 App Router**, and **Supabase (PostgreSQL 15+)**. Strict TypeScript 5 with zero `as any` across all packages.

---

## 1. المكدس المعتمد (Approved Stack v1.4)

| الطبقة (Layer) | التقنية (Technology) | الملاحظات والقيود |
| :--- | :--- | :--- |
| **الإطار الأساسي** | Next.js 15 (App Router, RSC, ISR) | تطبيقان منفصلان: `apps/web` (منفذ 3000) و`apps/admin` (منفذ 3001) |
| **اللغة والأنواع** | TypeScript 5 (Strict Mode) | فحص صارم لكافة الحزم عبر `pnpm -r typecheck` |
| **الواجهة والتنسيق** | Tailwind CSS + Shadcn/ui | RTL أولاً، أيقونات Lucide، نظام ألوان قبطية متناسق |
| **قاعدة البيانات** | Supabase (PostgreSQL 15+) | عبر `@supabase/ssr` (حظر تام لـ `auth-helpers`) |
| **النماذج والتحقق** | React Hook Form + Zod | تثبيت `zod: 3.24.2` في `pnpm.overrides` لتفادي تعارض الواجهات |
| **فاحص الأسرار** | `scripts/scan-secrets.mjs` | سكربت عديم الاعتماديات مدمج بـ `pnpm check:secrets` وسير عمل CI |
| **محرك الاختبارات** | Vitest 5.0.1 + Playwright 1.63.0 | 638 فحص وحدات ناجح بنسبة 100%، واختبارات E2E حقيقية |
| **الاستضافة والشبكة** | Vercel Edge / Cloudflare Tunnels | ثبات أصل الخادم، ورؤوس CSP وHSTS مفروضة |

---

## 2. متغيرات البيئة (Environment Variables)

المتغيرات الرسمية المعتمدة في النظام:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (خادم فقط), `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_YOUTUBE_CHANNEL_URL`, `YOUTUBE_API_KEY`.

### الاستهلاك الفعلي في الكود:
- **المستهلك فعلاً في الكود** (`ServerEnvVar` في `packages/data-access/src/env.ts`):
  * `NEXT_PUBLIC_SUPABASE_URL`
  * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  * `SUPABASE_SERVICE_ROLE_KEY`
  * `TURNSTILE_SECRET_KEY`
  * `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
  * `NEXT_PUBLIC_YOUTUBE_CHANNEL_URL`
- **المتغيرات التشغيلية الإضافية (ليست أسراراً)**:
  * `CHURCH_DATA_DIR`: دليل مخزن JSON المحلي (افتراضياً `<repo>/.data`).
  * `EVENTS_SUBSCRIPTIONS_ENABLED`: راية تمكين اشتراكات الفعاليات (افتراضياً مفعلة).
  * `MAIL_PROVIDER`: مزود البريد (`resend` أو `noop` افتراضياً).
- **قواعد اختيار محرك البيانات**:
  * `hasSupabaseAdminEnv()` (`URL` + `SERVICE_ROLE_KEY`): يحدد استخدام محرك Supabase للكتابة والإدارة.
  * `hasSupabaseEnv()` (`URL` + `ANON_KEY`): يحكم مسار القراءة العامة.
  > [!warning] Operational Caveat
  > أي نشر يضبط URL ومفتاح service-role وينسى مفتاح anon يشغل محرك Supabase بينما تقرأ الصفحات العامة البذرة. السطر `[queries] database read skipped` في السجلات هو الدليل.
- **ثابت البناء بلا بيئة (No-Env Build Invariant)**:
  * تطبيق `apps/web` **يجب** أن يبني بصفر متغيرات بيئة (59 مساراً ثابتاً وديناميكياً بنجاح 100%).

---

## 3. مخطط قاعدة البيانات وسلسلة الهجرات (20 Migrations)

سلسلة الهجرات في `supabase/migrations/` تضم 20 ملفاً مرقماً زمنياً (راجع [[Database Migrations & Security Hardening]]):
1. **الهجرات 1–7**: مخطط الأساس (الأنواع، الامتدادات، `profiles`، 21 جدولاً، دوال `SECURITY DEFINER`، الفهارس، تفعيل RLS).
2. **الهجرات 8–9**: طبقة الفعاليات والاستثناءات والتكرار.
3. **الهجرات 10–11**: نظام المشتركين والتنبيهات.
4. **الهجرات 12–17**: الميزات الإضافية، تخزين الوسائط، أنواع المحتوى المخصصة، الروابط الخارجية، وتقسية صلاحيات الطاقم (17 هجرة مطبقة حياً على Supabase).
5. **الهجرات 18–20 (محلية جديدة جاهزة للاعتماد)**:
   * `20260924100000_contact_message_atomic_submission.sql`: إدراج الرسالة والتدقيق ذرياً.
   * `20260924110000_rpc_security_hardening.sql`: تحصين صلاحيات RPC وتقييد المدخلات وتثبيت مسار البحث `search_path`.
   * `20260924120000_covering_indexes_and_rls_initplan.sql`: إضافة 9 فهارس تغطية وتحسين InitPlan لـ `auth.uid()`.

---

## 4. قيود الحزم والإصدارات (Package Boundary Constraints)

- **تعارض واجهات Supabase**:
  * `@supabase/supabase-js@2.116.0` أعاد تعريف `SupabaseClient` وحذف `dist/module/lib/types`.
  * `@supabase/ssr@0.5.2` يتطلب التصريح عن النوع في توقيع الدوال (`SupabaseClient<Database>`) دون تمرير وسائط نوعية لمنشئ العميل، مع توفير `Relationships` كاملة في `database.types.ts`.
- **Node.js Runtime & ICU**:
  * Node 20+ مع ICU كامل (تم التحقق على Node v22.22.0) لضمان عمل `Intl.DateTimeFormat` بمنطقة `Africa/Cairo` والتقويم الجريجوري.
  * `crypto.randomUUID()` ووحدة `node:crypto` هي المصدر الرسمي لإنشاء المعرفات المرجعية بعد حذف `nanoid`.
- **أوامر التشغيل المجمعة في الجذر**:
  * `pnpm dev:web` — تشغيل الموقع العام (منفذ 3000).
  * `pnpm dev:admin` — تشغيل لوحة الإدارة (منفذ 3001).
  * `pnpm build` — بناء التطبيقات والمشاريع الخمسة.
  * `pnpm typecheck` — فحص الأنواع عبر كامل مساحة العمل.
  * `pnpm test` — تشغيل أجنحة فحص Vitest (638 فحصاً).
  * `pnpm check:secrets` — تشغيل فاحص الأسرار الآلي.

---

## 5. أدوات الجودة وبوابات النشر (Quality Gates Summary)

| الأداة | الإصدار | الحالة والنتيجة |
| :--- | :--- | :--- |
| **Next.js** | `^15.5.25` | بناء نظيف لكلا التطبيقين دون أي تحذيرات |
| **Vitest** | `5.0.1` | **638/638 فحصاً ناجحاً بنسبة 100% (56 ملفاً)** |
| **TestSprite E2E** | CLI v3 | **65/66 فحصاً ناجحاً بنسبة 98.5% (Web: 26/27, Admin: 39/39)** |
| **TypeScript** | `^5.7.3` | **0 أخطاء نوعية عبر كافة المشاريع الخمسة** |
| **فاحص الأسرار** | مخصص | **0 أسرار مكتشفة في الشجرة الحالية** |

---
*مرجع المكدس والتقنيات — يُحدث عند تعديل أدوات البناء أو الاعتماديات أو الحزم.*
