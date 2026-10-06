---
title: "System Patterns — الأنماط المعمارية المعتمدة"
aliases: ["System Patterns", "Architecture Patterns", "System Invariants"]
tags:
  - "#memory-bank"
  - "#architecture"
  - "#patterns"
  - "#status/approved"
version: "2.0"
last_updated: 2026-09-26
---

# System Patterns — الأنماط المعمارية المعتمدة (42 Master Patterns)

> [!important] Foundational Invariant
> All architectural patterns are anchored to [[INV-01 Zero-Auth Invariant|INV-01]]: Decouple public community services from private internal parish ERPs. Zero authentication for public directories; zero confession or welfare storage.

---

## 1. التسليم: Static-First + Edge
- صفحات محتوى مستقر: SSG. صفحات الجداول: ISR بفترات مصفوفة IA §3.
- التحديث الفوري عبر `revalidateTag` بأسماء من `src/lib/tags.ts` حصراً — لا أسماء وسوم حرة.

## 2. قراءة/كتابة البيانات
- القراءة: RSC + `unstable_cache(query, keys, { tags, revalidate })` (BACKEND §6).
- الكتابة العامة: Server Action → تحديد المعدل → Zod → Turnstile → عميل service-role (للحجز والتسجيل) أو anon RLS insert — وكل مسار كتابة عام **يفشل مغلقاً**: لا إقرار نجاح بلا صف مُدرَج فعلاً، والخطأ يُعاد برسالة عربية دقيقة. إجراء `submitClinicInquiry` يتبع نفس العقد وإن كان بلا واجهة حالياً.
- الكتابة الإدارية: جلسة `@supabase/ssr` + `getUser()` + فحص `profiles.role` + سياسات `is_staff()`/`is_admin()`.

## 3. نموذج الأدوار
`admin` > `secretary` > `priest` / `servant` — لا صلاحيات كتابة بلا دور. أول مدير: SQL يدوي فقط.

## 4. الثابت اللفظي (CONTEXT §3)
`mass_schedules` لا "فعاليات" — `parishioners` لا "users" — `condolence_booking` لا "إيجار" — `consultation_fee_egp` لا "ticket".

## 5. هيكل المستودع ومساحة العمل (pnpm Monorepo Architecture)
تمت إعادة هيكلة المستودع بالكامل إلى pnpm workspace يضم تطبيقين منفصلين وثلاث حزم مشتركة (راجع التفاصيل في [[Monorepo Architecture]]):
- **`apps/web` (بوابة المخدومين العامة)**:
  * تطبيق Next.js 15 App Router، ثابت أولاً (Static-First) بصفر مصادقة (Zero-Auth مطابقة لـ [[INV-01 Zero-Auth Invariant|INV-01]]).
  * يبني بصفر متغيرات بيئة (No-Env Invariant) مع توليد 50/50 صفحة ثابتة بنجاح، ويتراجع تلقائياً لمخزن الملفات أو البذرة.
  * إزالة كاملة للسطح الإداري ومسارات `/admin` وإجراءات الخادم الإدارية لمنع أي تسريب.
- **`apps/admin` (لوحة الإدارة)**:
  * تطبيق Next.js 15 مستقل للسكرتارية والكهنة، يعمل على المنفذ `3001` محلياً وعلى نطاق فرعي مخصص إنتاجياً.
  * عزل أعطال كامل (Fault Isolation): تعطل الموقع العام لا يؤثر على لوحة الإدارة (G6).
  * جلسات `@supabase/ssr` مستقلة مع كوكيز محصورة بنطاق لوحة الإدارة (ADR-0002).
  * يحوي المسارات الإدارية الـ 12: `/`, `/audit`, `/bookings`, `/events`, `/events/[id]/edit`, `/events/new`, `/events/series/[id]`, `/events/series/new`, `/login`, `/masses`, `/media`, `/subscribers`.
- **`packages/domain` (`@church-site/domain`)**:
  * المصدر الواحد والنهائي للأنواع (`src/types/database.types.ts`)، ونماذج النطاق، ومحرك التكرار، ومصفوفة الصلاحيات (`can()`).
- **`packages/data-access` (`@church-site/data-access`)**:
  * الطبقة الوحيدة التي تتخاطب مع قاعدة البيانات، تضم محركي التخزين (JSON / Supabase)، والعملاء الآمنين، والاستعلامات والتنبيهات، ونقطة دخول آمنة للمتصفح `@church-site/data-access/client`.
