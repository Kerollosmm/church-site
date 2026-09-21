# QA Remediation & Performance Engineering Report

**Date**: 2026-09-21  
**Author**: Antigravity Autonomous Agent  
**Branch**: `fix/qa-remediation-2026-09-21`  
**Status**: 100% Verified & Passing (All Quality Gates Green)

---

## 1. Executive Summary

This report documents the remediation of quality defects, performance bottlenecks, and user experience issues identified during the 2026-09-21 QA inspection of the Coptic Orthodox Parish Portal. All changes strictly adhere to architectural invariant **INV-01** (zero public authentication leakage, no private confession or welfare storage, complete preservation of immutable audit logs).

Key accomplishments:
1. **Admin Authentication UX Hardening**: Eliminated the manual browser refresh workaround after login. Implemented `confirmSessionAction` and automated client navigation, plus 6-second auto-dismissal for sign-in notices with URL query cleanup.
2. **Performance Optimization & ISR Route Revalidation**: Replaced unconditional `force-dynamic` with deterministic ISR revalidation times across all static/public routes. Added tagged caching for gallery media, anti-indexing headers for admin routes, and dedicated `/api/health` endpoints.
3. **Regression Test Suite**: Added a 6-test suite covering admin creation workflows, validation rejection, authorization enforcement, and security defenses (SSRF and untrusted domain blocks).
4. **User Experience Polish**: Added one-click copy buttons for condolence reservation tracking, an admin media shortcut in the public gallery, 150ms hover-leave grace periods on desktop navigation menus, and tightened burst rate limiting on public form actions.
5. **Supabase Test Data Cleanup**: Purged ephemeral QA testing rows across subscribers, condolence bookings, contact messages, and CMS entries while keeping the `audit_log` 100% intact.

---

## 2. Deliverables & Modified Files

