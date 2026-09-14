# System Patterns — الأنماط المعمارية المعتمدة

## 1. التسليم: Static-First + Edge
- صفحات محتوى مستقر: SSG. صفحات الجداول: ISR بفترات مصفوفة IA §3.
- التحديث الفوري عبر `revalidateTag` بأسماء من `src/lib/tags.ts` حصراً — لا أسماء وسوم حرة.

## 2. قراءة/كتابة البيانات
- القراءة: RSC + `unstable_cache(query, keys, { tags, revalidate })` (BACKEND §6).
- الكتابة العامة: Server Action → Zod → Turnstile → عميل service-role (للحجز والتسجيل) أو anon RLS insert.
- الكتابة الإدارية: جلسة `@supabase/ssr` + `getUser()` + فحص `profiles.role` + سياسات `is_staff()`/`is_admin()`.

## 3. نموذج الأدوار
`admin` > `secretary` > `priest` / `servant` — لا صلاحيات كتابة بلا دور. أول مدير: SQL يدوي فقط.

## 4. الثابت اللفظي (CONTEXT §3)
`mass_schedules` لا "فعاليات" — `parishioners` لا "users" — `condolence_booking` لا "إيجار" — `consultation_fee_egp` لا "ticket".

## 5. هيكل المستودع
`src/app` (44 مساراً)، `src/actions` (Server Actions)، `src/lib/{supabase,queries,tags,validations,security}`، `docs/{adr,agents}`، `memory-bank/` (يُزامن بداية ونهاية كل مهمة).

## 6. الخصوصية
لا جداول اعترافات أو ماليّة داخلية أصلاً — غياب البنية هو الضمانة (INV-01).