- **`packages/ui` (`@church-site/ui`)**:
  * مكونات الواجهة الأساسية (shadcn/ui)، والأدوات المساعدة (`cn`)، ومنظومة التدويل (i18n).
- **انضباط حذف الكود الميت**: لا تُترك مكوّنات أو تصديرات غير موصولة. الإثبات المطلوب قبل الحذف هو صفر مستوردين بـ `git grep` على `HEAD`، ثم فحص ما إذا كان الحذف قد يتّم أي تصدير آخر.

## 6. الخصوصية
لا جداول اعترافات أو ماليّة داخلية أصلاً — غياب البنية هو الضمانة ([[INV-01 Zero-Auth Invariant|INV-01]]).

## 7. قنوات التواصل (Contact Channels)
- مكوّن مشترك واحد `ContactLinks.tsx` يعرض عناصر التواصل (اتصال/واتساب/مجموعة واتساب) ويعيد `null` عند غيابها كلها — يُعرض العنصر فقط عند وجود قيمة غير فارغة في البذرة.
- تحويل الأرقام إلى صيغة دولية يتم حصراً عبر `toWhatsAppUrl` في `parish-contact.ts` (يحوّل «0» البادئة إلى كود مصر «20»).
- اشتقاق الفترة (صباحي/مسائي) وتسمياتها مصدره الوحيد `getMassPeriodFromTime` و`getMassPeriodLabel` — لا يجوز تكرار منطق التحويل أو التسمية.
- الثوابت غير المُبذَّرة (رسم الكشف 30-35 ج.م) تُعرَّف مرة واحدة في `constants.ts`.

## 8. التنقل والعدّادات المشتقة (Navigation & Derived Counts)
- التنقل مصدره الوحيد `Header.tsx` (مصفوفة `navLinks` + درج جوّال مدمج). لا تُضاف مكوّنات تنقل بديلة غير موصولة.
- عدد التخصصات الطبية يُشتق دائماً من `SEED_CLINIC_SPECIALTIES.length`، ورسم الكشف من `CLINIC_CONSULTATION_FEE_MIN_EGP`/`MAX_EGP` في `constants.ts` — يُمنع تكرار الأرقام كنصوص صلبة.
- تسميات أيام الأسبوع ومؤشرها تُشتق من `DAY_OF_WEEK_LABELS_AR`/`DAY_OF_WEEK_INDEX` في `mass-schedule.ts` — والإملاء المعتمد «الإثنين».

## 9. حدود الأنواع مع Supabase (Typed Client Boundary)
- `src/types/database.types.ts` يجب أن تبقى مطابقة تماماً لشكل `GenericSchema` في إصدار `postgrest-js` المثبَّت: `public.Tables/Views/Functions/Enums/CompositeTypes`، وكل جدول يجب أن يحمل `Relationships: GenericRelationship[]`.
- يُنشأ عميل Supabase بلا وسائط نوعية في `src/lib/supabase/{server,client}.ts` ويُصرَّح بالنوع المقصود على توقيع الدالة (`SupabaseClient<Database>`). لا يُستخدم `as any` على الاستعلامات.
- أنواع نتائج الإجراءات تُشتق في الواجهات عبر `Awaited<ReturnType<typeof action>>`.

## 10. الزمن والمكان (Time & Place)
- كل عرض زمني للجمهور يمر عبر `cairo-time.ts` (`PARISH_TIME_ZONE = "Africa/Cairo"`، `formatCairoDateTime`)، ويُمنع قصّ نص UTC ISO أو الاعتماد على منطقة المضيف. تحويل وقت الجدار المحلي إلى لحظة مطلقة يتم بـ `cairoWallClockToInstant`.
- «القداس القادم» يُشتق حصراً من جدول القداسات الفعلي عبر `getNextMass`؛ وإن لم يوجد قداس مُفعَّل يُعرض لا شيء بدل موعد مُخترع.

## 11. أسلاج البرامج المؤهلة للتسجيل
- المصدر الوحيد هو `SEED_PROGRAM_SLUGS` في `seed-data.ts`: صفوف `SEED_SCHOOLS` مُقيَّدة به، و`PROGRAM_SLUGS` في مخطط zod مشتق منه، والحارس `isProgramSlug` يمنع أي سلَج غير مؤهل (تُرجع الصفحة `notFound()`).

