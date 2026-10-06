---
title: "Dual-Driver Storage & Repository Architecture"
aliases: ["Dual-Driver Storage", "Repositories", "JsonStore", "Storage Engines"]
tags:
  - "#memory-bank"
  - "#architecture"
  - "#storage"
  - "#json-store"
  - "#supabase"
  - "#status/approved"
version: "2.0"
last_updated: 2026-09-26
---

# Dual-Driver Storage & Repository Architecture

> [!info] Architectural Core
> An abstraction layer providing identical business contracts across two storage engines: a local atomic JSON file driver for zero-env builds/offline tests, and a Supabase PostgreSQL driver for production persistence.

---

## 1. الفلسفة ومبدأ التكافؤ التام (Dual-Driver Parity)

لا تخاطب أي صفحة أو إجراء خادمي مخزن البيانات بصورة مباشرة. يتم التعامل حصراً عبر واجهات المستودعات الموحدة (Repository Interfaces) المعرفة في `packages/data-access`:
- `EventRepository`
- `ContentTypeRepository`
- `ParishFacilityRepository`
- `ParishNavigationRepository`
- `MediaStorage`

### المصنع الواحد (Unified Factory Pattern)
يقوم مصنع المستودع (مثل `getEventRepository()`) بفحص بيئة التشغيل تلقائياً:
- إذا توفرت متغيرات الإدارة `NEXT_PUBLIC_SUPABASE_URL` و`SUPABASE_SERVICE_ROLE_KEY` معاً (`hasSupabaseAdminEnv()`): يتم اختيار محرك **Supabase PostgreSQL**.
- في حالة غيابها (التطوير المحلي دون شبكة، اختبارات Vitest، وبناء الويب بصفر متغيرات بيئة): يتم اختيار محرك **المخزن الملفي JSON**.

---

## 2. محرك المخزن الملفي الذري (Atomic JsonStore Driver)

المحرك الملفي هو بيئة تشغيل رسمية مدعومة بالكامل، وليس مجرد وضع افتراضي منقوص.

### أ. تطور إصدارات المخطط (Schema Versions 1–5)
تحمل وثيقة المخزن `.data/church-store.json` حقلاً صريحاً `schemaVersion`:
- **الإصدار 1**: البنية الأساسية للفعاليات وسلاسل القداسات والمصطلحات.
- **الإصدار 2**: إضافة سجلات المشتركين وتفضيلات التنبيهات.
- **الإصدار 3**: إضافة قوالب المحتوى المخصصة والحقول الديناميكية (CMS).
- **الإصدار 4**: إضافة فيديوهات الكنيسة وإحصائيات المشاركات.
- **الإصدار 5**: إضافة المرافق الكنسية (`facilities`) وشريط التنقل والقوائم (`navItems`).

> [!tip] Automatic In-Memory Upgrades
> عند قراءة وثيقة بإصدار قديم (مثلاً إصدار 3)، يقوم المحرك بترقيتها تلقائياً في الذاكرة عبر `parseStoreDocument` دون استبدال صامت أو ضياع للبيانات، وتتم كتابة الإصدار الأحدث عند أول عملية تعديل.

### ب. ضمانات الكتابة الذرية (Atomic File Writes)
- الكتابة في المحرك الملفي لا تتم أبداً مباشرة على الملف الحي.
- يتم إنشاء ملف مؤقت في نفس المجلد ثم استبداله بعملية `rename` ذرية مدعومة بحلقة إعادة محاولة قصيرة مخصصة لنظام Windows لتفادي تعارض أقفال الملفات.
- تسلسل التعديلات يتم عبر طابور داخلي أحادي (In-process Queue) لمنع تضارب المعاملات المتزامنة.
- الفشل المغلق: أي تلف أو خلل في المخطط يرمي استثناء `StoreError("unavailable")` بدلاً من التعتيم عليه ببيانات البذر.

---

## 3. محرك قاعدة البيانات السحابي (Supabase Driver)

- **أولوية جلسة الطاقم**:
  * في الإجراءات الإدارية، يتم استخدام عميل جلسة الطاقم أولاً لضمان تفعيل الحماية الثنائية لسياسات RLS (`is_staff()` / `is_admin()`).
  * يُستخدم عميل `service-role` فقط عند العمليات خارج نطاق الطلب (مثل معالجة اشتراك زائر عام لا يملك جلسة) مع تسجيل ذلك في سجلات التدقيق.
- **مبدأ الفشل المغلق للبيانات**:
  * كل عملية تعديل تشترط تأكيد الصف المتأثر (`.select().single()`).
  * في بيئة الإنتاج (`NODE_ENV === "production"`): غياب البيانات أو حدوث خطأ في الاستعلام يرمي خطأ فادحاً فورياً لحماية استقرار النظام وتنبيه المسؤولين، مع حظر التراجع الصامت للبذرة في الإنتاج.

---

## 4. نموذج الأخطاء الموحد (`StoreError`)

يترجم كلا المحركين كافة الأخطاء والرموز إلى نوع خطأ موحد بأربعة تصنيفات فقط:
1. `not_found`: الكيان المطلوب غير موجود في النظام.
2. `conflict`: تعارض في القيود الفريدة أو المواعيد المحجوزة.
3. `invalid`: البيانات المدخلة لا تطابق قواعد التحقق ومخططات Zod.
4. `unavailable`: تعذر الاتصال بمخزن البيانات أو عطل فادح.

تستقبل واجهات المستخدم هذه الأكواد وتترجمها فورياً إلى رسائل عربية واضحة ومحددة دون أي تسريب لتفاصيل قواعد البيانات الداخلية.

---
*مرجع بنية التخزين المزدوج والمستودعات — الأساس لمرونة التشغيل والبيئات.*
