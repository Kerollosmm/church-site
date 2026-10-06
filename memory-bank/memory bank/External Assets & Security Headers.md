---
title: "External Assets & Security Headers Architecture"
aliases: ["External Assets", "Security Headers", "CSP", "AssetResolver", "SSRF Defense"]
tags:
  - "#memory-bank"
  - "#security"
  - "#csp"
  - "#ssrf"
  - "#assets"
  - "#status/approved"
version: "2.0"
last_updated: 2026-09-26
---

# External Assets & Security Headers Architecture

> [!info] Security Posture
> Strict content security headers with **enforced CSP**, host allowlisting, and zero-proxy SSRF elimination across all parish public surfaces.

---

## 1. قائمة النطاقات المعتمدة ومصدر الحقيقة (`ASSET_ALLOWED_HOSTS`)

تقع القائمة في `packages/data-access/src/assets/asset-allowlist.ts` كثابت مجمد (`as const`):
- **نطاقات YouTube CDN الرسمية**:
  * `i.ytimg.com`, `*.ytimg.com`, `ytimg.com`, `img.youtube.com`
- **نطاقات Google Drive والمحتوى المباشر**:
  * `drive.usercontent.google.com`, `*.googleusercontent.com`, `googleusercontent.com`

> [!important] Derived Security Directives
> يشتق كل من `apps/web/next.config.ts` و`apps/admin/next.config.ts` إعدادات `images.remotePatterns` ورؤوس سياسة أمان المحتوى CSP `img-src` **مباشرة وحصرياً من هذا الثابت**، مما يمنع أي انحراف أمني بين الإعدادات والتشغيل.

---

## 2. محرك حل واعتماد الروابط (`AssetResolver`)

يقع المحرك في `packages/data-access/src/assets/asset-resolver.ts` ويقدم دالتين أساسيتين:

### أ. `resolveExternalImageUrl()` (وقت الإدخال في لوحة الإدارة)
- **روابط YouTube**: يدعم صيغ الروابط المتعددة (`watch?v=`, `youtu.be/`, `/shorts/`, `/embed/`, `/vi/`) ويستخرج معرف الفيديو عبر تعبير نمطي صارم (`^[a-zA-Z0-9_-]{11}$`) ويحوله إلى صورة المعاينة الرسمية عالية الجودة:
  `https://i.ytimg.com/vi/{id}/hqdefault.jpg`
- **روابط Google Drive**: يتعرف على صيغ المشاركة (`/file/d/`, `/uc?id=`, `/open?id=`) ويستخرج معرف الملف (`^[a-zA-Z0-9_-]{20,}$`) ويحوله إلى نقطة العرض المباشرة:
  `https://drive.usercontent.google.com/download?id={id}&authuser=0`
- **الرفض الصادق لصور Google Photos**: يرفض النظام صراحة روابط ألبومات `photos.app.goo.gl` مع إظهار توجيه عربي للخدام لنسخ عنوان الصورة المباشر من نطاق `lh3.googleusercontent.com`.

### ب. `getSafeRenderableImageUrl()` (بوابة العرض الآمن في الواجهات)
- يفحص أي رابط قبل تقديمه في وسوم `<img>` أو `<Image unoptimized />`.
- يسمح بالروابط النسبية ومسارات Supabase Storage المحصورة.
- يرفض أي بروتوكولات خطرة (`javascript:`, `data:`, `http:`).
- يمنع تماماً وصول أي رابط خام أو غير معتمد إلى المتصفح.

---

## 3. نموذج التهديدات والحماية من هجمات SSRF

- **حظر تام لمسارات البروكسي (Proxy Omission by Design)**:
  * تم رفض مقترح إنشاء مسار خادمي وسيط (`/api/media/proxy`). الجلب المباشر من المتصفح المقيد بـ CSP كافٍ وآمن تماماً ويوفر استهلاك موارد الخادم ويلغي ثغرات SSRF من الجذور.
- **تحصين المدخلات**:
  * فرض بروتوكول HTTPS المشفر حصراً.
  * حظر المنافذ المخصصة غير القياسية.
  * حظر بيانات الاعتماد المضمنة في الرابط (`userinfo`).
  * تشذيب المسافات ومحارف التحكم قبل المعالجة.

---

## 4. رؤوس الأمان وسياسة أمان المحتوى (Enforced CSP)

تُحقن رؤوس الأمان من `next.config.ts` لكافة المسارات `/:path*`:
- **Content-Security-Policy (مفروضة ومنفذة وليست مجرد Report-Only)**:
  * `default-src 'self'`
  * `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com` (لـ Next.js scripts وTurnstile)
  * `style-src 'self' 'unsafe-inline'`
  * `img-src 'self' data: blob: https://*.supabase.co https://i.ytimg.com https://*.googleusercontent.com`
  * `frame-src 'self' https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com https://www.facebook.com`
  * `connect-src 'self' https://*.supabase.co https://challenges.cloudflare.com`
- **Strict-Transport-Security (HSTS)**: `max-age=15552000; includeSubDomains`
- **X-Frame-Options**: `SAMEORIGIN`
- **X-Content-Type-Options**: `nosniff`
- **Referrer-Policy**: `strict-origin-when-cross-origin`
- **Permissions-Policy**: تعطيل كافة الحساسات غير المستخدمة (الكاميرا، الميكروفون، الموقع الجغرافي، المدفوعات).

---
*مرجع الوسائط الخارجية ورؤوس الأمان — معايير حماية الزوار وعزل التهديدات.*
