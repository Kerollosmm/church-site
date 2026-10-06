---
title: "INV-01: Zero-Auth Public Parish Portal Invariant"
aliases: ["INV-01", "Zero-Auth Invariant", "Architectural Invariant INV-01"]
tags:
  - "#memory-bank"
  - "#architecture"
  - "#security"
  - "#invariants"
  - "#status/approved"
version: "2.0"
last_updated: 2026-09-26
---

# INV-01: Zero-Auth Public Parish Portal Invariant

> [!important] Non-Negotiable Core Architectural Rule
> **Decouple public community services from private internal parish ERPs. Never require authentication for public directories or schedules; never store private confession or social welfare financial logs.**

---

## 1. المبدأ والفلسفة المعمارية (Philosophical Foundations)

تمثل كنيسة القديسين مكسيموس ودوماديوس والأنبا موسى الأسود مجتمعاً رعوياً متكاملاً يخدم آلاف الأسر في منطقة العصافرة بالإسكندرية والمهجر. إن الحصول على مواعيد الصلوات والقداسات الإلهية، ومعرفة أوقات العيادات الطبية الخيرية، ومشاهدة البث المباشر، لا ينبغي تحت أي ظرف أن يتطلب من المخدوم إنشاء حساب شخصي أو إدخال كلمة مرور أو تذكر بريد إلكتروني.

### البنود الثلاثة الحاكمة لـ INV-01:
1. **صفر مصادقة للجمهور (Zero-Auth Public Access)**:
   * كافة الجداول والمواعيد والخدمات العامة متاحة للجميع بدون أي جلسة أو تسجيل دخول.
2. **غياب بنية البيانات الحساسة (Structural Absence as Guarantee)**:
   * لا توجد في قاعدة البيانات أو المستودع جداول للاعترافات، ولا سجلات للمساعدات المالية أو إخوة الرب، ولا ملفات للأحوال الشخصية. الضمان الأمني ليس مجرد صلاحيات RLS بل **الغياب التام للبنية البرمجية** لهذه الأسرار.
3. **فرز مقترحات الدمج فورياً كـ `wontfix` (Immediate Triage Policy)**:
   * أي تذكرة أو طلب ميزة يقترح دمج نظام ERP الداخلي للكنيسة أو إجبار المخدومين على المصادقة للوصول للخدمات العامة يُغلق فوراً تحت تصنيف `wontfix`.

---

## 2. آليات التطبيق والتنفيذ التقني (Implementation Mechanisms)

### أ. الفصل المادي للتطبيقات (Application Boundary Separation)
- **`apps/web`**: تطبيق مخصص للمخدومين والجمهور، مبني بنهج **ثابت أولاً (Static-First)** عبر Next.js 15 App Router.
  * لا يحتوي على أي صفحات تسجيل دخول (`/login`).
  * لا يستورد حزم المصادقة الخاصة بالجلسات الإدارية (`@supabase/ssr` cookies handler غير مستخدم في المسارات العامة).
  * يبني بصفر متغيرات بيئة (No-Env Build Invariant)، مما يضمن عدم اعتماده الحتمي على أسرار الخادم لتقديم المحتوى العام.
- **`apps/admin`**: تطبيق معزول تماماً ومستقل للسكرتارية والكهنة، يعمل على المنفذ `3001` ونطاق فرعي منفصل تماماً (راجع [[Monorepo Architecture]]).

### ب. تجريد البيانات العامة (Data Projection Stripping)
- عند قراءة المرافق والخدمات وعناصر التنقل والفعاليات، تمر البيانات عبر دوال تجريد مخصصة في `@church-site/data-access`:
  * دالة `getPublicServices()` ودالة `getPublicNavigation()`.
  * يتم تجريد كافة الحقول الحساسة والتتبعية (`createdBy`, `updatedBy`, `createdAt`, `updatedAt`, `isActive`).
  * تُعاد فقط النماذج الموجهة للجمهور (`PublicParishFacility`, `PublicNavItem`, `WeeklyMassRow`).

### ج. مسارات الكتابة العامة المحمية (Zero-Auth Write Pathways)
يتيح الموقع للجمهور 3 عمليات كتابة فقط بدون مصادقة:
1. **طلب الاشتراك في تنبيهات الفعاليات** (`/subscribe`).
2. **إرسال رسالة تواصل** (`/contact`).
3. **طلب حجز قاعة العزاء** (`/condolence`).

**حراسة الكتابة العامة**:
- حماية بنظام Cloudflare Turnstile لمنع الهجمات الآلية والسبام.
- تحديد معدل الطلبات عبر Server Actions.
- التحقق الصارم من المدخلات بواسطة Zod.
- تنفيذ الكتابة عبر دوال محصنة أو معاملات ذرية ([[Database Migrations & Security Hardening|Atomic Submission]]).
- **الفشل المغلق**: لا يتم إبلاغ الزائر بالنجاح إلا بعد تأكيد إنشاء الصف وسجل التدقيق في قاعدة البيانات.

---

## 3. مصفوفة التحقق والضمانات (Verification & Invariant Audit)

| المكون / المسار | حالة المصادقة | آلية الحماية | التحقق الآلي |
| :--- | :--- | :--- | :--- |
| **مواعيد القداسات (`/masses`)** | Zero-Auth (عام تماماً) | Static SSG / ISR | TestSprite Web (`55627856`) |
| **دليل العيادات (`/clinics`)** | Zero-Auth (عام تماماً) | Static ISR | Playwright & TestSprite |
| **البث المباشر (`/live`)** | Zero-Auth (عام تماماً) | Static + Trusted Embeds | TestSprite Web (`3a9f9c83`) |
| **استمارة العزاء (`/condolence`)** | Zero-Auth (كتابة عامة) | Turnstile + Zod + Rate Limit | Vitest & E2E probe |
| **لوحة الإدارة (`apps/admin`)** | Protected (طاقم فقط) | `requireStaff()` + SSR Cookie | TestSprite Admin (39/39) |

---
*ثابت الأمان والوصول العام INV-01 — ميثاق غير قابل للتعديل أو التفاوض.*
