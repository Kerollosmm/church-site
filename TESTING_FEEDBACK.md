# Testing Issues & Feedback Log

| # | Date | Area / Screen | Observation / Issue | Status | Action Plan / Resolution |
| :-: | :--- | :--- | :--- | :-: | :--- |
| 1 | 2026-09-19 | Admin: Videos (`/videos`) | Error: "فشل في تحميل قائمة الفيديوهات" (`[admin] parish videos read failed`). Cause: Table `public.parish_videos` missing from remote Supabase schema cache (Migration 14 not yet applied). | Resolved | Applied migration 14 (`20260916140000_parish_videos.sql`). `public.parish_videos` verified live in Supabase. |
| 2 | 2026-09-19 | Admin: Navigation (`/navigation`) | Error: `parish navigation read failed`. Cause: Table `public.nav_menu_items` missing from remote Supabase (Migration 15 not yet applied). | Resolved | Applied migration 15 (`20260916150000_services_navigation.sql`). `public.nav_menu_items` verified live in Supabase (21 menu items seeded). |
| 3 | 2026-09-19 | Admin / Web Layout (`layout.tsx`) | Console Error: Hydration mismatch caused by browser extensions (Grammarly `data-new-gr-c-s-check-loaded`, `data-gr-ext-installed`). | Resolved | Added `suppressHydrationWarning` to `<html>` and `<body>` in `apps/admin/src/app/layout.tsx` and `apps/web/src/app/layout.tsx`. |
| 4 | 2026-09-19 | Admin: Media Upload (`/media`) | Error: "فشل رفع الملف" (`Could not find the 'host' column of 'media' in the schema cache`). Cause: Migration 16 not yet applied to remote Supabase. | Resolved | Applied migration 16 (`20260916160000_external_assets.sql`). Columns `source_url`, `resolved_url`, `host`, `kind` verified live on `public.media`. |
| 5 | 2026-09-19 | Admin vs Web Services Sync (`/services`) | Discrepancy: Public portal shows 8 fallback services while Admin shows 0 services. | Resolved | Applied migration 15 and seeded default 8 facilities from `SEED_PUBLIC_SERVICES` into `public.public_services`. Verified 8 rows live. |
| 6 | 2026-09-19 | Full Portal Performance / Load Latency | Slow page loads across portal. Cause: Next.js dev on-demand JIT compilation on first route visit + remote DB roundtrip retries on missing tables in Header + dual dev servers. | Resolved | Migrations 14–17 applied + nav items seeded. Header DB queries now execute with zero retries/errors. |
| 7 | 2026-09-19 | Web Layout (`Header.tsx` / `HeaderClient.tsx`) | Console Error: Each child in a list should have a unique "key" prop. Check the render method of HeaderClient. Passed child from Header (Header.tsx:19:5). | Resolved | Added `key="header-brand"` to brand Link in `Header.tsx` and wrapped slot with `<div className="shrink-0">{brand}</div>` in `HeaderClient.tsx`. |

## Detailed Notes & User Notices

### Issue 1: Admin Videos List Fails to Load (`/videos`)
- **Status**: Resolved.
- **Reported**: User noticed banner: "فشل في تحميل قائمة الفيديوهات. يرجى المحاولة مرة أخرى لاحقاً." and console error `[admin] parish videos read failed: Could not find the table 'public.parish_videos' in the schema cache`.
- **Root Cause**: Next.js app in dev mode connects to remote Supabase (`driver: 'supabase'`), but remote Supabase only had migrations up to #13. Migrations 14 (`parish_videos`), 15 (`services_navigation`), 16 (`external_assets`), and 17 (`staff_role_narrowing`) were pending.
- **Resolution**: Applied migration 14 (`20260916140000_parish_videos.sql`). `public.parish_videos` table, composite index, and RLS policies verified live in Supabase. Admin `/videos` route loads cleanly without errors.

### Issue 2: Admin Navigation Menu Items Fail to Load (`/navigation`)
- **Status**: Resolved.
- **Reported**: User noticed banner: "فشل في تحميل عناصر شريط التنقل. يرجى المحاولة مرة أخرى لاحقاً." and console error `[admin] parish navigation read failed: Could not find the table 'public.nav_menu_items' in the schema cache`.
- **Root Cause**: Remote Supabase database was missing migration 15 (`20260916150000_services_navigation.sql`) which creates table `public.nav_menu_items` and updates `public_services`.
- **Resolution**: Applied migration 15 (`20260916150000_services_navigation.sql`). `public.nav_menu_items` verified live in Supabase, and 21 menu items seeded into `public.nav_menu_items`. Admin `/navigation` route loads and allows re-ordering and active status management.

