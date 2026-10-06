---
title: "Audit Trail & Compliance Architecture"
aliases: ["Audit Trail", "Audit Log", "Compliance", "RFC-4180 Export"]
tags:
  - "#memory-bank"
  - "#security"
  - "#compliance"
  - "#audit"
  - "#status/approved"
version: "2.0"
last_updated: 2026-09-26
---

# Audit Trail & Compliance Architecture

> [!info] Operational Integrity
> An immutable, append-only audit ledger recording every administrative mutation across the parish portal, with RFC-4180 BOM-compliant Arabic CSV export for governance.

---

## 1. مبادئ سجل التدقيق وهيكل السجل (Immutable Audit Principles)

- **سجل إلحاقي غير قابل للتعديل (Append-Only Log)**:
  * جدول `public.audit_log` في قاعدة بيانات Supabase يخلو تماماً من أي سياسات `UPDATE` أو `DELETE` لجميع المستخدمين بما في ذلك المشرفين. السجل المكتوب يصبح جزءاً دائماً من تاريخ الكنيسة الرقمي.
- **تضمين لقطات الحالة (State Before and After)**:
  * يسجل كل سطر تدقيق الحالة السابقة للكيان والحالة الجديدة كنسخ JSON متطابقة (`before_state` و`after_state`)، مما يمنع تشويه السجل التاريخي عند إجراء تعديلات لاحقة.
- **الفاعل الإلزامي (Actor Tracking)**:
  * يوثق السجل هوية الفاعل (`actor_id`, `actor_name`) سواء كان مستخدماً من الطاقم أو إجراءً آلياً من النظام (مثل معالج البريد).

---

## 2. النماذج والأفعال المغلقة (Enums & Typed Taxonomy)

يتم بناء سجلات التدقيق حصراً عبر دالة `buildAuditEntry()` المعرفة في حزمة `@church-site/data-access`:

### أ. الأفعال المغلقة (`AuditAction`)
- `create` — إنشاء كيان جديد.
- `update` — تعديل بيانات كيان قائم.
- `delete` — حذف كيان (أو إلغاؤه).
- `publish` — نشر محتوى للجمهور.
- `unpublish` — إلغاء نشر محتوى وإعادته للمسودات.
- `approve` — اعتماد طلب (مثل اعتماد حجز قاعة العزاء).
- `reject` — رفض طلب مع تسجيل سبب الرفض الإلزامي.
- `notify` — تسجيل إشعار أو محاولة إرسال بريد.

### ب. الكيانات المغلقة (`AuditEntityType`)
- `event` — الفعاليات واللقاءات الرعوية.
- `event_series` — سلاسل القداسات والاجتماعات الأسبوعية.
- `mass_schedule` — جدول مواعيد القداسات الأسبوعية.
- `condolence_booking` — طلبات حجز قاعة العزاء.
- `subscriber` — سجلات المشتركين في التنبيهات.
- `media` — الوسائط والصور المرفوعة.
- `contact_message` — رسائل التواصل الواردة من الجمهور.

---

## 3. تصدير البيانات المتوافق مع معيار RFC-4180 وعلامة UTF-8 BOM

توفر لوحة الإدارة إمكانية تصدير سجل التدقيق إلى ملف CSV متوافق بالكامل مع المعايير الدولية لحفظ السجلات:

### أ. منع التشويه اللغوي في Excel (Mojibake Prevention)
- تصدير علامة **UTF-8 Byte Order Mark (`\uFEFF`)** في البايت الأول من الملف.
- تضمن هذه العلامة فتح ملف الـ CSV في برنامج Microsoft Excel وكافة محررات الجداول مع ظهور الحروف العربية بدقة متناهية ودون أي تشويه للحروف أو علامات استفهام مقلوبة.

### ب. التوافق الصارم مع معيار RFC-4180
- إحاطة الحقول النصية التي تحتوي على فواصل أو أسطر جديدة بعلامات اقتباس مزدوجة.
- الهروب الآمن من علامات الاقتباس الداخلية بمضاعفتها (`""`).
- تنسيق التواريخ بتوقيت القاهرة الرسمي ISO 8601.

### ج. جدار الحماية والصلاحيات
- مسار التنزيل المباشر `/api/audit/export` وإجراء الخادم `exportAuditCsvAction` محكومان بفحص الصلاحيات الصارم:
  * اشتراط جلسة طاقم نشطة عبر `requireStaff()`.
  * التحقق من امتلاك قدرة `audit:read` أو `event:read` عبر مصفوفة `can()`.

---
*مرجع سجل التدقيق والامتثال — الدليل التشغيلي لحفظ السجلات والشفافية.*