## 12. منطقة `/admin` ديناميكية إلزامياً
- `layout.tsx` في `apps/admin/src/app/(protected)` يحمل `export const dynamic = "force-dynamic"`: فحص الجلسة يجب أن يُعاد تقييمه في كل طلب، وإلا رُسّخت تحويلة الفشل المغلق `redirect("/admin/login")` كتحويلة ثابتة 307 في مخرجات البناء فتُحجب اللوحة عن الطاقم المسجَّل.

## 13. واجهة Turnstile — النصف العميل (Client Half)
- مكوّن واحد فقط: `TurnstileWidget.tsx` (عميل) يُركَّب في الاستمارات العامة الثلاث، ويحمّل سكربت Cloudflare مرة واحدة لكل مستند عبر وعد مُخزَّن على مستوى الوحدة (`?render=explicit`).
- المفتاح العام يُقرأ بعبارة عضو حرفية `process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY` لِيُستبدَل في حزمة المتصفح؛ وعند غيابه يُرسم لا شيء.
- العقد: `onVerify(token)`، و`onExpire` اختياري، و`resetSignal` تصاعدي يطلب رمزاً جديداً بعد كل إرسال.
- التحقق الخادمي `verifyTurnstile()` يبقى الفيصل.

## 14. مسار القراءة العام: عميل بلا كوكيز + تراجع مُعلَن (Observable Fallback)
- كل قراءة عامة تمر عبر `readOrSeed(queryName, seed, read)` وتستعمل `createPublicSupabaseClient()` — عميل anon بلا جلسة وبلا `cookies()`، لأن `unstable_cache` يعمل خارج نطاق الطلب.
- **لا تراجع صامت**: كل حالة تراجع تُسجَّل ببنية ثابتة `[queries] database read failed|skipped { query, served: 'seed-data', reason }`.
- القراءات الخاصة بالطاقم (`getCondolenceBookings`) استثناء مقصود: تحتاج الجلسة (`createSupabaseServerClient`) فتُنفَّذ بلا كاش وبلا أي بذرة بديلة.

## 15. صفحات تعتمد البيانات: غلاف خادمي + طفل عميل
- الصفحات التي تحتاج تفاعلاً تُقسَم إلى `page.tsx` خادمي + مكوّن عميل في نفس المجلد يستقبل البيانات كخصائص.
- الأنواع المشتركة بين البذرة والقاعدة تُعرَّف مرة واحدة في حزمة `@church-site/data-access` أو `@church-site/domain`.

## 16. مصدر واحد لأسفار الكتاب المقدس
- `SEED_BIBLE_BOOKS` هو المصدر الوحيد للكانون (73 سفراً: 46 + 27، وسِتّها القانونية الثانية)، ومعرّفات الأسفار تُشتق من رقمها القانوني عبر `bibleBookId(order)`.
- كل عدّاد معروض (73/46/27) يُشتق من طول المصفوفة لا من نص صلب.

## 17. كتابة إدارية موثوقة (Admin Mutations)
- كل إجراء إداري يبدأ بـ `requireStaff()` ثم يتحقق بـ zod، ثم يكتب بعميل الجلسة (لا service-role) لتكون سياسة `is_staff()` هي الحد الثاني.
- **الفشل المغلق**: لا نجاح بلا صف مُتأثّر فعلاً. وبعد النجاح فقط `revalidateTag(...)`.
- الاعتذار يستلزم سبباً مكتوباً (5–500 حرف) يُخزَّن في `rejection_reason`.

## 18. البث المباشر: بلا محتوى بديل مُخترع
- يُمنع منعاً باتاً بذر معرّف فيديو أو اسم قناة وهمي في `SEED_STREAM_EVENTS`، ويُمنع أي رابط يوتيوب صلب في الواجهة.
- رابط القناة الرسمية مصدره `getYoutubeChannelUrl()`: عند غيابه تُرسم حالة «لم تُضبط قناة البث الرسمية»؛ والبث المباشر لا يُضمَّن إلا إذا كانت حالته `live` وسجلّه غير مؤرشف و`stream_url` غير فارغ ومطابق لـ [[External Assets & Security Headers|النطاقات المعتمدة]].