### A. Admin Authentication UX Hardening
- [`apps/admin/src/actions/auth-actions.ts`](file:///c:/Church-Site/apps/admin/src/actions/auth-actions.ts): Added `confirmSessionAction(targetUrl = '/masses')`. Verifies session via `supabase.auth.getUser()`, executes `revalidatePath('/', 'layout')`, and returns redirection metadata.
- [`apps/admin/src/app/login/AdminLoginForm.tsx`](file:///c:/Church-Site/apps/admin/src/app/login/AdminLoginForm.tsx): Awaits `confirmSessionAction()` immediately after successful client `signInWithPassword()`, then performs `router.replace(targetUrl)`.
- [`apps/admin/src/app/login/SignInNotice.tsx`](file:///c:/Church-Site/apps/admin/src/app/login/SignInNotice.tsx): Added a 6000ms timer (`setTimeout`) that hides the notification and removes `reason` from window search parameters via `window.history.replaceState()`.
- [`docs/admin-guide.md`](file:///c:/Church-Site/docs/admin-guide.md): Removed obsolete manual refresh workaround; documented seamless session establishment and auto-dismiss notices.
- [`apps/admin/playwright.config.ts`](file:///c:/Church-Site/apps/admin/playwright.config.ts): Playwright configuration for admin application on port 3001.
- [`apps/admin/e2e/login.spec.ts`](file:///c:/Church-Site/apps/admin/e2e/login.spec.ts): E2E test verifying invalid credentials rejection and 6s notice auto-dismissal (2/2 PASS).

### B. Performance & Route Revalidation
- [`apps/web/src/app/condolence/page.tsx`](file:///c:/Church-Site/apps/web/src/app/condolence/page.tsx): Configured `revalidate = 3600`.
- [`apps/web/src/app/subscribe/page.tsx`](file:///c:/Church-Site/apps/web/src/app/subscribe/page.tsx): Removed `force-dynamic`, configured `revalidate = 300`.
- [`apps/web/src/app/events/page.tsx`](file:///c:/Church-Site/apps/web/src/app/events/page.tsx): Removed `force-dynamic`, configured `revalidate = 300`.
- [`apps/web/src/app/events/[slug]/page.tsx`](file:///c:/Church-Site/apps/web/src/app/events/[slug]/page.tsx): Removed `force-dynamic`, configured `revalidate = 300`.
- [`apps/web/src/app/bible/page.tsx`](file:///c:/Church-Site/apps/web/src/app/bible/page.tsx): Configured `revalidate = 86400`.
- [`apps/web/src/app/contact/page.tsx`](file:///c:/Church-Site/apps/web/src/app/contact/page.tsx): Configured `revalidate = 86400`.
- [`packages/data-access/src/events/feed.ts`](file:///c:/Church-Site/packages/data-access/src/events/feed.ts): Wrapped `getPublicGalleryMedia()` in Next.js `unstable_cache` tagged with `REVALIDATION_TAGS.eventMedia` (`"event-media"`).
- [`apps/admin/next.config.ts`](file:///c:/Church-Site/apps/admin/next.config.ts): Added security header `X-Robots-Tag: noindex, nofollow` applied to `/:path*`.
- [`apps/web/src/app/api/health/route.ts`](file:///c:/Church-Site/apps/web/src/app/api/health/route.ts): Public web health probe endpoint (`Cache-Control: no-store`).
- [`apps/admin/src/app/api/health/route.ts`](file:///c:/Church-Site/apps/admin/src/app/api/health/route.ts): Admin health probe endpoint (`Cache-Control: no-store`).
- [`apps/web/e2e/lighthouse.spec.ts`](file:///c:/Church-Site/apps/web/e2e/lighthouse.spec.ts): Performance budget verification suite (3/3 PASS).

### C. Regression Test Suite
- [`apps/admin/src/actions/__tests__/create-flows.regression.test.ts`](file:///c:/Church-Site/apps/admin/src/actions/__tests__/create-flows.regression.test.ts):
  - `createMassAction`: Verifies valid creation, database write, and `"create"` audit logging.
  - `createMassAction`: Verifies invalid schema rejection before hitting repository.
  - `createMassAction`: Verifies permission denial and `"denied"` audit log recording.
  - `createParishVideoAction`: Verifies valid YouTube / Facebook URL creation and audit logging.
  - `createParishVideoAction`: Verifies SSRF / untrusted domain rejection and security denial audit logging.
  - `createParishVideoAction`: Verifies field length and metadata validation rejection.

### D. UX Improvements
- [`apps/web/src/app/condolence/CondolenceBookingForm.tsx`](file:///c:/Church-Site/apps/web/src/app/condolence/CondolenceBookingForm.tsx): One-click copy button for newly generated condolence booking reference numbers.
- [`apps/web/src/app/condolence/track/ReservationTrackingCard.tsx`](file:///c:/Church-Site/apps/web/src/app/condolence/track/ReservationTrackingCard.tsx): One-click copy button for tracked reservation codes.
- [`apps/web/src/app/gallery/page.tsx`](file:///c:/Church-Site/apps/web/src/app/gallery/page.tsx): Added staff shortcut link «رفع صور جديدة» leading directly to `/media`.
- [`apps/web/src/components/layout/HeaderClient.tsx`](file:///c:/Church-Site/apps/web/src/components/layout/HeaderClient.tsx): Added 150ms pointer leave grace timeout to prevent accidental dropdown collapse on hover.
- [`apps/web/src/lib/security/rate-limit.ts`](file:///c:/Church-Site/apps/web/src/lib/security/rate-limit.ts): Added `checkPublicWriteRateLimit()` with burst cap of 1 request per 15 seconds (`PUBLIC_BURST_LIMIT = 1`, `PUBLIC_BURST_WINDOW_MS = 15_000`), integrated into contact, condolence, subscription, and enrollment actions.

### E. Supabase Database Cleanup
- Removed temporary QA test data from live production Supabase instance `mlprvcgbwwihnjyvyawm`:
  - Ephemeral subscribers: `qa+test-qa-2026-09-21@example.com`, `qa+qa-2026-09-21-sub@example.com`
  - Ephemeral condolence booking: `COND-UJDBXH`
  - Ephemeral contact message: `fe8727ef-eeb2-4a4d-ab35-12a7ba5b2fb6`
  - Ephemeral test CMS content type: «تبا» (`slug: video`) and child entry
- `audit_log` table: preserved completely intact with 0 rows deleted.

### F. Next.js 15 "use server" Module-Shape Remediation & Shared Modules
- Root cause: Next.js 15 compiler throws *«A "use server" file can only export async functions, found object»* when files marked with `"use server"` export non-async values (such as Zod schemas or object constants).
- Extracted shared modules devoid of `"use server"` directive:
  * [`apps/admin/src/actions/admin-mass-actions.shared.ts`](file:///c:/Church-Site/apps/admin/src/actions/admin-mass-actions.shared.ts): Hosts `WeeklyMassInputSchema`, `CreateMassInput`, `UpdateMassInput`, `AdminMassActionResult`.
  * [`apps/admin/src/actions/admin-video-actions.shared.ts`](file:///c:/Church-Site/apps/admin/src/actions/admin-video-actions.shared.ts): Hosts `ParishVideoInputSchema`, `ParishVideoFormInput`, `AdminVideoActionResult`.
  * [`apps/admin/src/actions/admin-facility-actions.shared.ts`](file:///c:/Church-Site/apps/admin/src/actions/admin-facility-actions.shared.ts): Hosts `ParishFacilityInputSchema`, `ParishFacilityFormInput`, `AdminFacilityActionResult`.
  * [`apps/admin/src/actions/admin-navigation-actions.shared.ts`](file:///c:/Church-Site/apps/admin/src/actions/admin-navigation-actions.shared.ts): Hosts `NavigationItemInputSchema`, `NavigationItemFormInput`, `ReorderNavItemsSchema`, `AdminNavActionResult`.
- Refactored server action modules to import from `.shared.ts` files:
  * [`apps/admin/src/actions/admin-mass-actions.ts`](file:///c:/Church-Site/apps/admin/src/actions/admin-mass-actions.ts)
  * [`apps/admin/src/actions/admin-video-actions.ts`](file:///c:/Church-Site/apps/admin/src/actions/admin-video-actions.ts)
  * [`apps/admin/src/actions/admin-facility-actions.ts`](file:///c:/Church-Site/apps/admin/src/actions/admin-facility-actions.ts)
  * [`apps/admin/src/actions/admin-navigation-actions.ts`](file:///c:/Church-Site/apps/admin/src/actions/admin-navigation-actions.ts)
- Updated consumers, modals, and tests:
  * [`apps/admin/src/app/(protected)/masses/AdminMassModal.tsx`](file:///c:/Church-Site/apps/admin/src/app/(protected)/masses/AdminMassModal.tsx): Imports `CreateMassInput` from `.shared`.
  * [`apps/admin/src/app/(protected)/videos/AdminVideoModal.tsx`](file:///c:/Church-Site/apps/admin/src/app/(protected)/videos/AdminVideoModal.tsx): Imports `ParishVideoInputSchema`, `ParishVideoFormInput`, `AdminVideoActionResult` from `.shared`. Confirmed modal remains open with inline error banner on non-success / throw.
  * [`apps/admin/src/actions/__tests__/admin-mass-actions.test.ts`](file:///c:/Church-Site/apps/admin/src/actions/__tests__/admin-mass-actions.test.ts): Updated imports to point to `.shared`.
- Permanent AST/File Contract Test:
  * [`apps/admin/src/actions/__tests__/use-server-contract.test.ts`](file:///c:/Church-Site/apps/admin/src/actions/__tests__/use-server-contract.test.ts): Scans all 21 action files in `apps/admin` and `apps/web`. Asserts any file with `"use server"` exports only async functions (22/22 tests PASS).

### G. Condolence Audit Logging & Submission Confirmation
- [`apps/web/src/actions/condolence-actions.ts`](file:///c:/Church-Site/apps/web/src/actions/condolence-actions.ts): Added explicit audit logging upon successful reservation insert into `condolence_bookings` (`recordAuditLog` with `action: "create"`, `entityType: "booking"`, `entityId: referenceCode`, `before: null`, and snapshot payload).

---

## 3. Verification & Quality Gates

All verification quality gates have been re-run and verified 100% green:

| Gate | Verification Command | Result | Details |
| :--- | :--- | :--- | :--- |
| **G1 Typecheck** | `pnpm typecheck` | **0 errors** | Passed across all 5 workspace projects (`domain`, `data-access`, `ui`, `web`, `admin`). |
| **G2 Lint** | `pnpm run lint` | **0 errors** | 0 warnings, 0 errors across entire repository. |
| **G3 Unit / Integration Tests** | `pnpm test` | **781/781 passed** | 47 test files (including new `use-server-contract.test.ts`), 100% pass rate. |
| **G4 Web Production Build** | `pnpm --filter web build` | **Exit code 0** | 57 static routes compiled; zero mandatory build-time environment variables. |
| **G5 Admin Production Build** | `pnpm --filter admin build` | **Exit code 0** | All routes compiled and optimized without "use server" module-shape warnings. |
| **G6 Live E2E Verification Suite** | `python e2e_create.py` & `admin_probe.py` | **100% Verified** | Verified live via Cloudflare Quick Tunnels against Supabase. |

---

## 4. Live Verification Suite Evidence

Executed acceptance tests (`qa-run-2026-09-21b/e2e_create.py` and `admin_probe.py`) over live Cloudflare Quick Tunnels:
- **Admin login**: Succeeded cleanly without reload workaround (`after-submit URL: .../masses`).
- **Admin route sweep**: 10/10 admin routes returned HTTP 200 OK (`admin_probe.py`).
- **Weekly Mass creation**: Modal submitted cleanly; mass row landed in database and rendered in `/masses` table (`admin table shows TAG? True`).
- **Parish Video creation**: Modal submitted cleanly; video row landed in database and rendered in `/videos` table (`admin table shows TAG? True`) and verified visible on public `/about` (`/about shows video TAG? True`).
- **Public Condolence booking**: Successfully generated and returned booking reference code (`COND-JV3XOB`).
- **Audit Log verification (Supabase Live SQL query)**:
  1. `create` / `subscriber`: `اشتراك جديد في تنبيهات الفعاليات من نموذج الموقع العام.`
  2. `create` / `booking`: `حجز قاعة العزاء للمتنيح «المرحوم اختبار QA-2026-09-21-c» في تاريخ 2026-10-21` (`COND-JV3XOB`)
  3. `create` / `video`: `إضافة فيديو: «فيديو اختبار QA-2026-09-21-verified»`
  4. `create` / `mass`: `إضافة قداس: «قداس اختبار QA-2026-09-21-verified»`
- **Database Hygiene**: All ephemeral test rows (`mass_schedules`, `parish_videos`, `subscribers`, `condolence_bookings`, `contact_messages`) purged, with `audit_log` left 100% untouched pursuant to invariant **INV-01**.

---

## 5. Conclusion & Invariant Statement

All Next.js 15 `"use server"` module-shape defects and QA report P0 regressions are fully remediated, verified, and sealed with contract tests. Invariant **INV-01** remains strictly preserved. Ready for merge into main.