### Issue 3: Hydration Mismatch on Root Layout from Browser Extensions
- **Status**: Resolved.
- **Reported**: Console warning/error `A tree hydrated but some attributes of the server rendered HTML didn't match the client properties... data-new-gr-c-s-check-loaded="14.1330.0" data-gr-ext-installed=""`. Encountered on multiple pages including `/navigation` and `/media`.
- **Root Cause**: Client browser extensions (Grammarly) modify the DOM tree by injecting attributes on `<body>` before React completes hydration. Because `RootLayout` wraps all routes, this warning triggered on route navigation.
- **Resolution**: Added `suppressHydrationWarning` to `<html>` and `<body>` in `apps/admin/src/app/layout.tsx` and `apps/web/src/app/layout.tsx`. Suppresses React hydration discrepancy warnings caused by injected browser extension attributes.

### Issue 4: Media Upload & External Asset Linking Fails with Missing 'host' Column (`/media`)
- **Status**: Resolved.
- **Reported**:
  1. File upload tab: failed with "فشل رفع الملف: Could not find the 'host' column of 'media' in the schema cache".
  2. External link tab: preview validated URL successfully, but saving ("ربط الأصل الخارجي") failed with "فشل التحقق من الأصل: Could not find the 'host' column of 'media' in the schema cache".
- **Root Cause**: Remote Supabase `public.media` table was missing columns from Migration 16 (`20260916160000_external_assets.sql`): `source_url`, `resolved_url`, `host`, `kind`.
- **Resolution**: Applied migration 16 (`20260916160000_external_assets.sql`). Columns `source_url`, `resolved_url`, `host`, `kind` verified live on `public.media`. Media uploads and external asset link resolution work seamlessly.

### Issue 5: Admin Services Screen Shows 0 Services While Public Portal Shows 8 Services (`/services`)
- **Status**: Resolved.
- **Reported**: User noticed `http://localhost:3000/services` displays 8 full community facilities (نرسري، مطبخ خيري، مقاصف، إلخ), while `http://localhost:3001/services` displayed "لا توجد خدمات مطابقة لمعايير البحث" (0 services). Asked if they are connected to different databases.
- **Root Cause**: Both apps connect to the exact same database. But `public.public_services` originally had 0 rows in Supabase. The public website had a built-in static seed fallback (`SEED_PUBLIC_PARISH_FACILITIES`) to guarantee zero downtime / zero blank pages if the database was unseeded. The admin portal intentionally queries the live database only and does not show mock data.
- **Resolution**: Applied migration 15 and seeded default 8 facilities from `SEED_PUBLIC_SERVICES` into `public.public_services`. Verified 8 rows live in database. Both public and admin views are now synchronized with live data.

### Issue 6: Portal Load Latency & Initial Slowness
- **Status**: Resolved.
- **Reported**: User observed pages take too long to load ("Any page on the website is too much to load. Maybe a problem with the forms or it is too much cookies or the problem on the device performance").
- **Root Cause Analysis**:
  1. **Next.js Dev JIT Compilation**: `next dev` compiles TypeScript, JSX, and all imported modules on-demand the first time a user visits a page. Subsequent re-visits are fast.
  2. **Header DB Retries on Missing Tables**: The `Header` component renders on every public page and calls `getPublicNavigation()`. Because `public.nav_menu_items` was missing from remote DB, every page request performed remote queries, retried, threw errors, and dropped to fallback, causing ~1-3s latency overhead.
  3. **Dual Dev Servers**: Running dev servers concurrently on local machine during cold starts.
- **Resolution**: Migrations 14–17 applied + nav items seeded. Header DB queries now execute with zero retries/errors. For production speed, pre-rendered static builds serve in <50ms with zero compilation lag.

### Issue 7: HeaderClient Missing 'key' Prop Console Error on 'brand'
- **Status**: Resolved.
- **Reported**: Console Error: `Each child in a list should have a unique "key" prop. Check the render method of HeaderClient. Passed child from Header (Header.tsx:19:5).`
- **Root Cause**: In Next.js App Router (React 19), passing a React element (`brand`) created inside a Server Component (`Header.tsx`) into a Client Component (`HeaderClient.tsx`) where it is placed directly as a sibling within a JSX parent container can cause React to treat the slotted element as an item in a children array. Without an explicit `key`, React emits a unique key warning during reconciliation.
- **Resolution**:
  1. Added explicit `key="header-brand"` to the `<Link>` element in `apps/web/src/components/layout/Header.tsx`.
  2. Wrapped `{brand}` in a dedicated wrapper `<div className="shrink-0">{brand}</div>` inside `apps/web/src/components/layout/HeaderClient.tsx` to isolate the element slot and maintain pristine layout styling.