## 19. رؤوس الأمن (Security Headers) — CSP مُنفَّذة
- كلها تُحقن من `next.config.ts` على `/:path*`: HSTS (`max-age=15552000; includeSubDomains`)، CSP، Permissions-Policy، مع `X-Frame-Options: SAMEORIGIN` و`X-Content-Type-Options: nosniff` و`Referrer-Policy: strict-origin-when-cross-origin`.
- **CSP مُنفَّذة لا Report-Only**. التفاصيل الكاملة في [[External Assets & Security Headers]].

## 20. مصدر واحد لمضيفي التضمين الموثوقين
- `trusted-embeds.ts` هو المصدر الوحيد: `TURNSTILE_ORIGIN`، `TRUSTED_EMBED_HOSTS` (YouTube/YouTube-nocookie/Facebook)، و`getTrustedEmbedUrl(raw)`.
- قيمة القاعدة لا تصل إلى `src` الإطار أبداً دون تطهير واعتماد.

## 21. بوابات الجودة (Lint + CI)
- ESLint 9 بصيغة flat في `eslint.config.mjs` يبني `next/core-web-vitals` عبر `FlatCompat`.
- سير عمل GitHub Actions يحرس بوابات صلدة: `pnpm check:secrets`، `pnpm typecheck`، `pnpm test` (Vitest)، وبناء التطبيقات بصفر متغيرات بيئة.

## 22. مصدر واحد لرمز الحجز المرجعي (Booking Reference)
- `booking-reference.ts` هو المصدر الوحيد لشكل `COND-XXXXXX`: `BOOKING_REFERENCE_PREFIX = "COND"`، `BOOKING_REFERENCE_BODY_LENGTH = 6`.
- التوليد عبر `node:crypto` (`randomBytes(3).toString("hex").toUpperCase()`) والتوحيد عبر `normalizeBookingReference(value)`.

## 23. المستودع بمحرّكين: عقد واحد لبيانات الفعاليات (Repository Abstraction)
- راجع التفاصيل الكاملة في [[Dual-Driver Storage & Repositories]].
- المصنع الواحد `getEventRepository()` يختار تلقائياً: وجود `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` ⇒ `supabase`، وإلا ⇒ `json`.
- الكتابة ذرّية دائماً بملف مؤقت ثم `rename`.

## 24. سجل التدقيق: سطر واحد لكل تعديل (Audit Trail)
- كل تعديل يستقبل `Actor` ويمر بـ `buildAuditEntry()` الذي يسجّل الفاعل والإجراء والكيان والحالة قبل وبعد وملخّصاً عربياً. التفاصيل في [[Audit Trail & Compliance]].

## 25. محرك التكرار: المواعيد تُشتق ولا تُخزَّن (Recurrence)
- `recurrence.ts` نقية بلا اعتماديات. `expandSeries` توسّع في منطقة السلسلة لا منطقة المضيف.
- المواعيد الأسبوعية تُوسَّع وقت القراءة وتُعدَّل بالاستثناءات (`event_exceptions`) دون توليد صفوف مكررة.

## 26. نموذج القدرات فوق الأدوار القائمة (Capabilities)
- `capabilities.ts` يضيف `owner | editor | viewer` فوق `profiles.role`: `admin` → `owner`, `secretary` → `editor`, `viewer` للقراءة فقط.
- `can(role, capability)` دالة نقية من جدول قرار واحد (`ROLE_CAPABILITIES`).

## 27. نظام اللهجات: العربية أصل والترجمة الناقصة تُوسَم (i18n)
- العربية RTL افتراضي، والإنجليزية LTR.
- عند غياب الترجمة تُعاد العربية متبوعة بعلامة ظاهرة `⟦ترجمة مفقودة⟧`.

## 28. الزمن: مصدر واحد للتحويل بين الساعة الجدارية واللحظة (Zone Time)
- `zone-time.ts` هو التنفيذ الوحيد لتحويل «ساعة جدارية ⇄ لحظة» بـ IANA، مع احترام التوقيت الصيفي.

## 29. الاشتراكات في التنبيهات: البريد هوية، ولا حذف، ولا بريد يُرسل
- تطبيع البريد عبر `normalizeSubscriberEmail` (تشذيب وخفض حالة دون دمج مدمر).
- عدمية التكرار: البريد الموجود يُحدَّث صفّه ولا يُحذف المشترك أبداً (`setSubscriberActive` فقط).
- البريد لا يُرسل إلا بتوفر مزود حقيقي، والافتراضي `noopMailer` مع إفصاح شفاف.

## 30. مستند المخزن: ترقية الإصدار بدل رفضه
- `StoreDocument` يحمل `schemaVersion` (الإصدار 5 حالياً)، وتتم الترقية في الذاكرة دون استبدال صامت أو ضياع للبيانات.

## 31. وثائق التسليم: كل ما لم يُختبر يُقال صراحةً
- أي أمر لم يُنفَّذ فعلاً في البيئة يُوسَم «غير مختبَر» صراحةً.

## 32. الصفحات العامة: الحالة الفارغة تُقال، والنائبة تُوسَم
- صفحة عامة بلا محتوى حقيقي تعرض حالة صريحة موسومة (`data-<surface>-state="empty"`)، وتُمنع المحتويات التجريبية الملفقة.

## 33. بنية تخزين الوسائط وثابت عدم المصادقة
- واجهة `MediaStorage` تدعم `SupabaseMediaStorage` للإنتاج و`FileMediaStorage` للتطوير.
- حاوية `media` بقراءة عامة، ومسارات زمنية `YYYY/MM/<uuid>.<ext>` مع بصمة SHA-256.

## 34. محرك أنواع المحتوى المخصص (Phase 3 Content Types Engine)
- فصل تعريفات النماذج (`content_types`) والحقول (`content_fields`) عن بيانات المشاركات (`content_entries`).
- التحقق الديناميكي عبر `validateContentEntryData`.

## 35. معمارية فيديوهات الكنيسة والروابط الخارجية الموثوقة
- تطهير الروابط عبر `normalizeVideoUrl()` المحمية بـ `TRUSTED_EMBED_HOSTS` ومنع `javascript:` وحظر Wildcards في `images.remotePatterns`.

## 36. معمارية التقسية والبريد وسجل التدقيق وسلامة الإنتاج
- محول `ResendMailer` بالاعتماد على `fetch` المدمج.
- ثابت سلامة قاعدة بيانات الإنتاج (`readOrSeed` Invariant): خطأ فادح في الإنتاج بدل التراجع للبذرة.
- تصدير سجل التدقيق بـ RFC-4180 UTF-8 BOM CSV. التفاصيل في [[Audit Trail & Compliance]].

## 37. معمارية اختبارات المتصفح الشاملة وإفصاح الأمانة
- اختبارات Chromium Headless عبر Playwright.
- التحقق من اتجاه `<html dir="rtl">` في كافة المسارات.

## 38. معمارية إدارة الخدمات وشريط التنقل CMS
- الإصدار الخامس لمخزن الملفات (`STORE_SCHEMA_VERSION = 5`) مع دعم `facilities` و`navItems`.
- تجريد الحقول الداخلية للمرافق والتنقل للحفاظ على ثابت [[INV-01 Zero-Auth Invariant|INV-01]].

## 39. معمارية حل وتضمين الروابط الخارجية للوسائط
- قائمة النطاقات المعتمدة `ASSET_ALLOWED_HOSTS` ومحرك `AssetResolver`.
- حظر ثغرات SSRF وإلزام HTTPS وحظر البروكسي الخادمي. راجع [[External Assets & Security Headers]].

## 40. نمط تجميع التنقل والدرج الجانبي للهاتف
- اختزال شريط التنقل المكتبي إلى 6-7 خانات رئيسية مع قوائم منسدلة WCAG 2.1 AA ودرج جوال لمسي `min-h-[44px]`.

## 41. معمارية لوحة الإدارة الموحدة والإطار البصري
- لوحة تحكم موحدة ببطاقات إحصائية، ومكون `AdminPageHeader`، ومكون `AdminFeedback`، ومكتبة أنماط `admin-ui.ts`.
- صيانة حارس `requireStaff()` والفشل المغلق.

## 42. معمارية تحصين الأمان والاعتمادية المعمارية
- دالة `submit_contact_message_atomic` لإدراج الرسالة والتدقيق في معاملة واحدة ذرية.
- سحب صلاحيات التنفيذ العام عن دوال التريجر ودوال فحص الطاقم.
- تحسين أداء RLS عبر InitPlan `(select auth.uid())`.
- إضافة فهارس التغطية للمفاتيح الأجنبية الفعلية. راجع [[Database Migrations & Security Hardening]].

---
*الأنماط المعمارية المعتمدة للمنظومة — مرجع إلزامي لكافة التصاميم والتعديلات.*
